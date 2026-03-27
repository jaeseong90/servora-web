'use client'

import { useEffect, useState } from 'react'
import type { Locale } from '@/lib/i18n'

interface DesignGenerationOverlayProps {
  locale: Locale
  phase: number
  visible: boolean
}

const PHASE_STEPS: Record<number, { ko: string[]; en: string[] }> = {
  1: {
    ko: ['기획안 분석 중...', '서비스 성격 파악 중...', '컬러 팔레트 생성 중...', '브랜드 시안 완성 중...'],
    en: ['Analyzing plan...', 'Understanding service...', 'Creating palette...', 'Finalizing brand...'],
  },
  2: {
    ko: ['기획안에서 핵심 기능 추출 중...', '화면 구성 설계 중...', '사용자 흐름 최적화 중...', '서비스 구성 완성 중...'],
    en: ['Extracting features...', 'Designing screens...', 'Optimizing flow...', 'Finalizing structure...'],
  },
  3: {
    ko: ['화면 구조 분석 중...', 'UI 컴포넌트 설계 중...', '인터랙션 시나리오 작성 중...', '상세 설계 완성 중...'],
    en: ['Analyzing structure...', 'Designing components...', 'Writing scenarios...', 'Finalizing details...'],
  },
  4: {
    ko: ['설계 내용 통합 중...', '데이터 구조 추출 중...', '최종 검증 중...', '블루프린트 완성 중...'],
    en: ['Consolidating design...', 'Extracting data model...', 'Final validation...', 'Completing blueprint...'],
  },
}

export default function DesignGenerationOverlay({ locale, phase, visible }: DesignGenerationOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const steps = PHASE_STEPS[phase] || PHASE_STEPS[1]
  const labels = locale === 'ko' ? steps.ko : steps.en

  useEffect(() => {
    if (!visible) { setCurrentStep(0); return }
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev < labels.length - 1 ? prev + 1 : prev))
    }, 3000)
    return () => clearInterval(interval)
  }, [visible, labels.length])

  if (!visible) return null

  const progress = Math.min(((currentStep + 1) / labels.length) * 90, 90) // 최대 90%

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-surface/80 backdrop-blur-sm rounded-2xl">
      <div className="text-center max-w-sm">
        {/* Progress Circle */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="35" fill="none" stroke="currentColor" strokeWidth="4" className="text-surface-container-high" />
            <circle
              cx="40" cy="40" r="35" fill="none" stroke="currentColor" strokeWidth="4"
              className="text-purple-400 transition-all duration-1000"
              strokeDasharray={`${2 * Math.PI * 35}`}
              strokeDashoffset={`${2 * Math.PI * 35 * (1 - progress / 100)}`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-purple-400">
            {Math.round(progress)}%
          </span>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {labels.map((label, i) => (
            <div key={i} className="flex items-center gap-3 justify-center">
              {i < currentStep ? (
                <span className="material-symbols-outlined text-sm text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              ) : i === currentStep ? (
                <span className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="w-4 h-4 rounded-full border border-on-surface-variant/20" />
              )}
              <span className={`text-sm ${
                i <= currentStep ? 'text-on-surface font-medium' : 'text-on-surface-variant/40'
              }`}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
