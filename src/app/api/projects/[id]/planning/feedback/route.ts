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
  const { feedback, currentContent } = body

  const systemPrompt = loadPrompt('plan-refiner-system.txt')
  const userPrompt = `## 현재 기획안\n\n${currentContent}\n\n## 피드백\n\n${feedback}`

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullContent = ''
        for await (const chunk of streamWithGemini(systemPrompt, userPrompt)) {
          fullContent += chunk
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`))
        }

        // 피드백 기록
        const latestDoc = await supabase
          .from('planning_documents')
          .select('id, version')
          .eq('project_id', projectId)
          .order('version', { ascending: false })
          .limit(1)
          .single()

        if (latestDoc.data) {
          await supabase.from('planning_feedbacks').insert({
            document_id: latestDoc.data.id,
            project_id: Number(projectId),
            content: feedback,
          })
        }

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
