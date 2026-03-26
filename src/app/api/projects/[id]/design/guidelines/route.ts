import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const guidelinesSchema = z.object({
  mvp_guidelines: z.string().min(1).max(50000),
})

export async function PUT(
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
  const parsed = guidelinesSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: '지침 내용이 필요합니다.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('design_preferences')
    .update({
      mvp_guidelines: parsed.data.mvp_guidelines,
      updated_at: new Date().toISOString(),
    })
    .eq('project_id', projectId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
