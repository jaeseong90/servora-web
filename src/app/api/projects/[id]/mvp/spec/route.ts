import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseProjectId } from '@/lib/utils/parse-project-id'
import { z } from 'zod'

/**
 * MVP 스펙 조회/수정/확정 API
 * 
 * GET  — 현재 스펙 조회
 * PUT  — 스펙 수정 (SPEC_REVIEW 상태에서만)
 * POST — 스펙 확정 → PENDING 상태로 전환 (데몬이 픽업)
 */

// GET: 스펙 조회
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
    .from('projects').select('id').eq('id', projectId).eq('user_id', user.id).single()
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: build } = await supabase
    .from('mvp_build_queue')
    .select('id, status, spec_json')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!build || !build.spec_json) {
    return NextResponse.json({ spec: null })
  }

  return NextResponse.json({
    buildId: build.id,
    status: build.status,
    spec: JSON.parse(build.spec_json),
  })
}

// PUT: 스펙 수정
const specUpdateSchema = z.object({
  spec: z.object({
    serviceName: z.string(),
    serviceDescription: z.string(),
    entities: z.array(z.object({
      name: z.string(),
      displayName: z.string(),
      fields: z.array(z.object({
        name: z.string(),
        type: z.string(),
        displayName: z.string(),
        required: z.boolean().optional(),
        options: z.array(z.string()).optional(),
        relationTarget: z.string().optional(),
      })),
    })).min(1).max(5),
    screens: z.array(z.object({
      id: z.string(),
      displayName: z.string(),
      type: z.string(),
      entity: z.string(),
      role: z.string().optional(),
      audience: z.string().optional(),
      columns: z.array(z.string()).optional(),
      actions: z.array(z.string()).optional(),
      search: z.array(z.string()).optional(),
      description: z.string().optional(),
    })).max(8),
    roles: z.array(z.any()).optional(),
    excludedFromMvp: z.array(z.string()).optional(),
  }),
})

export async function PUT(
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
    .from('projects').select('id').eq('id', projectId).eq('user_id', user.id).single()
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // SPEC_REVIEW 상태인 빌드만 수정 가능
  const { data: build } = await supabase
    .from('mvp_build_queue')
    .select('id, status')
    .eq('project_id', projectId)
    .eq('status', 'SPEC_REVIEW')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!build) {
    return NextResponse.json({ error: '수정 가능한 스펙이 없습니다.' }, { status: 400 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = specUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid spec' }, { status: 400 })
  }

  const { error } = await supabase
    .from('mvp_build_queue')
    .update({
      spec_json: JSON.stringify(parsed.data.spec, null, 2),
    })
    .eq('id', build.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// POST: 스펙 확정 → PENDING 전환 (빌드 시작)
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
    .from('projects').select('id').eq('id', projectId).eq('user_id', user.id).single()
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // SPEC_REVIEW → PENDING 전환
  const { data: build, error: selectError } = await supabase
    .from('mvp_build_queue')
    .select('id, status, spec_json')
    .eq('project_id', projectId)
    .eq('status', 'SPEC_REVIEW')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!build || selectError) {
    return NextResponse.json({ error: '확정할 스펙이 없습니다.' }, { status: 400 })
  }

  if (!build.spec_json) {
    return NextResponse.json({ error: '스펙 데이터가 비어있습니다.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('mvp_build_queue')
    .update({ status: 'PENDING' })
    .eq('id', build.id)
    .eq('status', 'SPEC_REVIEW') // 낙관적 잠금

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
