'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { t, getLocale, type Locale } from '@/lib/i18n'
import type { MvpBuildQueue } from '@/types'

export default function MvpPage() {
  const params = useParams()
  const projectId = params.id as string

  const [locale, setLocaleState] = useState<Locale>('ko')
  const [buildStatus, setBuildStatus] = useState<MvpBuildQueue | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/mvp/status`)
      if (response.ok) {
        const data = await response.json()
        setBuildStatus(data.build || null)
      }
    } catch { /* ignore */ }
  }, [projectId])

  useEffect(() => {
    setLocaleState(getLocale())
    fetchStatus()
  }, [fetchStatus])

  // 폴링: PENDING 또는 BUILDING 상태일 때 5초마다 확인
  useEffect(() => {
    if (!buildStatus) return
    if (buildStatus.status !== 'PENDING' && buildStatus.status !== 'BUILDING') return

    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [buildStatus, fetchStatus])

  const handleGenerate = async () => {
    if (!confirm(t('mvp.generateConfirm', locale))) return

    setGenerating(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/mvp/generate`, {
        method: 'POST',
      })

      if (response.ok) {
        await fetchStatus()
      } else {
        const data = await response.json()
        alert(data.error || t('mvp.generateError', locale))
      }
    } catch {
      alert(t('mvp.generateError', locale))
    } finally {
      setGenerating(false)
    }
  }

  const statusDisplay: Record<string, { label: string; color: string; description: string }> = {
    PENDING: {
      label: t('mvp.pending', locale),
      color: 'bg-yellow-100 text-yellow-800',
      description: t('mvp.pendingDesc', locale),
    },
    BUILDING: {
      label: t('mvp.building', locale),
      color: 'bg-blue-100 text-blue-800',
      description: t('mvp.buildingDesc', locale),
    },
    COMPLETED: {
      label: t('mvp.completed', locale),
      color: 'bg-green-100 text-green-800',
      description: t('mvp.completedDesc', locale),
    },
    FAILED: {
      label: t('mvp.failed', locale),
      color: 'bg-red-100 text-red-800',
      description: t('mvp.failedDesc', locale),
    },
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('mvp.title', locale)}</h1>

      {!buildStatus ? (
        <div className="bg-white rounded-xl p-8 shadow-sm text-center">
          <div className="text-4xl mb-4">&#x1F680;</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('mvp.ready', locale)}</h2>
          <p className="text-sm text-gray-600 mb-6">
            {t('mvp.readyDesc', locale)}
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-8 py-3 text-white bg-blue-600 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? t('mvp.requesting', locale) : t('mvp.generate', locale)}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 상태 카드 */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusDisplay[buildStatus.status]?.color}`}>
                {statusDisplay[buildStatus.status]?.label}
              </span>
              {(buildStatus.status === 'PENDING' || buildStatus.status === 'BUILDING') && (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            <p className="text-sm text-gray-600">
              {statusDisplay[buildStatus.status]?.description}
            </p>

            {buildStatus.build_duration_ms && (
              <p className="mt-2 text-xs text-gray-400">
                {t('mvp.buildTime', locale)}: {Math.round(buildStatus.build_duration_ms / 1000)}{t('common.seconds', locale)}
              </p>
            )}
          </div>

          {/* 결과 */}
          {buildStatus.status === 'COMPLETED' && (
            <div className="bg-green-50 rounded-xl p-6">
              <h3 className="font-semibold text-green-900 mb-3">{t('mvp.deployComplete', locale)}</h3>
              {buildStatus.vercel_url && (
                <div className="mb-3">
                  <label className="block text-xs text-green-700 mb-1">Vercel URL</label>
                  <a
                    href={buildStatus.vercel_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm break-all"
                  >
                    {buildStatus.vercel_url}
                  </a>
                </div>
              )}
              {buildStatus.github_repo && (
                <div>
                  <label className="block text-xs text-green-700 mb-1">GitHub</label>
                  <a
                    href={buildStatus.github_repo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm break-all"
                  >
                    {buildStatus.github_repo}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* 에러 */}
          {buildStatus.status === 'FAILED' && buildStatus.error_message && (
            <div className="bg-red-50 rounded-xl p-6">
              <h3 className="font-semibold text-red-900 mb-2">{t('mvp.errorDetail', locale)}</h3>
              <p className="text-sm text-red-700">{buildStatus.error_message}</p>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="mt-4 px-6 py-2 text-white bg-red-600 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {t('mvp.retry', locale)}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
