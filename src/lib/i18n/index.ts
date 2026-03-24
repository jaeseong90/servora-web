export type Locale = 'ko' | 'en'

const STORAGE_KEY = 'servora-locale'

export function getLocale(): Locale {
  if (typeof window === 'undefined') return 'ko'
  return (localStorage.getItem(STORAGE_KEY) as Locale) || 'ko'
}

export function setLocale(locale: Locale) {
  localStorage.setItem(STORAGE_KEY, locale)
}

type TranslationMap = Record<string, Record<Locale, string>>

const translations: TranslationMap = {
  // ── Auth ──
  'auth.login.title': { ko: '계정에 로그인하세요', en: 'Sign in to your account' },
  'auth.login.email': { ko: '이메일', en: 'Email' },
  'auth.login.password': { ko: '비밀번호', en: 'Password' },
  'auth.login.submit': { ko: '로그인', en: 'Sign In' },
  'auth.login.loading': { ko: '로그인 중...', en: 'Signing in...' },
  'auth.login.noAccount': { ko: '계정이 없으신가요?', en: "Don't have an account?" },
  'auth.login.signupLink': { ko: '회원가입', en: 'Sign Up' },

  'auth.signup.title': { ko: '새 계정을 만드세요', en: 'Create a new account' },
  'auth.signup.email': { ko: '이메일', en: 'Email' },
  'auth.signup.password': { ko: '비밀번호', en: 'Password' },
  'auth.signup.confirmPassword': { ko: '비밀번호 확인', en: 'Confirm Password' },
  'auth.signup.confirmPlaceholder': { ko: '비밀번호를 다시 입력', en: 'Re-enter password' },
  'auth.signup.passwordPlaceholder': { ko: '6자 이상', en: 'Min 6 characters' },
  'auth.signup.submit': { ko: '회원가입', en: 'Sign Up' },
  'auth.signup.loading': { ko: '가입 중...', en: 'Signing up...' },
  'auth.signup.hasAccount': { ko: '이미 계정이 있으신가요?', en: 'Already have an account?' },
  'auth.signup.loginLink': { ko: '로그인', en: 'Sign In' },
  'auth.signup.passwordMismatch': { ko: '비밀번호가 일치하지 않습니다.', en: 'Passwords do not match.' },
  'auth.signup.passwordTooShort': { ko: '비밀번호는 6자 이상이어야 합니다.', en: 'Password must be at least 6 characters.' },

  'auth.emailSent.title': { ko: '인증 메일을 보냈습니다', en: 'Verification email sent' },
  'auth.emailSent.descKo': { ko: '으로 인증 메일을 발송했습니다.', en: '' },
  'auth.emailSent.descEn': { ko: '', en: 'A verification email has been sent to' },
  'auth.emailSent.instruction': { ko: '메일함을 확인하고 인증 링크를 클릭해주세요. 인증 완료 후 로그인할 수 있습니다.', en: 'Check your inbox and click the verification link. You can sign in after verification.' },
  'auth.emailSent.goLogin': { ko: '로그인 페이지로 이동', en: 'Go to Sign In' },
  'auth.emailSent.noMail': { ko: '메일이 오지 않나요? 스팸함을 확인하거나 잠시 후 다시 시도해주세요.', en: "Didn't receive the email? Check your spam folder or try again later." },

  // ── Dashboard ──
  'dash.welcome': { ko: '안녕하세요, {name}님! 👋', en: 'Welcome back, {name}! 👋' },
  'dash.subtitle': { ko: '오늘도 Servora와 함께 혁신적인 서비스를 시작해보세요.', en: 'Build something innovative with Servora today.' },
  'dash.credits': { ko: '보유 크레딧', en: 'Credits' },
  'dash.activeServices': { ko: '활성 서비스', en: 'Active Services' },
  'dash.newService': { ko: '새 서비스 만들기', en: 'Create New Service' },
  'dash.newServiceDesc': { ko: 'AI 가이드를 따라 몇 분 만에 완벽한 워크플로우를 구성하세요.', en: 'Follow the AI guide to build a complete workflow in minutes.' },
  'dash.workflowSummary': { ko: '최근 워크플로우 요약', en: 'Recent Workflow Summary' },
  'dash.noService': { ko: '서비스를 생성해주세요', en: 'Create a service to get started' },
  'dash.detail': { ko: '상세 보기', en: 'View Details' },
  'dash.myServices': { ko: '내 서비스', en: 'My Services' },
  'dash.myServicesDesc': { ko: '진행 중인 모든 서비스를 관리합니다.', en: 'Manage all your services in progress.' },
  'dash.lastModified': { ko: '마지막 수정일자', en: 'Last Modified' },
  'dash.continue': { ko: '계속하기', en: 'Continue' },
  'dash.newIdea': { ko: '새로운 아이디어가 있나요?', en: 'Have a new idea?' },
  'dash.addService': { ko: '서비스 추가', en: 'Add Service' },
  'dash.loading': { ko: '로딩 중...', en: 'Loading...' },

  // ── New Service Modal ──
  'modal.title': { ko: '새 서비스 만들기', en: 'Create New Service' },
  'modal.subtitle': { ko: '혁신적인 비즈니스 아이디어를 Servora와 함께 시작하세요.', en: 'Start your innovative business idea with Servora.' },
  'modal.nameLabel': { ko: '서비스 이름', en: 'Service Name' },
  'modal.namePlaceholder': { ko: '예: Ethereal E-commerce UI', en: 'e.g. Ethereal E-commerce UI' },
  'modal.descLabel': { ko: '서비스 설명', en: 'Service Description' },
  'modal.descPlaceholder': { ko: '서비스의 목적과 핵심 가치를 입력해주세요...', en: 'Describe the purpose and core value of your service...' },
  'modal.cancel': { ko: '취소', en: 'Cancel' },
  'modal.create': { ko: '서비스 생성', en: 'Create Service' },
  'modal.nameRequired': { ko: '서비스 이름을 입력해주세요.', en: 'Please enter a service name.' },
  'modal.createFailed': { ko: '서비스 생성에 실패했습니다.', en: 'Failed to create service.' },

  // ── Sidebar ──
  'nav.dashboard': { ko: '대시보드', en: 'Dashboard' },
  'nav.selectService': { ko: '서비스 선택', en: 'Select Service' },
  'nav.planning': { ko: '기획', en: 'Planning' },
  'nav.design': { ko: '디자인', en: 'Design' },
  'nav.mvp': { ko: 'MVP', en: 'MVP' },
  'nav.service': { ko: '서비스', en: 'Service' },
  'nav.operation': { ko: '운영', en: 'Operation' },
  'nav.contact': { ko: '문의', en: 'Contact' },
  'nav.support': { ko: '지원', en: 'Support' },
  'nav.upgrade': { ko: '플랜 업그레이드', en: 'Upgrade Plan' },
  'nav.unlockEnterprise': { ko: '엔터프라이즈 사용', en: 'Unlock Enterprise' },
  'nav.myInfo': { ko: '내 정보', en: 'My Profile' },
  'nav.remainCredits': { ko: '잔여 크레딧', en: 'Remaining Credits' },
  'nav.logout': { ko: '로그아웃', en: 'Logout' },
  'nav.completed': { ko: '완료', en: 'Done' },

  // ── Notifications ──
  'notify.title': { ko: '최근 활동', en: 'Recent Activity' },
  'notify.markRead': { ko: '모두 읽음 처리', en: 'Mark all as read' },
  'notify.colService': { ko: '서비스', en: 'Service' },
  'notify.colTime': { ko: '작업 시간', en: 'Time' },
  'notify.colAction': { ko: '작업 내용', en: 'Action' },
  'notify.viewAll': { ko: '전체 활동 보기', en: 'View all activity' },

  // ── Planning ──
  'plan.title': { ko: '기획', en: 'Planning' },
  'plan.questionTitle': { ko: '서비스 기획 질문', en: 'Service Planning Questions' },
  'plan.questionDesc': { ko: '최소 3개 이상 답변해주세요. 자세할수록 좋은 기획안이 나옵니다.', en: 'Answer at least 3 questions. More detail means better results.' },
  'plan.generate': { ko: 'AI 기획안 생성', en: 'Generate AI Plan' },
  'plan.generating': { ko: 'AI가 기획안을 작성 중...', en: 'AI is generating your plan...' },
  'plan.aiWriting': { ko: 'AI가 작성 중...', en: 'AI is writing...' },
  'plan.editQuestions': { ko: '질문 수정', en: 'Edit Questions' },
  'plan.minQuestions': { ko: '최소 3개 이상의 질문에 답해주세요.', en: 'Please answer at least 3 questions.' },
  'plan.feedbackTitle': { ko: '피드백 반영', en: 'Apply Feedback' },
  'plan.feedbackPlaceholder': { ko: '수정하고 싶은 내용을 입력하세요', en: 'Enter your feedback for changes' },
  'plan.feedbackSubmit': { ko: '피드백 반영', en: 'Apply Feedback' },
  'plan.deepDiveTitle': { ko: '섹션 딥다이브', en: 'Section Deep Dive' },
  'plan.deepDivePlaceholder': { ko: '깊이 분석할 섹션 번호 또는 이름 (예: 7. 핵심 기능 구성)', en: 'Section number or name to deep dive (e.g. 7. Core Features)' },
  'plan.deepDiveSubmit': { ko: '딥다이브', en: 'Deep Dive' },
  'plan.finalize': { ko: '기획안 확정 → 디자인 단계로 이동', en: 'Finalize Plan → Move to Design' },
  'plan.finalizeConfirm': { ko: '기획안을 확정하시겠습니까? 확정 후에는 디자인 단계로 이동합니다.', en: 'Finalize your plan? This will move you to the Design phase.' },
  'plan.finalized': { ko: '기획안이 확정되었습니다.', en: 'Plan has been finalized.' },
  'plan.goDesign': { ko: '디자인 단계로 이동', en: 'Go to Design' },
  'plan.errorGenerate': { ko: '기획안 생성 중 오류가 발생했습니다.', en: 'An error occurred while generating the plan.' },
  'plan.errorFinalize': { ko: '확정 중 오류가 발생했습니다.', en: 'An error occurred while finalizing.' },

  'plan.q1': { ko: '서비스 핵심 아이디어', en: 'Core Service Idea' },
  'plan.q1p': { ko: '어떤 서비스를 만들고 싶으신가요?', en: 'What service do you want to build?' },
  'plan.q2': { ko: '타겟 사용자', en: 'Target Users' },
  'plan.q2p': { ko: '누구를 위한 서비스인가요?', en: 'Who is this service for?' },
  'plan.q3': { ko: '핵심 기능 3가지', en: 'Top 3 Key Features' },
  'plan.q3p': { ko: '가장 중요한 기능 3가지를 알려주세요.', en: 'What are the 3 most important features?' },
  'plan.q4': { ko: '차별화 포인트', en: 'Differentiation' },
  'plan.q4p': { ko: '기존 서비스와 어떻게 다른가요?', en: 'How is it different from existing services?' },
  'plan.q5': { ko: '수익 모델', en: 'Revenue Model' },
  'plan.q5p': { ko: '어떻게 수익을 낼 계획인가요?', en: 'How do you plan to monetize?' },
  'plan.q6': { ko: '사용자 여정', en: 'User Journey' },
  'plan.q6p': { ko: '사용자가 서비스를 어떻게 이용하나요?', en: 'How will users interact with the service?' },
  'plan.q7': { ko: '필수 데이터', en: 'Required Data' },
  'plan.q7p': { ko: '서비스에 꼭 필요한 데이터는 무엇인가요?', en: 'What data is essential for the service?' },
  'plan.q8': { ko: '외부 연동', en: 'External Integrations' },
  'plan.q8p': { ko: '외부 서비스와 연동이 필요한가요?', en: 'Do you need integrations with external services?' },
  'plan.q9': { ko: 'MVP 론칭 범위', en: 'MVP Scope' },
  'plan.q9p': { ko: '처음에 어디까지 만들고 싶으신가요?', en: 'What scope do you want for the initial launch?' },
  'plan.q10': { ko: '성공 지표', en: 'Success Metrics' },
  'plan.q10p': { ko: '성공을 어떻게 측정할 건가요?', en: 'How will you measure success?' },

  // ── Design ──
  'design.title': { ko: '디자인 선호도', en: 'Design Preferences' },
  'design.tone': { ko: '디자인 톤', en: 'Design Tone' },
  'design.brandColor': { ko: '브랜드 색상', en: 'Brand Colors' },
  'design.primaryColor': { ko: '주요 색상', en: 'Primary Color' },
  'design.secondaryColor': { ko: '보조 색상', en: 'Secondary Color' },
  'design.colorMode': { ko: '색상 모드', en: 'Color Mode' },
  'design.light': { ko: '라이트', en: 'Light' },
  'design.dark': { ko: '다크', en: 'Dark' },
  'design.layoutStyle': { ko: '레이아웃 스타일', en: 'Layout Style' },
  'design.sidebar': { ko: '사이드바', en: 'Sidebar' },
  'design.topNav': { ko: '상단 네비', en: 'Top Nav' },
  'design.minimal': { ko: '미니멀', en: 'Minimal' },
  'design.fontStyle': { ko: '폰트 스타일', en: 'Font Style' },
  'design.cornerStyle': { ko: '모서리 스타일', en: 'Corner Style' },
  'design.save': { ko: '저장 후 MVP 단계로 이동', en: 'Save & Move to MVP' },
  'design.saving': { ko: '저장 중...', en: 'Saving...' },
  'design.saveError': { ko: '저장 중 오류가 발생했습니다.', en: 'An error occurred while saving.' },

  'design.toneModern': { ko: '모던', en: 'Modern' },
  'design.toneClassic': { ko: '클래식', en: 'Classic' },
  'design.toneMinimal': { ko: '미니멀', en: 'Minimal' },
  'design.toneVibrant': { ko: '활기찬', en: 'Vibrant' },
  'design.toneCalm': { ko: '차분한', en: 'Calm' },
  'design.toneProfessional': { ko: '전문적', en: 'Professional' },

  'design.fontGothic': { ko: '깔끔한 고딕', en: 'Clean Gothic' },
  'design.fontRounded': { ko: '부드러운 둥근체', en: 'Soft Rounded' },
  'design.fontSerif': { ko: '세련된 세리프', en: 'Elegant Serif' },
  'design.fontSansSerif': { ko: '모던 산세리프', en: 'Modern Sans-serif' },

  'design.cornerSquare': { ko: '직각', en: 'Square' },
  'design.cornerSlightRound': { ko: '약간 둥근', en: 'Slightly Rounded' },
  'design.cornerRound': { ko: '많이 둥근', en: 'Rounded' },
  'design.cornerFull': { ko: '완전 둥근', en: 'Fully Rounded' },

  // ── MVP ──
  'mvp.title': { ko: 'MVP 생성', en: 'MVP Generation' },
  'mvp.ready': { ko: 'MVP를 생성할 준비가 되었습니다', en: 'Ready to generate your MVP' },
  'mvp.readyDesc': { ko: '확정된 기획안과 디자인 선호도를 바탕으로 AI가 MVP를 자동으로 생성합니다.', en: 'AI will automatically generate an MVP based on your finalized plan and design preferences.' },
  'mvp.generate': { ko: 'MVP 생성 요청', en: 'Request MVP Generation' },
  'mvp.generateConfirm': { ko: 'MVP 생성을 요청하시겠습니까?', en: 'Request MVP generation?' },
  'mvp.requesting': { ko: '요청 중...', en: 'Requesting...' },
  'mvp.generateError': { ko: 'MVP 생성 요청 중 오류가 발생했습니다.', en: 'An error occurred while requesting MVP generation.' },
  'mvp.pending': { ko: '대기 중', en: 'Pending' },
  'mvp.pendingDesc': { ko: 'MVP 생성 요청이 큐에 등록되었습니다. 곧 처리가 시작됩니다.', en: 'MVP generation request has been queued. Processing will begin shortly.' },
  'mvp.building': { ko: '빌드 중', en: 'Building' },
  'mvp.buildingDesc': { ko: 'AI가 MVP를 생성하고 있습니다. 잠시만 기다려주세요.', en: 'AI is building your MVP. Please wait.' },
  'mvp.completed': { ko: '완료', en: 'Completed' },
  'mvp.completedDesc': { ko: 'MVP가 성공적으로 생성되었습니다!', en: 'MVP has been successfully generated!' },
  'mvp.failed': { ko: '실패', en: 'Failed' },
  'mvp.failedDesc': { ko: 'MVP 생성 중 오류가 발생했습니다.', en: 'An error occurred during MVP generation.' },
  'mvp.deployComplete': { ko: '배포 완료', en: 'Deployment Complete' },
  'mvp.buildTime': { ko: '빌드 시간', en: 'Build Time' },
  'mvp.errorDetail': { ko: '오류 상세', en: 'Error Details' },
  'mvp.retry': { ko: '다시 시도', en: 'Retry' },

  // ── Project New ──
  'project.new.back': { ko: '← 대시보드로 돌아가기', en: '← Back to Dashboard' },
  'project.new.title': { ko: '새 프로젝트 만들기', en: 'Create New Project' },
  'project.new.nameLabel': { ko: '프로젝트 제목 *', en: 'Project Title *' },
  'project.new.namePlaceholder': { ko: '예: 반려동물 돌봄 서비스', en: 'e.g. Pet Care Service' },
  'project.new.descLabel': { ko: '간단한 설명', en: 'Brief Description' },
  'project.new.descPlaceholder': { ko: '프로젝트에 대한 간단한 설명을 입력하세요', en: 'Enter a brief description of your project' },
  'project.new.submit': { ko: '프로젝트 생성', en: 'Create Project' },
  'project.new.loading': { ko: '생성 중...', en: 'Creating...' },
  'project.new.titleRequired': { ko: '프로젝트 제목을 입력하세요.', en: 'Please enter a project title.' },

  // ── Common ──
  'common.seconds': { ko: '초', en: 's' },
}

