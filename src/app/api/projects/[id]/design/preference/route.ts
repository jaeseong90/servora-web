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

  const { data } = await supabase
    .from('design_preferences')
    .select('*')
    .eq('project_id', projectId)
    .single()

  return NextResponse.json({ preference: data })
}

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

  // upsert
  const { error } = await supabase
    .from('design_preferences')
    .upsert({
      project_id: Number(projectId),
      design_tone: body.design_tone,
      primary_color: body.primary_color,
      secondary_color: body.secondary_color,
      color_mode: body.color_mode,
      layout_style: body.layout_style,
      font_style: body.font_style,
      corner_style: body.corner_style,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'project_id' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 프로젝트 상태 업데이트
  await supabase
    .from('projects')
    .update({ status: 'MVP', updated_at: new Date().toISOString() })
    .eq('id', projectId)

  return NextResponse.json({ success: true })
}
