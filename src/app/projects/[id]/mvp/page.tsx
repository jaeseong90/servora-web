'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { t, getLocale, type Locale } from '@/lib/i18n'
import type { MvpBuildQueue } from '@/types'

interface MvpSpec {
  serviceName: string
  serviceDescription: string
  entities: SpecEntity[]
  screens: SpecScreen[]
  roles?: { name: string; displayName: string; description: string }[]
  excludedFromMvp?: string[]
}

interface SpecEntity {
  name: string
  displayName: string
  fields: {
    name: string
    type: string
    displayName: string
    required?: boolean
    options?: string[]
    relationTarget?: string
  }[]
}

interface SpecScreen {
  id: string
  displayName: string
  type: string
  entity: string
  role?: string
  audience?: string
  columns?: string[]
  actions?: string[]
  search?: string[]
  description?: string
}

export default function MvpPage() {
  const params = useParams()
  const projectId = params.id as string

  const [locale, setLocaleState] = useState<Locale>('ko')
  const [buildStatus, setBuildStatus] = useState<MvpBuildQueue | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const prevStatusRef = useRef<string | null>(null)

  // 스펙 리뷰 상태
  const [spec, setSpec] = useState<MvpSpec | null>(null)
  const [specTab, setSpecTab] = useState<'visual' | 'json'>('visual')
  const [jsonEdit, setJsonEdit] = useState('')
  const [specSaving, setSpecSaving] = useState(false)
  const [specConfirming, setSpecConfirming] = useState(false)
  const [specError, setSpecError] = useState('')

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/mvp/status`)
      if (response.ok) {
        const data = await response.json()
        const newBuild = data.build || null
        const newStatus = newBuild?.status || null
        const prevStatus = prevStatusRef.current

        if (prevStatus && newStatus !== prevStatus) {
          if (newStatus === 'COMPLETED' || newStatus === 'FAILED') {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Servora', {
                body: newStatus === 'COMPLETED'
                  ? (locale === 'ko' ? 'MVP 빌드가 완료되었습니다!' : 'MVP build is complete!')
                  : (locale === 'ko' ? 'MVP 빌드에 실패했습니다.' : 'MVP build failed.'),
                icon: '/favicon.ico',
              })
            }
          }
        }

        if (newStatus === 'COMPLETED' || newStatus === 'FAILED' || !newBuild) {
          sessionStorage.removeItem(`mvp-generating-${projectId}`)
        }

        prevStatusRef.current = newStatus
        setBuildStatus(newBuild)

        // SPEC_REVIEW 상태면 스펙 데이터 로드
        if (newBuild?.status === 'SPEC_REVIEW' && newBuild.spec_json) {
          try {
            const parsed = JSON.parse(newBuild.spec_json)
            setSpec(parsed)
            setJsonEdit(JSON.stringify(parsed, null, 2))
          } catch { /* ignore */ }
        }
      }
    } catch { /* ignore */ }
  }, [projectId, locale])

  useEffect(() => {
    setLocaleState(getLocale())
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    const wasPending = sessionStorage.getItem(`mvp-generating-${projectId}`)
    if (wasPending) setGenerating(true)
    fetchStatus().finally(() => { setInitialLoading(false); setGenerating(false) })
  }, [fetchStatus, projectId])

  // Realtime 구독
  useEffect(() => {
    if (!buildStatus) return
    if (buildStatus.status !== 'PENDING' && buildStatus.status !== 'BUILDING') return
    const supabase = createClient()
    const channel = supabase
      .channel(`mvp-${projectId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'mvp_build_queue',
        filter: `project_id=eq.${projectId}`,
      }, () => fetchStatus())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [buildStatus, fetchStatus, projectId])

  // ─── 스펙 추출 (generate) ───
  const handleGenerate = async () => {
    setGenerating(true)
    setSpecError('')
    try {
      const response = await fetch(`/api/projects/${projectId}/mvp/generate`, { method: 'POST' })
      if (response.ok) {
        sessionStorage.setItem(`mvp-generating-${projectId}`, '1')
        await fetchStatus()
      } else {
        const data = await response.json()
        setSpecError(data.error || (locale === 'ko' ? 'MVP 스펙 추출에 실패했습니다.' : 'Failed to extract MVP spec.'))
      }
    } catch {
      setSpecError(locale === 'ko' ? '오류가 발생했습니다.' : 'An error occurred.')
    } finally {
      setGenerating(false)
    }
  }

  // ─── 스펙 저장 ───
  const handleSaveSpec = async () => {
    setSpecSaving(true)
    setSpecError('')
    try {
      let specToSave: MvpSpec
      if (specTab === 'json') {
        specToSave = JSON.parse(jsonEdit)
        setSpec(specToSave)
      } else {
        specToSave = spec!
        setJsonEdit(JSON.stringify(specToSave, null, 2))
      }

      const response = await fetch(`/api/projects/${projectId}/mvp/spec`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spec: specToSave }),
      })
      if (!response.ok) {
        const data = await response.json()
        setSpecError(data.error || '저장 실패')
      }
    } catch (err) {
      setSpecError(err instanceof SyntaxError ? 'JSON 형식이 올바르지 않습니다.' : '저장 실패')
    } finally {
      setSpecSaving(false)
    }
  }

  // ─── 스펙 확정 → 빌드 시작 ───
  const handleConfirmSpec = async () => {
    const msg = locale === 'ko'
      ? '이 스펙으로 MVP 빌드를 시작합니다. 계속하시겠습니까?'
      : 'Start MVP build with this spec?'
    if (!confirm(msg)) return

    setSpecConfirming(true)
    setSpecError('')
    try {
      const response = await fetch(`/api/projects/${projectId}/mvp/spec`, { method: 'POST' })
      if (response.ok) {
        await fetchStatus()
      } else {
        const data = await response.json()
        setSpecError(data.error || '확정 실패')
      }
    } catch {
      setSpecError('오류가 발생했습니다.')
    } finally {
      setSpecConfirming(false)
    }
  }

  // ─── 스펙 폐기 + 재생성 ───
  const handleRegenerate = async () => {
    if (buildStatus?.id) {
      const supabase = createClient()
      await supabase.from('mvp_build_queue').delete().eq('id', buildStatus.id)
    }
    setBuildStatus(null)
    setSpec(null)
    await handleGenerate()
  }

  const statusDisplay: Record<string, { label: string; color: string; description: string }> = {
    SPEC_REVIEW: {
      label: locale === 'ko' ? '스펙 검토' : 'Spec Review',
      color: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
      description: locale === 'ko' ? 'AI가 추출한 MVP 스펙을 확인하고 수정할 수 있습니다.' : 'Review and edit the AI-extracted MVP spec.',
    },
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
      {/* ━━━ 초기 상태: 생성 버튼 ━━━ */}
      {!buildStatus ? (
        <div className="glass-card rounded-2xl p-8 border border-outline-variant/20 text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary-container/20 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-primary text-2xl">rocket_launch</span>
          </div>
          <h2 className="text-lg font-bold text-on-surface mb-2">
            {locale === 'ko' ? 'MVP 스펙 추출' : 'Extract MVP Spec'}
          </h2>
          <p className="text-sm text-on-surface-variant mb-6">
            {locale === 'ko'
              ? '기획안과 디자인 선호도를 분석하여 MVP 구조를 자동으로 추출합니다.'
              : 'Automatically extract MVP structure from your plan and design preferences.'}
          </p>

          {specError && (
            <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 text-sm text-error text-left">
              {specError}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-8 py-3.5 text-sm font-bold text-white bg-primary-container rounded-xl hover:bg-primary-container/90 hover:shadow-lg hover:shadow-primary-container/30 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
          >
            {generating ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {locale === 'ko' ? '스펙 추출 중...' : 'Extracting...'}
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">auto_awesome</span>
                {locale === 'ko' ? '스펙 추출하기' : 'Extract Spec'}
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

          {/* ━━━ 스펙 리뷰 UI ━━━ */}
          {buildStatus.status === 'SPEC_REVIEW' && spec && (
            <>
              {specError && (
                <div className="p-3 rounded-lg bg-error/10 border border-error/20 flex items-center gap-2">
                  <span className="material-symbols-outlined text-error text-sm">error</span>
                  <p className="text-sm text-error">{specError}</p>
                  <button onClick={() => setSpecError('')} className="ml-auto text-on-surface-variant hover:text-on-surface">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              )}

              {/* 탭 전환 */}
              <div className="glass-card rounded-2xl p-6 border border-outline-variant/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-1 bg-surface-container-highest/30 rounded-lg p-0.5">
                    <button
                      onClick={() => setSpecTab('visual')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        specTab === 'visual'
                          ? 'bg-surface-container-highest text-on-surface'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {locale === 'ko' ? '시각적 보기' : 'Visual'}
                    </button>
                    <button
                      onClick={() => { setSpecTab('json'); setJsonEdit(JSON.stringify(spec, null, 2)) }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        specTab === 'json'
                          ? 'bg-surface-container-highest text-on-surface'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      JSON
                    </button>
                  </div>
                  <button
                    onClick={handleRegenerate}
                    disabled={generating}
                    className="text-xs text-on-surface-variant hover:text-tertiary-container transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">refresh</span>
                    {locale === 'ko' ? '다시 추출' : 'Re-extract'}
                  </button>
                </div>

                {/* 시각적 보기 */}
                {specTab === 'visual' && (
                  <div className="space-y-6">
                    {/* 서비스 개요 */}
                    <div>
                      <h3 className="text-sm font-bold text-on-surface mb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-lg">info</span>
                        {spec.serviceName}
                      </h3>
                      <p className="text-sm text-on-surface-variant">{spec.serviceDescription}</p>
                    </div>

                    {/* 엔티티 */}
                    <div>
                      <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-lg">table_chart</span>
                        {locale === 'ko' ? '엔티티' : 'Entities'} ({spec.entities.length}/5)
                      </h3>
                      <div className="space-y-3">
                        {spec.entities.map((entity) => (
                          <div key={entity.name} className="bg-surface-container-lowest/50 rounded-xl border border-outline-variant/10 p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-bold text-on-surface">{entity.displayName}</span>
                              <span className="text-[10px] font-mono text-on-surface-variant/60 bg-surface-container-highest px-1.5 py-0.5 rounded">
                                {entity.name}
                              </span>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-outline-variant/10">
                                    <th className="text-left py-1.5 px-2 text-on-surface-variant font-medium">필드</th>
                                    <th className="text-left py-1.5 px-2 text-on-surface-variant font-medium">타입</th>
                                    <th className="text-left py-1.5 px-2 text-on-surface-variant font-medium">필수</th>
                                    <th className="text-left py-1.5 px-2 text-on-surface-variant font-medium">비고</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {entity.fields.map((field) => (
                                    <tr key={field.name} className="border-b border-outline-variant/5">
                                      <td className="py-1.5 px-2">
                                        <span className="text-on-surface">{field.displayName}</span>
                                        <span className="ml-1 text-on-surface-variant/50 font-mono">({field.name})</span>
                                      </td>
                                      <td className="py-1.5 px-2">
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                          field.type === 'relation'
                                            ? 'bg-blue-500/10 text-blue-400'
                                            : field.type === 'select'
                                            ? 'bg-purple-500/10 text-purple-400'
                                            : 'bg-surface-container-highest text-on-surface-variant'
                                        }`}>
                                          {field.type}
                                        </span>
                                      </td>
                                      <td className="py-1.5 px-2 text-on-surface-variant">{field.required ? '✓' : ''}</td>
                                      <td className="py-1.5 px-2 text-on-surface-variant/60">
                                        {field.options && `[${field.options.join(', ')}]`}
                                        {field.relationTarget && `→ ${field.relationTarget}`}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 화면 */}
                    <div>
                      <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-lg">web</span>
                        {locale === 'ko' ? '화면' : 'Screens'} ({spec.screens.length}/8)
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {spec.screens.map((screen) => (
                          <div key={screen.id} className="bg-surface-container-lowest/50 rounded-xl border border-outline-variant/10 p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-on-surface">{screen.displayName}</span>
                              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                                screen.audience === 'admin'
                                  ? 'bg-primary/10 text-primary border border-primary/20'
                                  : 'bg-secondary/10 text-secondary border border-secondary/20'
                              }`}>
                                {screen.audience || screen.role || 'all'}
                              </span>
                            </div>
                            <p className="text-[11px] text-on-surface-variant">{screen.description}</p>
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {screen.actions?.map(a => (
                                <span key={a} className="text-[9px] bg-surface-container-highest px-1.5 py-0.5 rounded text-on-surface-variant">
                                  {a}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* MVP 제외 항목 */}
                    {spec.excludedFromMvp && spec.excludedFromMvp.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-on-surface mb-2 flex items-center gap-2">
                          <span className="material-symbols-outlined text-on-surface-variant text-lg">block</span>
                          {locale === 'ko' ? 'MVP 제외 (향후 추가)' : 'Excluded from MVP'}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {spec.excludedFromMvp.map((item, i) => (
                            <span key={i} className="text-xs bg-surface-container-highest/50 text-on-surface-variant px-2.5 py-1 rounded-lg border border-outline-variant/10">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* JSON 편집 */}
                {specTab === 'json' && (
                  <div>
                    <textarea
                      value={jsonEdit}
                      onChange={(e) => setJsonEdit(e.target.value)}
                      rows={25}
                      className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/20 rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-transparent outline-none resize-y text-sm text-on-surface font-mono placeholder:text-on-surface-variant/40"
                    />
                    <div className="flex justify-end mt-3">
                      <button
                        onClick={handleSaveSpec}
                        disabled={specSaving}
                        className="px-5 py-2 text-sm font-bold text-white bg-primary-container rounded-xl hover:bg-primary-container/80 disabled:opacity-50 transition-colors flex items-center gap-2"
                      >
                        {specSaving ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            {locale === 'ko' ? '저장 중...' : 'Saving...'}
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-sm">save</span>
                            {locale === 'ko' ? '스펙 저장' : 'Save Spec'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 확정 버튼 */}
              <button
                onClick={handleConfirmSpec}
                disabled={specConfirming}
                className="w-full py-3.5 text-sm font-bold text-white bg-primary-container rounded-xl hover:bg-primary-container/90 hover:shadow-lg hover:shadow-primary-container/30 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {specConfirming ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {locale === 'ko' ? '빌드 시작 중...' : 'Starting build...'}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">play_arrow</span>
                    {locale === 'ko' ? '이 스펙으로 MVP 빌드 시작' : 'Start MVP Build with this Spec'}
                  </>
                )}
              </button>
            </>
          )}

          {/* ━━━ 빌드 완료 ━━━ */}
          {buildStatus.status === 'COMPLETED' && (
            <>
              <div className="glass-card rounded-2xl p-6 border border-secondary/20 bg-secondary/5">
                <h3 className="font-bold text-on-surface mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  {t('mvp.deployComplete', locale)}
                </h3>
                {buildStatus.vercel_url && (
                  <a href={buildStatus.vercel_url} target="_blank" rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm break-all">
                    {buildStatus.vercel_url}
                  </a>
                )}
              </div>

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
                        }`}>{account.role}</span>
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
                        >
                          <span className="material-symbols-outlined text-sm">content_copy</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ━━━ 빌드 실패 ━━━ */}
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
                onClick={handleRegenerate}
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
