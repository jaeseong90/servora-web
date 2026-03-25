import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * 버전 번호 레이스 컨디션을 방지하면서 기획 문서를 삽입합니다.
 * 동시 요청 시 unique constraint 충돌이 발생하면 재시도합니다.
 */
export async function insertDocumentWithVersion(
  supabase: SupabaseClient,
  projectId: string,
  content: string,
  questionnaireData: Record<string, string> | null
): Promise<number> {
  const MAX_RETRIES = 3

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const { data: latestDoc } = await supabase
      .from('planning_documents')
      .select('version')
      .eq('project_id', projectId)
      .order('version', { ascending: false })
      .limit(1)
      .single()

    const nextVersion = (latestDoc?.version || 0) + 1

    const { error } = await supabase.from('planning_documents').insert({
      project_id: Number(projectId),
      content,
      questionnaire_data: questionnaireData,
      version: nextVersion,
    })

    if (!error) return nextVersion

    // unique constraint violation (23505) → retry
    if (error.code === '23505') continue
    throw new Error(`Document insert failed: ${error.message}`)
  }

  throw new Error('Failed to insert document after retries (version conflict)')
}
