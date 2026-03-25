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
  const { finalize, ...designData } = body

  // upsert
  const { error } = await supabase
    .from('design_preferences')
    .upsert({
      project_id: Number(projectId),
      design_tone: designData.design_tone,
      primary_color: designData.primary_color,
      secondary_color: designData.secondary_color,
      color_mode: designData.color_mode,
      layout_style: designData.layout_style,
      font_style: designData.font_style,
      corner_style: designData.corner_style,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'project_id' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // finalize 플래그가 있을 때만 MVP 단계로 전환
  if (finalize) {
    await supabase
      .from('projects')
      .update({ status: 'MVP', updated_at: new Date().toISOString() })
      .eq('id', projectId)
  }

  return NextResponse.json({ success: true })
}
