import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateWithGemini } from '@/lib/ai/gemini'
import { checkAiRateLimit } from '@/lib/ratelimit'
import { logTokenUsage } from '@/lib/usage/log-usage'
import { z } from 'zod'

const QUESTION_LABELS: Record<string, string> = {
  q1: '만들고 싶은 서비스',
  q2: '서비스를 만들고 싶은 이유',
  q3: '현재 가장 불편하거나 아쉬운 점',
  q4: '가장 많이 쓸 사용자',
  q5: '사용 상황',
  q6: '사용자에게 가장 좋아질 점',
  q7: '제일 먼저 해보고 싶은 것',
  q8: '꼭 있어야 하는 기능',
  q9: '잘 만들어졌다고 느끼는 모습',
  q10: '참고하고 싶은 서비스나 방식',
}

const suggestSchema = z.object({
  questionnaire: z.record(z.string(), z.string().max(5000)),
  mode: z.enum(['all', 'single']),
  targetKey: z.string().optional(),
}).refine(
  (data) => data.mode === 'all' || (data.mode === 'single' && data.targetKey),
  { message: 'single 모드에서는 targetKey가 필요합니다.' },
)

const SYSTEM_PROMPT = `당신은 웹서비스 기획 전문가입니다. 사용자가 입력한 서비스 아이디어를 바탕으로 나머지 질문에 대한 답변을 자연스럽고 구체적으로 제안합니다.

규칙:
- 사용자의 아이디어와 이미 입력된 답변의 맥락에 맞게 작성
- 답변은 사용자가 직접 쓴 것처럼 자연스러운 1인칭 구어체로 작성
- 각 답변은 2~4문장으로 핵심만 간결하게
- 너무 포괄적이거나 뻔한 답변은 피하고, 서비스 특성에 맞는 구체적인 내용으로 작성
- JSON 형식으로만 응답 (마크다운이나 코드블록 없이 순수 JSON만)`

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = suggestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input' }, { status: 400 })
  }

  const { questionnaire, mode, targetKey } = parsed.data

  if (!questionnaire.q1?.trim()) {
    return NextResponse.json({ error: '서비스 아이디어(Q1)를 먼저 입력해주세요.' }, { status: 400 })
  }

  try {
    const userPrompt = buildUserPrompt(questionnaire, mode, targetKey)
    const result = await generateWithGemini(SYSTEM_PROMPT, userPrompt, {
      maxTokens: mode === 'all' ? 4096 : 1024,
      temperature: 0.8,
    })

    await logTokenUsage(supabase, user.id, projectId, 'planning_suggest', {
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
    })

    // JSON 파싱 (코드블록 제거 후)
    const cleaned = result.content.replace(/```json\s*|```\s*/g, '').trim()
    const suggestions = JSON.parse(cleaned)

    return NextResponse.json({ suggestions })
  } catch (e) {
    console.error('Suggest error:', e)
    const msg = e instanceof Error && e.message.includes('503')
      ? 'AI 서버가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해주세요.'
      : 'AI 답변 생성에 실패했습니다.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

function buildUserPrompt(
  questionnaire: Record<string, string>,
  mode: 'all' | 'single',
  targetKey?: string,
): string {
  const filledEntries = Object.entries(questionnaire)
    .filter(([, v]) => v.trim())
    .map(([k, v]) => `- ${QUESTION_LABELS[k] || k}: ${v.trim()}`)
    .join('\n')

  if (mode === 'all') {
    const emptyKeys = Object.keys(QUESTION_LABELS)
      .filter(k => k !== 'q1' && !questionnaire[k]?.trim())

    return `사용자가 입력한 내용:
${filledEntries}

위 내용을 바탕으로 아래 질문들에 대한 답변을 JSON으로 제안해주세요.
${emptyKeys.map(k => `- "${k}": ${QUESTION_LABELS[k]}`).join('\n')}

응답 형식 (빈 항목만 포함):
{ ${emptyKeys.map(k => `"${k}": "제안 답변"`).join(', ')} }`
  }

  // single mode
  const key = targetKey!
  return `사용자가 입력한 내용:
${filledEntries}

위 내용을 바탕으로 아래 질문에 대한 답변을 JSON으로 제안해주세요.
- "${key}": ${QUESTION_LABELS[key] || key}

응답 형식:
{ "${key}": "제안 답변" }`
}
