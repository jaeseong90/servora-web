-- 디자인 4-Phase 블루프린트 지원
ALTER TABLE design_preferences
  ADD COLUMN IF NOT EXISTS design_blueprint JSONB,
  ADD COLUMN IF NOT EXISTS current_phase INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS phase_status JSONB DEFAULT '{"1":"pending","2":"pending","3":"pending","4":"pending"}';
