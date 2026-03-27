import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateWithGemini } from '@/lib/ai/gemini'
import { loadPrompt } from '@/lib/prompts'
import { logTokenUsage } from '@/lib/usage/log-usage'
import { checkAiRateLimit } from '@/lib/ratelimit'
import { parseProjectId } from '@/lib/utils/parse-project-id'
import type { DesignBlueprint } from '@/types'

/**
 * 디자인 최종 확정
 * Phase 3 승인 후 → entities 자동 추출 → blueprint.finalized = true → 프로젝트 MVP 전환
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params
  const projectId = parseProjectId(rawId)
  if (!projectId) return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rateLimited = await checkAiRateLimit(user.id)
  if (rateLimited) return rateLimited

  const { data: project } = await supabase
    .from('projects').select('*').eq('id', projectId).eq('user_id', user.id).single()
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (project.status !== 'DESIGN')
    return NextResponse.json({ error: '디자인 단계에서만 확정할 수 있습니다.' }, { status: 400 })

  const { data: pref } = await supabase
    .from('design_preferences').select('*').eq('project_id', projectId).single()
  if (!pref?.design_blueprint) return NextResponse.json({ error: '디자인 블루프린트가 없습니다.' }, { status: 400 })

  const blueprint: DesignBlueprint = pref.design_blueprint
  const phaseStatus = pref.phase_status || {}

  // Phase 1~3 모두 approved인지 확인
  if (phaseStatus['1'] !== 'approved' || phaseStatus['2'] !== 'approved' || phaseStatus['3'] !== 'approved') {
    return NextResponse.json({ error: '모든 단계를 완료해주세요.' }, { status: 400 })
  }

  try {
    // AI로 entities 자동 추출
    const systemPrompt = loadPrompt('design-entity-extract-system.txt')
    const userPrompt = `서비스명: ${project.title}

━━━ 화면별 상세 설계 ━━━
${JSON.stringify(blueprint.screenDetails, null, 2)}

━━━ 서비스 구성 ━━━
${JSON.stringify(blueprint.architecture, null, 2)}`

    const result = await generateWithGemini(systemPrompt, userPrompt, {
      maxTokens: 8192,
      temperature: 0.3,
    })

    await logTokenUsage(supabase, user.id, projectId, 'design_entity_extract', result)

    const cleaned = result.content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const entities = JSON.parse(cleaned)

    if (!Array.isArray(entities) || entities.length === 0) {
      throw new Error('엔티티 추출 결과가 비어있습니다.')
    }

    // 블루프린트 확정
    blueprint.entities = entities.slice(0, 5) // 최대 5개
    blueprint.finalized = true

    phaseStatus['4'] = 'approved'

    await supabase.from('design_preferences').update({
      design_blueprint: blueprint,
      current_phase: 4,
      phase_status: phaseStatus,
      updated_at: new Date().toISOString(),
    }).eq('project_id', projectId)

    // 프로젝트 MVP 전환
    await supabase.from('projects').update({
      status: 'MVP',
      updated_at: new Date().toISOString(),
    }).eq('id', projectId)

    return NextResponse.json({ success: true, blueprint })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `확정 실패: ${message}` }, { status: 500 })
  }
}
