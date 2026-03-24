'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.push('/dashboard')
      }
    }
    checkAuth()
  }, [router])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
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
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold bg-gradient-to-br from-primary-container to-secondary bg-clip-text text-transparent">Servora</Link>
          <p className="mt-2 text-on-surface-variant">새 계정을 만드세요</p>
        </div>

        {emailSent ? (
          <div className="glass-card rounded-2xl p-8 border border-outline-variant/20 text-center">
            <div className="text-4xl mb-4">&#x2709;&#xFE0F;</div>
            <h2 className="text-xl font-bold text-on-surface mb-2">인증 메일을 보냈습니다</h2>
            <p className="text-on-surface-variant mb-2">
              <span className="text-secondary font-medium">{email}</span> 으로 인증 메일을 발송했습니다.
            </p>
            <p className="text-sm text-on-surface-variant mb-6">
              메일함을 확인하고 인증 링크를 클릭해주세요. 인증 완료 후 로그인할 수 있습니다.
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-2.5 text-white bg-primary-container rounded-lg font-medium hover:bg-primary-container/80"
            >
              로그인 페이지로 이동
            </Link>
            <p className="mt-4 text-xs text-on-surface-variant">
              메일이 오지 않나요? 스팸함을 확인하거나 잠시 후 다시 시도해주세요.
            </p>
          </div>
        ) : (
        <form onSubmit={handleSignup} className="glass-card rounded-2xl p-8 space-y-5 border border-outline-variant/20">
          {error && (
            <div className="p-3 text-sm text-error bg-error/10 rounded-lg">{error}</div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-on-surface-variant mb-1">
              이메일
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
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/20 rounded-lg focus:ring-2 focus:ring-primary/40 focus:outline-none text-on-surface"
              placeholder="6자 이상"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-on-surface-variant mb-1">
              비밀번호 확인
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/20 rounded-lg focus:ring-2 focus:ring-primary/40 focus:outline-none text-on-surface"
              placeholder="비밀번호를 다시 입력"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-white bg-primary-container rounded-lg font-medium hover:bg-primary-container/80 disabled:opacity-50"
          >
            {loading ? '가입 중...' : '회원가입'}
          </button>

          <p className="text-center text-sm text-on-surface-variant">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-secondary hover:underline">로그인</Link>
          </p>
        </form>
        )}
      </div>
    </div>
  )
}
