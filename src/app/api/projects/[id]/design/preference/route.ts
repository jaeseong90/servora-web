import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseProjectId } from '@/lib/utils/parse-project-id'
import { z } from 'zod'

const designPreferenceSchema = z.object({
  design_tone: z.string().max(50),
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  secondary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  color_mode: z.enum(['LIGHT', 'DARK']),
  layout_style: z.enum(['SIDEBAR', 'TOP_NAV', 'MINIMAL']),
  font_style: z.string().max(50),
  corner_style: z.string().max(50),
  finalize: z.boolean().optional(),
})

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

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = designPreferenceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input' }, { status: 400 })
  }
  const { finalize, ...designData } = parsed.data

  // upsert
  const { error } = await supabase
    .from('design_preferences')
    .upsert({
      project_id: projectId,
      ...designData,
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
