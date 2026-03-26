import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { streamWithGemini, type TokenUsage } from '@/lib/ai/gemini'
import { loadPrompt } from '@/lib/prompts'
import { checkAiRateLimit } from '@/lib/ratelimit'
import { logTokenUsage } from '@/lib/usage/log-usage'

export async function POST(
  _request: NextRequest,
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

  if (project.status !== 'DESIGN')
    return NextResponse.json({ error: '디자인 단계에서만 지침을 생성할 수 있습니다.' }, { status: 400 })

  // 확정된 기획안 조회
  const { data: planDoc } = await supabase
    .from('planning_documents')
    .select('content')
    .eq('project_id', projectId)
    .eq('is_finalized', true)
    .order('version', { ascending: false })
    .limit(1)
    .single()

  if (!planDoc) {
    return NextResponse.json({ error: '확정된 기획안이 없습니다.' }, { status: 400 })
  }

  // 디자인 선호도 조회
  const { data: pref } = await supabase
    .from('design_preferences')
    .select('*')
    .eq('project_id', projectId)
    .single()

  const systemPrompt = loadPrompt('mvp-guidelines-system.txt')
  const userPrompt = buildUserPrompt(planDoc.content, pref, project.title)

  // 생성 시작: 상태를 GENERATING으로 변경
  await supabase
    .from('design_preferences')
    .update({
      guidelines_status: 'GENERATING',
      updated_at: new Date().toISOString(),
    })
    .eq('project_id', projectId)

  const encoder = new TextEncoder()
  const usage: TokenUsage = { inputTokens: 0, outputTokens: 0 }
  const CHECKPOINT_INTERVAL = 30_000 // 30초마다 중간 저장

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullContent = ''
        let lastCheckpoint = Date.now()

        for await (const chunk of streamWithGemini(systemPrompt, userPrompt, { maxTokens: 32768 }, usage)) {
          fullContent += chunk
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`)
          )

          // 주기적 중간 저장
          if (Date.now() - lastCheckpoint >= CHECKPOINT_INTERVAL) {
            await supabase
              .from('design_preferences')
              .update({
                mvp_guidelines: fullContent,
                updated_at: new Date().toISOString(),
              })
              .eq('project_id', projectId)
            lastCheckpoint = Date.now()
          }
        }

        // 완료: DB 저장 + 상태 COMPLETED
        const currentVersion = pref?.guidelines_version || 0
        await supabase
          .from('design_preferences')
          .update({
            mvp_guidelines: fullContent,
            guidelines_version: currentVersion + 1,
            guidelines_status: 'COMPLETED',
            updated_at: new Date().toISOString(),
          })
          .eq('project_id', projectId)

        // 토큰 사용량 기록
        await logTokenUsage(supabase, user.id, projectId, 'design_guidelines', usage)

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'complete', version: currentVersion + 1 })}\n\n`)
        )
      } catch (error: unknown) {
        // 에러 시 상태를 IDLE로 복구 (부분 내용은 유지)
        await supabase
          .from('design_preferences')
          .update({
            guidelines_status: 'IDLE',
            updated_at: new Date().toISOString(),
          })
          .eq('project_id', projectId)

        const message = error instanceof Error ? error.message : 'Unknown error'
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', message })}\n\n`)
        )
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

function buildUserPrompt(planContent: string, pref: Record<string, string> | null, projectTitle: string): string {
  const p = pref || {}
  return `서비스명: ${projectTitle}

━━━ 디자인 선호도 ━━━
- 디자인 톤: ${p.design_tone || '모던'}
- 메인 컬러: ${p.primary_color || '#2563eb'}
- 보조 컬러: ${p.secondary_color || '#8b5cf6'}
- 색상 모드: ${p.color_mode || 'LIGHT'}
- 레이아웃: ${p.layout_style || 'SIDEBAR'}
- 폰트: ${p.font_style || '깔끔한 고딕'}
- 모서리: ${p.corner_style || '약간 둥근'}

━━━ 기획안 ━━━
${planContent}
`
}
