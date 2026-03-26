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
  'dash.newServiceDesc': { ko: '가이드를 따라 몇 분 만에 완벽한 워크플로우를 구성하세요.', en: 'Follow the guide to build a complete workflow in minutes.' },
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
  'modal.creating': { ko: '서비스를 생성하고 있습니다...', en: 'Creating your service...' },
  'modal.creatingDesc': { ko: '기획 환경을 준비 중입니다', en: 'Setting up planning environment' },
  'modal.success': { ko: '서비스가 생성되었습니다!', en: 'Service created!' },
  'modal.successDesc': { ko: '기획 단계로 이동합니다...', en: 'Moving to planning phase...' },
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
  'plan.questionTitle': { ko: '아이디어를 알려주세요', en: 'Tell us your idea' },
  'plan.questionDesc': { ko: '아래 질문에 답변해주시면 16항목 실무 기획안을 작성합니다. 구체적일수록 좋은 결과가 나옵니다.', en: 'Answer the questions below to create a 16-section professional plan. The more specific, the better.' },
  'plan.generateNote': { ko: '16항목 실무 기획안을 작성합니다. 약 1~2분 소요됩니다.', en: 'A 16-section plan will be generated. This takes about 1-2 minutes.' },
  'plan.generate': { ko: '기획안 생성', en: 'Generate Plan' },
  'plan.generating': { ko: '기획안을 작성 중...', en: 'Generating your plan...' },
  'plan.aiWriting': { ko: '작성 중...', en: 'Writing...' },
  'plan.editQuestions': { ko: '질문 수정', en: 'Edit Questions' },
  'plan.minQuestions': { ko: '최소 3개 이상의 질문에 답해주세요.', en: 'Please answer at least 3 questions.' },
  'plan.feedbackTitle': { ko: '피드백 반영', en: 'Apply Feedback' },
  'plan.feedbackPlaceholder': { ko: '수정하고 싶은 내용을 입력하세요', en: 'Enter your feedback for changes' },
  'plan.feedbackSubmit': { ko: '피드백 반영', en: 'Apply Feedback' },
  'plan.finalize': { ko: '기획안 확정 → 디자인 단계로 이동', en: 'Finalize Plan → Move to Design' },
  'plan.finalizeConfirm': { ko: '기획안을 확정하시겠습니까? 확정 후에는 디자인 단계로 이동합니다.', en: 'Finalize your plan? This will move you to the Design phase.' },
  'plan.finalized': { ko: '기획안이 확정되었습니다.', en: 'Plan has been finalized.' },
  'plan.goDesign': { ko: '디자인 단계로 이동', en: 'Go to Design' },
  'plan.errorGenerate': { ko: '기획안 생성 중 오류가 발생했습니다.', en: 'An error occurred while generating the plan.' },
  'plan.errorFinalize': { ko: '확정 중 오류가 발생했습니다.', en: 'An error occurred while finalizing.' },

  'plan.q1': { ko: '어떤 서비스를 만들고 싶으신가요?', en: 'What service do you want to build?' },
  'plan.q1h': { ko: '서비스를 한 문장으로 가볍게 설명해주세요.', en: 'Describe your service in one sentence.' },
  'plan.q1e': { ko: '예: 가족끼리 할 일을 쉽게 주고받는 웹서비스 / 지역 소상공인 예약을 간단하게 받는 서비스', en: 'e.g. A web service for families to share tasks / A booking service for local businesses' },
  'plan.q1p': { ko: '아이를 키우는 부모들이 육아 정보를 쉽게 찾고 저장할 수 있는 서비스', en: 'A service where parents can easily find and save parenting information' },
  'plan.q2': { ko: '이 서비스를 왜 만들고 싶으신가요?', en: 'Why do you want to build this service?' },
  'plan.q2h': { ko: '이 서비스의 출발점이나 계기를 알려주세요.', en: 'Tell us about the motivation behind this service.' },
  'plan.q2e': { ko: '예: 직접 겪은 불편이 있어서 / 지금 쓰는 방식이 너무 불편해서', en: 'e.g. Personal frustration / Current solutions are inconvenient' },
  'plan.q2p': { ko: '가족끼리 메신저로 할 일을 주고받다 보니 자꾸 놓치고 불편했어요.', en: 'Sharing tasks via messenger with family was unreliable and frustrating.' },
  'plan.q3': { ko: '지금 가장 불편하거나 아쉬운 점은 뭐라고 생각하세요?', en: 'What is the biggest pain point right now?' },
  'plan.q3h': { ko: '구체적일수록 좋은 기획안이 나옵니다.', en: 'The more specific, the better the plan.' },
  'plan.q3e': { ko: '예: 예약을 전화로만 받아서 번거롭다 / 정보가 너무 흩어져 있다', en: 'e.g. Phone-only bookings are cumbersome / Information is scattered' },
  'plan.q3p': { ko: '예약 가능한 시간을 손님에게 일일이 설명해야 하고, 중복 예약도 자주 생겨요.', en: 'Explaining available times to customers one by one, and double bookings happen often.' },
  'plan.q4': { ko: '이 서비스를 가장 많이 쓸 사람은 누구라고 생각하세요?', en: 'Who will use this service the most?' },
  'plan.q4h': { ko: '핵심 사용자를 떠올려 주세요.', en: 'Think of your core users.' },
  'plan.q4e': { ko: '예: 20~30대 직장인 / 아이를 키우는 부모 / 소규모 매장 사장님', en: 'e.g. Professionals in their 20-30s / Parents / Small business owners' },
  'plan.q4p': { ko: '주말마다 아이와 외출 계획을 세우는 30대 부모들이요.', en: 'Parents in their 30s who plan outings with their kids every weekend.' },
  'plan.q5': { ko: '그 사람은 보통 어떤 상황에서 이 서비스를 쓰게 될까요?', en: 'In what situations will users use this service?' },
  'plan.q5h': { ko: '사용자의 일상 속 장면을 떠올려 주세요.', en: 'Think of everyday scenarios for users.' },
  'plan.q5e': { ko: '예: 시간이 없을 때 빠르게 확인하려고 / 가족이나 팀원과 같이 쓰려고', en: 'e.g. Quick check when short on time / Using with family or team' },
  'plan.q5p': { ko: '퇴근하고 집에 와서 아이 일정이나 해야 할 일을 같이 정리할 때 쓸 것 같아요.', en: 'After work, when organizing kids schedules and tasks together.' },
  'plan.q6': { ko: '이 서비스를 쓰면 사용자에게 어떤 점이 가장 좋아질까요?', en: 'What is the biggest benefit for users?' },
  'plan.q6h': { ko: '이 서비스가 주는 가장 큰 가치를 알려주세요.', en: 'Tell us the core value of this service.' },
  'plan.q6e': { ko: '예: 시간을 아낄 수 있다 / 실수를 줄일 수 있다 / 소통이 편해진다', en: 'e.g. Save time / Reduce mistakes / Better communication' },
  'plan.q6p': { ko: '누가 뭘 해야 하는지 바로 보이고, 빠뜨리는 일이 줄어들 것 같아요.', en: 'Everyone can see who needs to do what, and nothing gets missed.' },
  'plan.q7': { ko: '이 서비스로 제일 먼저 꼭 해보고 싶은 건 뭐예요?', en: 'What is the first thing you want to try with this service?' },
  'plan.q7h': { ko: '가장 중요하게 생각하는 첫 목표를 알려주세요.', en: 'Tell us your most important first goal.' },
  'plan.q7e': { ko: '예: 예약을 온라인으로 받게 하고 싶다 / 게시글 등록과 조회만 먼저 되면 좋겠다', en: 'e.g. Enable online bookings / Start with post creation and viewing' },
  'plan.q7p': { ko: '일단 손님이 직접 예약 가능한 시간 보고 신청할 수 있게 만들고 싶어요.', en: 'I want customers to see available times and book directly.' },
  'plan.q8': { ko: '꼭 있어야 한다고 생각하는 기능은 어떤 게 있나요?', en: 'What features are essential?' },
  'plan.q8h': { ko: '떠오르는 기능을 편하게 나열해 주세요.', en: 'List any features that come to mind.' },
  'plan.q8e': { ko: '예: 회원가입/로그인 / 예약 신청 / 할 일 등록 / 댓글 작성 / 검색', en: 'e.g. Sign up / Booking / Task creation / Comments / Search' },
  'plan.q8p': { ko: '할 일 등록, 담당자 지정, 완료 체크는 꼭 있어야 해요.', en: 'Task creation, assigning people, and completion check are must-haves.' },
  'plan.q9': { ko: '이 서비스가 잘 만들어졌다고 느끼는 모습은 어떤 모습인가요?', en: 'What does success look like for this service?' },
  'plan.q9h': { ko: '기대하는 결과를 편하게 말씀해 주세요.', en: 'Describe your expected outcome.' },
  'plan.q9e': { ko: '예: 사람들이 헷갈리지 않고 바로 쓴다 / 가족이 실제로 매일 쓴다', en: 'e.g. People use it intuitively / Family actually uses it daily' },
  'plan.q9p': { ko: '가족들이 매일 자연스럽게 들어와서 확인하고, 서로 다시 안 물어봐도 되면 좋겠어요.', en: 'Family checks it naturally every day without asking each other again.' },
  'plan.q10': { ko: '비슷한 서비스나 참고하고 싶은 방식이 있나요?', en: 'Any similar services or references?' },
  'plan.q10h': { ko: '머릿속에 떠오르는 느낌이나 서비스가 있다면 알려주세요.', en: 'Mention any services or styles that come to mind.' },
  'plan.q10e': { ko: '예: 당근마켓처럼 직관적인 느낌 / 노션처럼 정리 잘 되는 느낌', en: 'e.g. Intuitive like Karrot / Organized like Notion' },
  'plan.q10p': { ko: '노션처럼 깔끔한데, 가족끼리는 훨씬 더 쉽게 쓸 수 있으면 좋겠어요.', en: 'Clean like Notion, but much easier for families to use.' },

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
  'mvp.readyDesc': { ko: '확정된 기획안과 디자인 선호도를 바탕으로 MVP를 자동으로 생성합니다.', en: 'An MVP will be automatically generated based on your finalized plan and design preferences.' },
  'mvp.generate': { ko: 'MVP 생성 요청', en: 'Request MVP Generation' },
  'mvp.generateConfirm': { ko: 'MVP 생성을 요청하시겠습니까?', en: 'Request MVP generation?' },
  'mvp.requesting': { ko: '요청 중...', en: 'Requesting...' },
  'mvp.generateError': { ko: 'MVP 생성 요청 중 오류가 발생했습니다.', en: 'An error occurred while requesting MVP generation.' },
  'mvp.pending': { ko: '대기 중', en: 'Pending' },
  'mvp.pendingDesc': { ko: 'MVP 생성 요청이 큐에 등록되었습니다. 곧 처리가 시작됩니다.', en: 'MVP generation request has been queued. Processing will begin shortly.' },
  'mvp.building': { ko: '빌드 중', en: 'Building' },
  'mvp.buildingDesc': { ko: 'MVP를 생성하고 있습니다. 잠시만 기다려주세요.', en: 'Building your MVP. Please wait.' },
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
