import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateWithGemini, type TokenUsage } from '@/lib/ai/gemini'
import { loadPrompt } from '@/lib/prompts'
import { checkAiRateLimit } from '@/lib/ratelimit'
import { logTokenUsage } from '@/lib/usage/log-usage'
import { parseProjectId } from '@/lib/utils/parse-project-id'
import type { DesignBlueprint, ScreenDetail } from '@/types'

/**
 * MVP 생성 요청 — JSON 스펙 추출 + 큐 등록
 *
 * v3: design_blueprint가 있으면 직접 spec 조합 (AI 호출 최소화)
 *     없으면 레거시 경로 (mvp_guidelines → Gemini 추출)
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

  const { data: designPref } = await supabase
    .from('design_preferences')
    .select('*')
    .eq('project_id', projectId)
    .single()

  const blueprint = designPref?.design_blueprint as DesignBlueprint | null

  // blueprint도 없고 mvp_guidelines도 없으면 차단
  if (!blueprint?.finalized && !designPref?.mvp_guidelines) {
    return NextResponse.json({ error: '디자인 단계를 먼저 완료해주세요.' }, { status: 400 })
  }

  // 중복 요청 방지
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

  let specJson: string

  // ─── 경로 분기: blueprint vs 레거시 ───
  if (blueprint?.finalized && blueprint.entities.length > 0 && blueprint.architecture) {
    // v3: blueprint에서 직접 spec 조합 (AI 호출 불필요)
    try {
      const spec = assembleSpecFromBlueprint(blueprint, project.title)
      specJson = JSON.stringify(spec, null, 2)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return NextResponse.json({ error: `스펙 조합 실패: ${message}` }, { status: 500 })
    }
  } else {
    // 레거시: Gemini로 JSON 스펙 추출
    const systemPrompt = loadPrompt('mvp-spec-extractor-system.txt')
    const userPrompt = buildSpecExtractionPrompt(planDoc.content, designPref, project.title)

    const usage: TokenUsage = { inputTokens: 0, outputTokens: 0 }

    try {
      const result = await generateWithGemini(systemPrompt, userPrompt, {
        maxTokens: 8192,
        temperature: 0.3,
      })
      usage.inputTokens = result.inputTokens
      usage.outputTokens = result.outputTokens

      const cleaned = result.content
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim()
      const parsed = JSON.parse(cleaned)

      if (!parsed.entities || !Array.isArray(parsed.entities) || parsed.entities.length === 0) {
        throw new Error('entities 배열이 비어있습니다.')
      }
      if (!parsed.screens || !Array.isArray(parsed.screens)) {
        throw new Error('screens 배열이 없습니다.')
      }

      if (parsed.entities.length > 5) parsed.entities = parsed.entities.slice(0, 5)
      if (parsed.screens.length > 8) parsed.screens = parsed.screens.slice(0, 8)

      specJson = JSON.stringify(parsed, null, 2)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return NextResponse.json({ error: `스펙 추출 실패: ${message}` }, { status: 500 })
    }

    await logTokenUsage(supabase, user.id, projectId, 'mvp_generate', usage)
  }

  // SPEC_REVIEW 상태로 큐 등록
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

// ─── v3: blueprint → spec 직접 조합 ───

function assembleSpecFromBlueprint(blueprint: DesignBlueprint, projectTitle: string) {
  const { architecture, entities, screenDetails } = blueprint

  if (!architecture) throw new Error('architecture가 없습니다.')

  return {
    serviceName: projectTitle,
    serviceDescription: architecture.coreValue,
    entities: entities.map(e => ({
      name: e.name,
      displayName: e.displayName,
      fields: e.fields.map(f => ({
        name: f.name,
        type: f.type,
        displayName: f.displayName,
        required: f.required,
        ...(f.options ? { options: f.options } : {}),
        ...(f.relationTarget ? { relationTarget: f.relationTarget } : {}),
      })),
    })),
    screens: architecture.screens.map(screen => {
      const detail = screenDetails.find((d: ScreenDetail) => d.screenId === screen.id)
      return {
        id: screen.id,
        displayName: screen.displayName,
        type: inferScreenType(detail),
        entity: inferPrimaryEntity(screen.id, entities, detail),
        role: screen.audience,
        audience: screen.audience,
        columns: inferColumns(detail, entities, screen.id),
        actions: inferActions(detail, screen.audience),
        search: inferSearchFields(detail),
        description: screen.description,
      }
    }),
    roles: [
      { name: 'admin', displayName: '운영자', description: '전체 관리' },
      { name: 'customer', displayName: '고객', description: '서비스 이용' },
    ],
    excludedFromMvp: architecture.excludedFeatures,
  }
}

function inferScreenType(detail?: ScreenDetail): string {
  if (!detail?.sections?.length) return 'list'
  const names = detail.sections.map(s => s.name.toLowerCase())
  if (names.some(n => n.includes('대시보드') || n.includes('dashboard') || n.includes('통계'))) return 'dashboard'
  if (names.some(n => n.includes('상세') || n.includes('detail'))) return 'detail'
  return 'list'
}

function inferPrimaryEntity(
  screenId: string,
  entities: DesignBlueprint['entities'],
  detail?: ScreenDetail
): string {
  // managedInfo에서 가장 많이 겹치는 entity 찾기
  if (!detail?.managedInfo?.length || !entities.length) {
    return entities[0]?.name || screenId
  }
  const infoNames = detail.managedInfo.map(i => i.name)
  let best = entities[0]?.name || screenId
  let bestScore = 0
  for (const entity of entities) {
    const score = entity.fields.filter(f =>
      infoNames.some(n => n.includes(f.displayName) || f.displayName.includes(n))
    ).length
    if (score > bestScore) { bestScore = score; best = entity.name }
  }
  return best
}

function inferColumns(
  detail: ScreenDetail | undefined,
  entities: DesignBlueprint['entities'],
  screenId: string
): string[] {
  const entityName = inferPrimaryEntity(screenId, entities, detail)
  const entity = entities.find(e => e.name === entityName)
  if (!entity) return []
  // 처음 4개 필드를 columns로
  return entity.fields.slice(0, 4).map(f => f.name)
}

function inferActions(detail: ScreenDetail | undefined, audience: string): string[] {
  if (!detail?.sections?.length) {
    return audience === 'admin' ? ['create', 'edit', 'detail', 'delete'] : ['detail']
  }
  const actions: string[] = ['detail']
  const allInteractions = detail.sections.flatMap(s => s.interactions).join(' ')
  if (allInteractions.includes('등록') || allInteractions.includes('추가') || allInteractions.includes('생성')) actions.push('create')
  if (allInteractions.includes('수정') || allInteractions.includes('편집') || allInteractions.includes('변경')) actions.push('edit')
  if (allInteractions.includes('삭제') || allInteractions.includes('제거')) actions.push('delete')
  return [...new Set(actions)]
}

function inferSearchFields(detail?: ScreenDetail): string[] {
  if (!detail?.sections?.length) return []
  const searchable: string[] = []
  for (const section of detail.sections) {
    for (const comp of section.components) {
      if (comp.includes('검색')) {
        // "이름, 연락처로 검색" → ["name", "phone"] 식의 추론은 어려우므로 첫 managedInfo 사용
        if (detail.managedInfo.length > 0) {
          searchable.push(detail.managedInfo[0].name)
        }
        break
      }
    }
  }
  return searchable
}

// ─── 레거시: Gemini 추출용 프롬프트 ───

function buildSpecExtractionPrompt(
  planContent: string,
  pref: Record<string, unknown> | null,
  projectTitle: string
): string {
  const p = pref || {}
  return `서비스명: ${projectTitle}

━━━ 디자인 선호도 ━━━
- 디자인 톤: ${p.design_tone || '모던'}
- 메인 컬러: ${p.primary_color || '#2563eb'}
- 보조 컬러: ${p.secondary_color || '#8b5cf6'}
- 색상 모드: ${p.color_mode || 'LIGHT'}
- 레이아웃: ${p.layout_style || 'SIDEBAR'}

━━━ MVP 구현 지침 ━━━
${p.mvp_guidelines || '(없음)'}

━━━ 기획안 ━━━
${planContent}
`
}
