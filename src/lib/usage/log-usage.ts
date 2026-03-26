import type { SupabaseClient } from '@supabase/supabase-js'
import type { TokenUsage } from '@/lib/ai/gemini'

export type UsageAction =
  | 'planning_generate'
  | 'planning_feedback'
  | 'design_guidelines'
  | 'mvp_generate'

export async function logTokenUsage(
  supabase: SupabaseClient,
  userId: string,
  projectId: string | number,
  action: UsageAction,
  usage: TokenUsage,
  model: string = 'gemini-2.5-flash',
) {
  if (usage.inputTokens === 0 && usage.outputTokens === 0) return

  await supabase.from('api_usage_logs').insert({
    user_id: userId,
    project_id: typeof projectId === 'number' ? projectId : Number(projectId),
    action,
    model,
    input_tokens: usage.inputTokens,
    output_tokens: usage.outputTokens,
  })
}

const DEFAULT_CREDITS = 1_000_000

export async function getUserCredits(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ total: number; used: number; remaining: number }> {
  const { data } = await supabase
    .from('api_usage_logs')
    .select('input_tokens, output_tokens')
    .eq('user_id', userId)

  const used = (data || []).reduce(
    (sum, row) => sum + (row.input_tokens || 0) + (row.output_tokens || 0),
    0,
  )

  return {
    total: DEFAULT_CREDITS,
    used,
    remaining: Math.max(0, DEFAULT_CREDITS - used),
  }
}
