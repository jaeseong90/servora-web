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
  stylePreset: z.string().max(100).optional(),
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

  const { data: project } = await supabase
    .from('projects').select('*').eq('id', projectId).eq('user_id', user.id).single()
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (project.status !== 'DESIGN')
    return NextResponse.json({ error: '디자인 단계에서만 가능합니다.' }, { status: 400 })

  let body: unknown = {}
  try { body = await request.json() } catch { /* empty body OK */ }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  // 기획안 조회
  const { data: planDoc } = await supabase
    .from('planning_documents')
    .select('content')
    .eq('project_id', projectId)
    .eq('is_finalized', true)
    .order('version', { ascending: false })
    .limit(1)
    .single()
  if (!planDoc) return NextResponse.json({ error: '확정된 기획안이 없습니다.' }, { status: 400 })

  // 현재 블루프린트 조회 (없으면 자동 생성)
  let { data: pref } = await supabase
    .from('design_preferences')
    .select('*')
    .eq('project_id', projectId)
    .single()

  if (!pref) {
    await supabase.from('design_preferences').insert({ project_id: projectId })
    const { data: newPref } = await supabase
      .from('design_preferences').select('*').eq('project_id', projectId).single()
    pref = newPref
  }

  const blueprint: DesignBlueprint = pref?.design_blueprint || {
    brand: null, architecture: null, screenDetails: [], entities: [], finalized: false,
  }

  // Phase별 상태를 generating으로 변경
  const phaseStatus = pref?.phase_status || { '1': 'pending', '2': 'pending', '3': 'pending', '4': 'pending' }
  phaseStatus[String(phase)] = 'generating'
  await supabase.from('design_preferences').update({
    phase_status: phaseStatus,
    updated_at: new Date().toISOString(),
  }).eq('project_id', projectId)

  try {
    let systemPrompt: string
    let userPrompt: string
    let actionType: 'design_brand' | 'design_architecture' | 'design_screen_detail'

    if (phase === 1) {
      systemPrompt = loadPrompt('design-brand-system.txt')
      userPrompt = buildBrandPrompt(project.title, planDoc.content, parsed.data.stylePreset)
      actionType = 'design_brand'
    } else if (phase === 2) {
      if (!blueprint.brand) return NextResponse.json({ error: '브랜드 시안을 먼저 완성해주세요.' }, { status: 400 })
      systemPrompt = loadPrompt('design-architecture-system.txt')
      userPrompt = buildArchitecturePrompt(project.title, planDoc.content, blueprint.brand)
      actionType = 'design_architecture'
    } else {
      if (!blueprint.architecture) return NextResponse.json({ error: '서비스 구성을 먼저 완성해주세요.' }, { status: 400 })
      const screenId = parsed.data.screenId
      if (!screenId) return NextResponse.json({ error: 'screenId가 필요합니다.' }, { status: 400 })
      const screen = blueprint.architecture.screens.find(s => s.id === screenId)
      if (!screen) return NextResponse.json({ error: '해당 화면을 찾을 수 없습니다.' }, { status: 400 })
      systemPrompt = loadPrompt('design-screen-detail-system.txt')
      userPrompt = buildScreenDetailPrompt(project.title, planDoc.content, blueprint.brand!, blueprint.architecture, screen)
      actionType = 'design_screen_detail'
    }

    const result = await generateWithGemini(systemPrompt, userPrompt, {
      maxTokens: phase === 3 ? 8192 : 4096,
      temperature: 0.7,
    })

    await logTokenUsage(supabase, user.id, projectId, actionType, result)

    // JSON 파싱
    const cleaned = result.content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const generated = JSON.parse(cleaned)

    // 블루프린트 업데이트
    if (phase === 1) {
      blueprint.brand = generated
    } else if (phase === 2) {
      blueprint.architecture = generated
    } else {
      const screenId = parsed.data.screenId!
      const existing = blueprint.screenDetails.findIndex(d => d.screenId === screenId)
      const detail = { screenId, ...generated }
      if (existing >= 0) {
        blueprint.screenDetails[existing] = detail
      } else {
        blueprint.screenDetails.push(detail)
      }
    }

    // Phase 상태를 review로 변경
    phaseStatus[String(phase)] = 'review'
    const currentPhase = Math.max(pref?.current_phase || 0, phase)

    await supabase.from('design_preferences').update({
      design_blueprint: blueprint,
      current_phase: currentPhase,
      phase_status: phaseStatus,
      updated_at: new Date().toISOString(),
    }).eq('project_id', projectId)

    return NextResponse.json({ success: true, blueprint, phaseStatus })
  } catch (err: unknown) {
    // 에러 시 상태 복구
    phaseStatus[String(phase)] = 'review'
    await supabase.from('design_preferences').update({
      phase_status: phaseStatus,
      updated_at: new Date().toISOString(),
    }).eq('project_id', projectId)

    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `생성 실패: ${message}` }, { status: 500 })
  }
}

function buildBrandPrompt(title: string, planContent: string, stylePreset?: string): string {
  return `서비스명: ${title}
${stylePreset ? `\n사용자가 선택한 분위기: ${stylePreset}\n` : ''}
━━━ 기획안 ━━━
${planContent}`
}

function buildArchitecturePrompt(
  title: string, planContent: string, brand: NonNullable<DesignBlueprint['brand']>
): string {
  return `서비스명: ${title}

━━━ 브랜드 아이덴티티 ━━━
- 톤: ${brand.tone}
- 성격: ${brand.personality}
- 메인 컬러: ${brand.colors.primary}
- 레이아웃: ${brand.layoutStyle}

━━━ 기획안 ━━━
${planContent}`
}

function buildScreenDetailPrompt(
  title: string,
  planContent: string,
  brand: NonNullable<DesignBlueprint['brand']>,
  architecture: NonNullable<DesignBlueprint['architecture']>,
  screen: { id: string; displayName: string; description: string; audience: string; keyFeatures: string[] }
): string {
  return `서비스명: ${title}

━━━ 대상 화면 ━━━
- ID: ${screen.id}
- 이름: ${screen.displayName}
- 설명: ${screen.description}
- 대상: ${screen.audience === 'admin' ? '운영자' : '고객'}
- 핵심 기능: ${screen.keyFeatures.join(', ')}

━━━ 브랜드 ━━━
- 톤: ${brand.tone}
- 메인 컬러: ${brand.colors.primary}
- 레이아웃: ${brand.layoutStyle}
- 모서리: ${brand.cornerStyle}

━━━ 전체 화면 구성 ━━━
${architecture.screens.map(s => `- ${s.displayName}: ${s.description}`).join('\n')}

━━━ 기획안 ━━━
${planContent}`
}
