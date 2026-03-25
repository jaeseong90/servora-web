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
