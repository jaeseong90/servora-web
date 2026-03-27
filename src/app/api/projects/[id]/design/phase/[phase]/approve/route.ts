import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseProjectId } from '@/lib/utils/parse-project-id'
import type { DesignBlueprint } from '@/types'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; phase: string }> }
) {
  const { id: rawId, phase: phaseStr } = await params
  const projectId = parseProjectId(rawId)
  if (!projectId) return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })

  const phase = parseInt(phaseStr, 10)
  if (![1, 2, 3].includes(phase)) {
    return NextResponse.json({ error: 'Invalid phase (1-3)' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: project } = await supabase
    .from('projects').select('id, status').eq('id', projectId).eq('user_id', user.id).single()
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (project.status !== 'DESIGN')
    return NextResponse.json({ error: '디자인 단계에서만 가능합니다.' }, { status: 400 })

  const { data: pref } = await supabase
    .from('design_preferences')
    .select('design_blueprint, phase_status, current_phase')
    .eq('project_id', projectId)
    .single()

  if (!pref) return NextResponse.json({ error: '디자인 설정이 없습니다.' }, { status: 400 })

  const blueprint = pref.design_blueprint as DesignBlueprint | null
  const phaseStatus: Record<string, string> = pref.phase_status || { '1': 'pending', '2': 'pending', '3': 'pending', '4': 'pending' }

  // Phase별 검증
  if (phase === 1 && !blueprint?.brand) {
    return NextResponse.json({ error: '브랜드 시안이 없습니다.' }, { status: 400 })
  }
  if (phase === 2 && !blueprint?.architecture) {
    return NextResponse.json({ error: '서비스 구성이 없습니다.' }, { status: 400 })
  }
  if (phase === 3) {
    if (!blueprint?.architecture?.screens?.length) {
      return NextResponse.json({ error: '서비스 구성이 없습니다.' }, { status: 400 })
    }
    const allScreenIds = blueprint.architecture.screens.map(s => s.id)
    const detailedIds = (blueprint.screenDetails || []).map(d => d.screenId)
    const missing = allScreenIds.filter(id => !detailedIds.includes(id))
    if (missing.length > 0) {
      return NextResponse.json({
        error: `아직 상세 설계가 완료되지 않은 화면이 있습니다: ${missing.join(', ')}`,
      }, { status: 400 })
    }
  }

  // Phase 승인 + 다음 Phase 잠금 해제
  phaseStatus[String(phase)] = 'approved'
  const nextPhase = phase + 1
  if (nextPhase <= 4 && phaseStatus[String(nextPhase)] === 'pending') {
    // 다음 Phase는 pending으로 유지 (진입 가능)
  }

  const currentPhase = Math.max(pref.current_phase || 0, phase + 1)

  await supabase.from('design_preferences').update({
    current_phase: currentPhase,
    phase_status: phaseStatus,
    updated_at: new Date().toISOString(),
  }).eq('project_id', projectId)

  return NextResponse.json({ success: true, phaseStatus, currentPhase })
}
