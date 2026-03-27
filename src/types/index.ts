// 프로젝트
export interface Project {
  id: number
  user_id: string
  title: string
  description: string | null
  status: 'PLANNING' | 'DESIGN' | 'MVP' | 'COMPLETED'
  created_at: string
  updated_at: string
}

// 기획 문서
export interface PlanningDocument {
  id: number
  project_id: number
  content: string
  questionnaire_data: QuestionnaireData | null
  version: number
  is_finalized: boolean
  created_at: string
}

// 설문 데이터
export interface QuestionnaireData {
  q1: string  // 서비스 핵심 아이디어
  q2: string  // 타겟 사용자
  q3: string  // 핵심 기능 3가지
  q4: string  // 차별화 포인트
  q5: string  // 수익 모델
  q6: string  // 사용자 여정
  q7: string  // 필수 데이터
  q8: string  // 외부 연동
  q9: string  // 론칭 범위
  q10: string // 성공 지표
}

// 디자인 선호도
export interface DesignPreference {
  id: number
  project_id: number
  design_tone: string | null
  primary_color: string
  secondary_color: string
  color_mode: string
  layout_style: string
  font_style: string
  corner_style: string
  // 4-Phase 블루프린트
  design_blueprint: DesignBlueprint | null
  current_phase: number
  phase_status: Record<string, PhaseStatus>
  // 레거시 (하위 호환)
  mvp_guidelines?: string | null
  guidelines_version?: number
  guidelines_status?: string
}

export type PhaseStatus = 'pending' | 'generating' | 'review' | 'approved'

// ── 디자인 블루프린트 ──

export interface BrandIdentity {
  tone: string
  personality: string
  colors: {
    primary: string
    secondary: string
    success: string
    warning: string
    danger: string
  }
  colorMode: 'LIGHT' | 'DARK'
  typography: string
  layoutStyle: 'SIDEBAR' | 'TOP_NAV' | 'MINIMAL'
  cornerStyle: string
}

export interface ArchitectureScreen {
  id: string
  displayName: string
  description: string
  audience: 'admin' | 'customer'
  keyFeatures: string[]
}

export interface ServiceArchitecture {
  coreValue: string
  screens: ArchitectureScreen[]
  excludedFeatures: string[]
}

export interface ScreenSection {
  name: string
  layout: string
  components: string[]
  interactions: string[]
}

export interface ManagedInfoItem {
  name: string
  description: string
  required: boolean
}

export interface ScreenDetail {
  screenId: string
  sections: ScreenSection[]
  managedInfo: ManagedInfoItem[]
  keyFeatures: string[]
  emptyState: string
  statusColors?: Record<string, string>
}

export interface BlueprintEntity {
  name: string
  displayName: string
  fields: {
    name: string
    type: string
    displayName: string
    required: boolean
    options?: string[]
    relationTarget?: string
  }[]
}

export interface DesignBlueprint {
  brand: BrandIdentity | null
  architecture: ServiceArchitecture | null
  screenDetails: ScreenDetail[]
  entities: BlueprintEntity[]
  finalized: boolean
}

// MVP 빌드 큐
export interface MvpBuildQueue {
  id: number
  project_id: number
  status: 'SPEC_REVIEW' | 'PENDING' | 'BUILDING' | 'COMPLETED' | 'FAILED'
  spec_json: string | null
  github_repo: string | null
  vercel_url: string | null
  error_message: string | null
  build_duration_ms: number | null
  demo_accounts: { role: string; email: string; password: string }[] | null
  created_at: string
  completed_at: string | null
}

// API 사용량 로그
export interface ApiUsageLog {
  id: number
  user_id: string
  project_id: number | null
  action: string
  model: string
  input_tokens: number
  output_tokens: number
  created_at: string
}

// MVP 프로젝트
export interface MvpProject {
  id: number
  project_id: number
  spec_json: string | null
  github_repo: string | null
  vercel_url: string | null
  version: number
  created_at: string
}
