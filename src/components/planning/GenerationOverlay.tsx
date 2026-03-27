'use client'

import { useEffect, useState, useRef } from 'react'
import { type Locale } from '@/lib/i18n'

interface GenerationOverlayProps {
  locale: Locale
  visible: boolean
  isComplete: boolean
}

const STEPS_KO = [
  '사용자 요구사항 분석 (Analysis)',
  '시장 도메인 데이터 검증 (Validation)',
  '기술 스택 및 프레임워크 매핑',
  '최종 기획 로드맵 생성',
]

const STEPS_EN = [
  'Analyzing User Requirements',
  'Validating Market Domain Data',
  'Mapping Tech Stack & Framework',
  'Generating Final Roadmap',
]

export default function GenerationOverlay({
  locale,
  visible,
  isComplete,
}: GenerationOverlayProps) {
  const [currentStep, setCurrentStep] = useState(-1)
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const steps = locale === 'ko' ? STEPS_KO : STEPS_EN

  // Reset & auto-advance steps when overlay becomes visible
  useEffect(() => {
    if (!visible) {
      setCurrentStep(-1)
      if (intervalRef.current) clearTimeout(intervalRef.current)
      return
    }

    setCurrentStep(0)

    const advance = (step: number) => {
      if (step >= steps.length - 1) return
      intervalRef.current = setTimeout(() => {
        setCurrentStep(step + 1)
        advance(step + 1)
      }, 3000)
    }
    intervalRef.current = setTimeout(() => advance(0), 1000)

    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current)
    }
  }, [visible, steps.length])

  // Jump to final step on complete
  useEffect(() => {
    if (isComplete && visible) {
      setCurrentStep(steps.length)
    }
  }, [isComplete, visible, steps.length])

  if (!visible) return null

  const progress = Math.min(((currentStep + 1) / steps.length) * 100, 100)
  const statusLabel = currentStep >= steps.length
    ? 'Complete'
    : currentStep >= 0
      ? 'Processing'
      : 'Initializing'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-background/80 backdrop-blur-md">
      <div className="max-w-xl w-full glass-card p-10 rounded-2xl shadow-[0_0_100px_rgba(124,58,237,0.2)] border border-outline-variant/20 relative overflow-hidden">
        {/* Glow effects */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary-container/20 rounded-full blur-[80px]" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-secondary/10 rounded-full blur-[80px]" />

        <div className="relative z-10 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-surface-container-highest rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-outline-variant/30">
            <span
              className="material-symbols-outlined text-4xl text-secondary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              rocket_launch
            </span>
          </div>

          <h2 className="text-3xl font-black tracking-tight text-on-surface mb-2">
            {locale === 'ko' ? 'AI 엔진 분석 중' : 'AI Engine Analyzing'}
          </h2>
          <p className="text-on-surface-variant mb-10">
            {locale === 'ko'
              ? '입력된 데이터를 기반으로 최적의 기획 아키텍처를 설계하고 있습니다.'
              : 'Designing the optimal planning architecture based on your input.'}
          </p>

          {/* Steps */}
          <div className="space-y-4 text-left mb-10">
            {steps.map((label, i) => {
              const isDone = i < currentStep
              const isActive = i === currentStep && currentStep < steps.length
              const isPending = i > currentStep

              return (
                <div
                  key={i}
                  className={`flex items-center gap-4 text-on-surface transition-opacity duration-300 ${isPending ? 'opacity-40' : ''}`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isDone
                        ? 'bg-secondary'
                        : isActive
                          ? 'border-2 border-secondary'
                          : 'border-2 border-outline-variant'
                    }`}
                  >
                    {isDone ? (
                      <span
                        className="material-symbols-outlined text-[14px] text-on-secondary"
                        style={{ fontWeight: 900 }}
                      >
                        check
                      </span>
                    ) : isActive ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-transparent" />
                    )}
                  </div>
                  <span className="text-sm font-semibold">{label}</span>
                </div>
              )
            })}
          </div>

          {/* Progress Bar */}
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <span className="text-xs font-bold inline-block py-1 px-2 uppercase rounded-full text-secondary bg-secondary/10">
                {statusLabel}
              </span>
              <span className="text-xs font-bold inline-block text-secondary">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-surface-container-highest">
              <div
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-primary-container to-secondary transition-all duration-500 shadow-[0_0_15px_rgba(95,218,203,0.5)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-on-surface-variant/60 mt-4 italic">
            {locale === 'ko'
              ? '"데이터 처리량이 많아 수 분이 소요될 수 있습니다. 창을 닫지 마세요."'
              : '"Processing may take a few minutes. Please do not close this window."'}
          </p>
        </div>
      </div>
    </div>
  )
}
