-- ============================================
-- Servora — MVP 구현 지침 컬럼 추가
-- ============================================

ALTER TABLE design_preferences
  ADD COLUMN IF NOT EXISTS mvp_guidelines TEXT,
  ADD COLUMN IF NOT EXISTS guidelines_version INT DEFAULT 0;
