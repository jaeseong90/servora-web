import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateWithGemini } from '@/lib/ai/gemini'
import { loadPrompt } from '@/lib/prompts'
import { logTokenUsage } from '@/lib/usage/log-usage'
import { checkAiRateLimit } from '@/lib/ratelimit'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
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

  // 확정된 기획안 가져오기
  const { data: planDoc } = await supabase
    .from('planning_documents')
    .select('*')
    .eq('project_id', projectId)
    .eq('is_finalized', true)
    .order('version', { ascending: false })
    .limit(1)
    .single()

  if (!planDoc) {
    return NextResponse.json({ error: '확정된 기획안이 없습니다.' }, { status: 400 })
  }

  // 중복 요청 방지: PENDING/BUILDING/COMPLETED 상태가 이미 있으면 차단
  const { data: existingBuild } = await supabase
    .from('mvp_build_queue')
    .select('id, status')
    .eq('project_id', projectId)
    .in('status', ['PENDING', 'BUILDING', 'COMPLETED'])
    .limit(1)
    .single()

  if (existingBuild) {
    const msg = existingBuild.status === 'COMPLETED'
      ? 'MVP가 이미 생성되었습니다.'
      : 'MVP 생성이 이미 진행 중입니다.'
    return NextResponse.json({ error: msg }, { status: 409 })
  }

  // 디자인 선호도 가져오기
  const { data: designPref } = await supabase
    .from('design_preferences')
    .select('*')
    .eq('project_id', projectId)
    .single()

  // MVP 스펙 추출
  const systemPrompt = loadPrompt('mvp-spec-extractor-system.txt')
  const userPrompt = `## 기획안\n\n${planDoc.content}\n\n## 디자인 선호도\n\n${JSON.stringify(designPref || {}, null, 2)}`

  try {
    const result = await generateWithGemini(systemPrompt, userPrompt, {
      maxTokens: 8192,
      temperature: 0.3,
    })

    // 토큰 사용량 기록
    await logTokenUsage(supabase, user.id, projectId, 'mvp_generate', {
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
    })

    // 큐에 등록
    const { error: insertError } = await supabase.from('mvp_build_queue').insert({
      project_id: Number(projectId),
      status: 'PENDING',
      spec_json: result.content,
    })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
