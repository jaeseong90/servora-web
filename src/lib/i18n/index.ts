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
  // Auth pages
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
  'auth.signup.submit': { ko: '회원가입', en: 'Sign Up' },
  'auth.signup.loading': { ko: '가입 중...', en: 'Signing up...' },
  'auth.signup.hasAccount': { ko: '이미 계정이 있으신가요?', en: 'Already have an account?' },
  'auth.signup.loginLink': { ko: '로그인', en: 'Sign In' },
  'auth.signup.passwordMismatch': { ko: '비밀번호가 일치하지 않습니다.', en: 'Passwords do not match.' },
  'auth.signup.passwordTooShort': { ko: '비밀번호는 6자 이상이어야 합니다.', en: 'Password must be at least 6 characters.' },

  'auth.emailSent.title': { ko: '인증 메일을 보냈습니다', en: 'Verification email sent' },
  'auth.emailSent.desc': { ko: '으로 인증 메일을 발송했습니다.', en: 'A verification email has been sent to' },
  'auth.emailSent.instruction': { ko: '메일함을 확인하고 인증 링크를 클릭해주세요. 인증 완료 후 로그인할 수 있습니다.', en: 'Check your inbox and click the verification link. You can sign in after verification.' },
  'auth.emailSent.goLogin': { ko: '로그인 페이지로 이동', en: 'Go to Sign In' },
  'auth.emailSent.noMail': { ko: '메일이 오지 않나요? 스팸함을 확인하거나 잠시 후 다시 시도해주세요.', en: "Didn't receive the email? Check your spam folder or try again later." },
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
      // $1, $2 등 캡처 그룹 치환
      match.slice(1).forEach((val, idx) => {
        translated = translated.replace(`$${idx + 1}`, val)
      })
      return translated
    }
  }
  return message
}
