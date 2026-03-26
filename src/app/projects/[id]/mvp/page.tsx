'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { t, getLocale, type Locale } from '@/lib/i18n'
import type { MvpBuildQueue } from '@/types'

export default function MvpPage() {
  const params = useParams()
  const projectId = params.id as string

  const [locale, setLocaleState] = useState<Locale>('ko')
  const [buildStatus, setBuildStatus] = useState<MvpBuildQueue | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const prevStatusRef = useRef<string | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/mvp/status`)
      if (response.ok) {
        const data = await response.json()
        const newBuild = data.build || null
        const newStatus = newBuild?.status || null
        const prevStatus = prevStatusRef.current

        // 상태 변경 시 브라우저 알림
        if (prevStatus && newStatus !== prevStatus) {
          if (newStatus === 'COMPLETED') {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Servora', {
                body: locale === 'ko' ? 'MVP 빌드가 완료되었습니다!' : 'MVP build is complete!',
                icon: '/favicon.ico',
              })
            }
          } else if (newStatus === 'FAILED') {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Servora', {
                body: locale === 'ko' ? 'MVP 빌드에 실패했습니다.' : 'MVP build failed.',
                icon: '/favicon.ico',
              })
            }
          }
        }

        prevStatusRef.current = newStatus
        setBuildStatus(newBuild)
      }
    } catch { /* ignore */ }
  }, [projectId, locale])

  useEffect(() => {
    setLocaleState(getLocale())
    // 브라우저 알림 권한 요청
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    fetchStatus().finally(() => setInitialLoading(false))
  }, [fetchStatus])

  // Realtime 구독: mvp_build_queue 변경 감지
  useEffect(() => {
    if (!buildStatus) return
    if (buildStatus.status !== 'PENDING' && buildStatus.status !== 'BUILDING') return

    const supabase = createClient()
    const channel = supabase
      .channel(`mvp-${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'mvp_build_queue',
        filter: `project_id=eq.${projectId}`,
      }, () => {
        fetchStatus()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [buildStatus, fetchStatus, projectId])

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
      color: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
      description: t('mvp.pendingDesc', locale),
    },
    BUILDING: {
      label: t('mvp.building', locale),
      color: 'bg-primary/10 text-primary border border-primary/20',
      description: t('mvp.buildingDesc', locale),
    },
    COMPLETED: {
      label: t('mvp.completed', locale),
      color: 'bg-secondary/10 text-secondary border border-secondary/20',
      description: t('mvp.completedDesc', locale),
    },
    FAILED: {
      label: t('mvp.failed', locale),
      color: 'bg-error/10 text-error border border-error/20',
      description: t('mvp.failedDesc', locale),
    },
  }

  if (initialLoading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-32">
        <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {!buildStatus ? (
        <div className="glass-card rounded-2xl p-8 border border-outline-variant/20 text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary-container/20 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-primary text-2xl">rocket_launch</span>
          </div>
          <h2 className="text-lg font-bold text-on-surface mb-2">{t('mvp.ready', locale)}</h2>
          <p className="text-sm text-on-surface-variant mb-6">
            {t('mvp.readyDesc', locale)}
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-8 py-3.5 text-sm font-bold text-white bg-primary-container rounded-xl hover:bg-primary-container/90 hover:shadow-lg hover:shadow-primary-container/30 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
          >
            {generating ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('mvp.requesting', locale)}
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">play_arrow</span>
                {t('mvp.generate', locale)}
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 상태 카드 */}
          <div className="glass-card rounded-2xl p-6 border border-outline-variant/20">
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusDisplay[buildStatus.status]?.color}`}>
                {statusDisplay[buildStatus.status]?.label}
              </span>
              {(buildStatus.status === 'PENDING' || buildStatus.status === 'BUILDING') && (
                <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            <p className="text-sm text-on-surface-variant">
              {statusDisplay[buildStatus.status]?.description}
            </p>

            {buildStatus.build_duration_ms && (
              <p className="mt-2 text-xs text-on-surface-variant/60">
                {t('mvp.buildTime', locale)}: {Math.round(buildStatus.build_duration_ms / 1000)}{t('common.seconds', locale)}
              </p>
            )}
          </div>

          {/* 결과 */}
          {buildStatus.status === 'COMPLETED' && (
            <>
              <div className="glass-card rounded-2xl p-6 border border-secondary/20 bg-secondary/5">
                <h3 className="font-bold text-on-surface mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  {t('mvp.deployComplete', locale)}
                </h3>
                {buildStatus.vercel_url && (
                  <div className="mb-3">
                    <label className="block text-xs text-on-surface-variant mb-1">Vercel URL</label>
                    <a
                      href={buildStatus.vercel_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm break-all"
                    >
                      {buildStatus.vercel_url}
                    </a>
                  </div>
                )}
              </div>

              {/* 데모 계정 */}
              {buildStatus.demo_accounts && Array.isArray(buildStatus.demo_accounts) && buildStatus.demo_accounts.length > 0 && (
                <div className="glass-card rounded-2xl p-6 border border-outline-variant/20">
                  <h3 className="font-bold text-on-surface mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">key</span>
                    {locale === 'ko' ? '데모 계정' : 'Demo Accounts'}
                  </h3>
                  <div className="space-y-3">
                    {(buildStatus.demo_accounts as { role: string; email: string; password: string }[]).map((account, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-3 bg-surface-container-lowest/50 rounded-xl border border-outline-variant/10">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                          account.role === 'admin'
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'bg-secondary/10 text-secondary border border-secondary/20'
                        }`}>
                          {account.role}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-on-surface font-medium">{account.email}</div>
                        </div>
                        <div className="text-sm text-on-surface-variant font-mono">{account.password}</div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`${account.email} / ${account.password}`)
                            alert(locale === 'ko' ? '복사되었습니다' : 'Copied!')
                          }}
                          className="text-on-surface-variant hover:text-primary transition-colors"
                          aria-label="Copy"
                        >
                          <span className="material-symbols-outlined text-sm">content_copy</span>
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[11px] text-on-surface-variant/50">
                    {locale === 'ko' ? '위 계정으로 생성된 MVP에 로그인할 수 있습니다.' : 'Use these accounts to log in to the generated MVP.'}
                  </p>
                </div>
              )}
            </>
          )}

          {/* 에러 */}
          {buildStatus.status === 'FAILED' && (
            <div className="glass-card rounded-2xl p-6 border border-error/20 bg-error/5">
              <h3 className="font-bold text-on-surface mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-error">error</span>
                {t('mvp.errorDetail', locale)}
              </h3>
              {buildStatus.error_message && (
                <p className="text-sm text-on-surface-variant mb-4">{buildStatus.error_message}</p>
              )}
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-5 py-2.5 text-sm font-bold text-error bg-error/10 border border-error/20 rounded-xl hover:bg-error/20 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">refresh</span>
                {t('mvp.retry', locale)}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
