'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { t, translateError, getLocale, setLocale, type Locale } from '@/lib/i18n'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(translateError(error.message, locale))
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
          <p className="mt-2 text-on-surface-variant">{t('auth.login.title', locale)}</p>
        </div>

        <form onSubmit={handleLogin} className="glass-card rounded-2xl p-8 space-y-5 border border-outline-variant/20">
          {error && (
            <div className="p-3 text-sm text-error bg-error/10 rounded-lg">{error}</div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-on-surface-variant mb-1">
              {t('auth.login.email', locale)}
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
              {t('auth.login.password', locale)}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/20 rounded-lg focus:ring-2 focus:ring-primary/40 focus:outline-none text-on-surface"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-white bg-primary-container rounded-lg font-medium hover:bg-primary-container/80 disabled:opacity-50"
          >
            {loading ? t('auth.login.loading', locale) : t('auth.login.submit', locale)}
          </button>

          <p className="text-center text-sm text-on-surface-variant">
            {t('auth.login.noAccount', locale)}{' '}
            <Link href="/signup" className="text-secondary hover:underline">{t('auth.login.signupLink', locale)}</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
