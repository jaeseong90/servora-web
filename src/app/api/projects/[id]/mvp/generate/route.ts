import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateWithGemini } from '@/lib/ai/gemini'
import { loadPrompt } from '@/lib/prompts'

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

  // 확정된 기획안 가져오기
  const { data: planDoc } = await supabase
    .from('planning_documents')
    .select('*')
    .eq('project_id', projectId)
    .eq('is_finalized', true)
    .order('version', { ascending: false })
    .limit(1)
    .single()

  if (!planDoc) {
    return NextResponse.json({ error: '확정된 기획안이 없습니다.' }, { status: 400 })
  }

  // 디자인 선호도 가져오기
  const { data: designPref } = await supabase
    .from('design_preferences')
    .select('*')
    .eq('project_id', projectId)
    .single()

  // MVP 스펙 추출
  const systemPrompt = loadPrompt('mvp-spec-extractor-system.txt')
  const userPrompt = `## 기획안\n\n${planDoc.content}\n\n## 디자인 선호도\n\n${JSON.stringify(designPref || {}, null, 2)}`

  try {
    const result = await generateWithGemini(systemPrompt, userPrompt, {
      maxTokens: 8192,
      temperature: 0.3,
    })

    // 큐에 등록
    const { error: insertError } = await supabase.from('mvp_build_queue').insert({
      project_id: Number(projectId),
      status: 'PENDING',
      spec_json: result.content,
    })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
