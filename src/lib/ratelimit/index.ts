import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// AI 생성 엔드포인트: 1분에 5회
const aiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  prefix: 'rl:ai',
})

/**
 * AI API 엔드포인트에 대한 Rate Limit을 체크합니다.
 * 제한 초과 시 429 Response를 반환하고, 통과 시 null을 반환합니다.
 */
export async function checkAiRateLimit(userId: string): Promise<NextResponse | null> {
  const { success, remaining, reset } = await aiLimiter.limit(userId)

  if (!success) {
    return NextResponse.json(
      { error: '요청이 너무 빠릅니다. 잠시 후 다시 시도해주세요.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(reset),
          'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
        },
      }
    )
  }

  return null
}
