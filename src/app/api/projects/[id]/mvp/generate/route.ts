import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseProjectId } from '@/lib/utils/parse-project-id'

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

  const { data: project } = await supabase
    .from('projects').select('*').eq('id', projectId).single()
  if (!project || project.user_id !== user.id)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (project.status !== 'DESIGN' && project.status !== 'MVP')
    return NextResponse.json({ error: '디자인 또는 MVP 단계에서만 MVP를 생성할 수 있습니다.' }, { status: 400 })

  // 확정된 기획안 확인
  const { data: planDoc } = await supabase
    .from('planning_documents')
    .select('id')
    .eq('project_id', projectId)
    .eq('is_finalized', true)
    .limit(1)
    .single()

  if (!planDoc) {
    return NextResponse.json({ error: '확정된 기획안이 없습니다.' }, { status: 400 })
  }

  // MVP 구현 지침 확인
  const { data: designPref } = await supabase
    .from('design_preferences')
    .select('mvp_guidelines')
    .eq('project_id', projectId)
    .single()

  if (!designPref?.mvp_guidelines) {
    return NextResponse.json({ error: 'MVP 구현 지침이 없습니다. 디자인 단계에서 지침을 먼저 생성해주세요.' }, { status: 400 })
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

  // 큐에 등록 (Gemini 호출 없이 즉시 등록, 데몬이 처리)
  const { error: insertError } = await supabase.from('mvp_build_queue').insert({
    project_id: projectId,
    status: 'PENDING',
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
