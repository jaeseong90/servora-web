'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { t, getLocale, type Locale } from '@/lib/i18n'

export default function NewProjectPage() {
  const router = useRouter()
  const [locale, setLocaleState] = useState<Locale>('ko')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLocaleState(getLocale())
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError(t('project.new.titleRequired', locale))
      return
    }

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data, error: insertError } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push(`/projects/${data.id}/planning`)
  }

  return (
    <div className="min-h-screen bg-background text-on-background">
      <main className="flex-1 p-8">
        <div className="max-w-lg mx-auto">
          <div className="mb-6">
            <Link href="/dashboard" className="text-sm text-on-surface-variant hover:text-on-surface">
              {t('project.new.back', locale)}
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-on-surface mb-6">{t('project.new.title', locale)}</h1>

          <form onSubmit={handleSubmit} className="glass-card rounded-xl p-6 shadow-sm space-y-5 border border-outline-variant/20">
            {error && (
              <div className="p-3 text-sm text-error bg-error/10 rounded-lg">{error}</div>
            )}

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-on-surface-variant mb-1">
                {t('project.new.nameLabel', locale)}
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/20 rounded-lg focus:ring-2 focus:ring-primary/40 focus:outline-none text-on-surface"
                placeholder={t('project.new.namePlaceholder', locale)}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-on-surface-variant mb-1">
                {t('project.new.descLabel', locale)}
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/20 rounded-lg focus:ring-2 focus:ring-primary/40 focus:outline-none resize-none text-on-surface"
                placeholder={t('project.new.descPlaceholder', locale)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-white bg-primary-container rounded-lg font-medium hover:bg-primary-container/80 disabled:opacity-50"
            >
              {loading ? t('project.new.loading', locale) : t('project.new.submit', locale)}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
