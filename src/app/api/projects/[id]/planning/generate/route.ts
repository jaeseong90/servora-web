import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { loadPrompt } from '@/lib/prompts'
import { createStreamingResponse } from '@/lib/planning/create-streaming-response'
import { checkAiRateLimit } from '@/lib/ratelimit'
import { z } from 'zod'

const questionnaireSchema = z.object({
  questionnaire: z.record(z.string(), z.string().max(5000)).refine(
    (q) => Object.values(q).filter(v => v.trim()).length >= 3,
    { message: '최소 3개 질문에 답변해야 합니다.' }
  ),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
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
    return NextResponse.json({ error: '기획 단계에서만 생성할 수 있습니다.' }, { status: 400 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = questionnaireSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input' }, { status: 400 })
  }
  const { questionnaire } = parsed.data

  return createStreamingResponse({
    supabase,
    userId: user.id,
    projectId,
    action: 'planning_generate',
    systemPrompt: loadPrompt('planner-system.txt'),
    userPrompt: buildPlannerUserPrompt(questionnaire),
    questionnaireData: questionnaire,
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
