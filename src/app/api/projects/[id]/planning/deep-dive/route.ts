import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { loadPrompt } from '@/lib/prompts'
import { createStreamingResponse } from '@/lib/planning/create-streaming-response'
import { z } from 'zod'

const deepDiveSchema = z.object({
  section: z.string().min(1).max(500),
  currentContent: z.string().min(1).max(100000),
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
  const parsed = deepDiveSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }
  const { section, currentContent } = parsed.data

  return createStreamingResponse({
    supabase,
    projectId,
    systemPrompt: loadPrompt('plan-deep-diver-system.txt'),
    userPrompt: `## 현재 기획안\n\n${currentContent}\n\n## 딥다이브 대상 항목\n\n${section}`,
  })
}
