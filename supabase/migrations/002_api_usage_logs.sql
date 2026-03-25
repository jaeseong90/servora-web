-- ============================================
-- Servora — API 사용량 추적 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS api_usage_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
  action TEXT NOT NULL,  -- 'planning_generate', 'planning_feedback', 'planning_deep_dive', 'mvp_generate'
  model TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
  input_tokens BIGINT NOT NULL DEFAULT 0,
  output_tokens BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_user ON api_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_project ON api_usage_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created ON api_usage_logs(created_at);

-- RLS
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own usage logs" ON api_usage_logs;
CREATE POLICY "Users own usage logs" ON api_usage_logs
  FOR ALL USING (auth.uid() = user_id);

-- planning_documents unique constraint (version race condition 방지)
CREATE UNIQUE INDEX IF NOT EXISTS idx_planning_docs_project_version
  ON planning_documents(project_id, version);
