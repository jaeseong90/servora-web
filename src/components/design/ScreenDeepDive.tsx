'use client'

import { useState } from 'react'
import type { Locale } from '@/lib/i18n'
import type { ArchitectureScreen, ScreenDetail, PhaseStatus } from '@/types'
import DesignFeedbackPanel from './DesignFeedbackPanel'
import DesignGenerationOverlay from './DesignGenerationOverlay'
import ApproveButton from './ApproveButton'

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
  const [error, setError] = useState('')

  const isApproved = phaseStatus === 'approved'
  const activeDetail = screenDetails.find(d => d.screenId === activeScreenId)
  const completedCount = screens.filter(s => screenDetails.some(d => d.screenId === s.id)).length
  const allCompleted = completedCount === screens.length

  const handleGenerate = async (screenId: string) => {
    setGeneratingScreenId(screenId)
    setError('')
    try {
      const res = await fetch(`/api/projects/${projectId}/design/phase/3/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ screenId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || '생성에 실패했습니다.')
      }
      const data = await res.json()
      if (data.blueprint?.screenDetails) onScreenDetailUpdate(data.blueprint.screenDetails)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setGeneratingScreenId(null)
    }
  }

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
          <div className="w-32 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${screens.length > 0 ? (completedCount / screens.length) * 100 : 0}%` }}
            />
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
                onClick={() => {
                  setActiveScreenId(screen.id)
                  if (!hasDetail && !isGenerating) handleGenerate(screen.id)
                }}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                    : hasDetail
                      ? 'bg-secondary/10 text-secondary border border-secondary/20'
                      : 'bg-surface-container-high text-on-surface-variant border border-transparent hover:border-outline-variant/20'
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

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-error/10 border border-error/20 flex items-center gap-2">
          <span className="material-symbols-outlined text-error text-sm">error</span>
          <p className="text-sm text-error flex-1">{error}</p>
          <button onClick={() => setError('')} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Generation Overlay */}
      {generatingScreenId && (
        <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 relative min-h-[300px]">
          <DesignGenerationOverlay locale={locale} phase={3} visible={true} />
        </div>
      )}

      {/* Screen Detail View */}
      {activeDetail && !generatingScreenId && (
        <div className="glass-card rounded-2xl p-6 border border-outline-variant/20">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-on-surface">
              {screens.find(s => s.id === activeScreenId)?.displayName}
            </h3>
            {!isApproved && (
              <button
                onClick={() => activeScreenId && handleGenerate(activeScreenId)}
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
                      {section.components.map((comp, j) => (
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
                      {section.interactions.map((inter, j) => (
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
          {activeDetail.keyFeatures.length > 0 && (
            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 mb-4">
              <p className="text-xs text-purple-400 mb-2">{locale === 'ko' ? '특별한 기능' : 'Key Features'}</p>
              <ul className="space-y-1">
                {activeDetail.keyFeatures.map((f, i) => (
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
      {allCompleted && !isApproved && !generatingScreenId && (
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
