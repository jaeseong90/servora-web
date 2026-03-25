import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const pptRequestSchema = z.object({
  documentId: z.number().int().positive(),
})

export async function POST(
  request: NextRequest,
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

  const body = await request.json()
  const parsed = pptRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { documentId } = parsed.data

  // 해당 문서가 이 프로젝트에 속하는지 확인
  const { data: doc } = await supabase
    .from('planning_documents')
    .select('id')
    .eq('id', documentId)
    .eq('project_id', projectId)
    .single()

  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  // 이미 PENDING/BUILDING 상태인 요청이 있는지 확인 (중복 방지)
  const { data: existing } = await supabase
    .from('ppt_build_queue')
    .select('id, status')
    .eq('document_id', documentId)
    .in('status', ['PENDING', 'BUILDING'])
    .limit(1)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'PPT request already in progress', status: existing.status }, { status: 409 })
  }

  const { error } = await supabase.from('ppt_build_queue').insert({
    project_id: Number(projectId),
    document_id: documentId,
    status: 'PENDING',
  })

  if (error) {
    return NextResponse.json({ error: 'Failed to request PPT' }, { status: 500 })
  }

  return NextResponse.json({ success: true, status: 'PENDING' })
}
