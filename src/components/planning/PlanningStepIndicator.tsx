'use client'

import { type Locale } from '@/lib/i18n'

type StepStatus = 'completed' | 'in-progress' | 'waiting'

interface PlanningStepIndicatorProps {
  locale: Locale
  activeStep: 0 | 1
  hasDocument: boolean
  hasFinalized: boolean
  onStepClick: (step: 0 | 1) => void
}

const STEPS_KO = ['설문 입력', '기획안 생성']
const STEPS_EN = ['Questionnaire', 'Plan Generation']

export default function PlanningStepIndicator({
  locale,
  activeStep,
  hasDocument,
  hasFinalized,
  onStepClick,
}: PlanningStepIndicatorProps) {
  const labels = locale === 'ko' ? STEPS_KO : STEPS_EN

  const getStatus = (index: number): StepStatus => {
    if (index === 0) {
      // 설문: 문서가 생성되었으면 완료
      return hasDocument ? 'completed' : 'in-progress'
    }
    // 기획안: 확정되면 완료, 문서 있으면 진행 중, 없으면 대기
    if (hasFinalized) return 'completed'
    if (hasDocument) return 'in-progress'
    return 'waiting'
  }

  const statusLabel = (status: StepStatus) => {
    if (status === 'completed') return locale === 'ko' ? '완료' : 'Done'
    if (status === 'in-progress') return locale === 'ko' ? '진행 중' : 'In Progress'
    return locale === 'ko' ? '대기' : 'Waiting'
  }

  const completedCount = [0, 1].filter(i => getStatus(i) === 'completed').length

  return (
    <header className="mb-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-on-surface">
          {locale === 'ko' ? '기획 단계' : 'Planning Phase'}
        </h1>
        <span className="text-on-surface-variant font-medium">
          {hasFinalized
            ? (locale === 'ko' ? '모든 단계 완료' : 'All steps completed')
            : (locale === 'ko'
              ? `진행률: ${completedCount}/2 단계`
              : `Progress: ${completedCount}/2 steps`)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {labels.map((label, i) => {
          const status = getStatus(i)
          const isSelected = i === activeStep
          const isClickable = status !== 'waiting'

          return (
            <div
              key={i}
              onClick={() => isClickable && onStepClick(i as 0 | 1)}
              className={`relative rounded-xl p-4 transition-all duration-300 ${
                isSelected
                  ? 'bg-surface-container border border-outline-variant/30 shadow-lg'
                  : 'border border-transparent'
              } ${
                isClickable ? 'cursor-pointer' : 'pointer-events-none opacity-50'
              }`}
            >
              {/* Status Badge */}
              <div className="mb-2 h-5 flex items-end">
                {status === 'completed' ? (
                  <div className="flex items-center gap-1 text-secondary">
                    <span className="material-symbols-outlined text-[12px] font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span className="text-[9px] font-black">{statusLabel(status)}</span>
                  </div>
                ) : status === 'in-progress' ? (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">
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
                  status === 'completed'
                    ? 'bg-secondary'
                    : status === 'in-progress'
                      ? 'bg-gradient-to-r from-purple-500 to-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                      : 'bg-surface-container-high'
                }`}
              />

              {/* Step Label */}
              <div
                className={`mt-2 text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${
                  status === 'completed'
                    ? 'text-secondary/70'
                    : status === 'in-progress'
                      ? 'text-purple-400'
                      : 'text-on-surface-variant/20'
                }`}
              >
                {label}
              </div>
            </div>
          )
        })}
      </div>
    </header>
  )
}
