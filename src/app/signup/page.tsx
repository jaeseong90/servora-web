'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { t, translateError, getLocale, setLocale, type Locale } from '@/lib/i18n'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [locale, setLocaleState] = useState<Locale>('ko')

  useEffect(() => {
    setLocaleState(getLocale())
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.push('/dashboard')
      }
    }
    checkAuth()
  }, [router])

  const switchLocale = (l: Locale) => {
    setLocale(l)
    setLocaleState(l)
  }

  const handleSocialLogin = async (provider: 'google' | 'kakao') => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError(t('auth.signup.passwordMismatch', locale))
      return
    }

    if (password.length < 6) {
      setError(t('auth.signup.passwordTooShort', locale))
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(translateError(error.message, locale))
      setLoading(false)
      return
    }

    // 이메일 인증이 필요한 경우 (세션이 없으면 인증 대기 상태)
    if (data.user && !data.session) {
      setEmailSent(true)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Language Switcher */}
        <div className="flex justify-end mb-4 gap-1">
          <button
            onClick={() => switchLocale('ko')}
            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
              locale === 'ko' ? 'bg-primary-container/30 text-on-surface font-bold' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            한국어
          </button>
          <button
            onClick={() => switchLocale('en')}
            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
              locale === 'en' ? 'bg-primary-container/30 text-on-surface font-bold' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            English
          </button>
        </div>

        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold bg-gradient-to-br from-primary-container to-secondary bg-clip-text text-transparent">Servora</Link>
          <p className="mt-2 text-on-surface-variant">{t('auth.signup.title', locale)}</p>
          <Link href="/" className="mt-3 inline-flex items-center gap-1 text-xs text-on-surface-variant hover:text-secondary transition-colors">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            {locale === 'ko' ? '홈으로' : 'Back to Home'}
          </Link>
        </div>

        {emailSent ? (
          <div className="glass-card rounded-2xl p-8 border border-outline-variant/20 text-center">
            <div className="text-4xl mb-4">&#x2709;&#xFE0F;</div>
            <h2 className="text-xl font-bold text-on-surface mb-2">{t('auth.emailSent.title', locale)}</h2>
            <p className="text-on-surface-variant mb-2">
              <span className="text-secondary font-medium">{email}</span>
              {locale === 'ko'
                ? ` ${t('auth.emailSent.desc', locale)}`
                : `. ${t('auth.emailSent.desc', locale)} ${email}.`
              }
            </p>
            <p className="text-sm text-on-surface-variant mb-6">
              {t('auth.emailSent.instruction', locale)}
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-2.5 text-white bg-primary-container rounded-lg font-medium hover:bg-primary-container/80"
            >
              {t('auth.emailSent.goLogin', locale)}
            </Link>
            <p className="mt-4 text-xs text-on-surface-variant">
              {t('auth.emailSent.noMail', locale)}
            </p>
          </div>
        ) : (
        <form onSubmit={handleSignup} className="glass-card rounded-2xl p-8 space-y-5 border border-outline-variant/20">
          {error && (
            <div className="p-3 text-sm text-error bg-error/10 rounded-lg">{error}</div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-on-surface-variant mb-1">
              {t('auth.signup.email', locale)}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/20 rounded-lg focus:ring-2 focus:ring-primary/40 focus:outline-none text-on-surface"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-on-surface-variant mb-1">
              {t('auth.signup.password', locale)}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/20 rounded-lg focus:ring-2 focus:ring-primary/40 focus:outline-none text-on-surface"
              placeholder={locale === 'ko' ? '6자 이상' : 'Min 6 characters'}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-on-surface-variant mb-1">
              {t('auth.signup.confirmPassword', locale)}
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/20 rounded-lg focus:ring-2 focus:ring-primary/40 focus:outline-none text-on-surface"
              placeholder={t('auth.signup.confirmPlaceholder', locale)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-white bg-primary-container rounded-lg font-medium hover:bg-primary-container/80 disabled:opacity-50"
          >
            {loading ? t('auth.signup.loading', locale) : t('auth.signup.submit', locale)}
          </button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant/20" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-surface-container px-3 text-on-surface-variant">{locale === 'ko' ? '또는' : 'or'}</span></div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              className="w-full py-2.5 bg-white text-gray-800 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-3"
            >
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              {locale === 'ko' ? 'Google로 가입하기' : 'Sign up with Google'}
            </button>
            <button
              type="button"
              onClick={() => handleSocialLogin('kakao')}
              className="w-full py-2.5 bg-[#FEE500] text-[#191919] rounded-lg font-medium hover:bg-[#FDD800] transition-colors flex items-center justify-center gap-3"
            >
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M12 3C6.48 3 2 6.36 2 10.5c0 2.67 1.77 5.02 4.44 6.38-.14.52-.9 3.34-.93 3.55 0 0-.02.17.09.23.11.07.24.01.24.01.32-.04 3.7-2.44 4.28-2.86.6.09 1.22.14 1.88.14 5.52 0 10-3.36 10-7.5S17.52 3 12 3z" fill="#191919"/></svg>
              {locale === 'ko' ? '카카오로 가입하기' : 'Sign up with Kakao'}
            </button>
          </div>

          <p className="text-center text-sm text-on-surface-variant">
            {t('auth.signup.hasAccount', locale)}{' '}
            <Link href="/login" className="text-secondary hover:underline">{t('auth.signup.loginLink', locale)}</Link>
          </p>
        </form>
        )}
      </div>
    </div>
  )
}
