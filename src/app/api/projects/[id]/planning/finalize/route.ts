import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: project } = await supabase
    .from('projects').select('*').eq('id', projectId).single()
  if (!project || project.user_id !== user.id)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // 최신 기획 문서 확정
  const { data: latestDoc } = await supabase
    .from('planning_documents')
    .select('id')
    .eq('project_id', projectId)
    .order('version', { ascending: false })
    .limit(1)
    .single()

  if (!latestDoc) {
    return NextResponse.json({ error: '기획 문서가 없습니다.' }, { status: 400 })
  }

  await supabase
    .from('planning_documents')
    .update({ is_finalized: true })
    .eq('id', latestDoc.id)

  await supabase
    .from('projects')
    .update({ status: 'DESIGN', updated_at: new Date().toISOString() })
    .eq('id', projectId)

  return NextResponse.json({ success: true })
}
