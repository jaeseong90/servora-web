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
  const { section, currentContent } = body

  const systemPrompt = loadPrompt('plan-deep-diver-system.txt')
  const userPrompt = `## 현재 기획안\n\n${currentContent}\n\n## 딥다이브 대상 항목\n\n${section}`

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
          questionnaire_data: null,
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
