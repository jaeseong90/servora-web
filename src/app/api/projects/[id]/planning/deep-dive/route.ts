import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { loadPrompt } from '@/lib/prompts'
import { createStreamingResponse } from '@/lib/planning/create-streaming-response'
import { checkAiRateLimit } from '@/lib/ratelimit'
import { parseProjectId } from '@/lib/utils/parse-project-id'
import { z } from 'zod'

const deepDiveSchema = z.object({
  sectionTitle: z.string().min(1).max(500),
  detail: z.string().min(1).max(10000),
  currentContent: z.string().min(1).max(100000),
})

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

  const rateLimited = await checkAiRateLimit(user.id)
  if (rateLimited) return rateLimited

  const { data: project } = await supabase
    .from('projects').select('*').eq('id', projectId).single()
  if (!project || project.user_id !== user.id)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (project.status !== 'PLANNING')
    return NextResponse.json({ error: '기획 단계에서만 딥다이브를 실행할 수 있습니다.' }, { status: 400 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = deepDiveSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }
  const { sectionTitle, detail, currentContent } = parsed.data

  const userPrompt = `## 현재 기획안\n\n${currentContent}\n\n## 딥다이브 대상 섹션\n\n${sectionTitle}\n\n## 보강 요청 상세 내역\n\n${detail}`

  return createStreamingResponse({
    supabase,
    userId: user.id,
    projectId,
    action: 'planning_deep_dive',
    systemPrompt: loadPrompt('plan-deepdive-system.txt'),
    userPrompt,
    onBeforeSave: async (sb) => {
      const { data: latestDoc } = await sb
        .from('planning_documents')
        .select('id')
        .eq('project_id', projectId)
        .order('version', { ascending: false })
        .limit(1)
        .single()

      if (latestDoc) {
        await sb.from('planning_feedbacks').insert({
          document_id: latestDoc.id,
          project_id: projectId,
          content: `[딥다이브: ${sectionTitle}] ${detail}`,
        })
      }
    },
  })
}