export function t(key: string, locale?: Locale): string {
  const l = locale || getLocale()
  return translations[key]?.[l] || translations[key]?.['ko'] || key
}

// Supabase 에러 메시지 번역
const errorMap: { pattern: RegExp; ko: string; en: string }[] = [
  {
    pattern: /for security purposes, you can only request this after (\d+) seconds?/i,
    ko: '보안을 위해 $1초 후에 다시 시도해주세요.',
    en: 'Please wait $1 seconds before trying again.',
  },
  {
    pattern: /email rate limit exceeded/i,
    ko: '이메일 발송 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
    en: 'Email rate limit exceeded. Please try again later.',
  },
  {
    pattern: /invalid login credentials/i,
    ko: '이메일 또는 비밀번호가 올바르지 않습니다.',
    en: 'Invalid email or password.',
  },
  {
    pattern: /email not confirmed/i,
    ko: '이메일 인증이 완료되지 않았습니다. 메일함을 확인해주세요.',
    en: 'Email not verified. Please check your inbox.',
  },
  {
    pattern: /user already registered/i,
    ko: '이미 등록된 이메일입니다.',
    en: 'This email is already registered.',
  },
  {
    pattern: /signup is disabled/i,
    ko: '현재 회원가입이 비활성화되어 있습니다.',
    en: 'Sign up is currently disabled.',
  },
  {
    pattern: /password should be at least (\d+) characters/i,
    ko: '비밀번호는 최소 $1자 이상이어야 합니다.',
    en: 'Password must be at least $1 characters.',
  },
  {
    pattern: /unable to validate email address/i,
    ko: '올바른 이메일 주소를 입력해주세요.',
    en: 'Please enter a valid email address.',
  },
  {
    pattern: /email address .* is invalid/i,
    ko: '올바른 이메일 주소를 입력해주세요.',
    en: 'Please enter a valid email address.',
  },
  {
    pattern: /new password should be different/i,
    ko: '새 비밀번호는 기존 비밀번호와 달라야 합니다.',
    en: 'New password must be different from the old one.',
  },
]

export function translateError(message: string, locale?: Locale): string {
  const l = locale || getLocale()
  for (const entry of errorMap) {
    const match = message.match(entry.pattern)
    if (match) {
      let translated = l === 'ko' ? entry.ko : entry.en
      match.slice(1).forEach((val, idx) => {
        translated = translated.replace(`$${idx + 1}`, val)
      })
      return translated
    }
  }
  return message
}
