'use client'

import type { Locale } from '@/lib/i18n'
import type { PhaseStatus } from '@/types'

interface DesignStepIndicatorProps {
  locale: Locale
  currentPhase: number
  phaseStatus: Record<string, PhaseStatus>
  onStepClick: (phase: number) => void
}

const STEPS_KO = ['분위기 선택', '서비스 구성', '화면별 상세', '최종 확인']
const STEPS_EN = ['Style', 'Structure', 'Screen Details', 'Final Review']
const STEP_ICONS = ['palette', 'dashboard_customize', 'screen_search_desktop', 'verified']

export default function DesignStepIndicator({
  locale,
  currentPhase,
  phaseStatus,
  onStepClick,
}: DesignStepIndicatorProps) {
  const labels = locale === 'ko' ? STEPS_KO : STEPS_EN

  const getStatus = (phase: number): PhaseStatus => {
    return phaseStatus[String(phase)] || 'pending'
  }

  const isClickable = (phase: number) => {
    if (phase === 1) return true
    // 이전 Phase가 approved여야 클릭 가능
    return getStatus(phase - 1) === 'approved'
  }

  const statusLabel = (status: PhaseStatus) => {
    if (status === 'approved') return locale === 'ko' ? '완료' : 'Done'
    if (status === 'review') return locale === 'ko' ? '검토 중' : 'Reviewing'
    if (status === 'generating') return locale === 'ko' ? '생성 중' : 'Generating'
    return locale === 'ko' ? '대기' : 'Waiting'
  }

  const approvedCount = [1, 2, 3, 4].filter(i => getStatus(i) === 'approved').length

  return (
    <header className="mb-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-on-surface">
          {locale === 'ko' ? '디자인 단계' : 'Design Phase'}
        </h1>
        <span className="text-on-surface-variant font-medium">
          {approvedCount === 4
            ? (locale === 'ko' ? '모든 단계 완료' : 'All steps completed')
            : (locale === 'ko'
              ? `진행률: ${approvedCount}/4 단계`
              : `Progress: ${approvedCount}/4 steps`)}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {labels.map((label, i) => {
          const phase = i + 1
          const status = getStatus(phase)
          const isSelected = phase === currentPhase
          const clickable = isClickable(phase)

          return (
            <div
              key={phase}
              onClick={() => clickable && onStepClick(phase)}
              className={`relative rounded-xl p-4 transition-all duration-300 ${
                isSelected
                  ? 'bg-surface-container border border-outline-variant/30 shadow-lg'
                  : 'border border-transparent'
              } ${
                clickable ? 'cursor-pointer hover:bg-surface-container/50' : 'pointer-events-none opacity-40'
              }`}
            >
              {/* Status Badge */}
              <div className="mb-2 h-5 flex items-end">
                {status === 'approved' ? (
                  <div className="flex items-center gap-1 text-secondary">
                    <span className="material-symbols-outlined text-[12px] font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span className="text-[9px] font-black">{statusLabel(status)}</span>
                  </div>
                ) : status === 'review' ? (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">
                    {statusLabel(status)}
                  </span>
                ) : status === 'generating' ? (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                    <span className="w-2 h-2 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                    {statusLabel(status)}
                  </span>
                ) : (
                  <span className="text-[9px] font-black text-on-surface-variant/30">
                    {statusLabel(status)}
                  </span>
                )}
              </div>

              {/* Step Bar */}
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  status === 'approved'
                    ? 'bg-secondary'
                    : status === 'review' || status === 'generating'
                      ? 'bg-gradient-to-r from-purple-500 to-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                      : 'bg-surface-container-high'
                }`}
              />

              {/* Icon + Label */}
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`material-symbols-outlined text-base transition-colors duration-300 ${
                    status === 'approved'
                      ? 'text-secondary/70'
                      : status === 'review' || status === 'generating'
                        ? 'text-purple-400'
                        : 'text-on-surface-variant/20'
                  }`}
                >
                  {STEP_ICONS[i]}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${
                    status === 'approved'
                      ? 'text-secondary/70'
                      : status === 'review' || status === 'generating'
                        ? 'text-purple-400'
                        : 'text-on-surface-variant/20'
                  }`}
                >
                  {label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </header>
  )
}
