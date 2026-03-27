'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Locale } from '@/lib/i18n'
import type { ArchitectureScreen, ScreenDetail, PhaseStatus } from '@/types'
import DesignFeedbackPanel from './DesignFeedbackPanel'
import ApproveButton from './ApproveButton'

/** AI 출력이 string[] 대신 object[]로 올 수 있으므로 안전하게 변환 */
function toStringArray(arr: unknown): string[] {
  if (!Array.isArray(arr)) return []
  return arr.map(item => {
    if (typeof item === 'string') return item
    if (item && typeof item === 'object') return Object.values(item).join(', ')
    return String(item)
  })
}

interface ScreenDeepDiveProps {
  locale: Locale
  projectId: string
  screens: ArchitectureScreen[]
  screenDetails: ScreenDetail[]
  phaseStatus: PhaseStatus
  onScreenDetailUpdate: (details: ScreenDetail[]) => void
  onApprove: () => Promise<void>
}

export default function ScreenDeepDive({
  locale,
  projectId,
  screens,
  screenDetails,
  phaseStatus,
  onScreenDetailUpdate,
  onApprove,
}: ScreenDeepDiveProps) {
  const [activeScreenId, setActiveScreenId] = useState<string | null>(screens[0]?.id || null)
  const [generatingScreenId, setGeneratingScreenId] = useState<string | null>(null)
  const [autoRunning, setAutoRunning] = useState(false)
  const [error, setError] = useState('')
  const autoRunTriggered = useRef(false)

  const isApproved = phaseStatus === 'approved'
  const activeDetail = screenDetails.find(d => d.screenId === activeScreenId)
  const completedCount = screens.filter(s => screenDetails.some(d => d.screenId === s.id)).length
  const allCompleted = completedCount === screens.length

  // 단일 화면 생성
  const generateScreen = useCallback(async (screenId: string): Promise<boolean> => {
    setGeneratingScreenId(screenId)
    setActiveScreenId(screenId)
    setError('')
    try {
      const res = await fetch(`/api/projects/${projectId}/design/phase/3/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ screenId }),
      })
      if (!res.ok) {
        if (res.status === 429) {
          // Rate limit — 잠시 대기 후 재시도
          const retryAfter = res.headers.get('Retry-After')
          const waitSec = retryAfter ? parseInt(retryAfter, 10) : 15
          await new Promise(r => setTimeout(r, waitSec * 1000))
          return generateScreen(screenId) // 재시도
        }
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || '생성에 실패했습니다.')
      }
      const data = await res.json()
      if (data.blueprint?.screenDetails) onScreenDetailUpdate(data.blueprint.screenDetails)
      return true
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
      return false
    } finally {
      setGeneratingScreenId(null)
    }
  }, [projectId, onScreenDetailUpdate])

  // 모든 미완성 화면 순차 자동 생성
  const runAutoGenerate = useCallback(async () => {
    setAutoRunning(true)
    for (const screen of screens) {
      const alreadyDone = screenDetails.some(d => d.screenId === screen.id)
      if (alreadyDone) continue

      const ok = await generateScreen(screen.id)
      if (!ok) break // 에러 시 중단
    }
    setAutoRunning(false)
  }, [screens, screenDetails, generateScreen])

  // Phase 3 진입 시 자동 실행
  useEffect(() => {
    if (autoRunTriggered.current || isApproved || allCompleted) return
    const remaining = screens.filter(s => !screenDetails.some(d => d.screenId === s.id))
    if (remaining.length > 0) {
      autoRunTriggered.current = true
      runAutoGenerate()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFeedback = async (feedback: string) => {
    if (!activeScreenId) return
    setError('')
    try {
      const res = await fetch(`/api/projects/${projectId}/design/phase/3/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback, screenId: activeScreenId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || '피드백 반영에 실패했습니다.')
      }
      const data = await res.json()
      if (data.blueprint?.screenDetails) onScreenDetailUpdate(data.blueprint.screenDetails)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    }
  }

  // 현재 생성 중인 화면의 진행 순서
  const currentGenIndex = generatingScreenId
    ? screens.findIndex(s => s.id === generatingScreenId) + 1
    : 0

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="glass-card rounded-2xl p-4 border border-outline-variant/20">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-on-surface">
            {locale === 'ko'
              ? `화면별 상세 설계 (${completedCount}/${screens.length})`
              : `Screen Details (${completedCount}/${screens.length})`}
          </h3>
          <div className="flex items-center gap-3">
            {autoRunning && (
              <span className="text-[11px] text-purple-400 flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                {locale === 'ko'
                  ? `${currentGenIndex}/${screens.length} 생성 중...`
                  : `Generating ${currentGenIndex}/${screens.length}...`}
              </span>
            )}
            <div className="w-32 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${screens.length > 0 ? (completedCount / screens.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Screen tabs */}
        <div className="flex gap-2 flex-wrap">
          {screens.map(screen => {
            const hasDetail = screenDetails.some(d => d.screenId === screen.id)
            const isGenerating = generatingScreenId === screen.id
            const isActive = activeScreenId === screen.id

            return (
              <button
                key={screen.id}
                onClick={() => setActiveScreenId(screen.id)}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                    : hasDetail
                      ? 'bg-secondary/10 text-secondary border border-secondary/20'
                      : isGenerating
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-surface-container-high text-on-surface-variant border border-transparent'
                }`}
              >
                {hasDetail && !isGenerating && (
                  <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                )}
                {isGenerating && (
                  <span className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                )}
                {screen.displayName}
              </button>
            )
          })}
        </div>
      </div>

      {/* Auto-running status */}
      {autoRunning && generatingScreenId && (
        <div className="glass-card rounded-2xl p-6 border border-outline-variant/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative w-12 h-12">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="3" className="text-surface-container-high" />
                <circle
                  cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="3"
                  className="text-purple-400 transition-all duration-500"
                  strokeDasharray={`${2 * Math.PI * 20}`}
                  strokeDashoffset={`${2 * Math.PI * 20 * (1 - completedCount / screens.length)}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-purple-400">
                {completedCount}/{screens.length}
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface">
                {locale === 'ko'
                  ? `"${screens.find(s => s.id === generatingScreenId)?.displayName}" 상세 설계 중...`
                  : `Designing "${screens.find(s => s.id === generatingScreenId)?.displayName}"...`}
              </p>
              <p className="text-xs text-on-surface-variant">
                {locale === 'ko'
                  ? '모든 화면을 순서대로 만들고 있어요. 완료되면 한번에 확인하실 수 있어요.'
                  : 'Generating all screens in order. You can review everything once done.'}
              </p>
            </div>
          </div>

          {/* Completed screens mini-list */}
          <div className="space-y-1.5">
            {screens.map(screen => {
              const done = screenDetails.some(d => d.screenId === screen.id)
              const isCurrent = generatingScreenId === screen.id
              return (
                <div key={screen.id} className="flex items-center gap-2 text-xs">
                  {done ? (
                    <span className="material-symbols-outlined text-secondary text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  ) : isCurrent ? (
                    <span className="w-3.5 h-3.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-on-surface-variant/20" />
                  )}
                  <span className={done ? 'text-on-surface' : isCurrent ? 'text-purple-400 font-medium' : 'text-on-surface-variant/40'}>
                    {screen.displayName}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-error/10 border border-error/20 flex items-center gap-2">
          <span className="material-symbols-outlined text-error text-sm">error</span>
          <p className="text-sm text-error flex-1">{error}</p>
          <button onClick={() => { setError(''); if (!allCompleted && !autoRunning) runAutoGenerate() }} className="text-xs text-purple-400 hover:text-purple-300 font-medium">
            {locale === 'ko' ? '다시 시도' : 'Retry'}
          </button>
          <button onClick={() => setError('')} className="text-on-surface-variant hover:text-on-surface ml-1">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Screen Detail View — 자동 생성 완료 후 또는 탭 클릭 시 */}
      {activeDetail && !autoRunning && (
        <div className="glass-card rounded-2xl p-6 border border-outline-variant/20">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-on-surface">
              {screens.find(s => s.id === activeScreenId)?.displayName}
            </h3>
            {!isApproved && (
              <button
                onClick={() => activeScreenId && generateScreen(activeScreenId)}
                className="text-xs text-on-surface-variant hover:text-purple-400 transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                {locale === 'ko' ? '다시 생성' : 'Regenerate'}
              </button>
            )}
          </div>

          {/* Sections */}
          <div className="space-y-4 mb-5">
            {activeDetail.sections.map((section, i) => (
              <div key={i} className="p-4 rounded-xl bg-surface-container-lowest/50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-purple-400 text-base">web</span>
                  <h4 className="text-sm font-bold text-on-surface">{section.name}</h4>
                  <span className="text-[10px] text-on-surface-variant bg-surface-container-high px-1.5 py-0.5 rounded">{section.layout}</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] text-on-surface-variant mb-1">UI 요소</p>
                    <ul className="space-y-0.5">
                      {toStringArray(section.components).map((comp, j) => (
                        <li key={j} className="text-xs text-on-surface flex items-start gap-1.5">
                          <span className="text-on-surface-variant/40 mt-0.5">·</span>
                          {comp}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[10px] text-on-surface-variant mb-1">{locale === 'ko' ? '동작' : 'Interactions'}</p>
                    <ul className="space-y-0.5">
                      {toStringArray(section.interactions).map((inter, j) => (
                        <li key={j} className="text-xs text-on-surface flex items-start gap-1.5">
                          <span className="text-purple-400/60 mt-0.5">→</span>
                          {inter}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Managed Info */}
          <div className="p-4 rounded-xl bg-surface-container-lowest/50 mb-4">
            <p className="text-xs text-on-surface-variant mb-2">{locale === 'ko' ? '관리되는 정보' : 'Managed Information'}</p>
            <div className="flex flex-wrap gap-2">
              {activeDetail.managedInfo.map((info, i) => (
                <span
                  key={i}
                  className={`text-xs px-2 py-1 rounded-lg ${
                    info.required
                      ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                      : 'bg-surface-container-high text-on-surface-variant'
                  }`}
                  title={info.description}
                >
                  {info.name}{info.required ? ' *' : ''}
                </span>
              ))}
            </div>
          </div>

          {/* Key Features */}
          {toStringArray(activeDetail.keyFeatures).length > 0 && (
            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 mb-4">
              <p className="text-xs text-purple-400 mb-2">{locale === 'ko' ? '특별한 기능' : 'Key Features'}</p>
              <ul className="space-y-1">
                {toStringArray(activeDetail.keyFeatures).map((f, i) => (
                  <li key={i} className="text-sm text-on-surface flex items-center gap-2">
                    <span className="text-purple-400">✦</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Status Colors */}
          {activeDetail.statusColors && Object.keys(activeDetail.statusColors).length > 0 && (
            <div className="flex gap-2 flex-wrap mb-4">
              {Object.entries(activeDetail.statusColors).map(([status, color]) => (
                <span key={status} className="text-xs px-2 py-1 rounded-lg bg-surface-container-high text-on-surface-variant">
                  {status}: {color}
                </span>
              ))}
            </div>
          )}

          {/* Empty State */}
          <div className="p-3 rounded-xl bg-surface-container-lowest/30 text-center">
            <p className="text-xs text-on-surface-variant/60">
              {locale === 'ko' ? '빈 화면 메시지:' : 'Empty state:'} &quot;{activeDetail.emptyState}&quot;
            </p>
          </div>

          {/* 피드백 */}
          {!isApproved && (
            <DesignFeedbackPanel
              locale={locale}
              onSubmit={handleFeedback}
              placeholder={locale === 'ko' ? '"메모 기능도 추가해주세요", "검색은 이름만으로 충분해요" 등' : '"Add a notes feature", "Search by name is enough"'}
            />
          )}
        </div>
      )}

      {/* Phase 3 전체 승인 */}
      {allCompleted && !isApproved && !generatingScreenId && !autoRunning && (
        <div className="flex justify-end">
          <ApproveButton
            locale={locale}
            onApprove={onApprove}
            label={locale === 'ko' ? '모든 화면 확인 완료, 진행해주세요' : 'All screens reviewed, proceed'}
          />
        </div>
      )}

      {isApproved && (
        <div className="p-3 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <span className="text-sm text-secondary font-medium">
            {locale === 'ko' ? '화면별 상세 설계가 확정되었습니다' : 'Screen details have been approved'}
          </span>
        </div>
      )}
    </div>
  )
}
