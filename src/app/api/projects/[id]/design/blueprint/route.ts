import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseProjectId } from '@/lib/utils/parse-project-id'

export async function GET(
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
    .from('projects').select('id, status, title').eq('id', projectId).eq('user_id', user.id).single()
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: pref } = await supabase
    .from('design_preferences')
    .select('design_blueprint, current_phase, phase_status')
    .eq('project_id', projectId)
    .single()

  return NextResponse.json({
    blueprint: pref?.design_blueprint || null,
    currentPhase: pref?.current_phase || 0,
    phaseStatus: pref?.phase_status || { '1': 'pending', '2': 'pending', '3': 'pending', '4': 'pending' },
    projectStatus: project.status,
    projectTitle: project.title,
  })
}
