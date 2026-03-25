-- ============================================
-- Servora v2 — 전체 DB 초기화 스크립트
-- Supabase Dashboard > SQL Editor 에서 실행
-- IF NOT EXISTS / IF EXISTS 사용으로 재실행 안전
-- ============================================

-- ── 1. 테이블 생성 ──

-- 프로젝트
CREATE TABLE IF NOT EXISTS projects (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT '서비스',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'PLANNING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 기획 문서
CREATE TABLE IF NOT EXISTS planning_documents (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT,
  questionnaire_data JSONB,
  version INT NOT NULL DEFAULT 1,
  is_finalized BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 기획 피드백
CREATE TABLE IF NOT EXISTS planning_feedbacks (
  id BIGSERIAL PRIMARY KEY,
  document_id BIGINT REFERENCES planning_documents(id) ON DELETE CASCADE NOT NULL,
  project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 디자인 선호도
CREATE TABLE IF NOT EXISTS design_preferences (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  design_tone TEXT DEFAULT '모던',
  primary_color TEXT DEFAULT '#2563eb',
  secondary_color TEXT DEFAULT '#8b5cf6',
  color_mode TEXT DEFAULT 'LIGHT',
  layout_style TEXT DEFAULT 'SIDEBAR',
  font_style TEXT DEFAULT '깔끔한 고딕',
  corner_style TEXT DEFAULT '약간 둥근',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- MVP 빌드 큐 (데몬이 폴링)
CREATE TABLE IF NOT EXISTS mvp_build_queue (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PENDING',
  spec_json TEXT,
  claude_md TEXT,
  prompt TEXT,
  result_json TEXT,
  error_message TEXT,
  github_repo TEXT,
  vercel_url TEXT,
  build_duration_ms BIGINT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- MVP 프로젝트
CREATE TABLE IF NOT EXISTS mvp_projects (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  spec_json TEXT,
  github_repo TEXT,
  vercel_url TEXT,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PPT 빌드 큐 (데몬이 폴링)
CREATE TABLE IF NOT EXISTS ppt_build_queue (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  document_id BIGINT NOT NULL REFERENCES planning_documents(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PENDING',
  slide_json TEXT,
  output_url TEXT,
  output_path TEXT,
  error_message TEXT,
  build_duration_ms BIGINT,
  runner_type TEXT NOT NULL DEFAULT 'claude-code',
  input_tokens BIGINT DEFAULT 0,
  output_tokens BIGINT DEFAULT 0,
  cache_creation_tokens BIGINT DEFAULT 0,
  cache_read_tokens BIGINT DEFAULT 0,
  total_cost_usd NUMERIC(10, 6) DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. 누락 컬럼 보정 (기존 DB에서 실행 시) ──

ALTER TABLE projects ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'PLANNING';
ALTER TABLE planning_documents ADD COLUMN IF NOT EXISTS questionnaire_data JSONB;
ALTER TABLE design_preferences ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE mvp_build_queue ADD COLUMN IF NOT EXISTS result_json TEXT;
ALTER TABLE mvp_projects ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;
ALTER TABLE ppt_build_queue ADD COLUMN IF NOT EXISTS document_id BIGINT REFERENCES planning_documents(id) ON DELETE CASCADE;
ALTER TABLE ppt_build_queue ADD COLUMN IF NOT EXISTS slide_json TEXT;
ALTER TABLE ppt_build_queue ADD COLUMN IF NOT EXISTS output_url TEXT;
ALTER TABLE ppt_build_queue ADD COLUMN IF NOT EXISTS output_path TEXT;
ALTER TABLE ppt_build_queue ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE ppt_build_queue ADD COLUMN IF NOT EXISTS build_duration_ms BIGINT;
ALTER TABLE ppt_build_queue ADD COLUMN IF NOT EXISTS runner_type TEXT NOT NULL DEFAULT 'claude-code';
ALTER TABLE ppt_build_queue ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE ppt_build_queue ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE ppt_build_queue ADD COLUMN IF NOT EXISTS input_tokens BIGINT DEFAULT 0;
ALTER TABLE ppt_build_queue ADD COLUMN IF NOT EXISTS output_tokens BIGINT DEFAULT 0;
ALTER TABLE ppt_build_queue ADD COLUMN IF NOT EXISTS cache_creation_tokens BIGINT DEFAULT 0;
ALTER TABLE ppt_build_queue ADD COLUMN IF NOT EXISTS cache_read_tokens BIGINT DEFAULT 0;
ALTER TABLE ppt_build_queue ADD COLUMN IF NOT EXISTS total_cost_usd NUMERIC(10, 6) DEFAULT 0;

-- ── 3. 인덱스 ──

CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_planning_docs_project ON planning_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_planning_feedbacks_project ON planning_feedbacks(project_id);
CREATE INDEX IF NOT EXISTS idx_build_queue_status ON mvp_build_queue(status);
CREATE INDEX IF NOT EXISTS idx_build_queue_project ON mvp_build_queue(project_id);
CREATE INDEX IF NOT EXISTS idx_build_queue_created ON mvp_build_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_ppt_queue_status ON ppt_build_queue(status);
CREATE INDEX IF NOT EXISTS idx_ppt_queue_project ON ppt_build_queue(project_id);
CREATE INDEX IF NOT EXISTS idx_ppt_queue_created ON ppt_build_queue(created_at);

-- ── 4. RLS (Row Level Security) ──

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE mvp_build_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE mvp_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppt_build_queue ENABLE ROW LEVEL SECURITY;

-- 기존 정책 제거 후 재생성 (재실행 안전)
DROP POLICY IF EXISTS "Users own projects" ON projects;
DROP POLICY IF EXISTS "Users own planning docs" ON planning_documents;
DROP POLICY IF EXISTS "Users own feedbacks" ON planning_feedbacks;
DROP POLICY IF EXISTS "Users own design prefs" ON design_preferences;
DROP POLICY IF EXISTS "Users own build queue" ON mvp_build_queue;
DROP POLICY IF EXISTS "Users own mvp projects" ON mvp_projects;
DROP POLICY IF EXISTS "Users own ppt queue" ON ppt_build_queue;

CREATE POLICY "Users own projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own planning docs" ON planning_documents
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users own feedbacks" ON planning_feedbacks
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users own design prefs" ON design_preferences
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users own build queue" ON mvp_build_queue
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users own mvp projects" ON mvp_projects
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users own ppt queue" ON ppt_build_queue
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
