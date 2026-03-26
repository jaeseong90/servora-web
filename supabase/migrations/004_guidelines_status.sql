-- ============================================
-- Servora — 지침 생성 상태 추적 컬럼 추가
-- ============================================

ALTER TABLE design_preferences
  ADD COLUMN IF NOT EXISTS guidelines_status TEXT DEFAULT 'IDLE';

-- guidelines_status: 'IDLE' | 'GENERATING' | 'COMPLETED'
-- 스트리밍 중간 저장을 위해 사용
