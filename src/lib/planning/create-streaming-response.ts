import type { SupabaseClient } from '@supabase/supabase-js'
import { streamWithGemini } from '@/lib/ai/gemini'
import { insertDocumentWithVersion } from './insert-document'

interface StreamingOptions {
  supabase: SupabaseClient
  projectId: string
  systemPrompt: string
  userPrompt: string
  questionnaireData?: Record<string, string> | null
  onBeforeSave?: (supabase: SupabaseClient, fullContent: string) => Promise<void>
}

/**
 * AI 스트리밍 생성 + DB 저장을 위한 공통 SSE Response를 생성합니다.
 */
export function createStreamingResponse(options: StreamingOptions): Response {
  const {
    supabase,
    projectId,
    systemPrompt,
    userPrompt,
    questionnaireData = null,
    onBeforeSave,
  } = options

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullContent = ''
        for await (const chunk of streamWithGemini(systemPrompt, userPrompt)) {
          fullContent += chunk
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`)
          )
        }

        if (onBeforeSave) {
          await onBeforeSave(supabase, fullContent)
        }

        const nextVersion = await insertDocumentWithVersion(
          supabase,
          projectId,
          fullContent,
          questionnaireData,
        )

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'complete', version: nextVersion })}\n\n`)
        )
      } catch (error: unknown) {
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
