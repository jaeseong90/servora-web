import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 프로젝트 소유권 확인
  const { data: project } = await supabase
    .from('projects').select('id').eq('id', projectId).eq('user_id', user.id).single()
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: build } = await supabase
    .from('mvp_build_queue')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // MVP 빌드 완료 시 프로젝트 상태를 COMPLETED로 업데이트
  if (build?.status === 'COMPLETED') {
    const { data: proj } = await supabase
      .from('projects').select('status').eq('id', projectId).single()
    if (proj?.status === 'MVP') {
      await supabase
        .from('projects')
        .update({ status: 'COMPLETED', updated_at: new Date().toISOString() })
        .eq('id', projectId)
    }
  }

  return NextResponse.json({ build })
}
