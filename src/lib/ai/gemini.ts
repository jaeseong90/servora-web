const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

// API 키 라운드로빈 + 429 시 다음 키로 폴백
function getApiKeys(): string[] {
  const keys: string[] = []
  if (process.env.GEMINI_API_KEY) keys.push(process.env.GEMINI_API_KEY)
  for (let i = 2; i <= 10; i++) {
    const k = process.env[`GEMINI_API_KEY_${i}`]
    if (k) keys.push(k)
  }
  return keys
}

let keyIndex = 0
function nextApiKey(): string {
  const keys = getApiKeys()
  if (keys.length === 0) throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.')
  const key = keys[keyIndex % keys.length]
  keyIndex++
  return key
}

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
}

interface GeminiResponse {
  content: string
  inputTokens: number
  outputTokens: number
}

function buildRequestBody(systemPrompt: string, userPrompt: string, maxTokens: number, temperature: number) {
  return JSON.stringify({
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: { maxOutputTokens: maxTokens, temperature },
  })
}

export async function generateWithGemini(
  systemPrompt: string,
  userPrompt: string,
  options?: { model?: string; maxTokens?: number; temperature?: number }
): Promise<GeminiResponse> {
  const model = options?.model || 'gemini-2.5-flash'
  const maxTokens = options?.maxTokens || 16384
  const temperature = options?.temperature || 0.7
  const keys = getApiKeys()
  const body = buildRequestBody(systemPrompt, userPrompt, maxTokens, temperature)

  // 모든 키를 순회하며 시도
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const apiKey = nextApiKey()
    const response = await fetch(
      `${GEMINI_API_URL}/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body,
      }
    )

    if (response.status === 429 && attempt < keys.length - 1) {
      continue // 다음 키로 재시도
    }

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

  throw new Error('모든 Gemini API 키의 할당량이 소진되었습니다.')
}

/**
 * SSE 스트리밍 생성 (기획안 생성용)
 * 429 시 다음 키로 자동 폴백
 */
export async function* streamWithGemini(
  systemPrompt: string,
  userPrompt: string,
  options?: { model?: string; maxTokens?: number },
  usageTracker?: TokenUsage,
): AsyncGenerator<string> {
  const model = options?.model || 'gemini-2.5-flash'
  const maxTokens = options?.maxTokens || 16384
  const keys = getApiKeys()
  const body = buildRequestBody(systemPrompt, userPrompt, maxTokens, 0.7)

  let response: Response | null = null

  // 모든 키를 순회하며 시도
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const apiKey = nextApiKey()
    const r = await fetch(
      `${GEMINI_API_URL}/${model}:streamGenerateContent?alt=sse`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body,
      }
    )

    if (r.status === 429 && attempt < keys.length - 1) {
      continue // 다음 키로 재시도
    }

    if (!r.ok) throw new Error(`Gemini 스트리밍 실패: ${r.status}`)

    response = r
    break
  }

  if (!response) throw new Error('모든 Gemini API 키의 할당량이 소진되었습니다.')

  const reader = response.body?.getReader()
  if (!reader) throw new Error('스트림을 읽을 수 없습니다.')
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
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
