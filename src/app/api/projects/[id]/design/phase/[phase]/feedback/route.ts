import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateWithGemini } from '@/lib/ai/gemini'
import { loadPrompt } from '@/lib/prompts'
import { checkAiRateLimit } from '@/lib/ratelimit'
import { logTokenUsage } from '@/lib/usage/log-usage'
import { parseProjectId } from '@/lib/utils/parse-project-id'
import { z } from 'zod'
import type { DesignBlueprint } from '@/types'

const bodySchema = z.object({
  feedback: z.string().min(1).max(2000),
  screenId: z.string().max(100).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; phase: string }> }
) {
  const { id: rawId, phase: phaseStr } = await params
  const projectId = parseProjectId(rawId)
  if (!projectId) return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })

  const phase = parseInt(phaseStr, 10)
  if (![1, 2, 3].includes(phase)) {
    return NextResponse.json({ error: 'Invalid phase (1-3)' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rateLimited = await checkAiRateLimit(user.id)
  if (rateLimited) return rateLimited

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input' }, { status: 400 })

  const { data: project } = await supabase
    .from('projects').select('*').eq('id', projectId).eq('user_id', user.id).single()
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (project.status !== 'DESIGN')
    return NextResponse.json({ error: '디자인 단계에서만 가능합니다.' }, { status: 400 })

  const { data: planDoc } = await supabase
    .from('planning_documents')
    .select('content')
    .eq('project_id', projectId)
    .eq('is_finalized', true)
    .order('version', { ascending: false })
    .limit(1)
    .single()
  if (!planDoc) return NextResponse.json({ error: '확정된 기획안이 없습니다.' }, { status: 400 })

  const { data: pref } = await supabase
    .from('design_preferences').select('*').eq('project_id', projectId).single()

  const blueprint: DesignBlueprint = pref?.design_blueprint || {
    brand: null, architecture: null, screenDetails: [], entities: [], finalized: false,
  }

  try {
    let systemPrompt: string
    let userPrompt: string
    let actionType: 'design_brand' | 'design_architecture' | 'design_screen_detail'

    if (phase === 1) {
      if (!blueprint.brand) return NextResponse.json({ error: '브랜드 시안이 없습니다.' }, { status: 400 })
      systemPrompt = loadPrompt('design-brand-feedback-system.txt')
      userPrompt = `서비스명: ${project.title}

━━━ 현재 브랜드 시안 ━━━
${JSON.stringify(blueprint.brand, null, 2)}

━━━ 사용자 피드백 ━━━
${parsed.data.feedback}

━━━ 기획안 ━━━
${planDoc.content}`
      actionType = 'design_brand'
    } else if (phase === 2) {
      if (!blueprint.architecture) return NextResponse.json({ error: '서비스 구성이 없습니다.' }, { status: 400 })
      systemPrompt = loadPrompt('design-architecture-feedback-system.txt')
      userPrompt = `서비스명: ${project.title}

━━━ 현재 서비스 구성 ━━━
${JSON.stringify(blueprint.architecture, null, 2)}

━━━ 브랜드 아이덴티티 ━━━
${JSON.stringify(blueprint.brand, null, 2)}

━━━ 사용자 피드백 ━━━
${parsed.data.feedback}

━━━ 기획안 ━━━
${planDoc.content}`
      actionType = 'design_architecture'
    } else {
      const screenId = parsed.data.screenId
      if (!screenId) return NextResponse.json({ error: 'screenId가 필요합니다.' }, { status: 400 })
      const detail = blueprint.screenDetails.find(d => d.screenId === screenId)
      if (!detail) return NextResponse.json({ error: '해당 화면 상세가 없습니다.' }, { status: 400 })
      systemPrompt = loadPrompt('design-screen-feedback-system.txt')
      userPrompt = `서비스명: ${project.title}

━━━ 현재 화면 상세 ━━━
${JSON.stringify(detail, null, 2)}

━━━ 사용자 피드백 ━━━
${parsed.data.feedback}

━━━ 기획안 ━━━
${planDoc.content}`
      actionType = 'design_screen_detail'
    }

    const result = await generateWithGemini(systemPrompt, userPrompt, {
      maxTokens: phase === 3 ? 8192 : 4096,
      temperature: 0.7,
    })

    await logTokenUsage(supabase, user.id, projectId, actionType, result)

    const cleaned = result.content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const generated = JSON.parse(cleaned)

    if (phase === 1) {
      blueprint.brand = generated
    } else if (phase === 2) {
      blueprint.architecture = generated
    } else {
      const screenId = parsed.data.screenId!
      const idx = blueprint.screenDetails.findIndex(d => d.screenId === screenId)
      const detail = { screenId, ...generated }
      if (idx >= 0) blueprint.screenDetails[idx] = detail
      else blueprint.screenDetails.push(detail)
    }

    await supabase.from('design_preferences').update({
      design_blueprint: blueprint,
      updated_at: new Date().toISOString(),
    }).eq('project_id', projectId)

    return NextResponse.json({ success: true, blueprint })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `피드백 반영 실패: ${message}` }, { status: 500 })
  }
}
