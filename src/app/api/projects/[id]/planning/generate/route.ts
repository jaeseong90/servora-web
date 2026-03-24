import { NextRequest } from 'next/server'
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
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: project } = await supabase
    .from('projects').select('*').eq('id', projectId).single()
  if (!project || project.user_id !== user.id)
    return new Response('Not found', { status: 404 })

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
  return `아래 설문 답변을 기반으로 서비스 기획안을 작성해주세요.

1. 서비스 핵심 아이디어: ${q.q1 || '(미입력)'}
2. 타겟 사용자: ${q.q2 || '(미입력)'}
3. 핵심 기능 3가지: ${q.q3 || '(미입력)'}
4. 차별화 포인트: ${q.q4 || '(미입력)'}
5. 수익 모델: ${q.q5 || '(미입력)'}
6. 사용자 여정: ${q.q6 || '(미입력)'}
7. 필수 데이터: ${q.q7 || '(미입력)'}
8. 외부 연동: ${q.q8 || '(미입력)'}
9. MVP 론칭 범위: ${q.q9 || '(미입력)'}
10. 성공 지표: ${q.q10 || '(미입력)'}
`
}
