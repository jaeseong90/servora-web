const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
}

interface GeminiResponse {
  content: string
  inputTokens: number
  outputTokens: number
}

export async function generateWithGemini(
  systemPrompt: string,
  userPrompt: string,
  options?: { model?: string; maxTokens?: number; temperature?: number }
): Promise<GeminiResponse> {
  const model = options?.model || 'gemini-2.5-flash'
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.')

  const response = await fetch(
    `${GEMINI_API_URL}/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
          maxOutputTokens: options?.maxTokens || 16384,
          temperature: options?.temperature || 0.7,
        },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Gemini API 오류 (${response.status}): ${error}`)
  }

  const data = await response.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const usage = data.usageMetadata || {}

  return {
    content,
    inputTokens: usage.promptTokenCount || 0,
    outputTokens: usage.candidatesTokenCount || 0,
  }
}

/**
 * SSE 스트리밍 생성 (기획안 생성용)
 */
export async function* streamWithGemini(
  systemPrompt: string,
  userPrompt: string,
  options?: { model?: string; maxTokens?: number },
  usageTracker?: TokenUsage,
): AsyncGenerator<string> {
  const model = options?.model || 'gemini-2.5-flash'
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.')

  const response = await fetch(
    `${GEMINI_API_URL}/${model}:streamGenerateContent?alt=sse`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
          maxOutputTokens: options?.maxTokens || 16384,
          temperature: 0.7,
        },
      }),
    }
  )

  if (!response.ok) throw new Error(`Gemini 스트리밍 실패: ${response.status}`)

  const reader = response.body?.getReader()
  if (!reader) throw new Error('스트림을 읽을 수 없습니다.')
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    // SSE 파싱
    for (const line of chunk.split('\n')) {
      if (line.startsWith('data: ')) {
        try {
          const json = JSON.parse(line.slice(6))
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) yield text
          if (json.usageMetadata && usageTracker) {
            usageTracker.inputTokens = json.usageMetadata.promptTokenCount || 0
            usageTracker.outputTokens = json.usageMetadata.candidatesTokenCount || 0
          }
        } catch { /* 파싱 실패 무시 */ }
      }
    }
  }
}
