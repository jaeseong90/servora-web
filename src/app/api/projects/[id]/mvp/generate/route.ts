import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateWithGemini, type TokenUsage } from '@/lib/ai/gemini'
import { loadPrompt } from '@/lib/prompts'
import { checkAiRateLimit } from '@/lib/ratelimit'
import { logTokenUsage } from '@/lib/usage/log-usage'
import { parseProjectId } from '@/lib/utils/parse-project-id'

/**
 * MVP 생성 요청 — JSON 스펙 추출 + 큐 등록
 * 
 * 변경사항 (v2):
 * - 기존: 단순 PENDING 큐 등록만
 * - 변경: Gemini로 구조화 JSON 스펙 추출 → spec_json에 저장 → SPEC_REVIEW 상태로 등록
 * - 사용자가 스펙 확인 후 빌드 시작 가능
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
    .from('projects').select('*').eq('id', projectId).single()
  if (!project || project.user_id !== user.id)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (project.status !== 'DESIGN' && project.status !== 'MVP')
    return NextResponse.json({ error: '디자인 또는 MVP 단계에서만 MVP를 생성할 수 있습니다.' }, { status: 400 })

  // 확정된 기획안 확인
  const { data: planDoc } = await supabase
    .from('planning_documents')
    .select('content')
    .eq('project_id', projectId)
    .eq('is_finalized', true)
    .order('version', { ascending: false })
    .limit(1)
    .single()

  if (!planDoc) {
    return NextResponse.json({ error: '확정된 기획안이 없습니다.' }, { status: 400 })
  }

  // MVP 구현 지침 확인
  const { data: designPref } = await supabase
    .from('design_preferences')
    .select('*')
    .eq('project_id', projectId)
    .single()

  if (!designPref?.mvp_guidelines) {
    return NextResponse.json({ error: 'MVP 구현 지침이 없습니다. 디자인 단계에서 지침을 먼저 생성해주세요.' }, { status: 400 })
  }

  // 중복 요청 방지: PENDING/BUILDING/COMPLETED 또는 SPEC_REVIEW 상태가 이미 있으면 차단
  const { data: existingBuild } = await supabase
    .from('mvp_build_queue')
    .select('id, status')
    .eq('project_id', projectId)
    .in('status', ['SPEC_REVIEW', 'PENDING', 'BUILDING', 'COMPLETED'])
    .limit(1)
    .single()

  if (existingBuild) {
    const msgMap: Record<string, string> = {
      COMPLETED: 'MVP가 이미 생성되었습니다.',
      SPEC_REVIEW: '스펙 검토 중입니다. MVP 페이지에서 확인해주세요.',
      PENDING: 'MVP 빌드가 대기 중입니다.',
      BUILDING: 'MVP 빌드가 진행 중입니다.',
    }
    return NextResponse.json({ error: msgMap[existingBuild.status] || '이미 진행 중입니다.' }, { status: 409 })
  }

  // ─── Gemini로 JSON 스펙 추출 ───
  const systemPrompt = loadPrompt('mvp-spec-extractor-system.txt')
  const userPrompt = buildSpecExtractionPrompt(planDoc.content, designPref, project.title)

  let specJson: string
  const usage: TokenUsage = { inputTokens: 0, outputTokens: 0 }

  try {
    const result = await generateWithGemini(systemPrompt, userPrompt, {
      maxTokens: 8192,
      temperature: 0.3, // 구조화 추출이므로 낮은 temperature
    })
    usage.inputTokens = result.inputTokens
    usage.outputTokens = result.outputTokens

    // JSON 파싱 검증
    const cleaned = result.content
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim()
    const parsed = JSON.parse(cleaned)

    // 필수 필드 검증
    if (!parsed.entities || !Array.isArray(parsed.entities) || parsed.entities.length === 0) {
      throw new Error('entities 배열이 비어있습니다.')
    }
    if (!parsed.screens || !Array.isArray(parsed.screens)) {
      throw new Error('screens 배열이 없습니다.')
    }

    // 제한 검증
    if (parsed.entities.length > 5) {
      parsed.entities = parsed.entities.slice(0, 5)
    }
    if (parsed.screens.length > 8) {
      parsed.screens = parsed.screens.slice(0, 8)
    }

    specJson = JSON.stringify(parsed, null, 2)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `스펙 추출 실패: ${message}` }, { status: 500 })
  }

  // 토큰 사용량 기록
  await logTokenUsage(supabase, user.id, projectId, 'mvp_generate', usage)

  // SPEC_REVIEW 상태로 큐 등록 (사용자가 확인 후 빌드 시작)
  const { error: insertError } = await supabase.from('mvp_build_queue').insert({
    project_id: projectId,
    status: 'SPEC_REVIEW',
    spec_json: specJson,
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // 프로젝트 상태 MVP로 전환
  if (project.status === 'DESIGN') {
    await supabase
      .from('projects')
      .update({ status: 'MVP', updated_at: new Date().toISOString() })
      .eq('id', projectId)
  }

  return NextResponse.json({ success: true, spec: JSON.parse(specJson) })
}

function buildSpecExtractionPrompt(
  planContent: string,
  pref: Record<string, unknown>,
  projectTitle: string
): string {
  return `서비스명: ${projectTitle}

━━━ 디자인 선호도 ━━━
- 디자인 톤: ${pref.design_tone || '모던'}
- 메인 컬러: ${pref.primary_color || '#2563eb'}
- 보조 컬러: ${pref.secondary_color || '#8b5cf6'}
- 색상 모드: ${pref.color_mode || 'LIGHT'}
- 레이아웃: ${pref.layout_style || 'SIDEBAR'}

━━━ MVP 구현 지침 ━━━
${pref.mvp_guidelines || '(없음)'}

━━━ 기획안 ━━━
${planContent}
`
}
