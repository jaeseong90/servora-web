'use client'

import { useState, useEffect, useRef } from 'react'
import type { Locale } from '@/lib/i18n'
import type { ServiceArchitecture as ServiceArchitectureType, PhaseStatus } from '@/types'
import DesignFeedbackPanel from './DesignFeedbackPanel'
import DesignGenerationOverlay from './DesignGenerationOverlay'
import ApproveButton from './ApproveButton'

interface ServiceArchitectureProps {
  locale: Locale
  projectId: string
  architecture: ServiceArchitectureType | null
  phaseStatus: PhaseStatus
  onArchitectureUpdate: (arch: ServiceArchitectureType) => void
  onApprove: () => Promise<void>
}

export default function ServiceArchitecture({
  locale,
  projectId,
  architecture,
  phaseStatus,
  onArchitectureUpdate,
  onApprove,
}: ServiceArchitectureProps) {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const isApproved = phaseStatus === 'approved'

  const handleGenerate = async () => {
    setGenerating(true)
    setError('')
    try {
      const res = await fetch(`/api/projects/${projectId}/design/phase/2/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || '생성에 실패했습니다.')
      }
      const data = await res.json()
      if (data.blueprint?.architecture) onArchitectureUpdate(data.blueprint.architecture)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setGenerating(false)
    }
  }

  const handleFeedback = async (feedback: string) => {
    setError('')
    try {
      const res = await fetch(`/api/projects/${projectId}/design/phase/2/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || '피드백 반영에 실패했습니다.')
      }
      const data = await res.json()
      if (data.blueprint?.architecture) onArchitectureUpdate(data.blueprint.architecture)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    }
  }

  // 자동 생성 트리거
  const autoTriggered = useRef(false)
  useEffect(() => {
    if (!architecture && !generating && phaseStatus !== 'pending' && !autoTriggered.current) {
      autoTriggered.current = true
      handleGenerate()
    }
  }, [architecture, generating, phaseStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      {/* 생성 중 */}
      {generating && (
        <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 relative min-h-[300px]">
          <DesignGenerationOverlay locale={locale} phase={2} visible={generating} />
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div className="p-3 rounded-lg bg-error/10 border border-error/20 flex items-center gap-2">
          <span className="material-symbols-outlined text-error text-sm">error</span>
          <p className="text-sm text-error flex-1">{error}</p>
          <button onClick={() => setError('')} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* 결과 */}
      {architecture && !generating && (
        <div className="glass-card rounded-2xl p-6 border border-outline-variant/20">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-on-surface">
              {locale === 'ko' ? '서비스 구성이 준비되었어요' : 'Service structure is ready'}
            </h3>
            {!isApproved && (
              <button
                onClick={handleGenerate}
                className="text-xs text-on-surface-variant hover:text-purple-400 transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                {locale === 'ko' ? '다시 생성' : 'Regenerate'}
              </button>
            )}
          </div>

          {/* Core Value */}
          <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 mb-5">
            <p className="text-xs text-purple-400 mb-1">{locale === 'ko' ? '핵심 가치' : 'Core Value'}</p>
            <p className="text-base font-bold text-on-surface">{architecture.coreValue}</p>
          </div>

          {/* Screens */}
          <div className="mb-5">
            <p className="text-sm font-bold text-on-surface mb-3">
              {locale === 'ko' ? `만들어질 페이지 (${architecture.screens.length}개)` : `Pages (${architecture.screens.length})`}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {architecture.screens.map(screen => (
                <div
                  key={screen.id}
                  className="p-4 rounded-xl bg-surface-container-lowest/50 border border-outline-variant/10"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      screen.audience === 'admin'
                        ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                        : 'bg-green-500/15 text-green-400 border border-green-500/30'
                    }`}>
                      {screen.audience === 'admin'
                        ? (locale === 'ko' ? '운영자' : 'Admin')
                        : (locale === 'ko' ? '고객' : 'Customer')}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-on-surface mb-1">{screen.displayName}</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{screen.description}</p>
                  {screen.keyFeatures.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {screen.keyFeatures.map((f, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Excluded */}
          {architecture.excludedFeatures.length > 0 && (
            <div className="p-4 rounded-xl bg-surface-container-lowest/30">
              <p className="text-xs text-on-surface-variant mb-2">
                {locale === 'ko' ? '나중에 추가할 기능' : 'Features for later'}
              </p>
              <div className="flex flex-wrap gap-2">
                {architecture.excludedFeatures.map((f, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded-lg bg-surface-container-high text-on-surface-variant/60">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 피드백 & 승인 */}
          {!isApproved && (
            <>
              <DesignFeedbackPanel
                locale={locale}
                onSubmit={handleFeedback}
                placeholder={locale === 'ko' ? '"매출 리포트 페이지도 추가해주세요", "예약 관리는 필요없어요" 등' : '"Add a sales report page", "Remove booking management"'}
              />
              <div className="flex justify-end mt-4">
                <ApproveButton locale={locale} onApprove={onApprove} />
              </div>
            </>
          )}

          {isApproved && (
            <div className="mt-4 p-3 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <span className="text-sm text-secondary font-medium">
                {locale === 'ko' ? '서비스 구성이 확정되었습니다' : 'Service structure has been approved'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
