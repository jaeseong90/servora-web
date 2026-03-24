import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { streamWithGemini } from '@/lib/ai/gemini'
import { loadPrompt } from '@/lib/prompts'

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
  const questionnaire = body.questionnaire as Record<string, string>

  const systemPrompt = loadPrompt('planner-system.txt')
  const userPrompt = buildPlannerUserPrompt(questionnaire)

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullContent = ''
        for await (const chunk of streamWithGemini(systemPrompt, userPrompt)) {
          fullContent += chunk
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`))
        }

        const latestDoc = await supabase
          .from('planning_documents')
          .select('version')
          .eq('project_id', projectId)
          .order('version', { ascending: false })
          .limit(1)
          .single()

        const nextVersion = (latestDoc.data?.version || 0) + 1

        await supabase.from('planning_documents').insert({
          project_id: Number(projectId),
          content: fullContent,
          questionnaire_data: questionnaire,
          version: nextVersion,
        })

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'complete', version: nextVersion })}\n\n`))
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message })}\n\n`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

function buildPlannerUserPrompt(q: Record<string, string>): string {
  const nvl = (v: string | undefined) => (v && v.trim()) ? v.trim() : '(미입력)'

  return `아래 사용자의 답변을 바탕으로 웹서비스 기획안을 작성해주세요.

---

[입력값]
- 답변1_만들고싶은서비스: ${nvl(q.q1)}
- 답변2_서비스를만들고싶은이유: ${nvl(q.q2)}
- 답변3_현재가장불편하거나아쉬운점: ${nvl(q.q3)}
- 답변4_가장많이쓸사용자: ${nvl(q.q4)}
- 답변5_사용상황: ${nvl(q.q5)}
- 답변6_사용자에게가장좋아질점: ${nvl(q.q6)}
- 답변7_제일먼저해보고싶은것: ${nvl(q.q7)}
- 답변8_꼭있어야하는기능: ${nvl(q.q8)}
- 답변9_잘만들어졌다고느끼는모습: ${nvl(q.q9)}
- 답변10_참고하고싶은서비스나방식: ${nvl(q.q10)}

---

위 입력값을 기반으로 16개 항목의 기획안을 작성해주세요.
`
}
