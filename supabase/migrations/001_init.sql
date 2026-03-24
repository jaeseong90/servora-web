-- 프로젝트
CREATE TABLE projects (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'PLANNING',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 기획 문서
CREATE TABLE planning_documents (
  id bigserial PRIMARY KEY,
  project_id bigint REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  questionnaire_data jsonb,
  version int NOT NULL DEFAULT 1,
  is_finalized boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 기획 피드백
CREATE TABLE planning_feedbacks (
  id bigserial PRIMARY KEY,
  document_id bigint REFERENCES planning_documents(id) ON DELETE CASCADE NOT NULL,
  project_id bigint REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 디자인 선호도
CREATE TABLE design_preferences (
  id bigserial PRIMARY KEY,
  project_id bigint REFERENCES projects(id) ON DELETE CASCADE UNIQUE NOT NULL,
  design_tone text,
  primary_color text DEFAULT '#2563eb',
  secondary_color text DEFAULT '#8b5cf6',
  color_mode text DEFAULT 'LIGHT',
  layout_style text DEFAULT 'SIDEBAR',
  font_style text DEFAULT '깔끔한 고딕',
  corner_style text DEFAULT '약간 둥근',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- MVP 빌드 큐 (데몬이 폴링)
CREATE TABLE mvp_build_queue (
  id bigserial PRIMARY KEY,
  project_id bigint REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  spec_json text,
  claude_md text,
  prompt text,
  result_json text,
  error_message text,
  github_repo text,
  vercel_url text,
  build_duration_ms bigint,
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

-- MVP 프로젝트
CREATE TABLE mvp_projects (
  id bigserial PRIMARY KEY,
  project_id bigint REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  spec_json text,
  github_repo text,
  vercel_url text,
  version int NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE mvp_build_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE mvp_projects ENABLE ROW LEVEL SECURITY;

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
