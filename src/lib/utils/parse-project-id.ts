/**
 * params에서 projectId를 안전하게 숫자로 파싱.
 * 유효하지 않으면 null 반환.
 */
export function parseProjectId(raw: string): number | null {
  const id = parseInt(raw, 10)
  if (isNaN(id) || id <= 0 || String(id) !== raw) return null
  return id
}
