'use client'

import { useState } from 'react'
import type { Locale } from '@/lib/i18n'
import type { BrandIdentity, PhaseStatus } from '@/types'
import StylePresetCard from './StylePresetCard'
import DesignFeedbackPanel from './DesignFeedbackPanel'
import DesignGenerationOverlay from './DesignGenerationOverlay'
import ApproveButton from './ApproveButton'

interface BrandConsultationProps {
  locale: Locale
  projectId: string
  brand: BrandIdentity | null
  phaseStatus: PhaseStatus
  onBrandUpdate: (brand: BrandIdentity) => void
  onApprove: () => Promise<void>
}

const STYLE_PRESETS = [
  {
    id: 'clean-professional',
    name: { ko: '깔끔하고 전문적인', en: 'Clean & Professional' },
    desc: { ko: '비즈니스 도구, 관리 시스템에 어울리는 신뢰감 있는 스타일', en: 'Trustworthy style for business tools and management systems' },
    icon: '🏢',
    colors: ['#2563eb', '#8b5cf6', '#64748b'] as [string, string, string],
    keyword: '깔끔하고 전문적인 비즈니스 스타일. 신뢰감, 효율성, 정돈된 느낌.',
  },
  {
    id: 'warm-friendly',
    name: { ko: '따뜻하고 친근한', en: 'Warm & Friendly' },
    desc: { ko: '커뮤니티, 교육, 돌봄 서비스에 어울리는 편안한 스타일', en: 'Comfortable style for community, education, care services' },
    icon: '☕',
    colors: ['#f97316', '#eab308', '#84cc16'] as [string, string, string],
    keyword: '따뜻하고 친근한 스타일. 부드러운 톤, 라운드 모서리, 편안한 느낌.',
  },
  {
    id: 'bold-energetic',
    name: { ko: '강렬하고 활기찬', en: 'Bold & Energetic' },
    desc: { ko: '스타트업, 이커머스, 엔터테인먼트에 어울리는 역동적 스타일', en: 'Dynamic style for startups, e-commerce, entertainment' },
    icon: '⚡',
    colors: ['#ef4444', '#ec4899', '#8b5cf6'] as [string, string, string],
    keyword: '강렬하고 활기찬 스타일. 대비 강한 색상, 임팩트, 에너지.',
  },
  {
    id: 'minimal-calm',
    name: { ko: '미니멀하고 차분한', en: 'Minimal & Calm' },
    desc: { ko: '갤러리, 포트폴리오, 프리미엄 서비스에 어울리는 세련된 스타일', en: 'Refined style for galleries, portfolios, premium services' },
    icon: '🎨',
    colors: ['#0d9488', '#6366f1', '#9ca3af'] as [string, string, string],
    keyword: '미니멀하고 차분한 스타일. 여백, 절제, 세련된 느낌.',
  },
]

export default function BrandConsultation({
  locale,
  projectId,
  brand,
  phaseStatus,
  onBrandUpdate,
  onApprove,
}: BrandConsultationProps) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const isApproved = phaseStatus === 'approved'

  const handleGenerate = async (presetKeyword?: string) => {
    setGenerating(true)
    setError('')
    try {
      const res = await fetch(`/api/projects/${projectId}/design/phase/1/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stylePreset: presetKeyword }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || '생성에 실패했습니다.')
      }
      const data = await res.json()
      if (data.blueprint?.brand) onBrandUpdate(data.blueprint.brand)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setGenerating(false)
    }
  }

  const handleFeedback = async (feedback: string) => {
    setError('')
    try {
      const res = await fetch(`/api/projects/${projectId}/design/phase/1/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || '피드백 반영에 실패했습니다.')
      }
      const data = await res.json()
      if (data.blueprint?.brand) onBrandUpdate(data.blueprint.brand)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    }
  }

  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId)
    const preset = STYLE_PRESETS.find(p => p.id === presetId)
    if (preset) handleGenerate(preset.keyword)
  }

  return (
    <div className="space-y-6">
      {/* 프리셋 선택 */}
      {!brand && !generating && (
        <div className="glass-card rounded-2xl p-6 border border-outline-variant/20">
          <h3 className="text-lg font-bold text-on-surface mb-2">
            {locale === 'ko' ? '어떤 분위기의 서비스를 원하세요?' : 'What style do you want?'}
          </h3>
          <p className="text-sm text-on-surface-variant mb-6">
            {locale === 'ko'
              ? '분위기를 선택하면 서비스에 맞는 브랜드 시안을 만들어드릴게요.'
              : 'Select a mood and we\'ll create a brand proposal for your service.'}
          </p>
          <div className="grid grid-cols-2 gap-4">
            {STYLE_PRESETS.map(preset => (
              <StylePresetCard
                key={preset.id}
                name={locale === 'ko' ? preset.name.ko : preset.name.en}
                description={locale === 'ko' ? preset.desc.ko : preset.desc.en}
                icon={preset.icon}
                colors={preset.colors}
                selected={selectedPreset === preset.id}
                onClick={() => handlePresetSelect(preset.id)}
                disabled={isApproved}
              />
            ))}
          </div>
        </div>
      )}

      {/* 생성 중 오버레이 */}
      {generating && (
        <div className="glass-card rounded-2xl p-6 border border-outline-variant/20 relative min-h-[300px]">
          <DesignGenerationOverlay locale={locale} phase={1} visible={generating} />
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

      {/* 브랜드 시안 결과 */}
      {brand && !generating && (
        <div className="glass-card rounded-2xl p-6 border border-outline-variant/20">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-on-surface">
              {locale === 'ko' ? '브랜드 시안이 준비되었어요' : 'Brand proposal is ready'}
            </h3>
            {!isApproved && (
              <button
                onClick={() => handleGenerate(selectedPreset ? STYLE_PRESETS.find(p => p.id === selectedPreset)?.keyword : undefined)}
                className="text-xs text-on-surface-variant hover:text-purple-400 transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                {locale === 'ko' ? '다시 생성' : 'Regenerate'}
              </button>
            )}
          </div>

          {/* Brand Display */}
          <div className="space-y-4">
            {/* Tone & Personality */}
            <div className="p-4 rounded-xl bg-surface-container-lowest/50">
              <p className="text-xs text-on-surface-variant mb-1">{locale === 'ko' ? '서비스 분위기' : 'Mood'}</p>
              <p className="text-base font-bold text-on-surface">{brand.tone}</p>
              <p className="text-sm text-on-surface-variant mt-1">{brand.personality}</p>
            </div>

            {/* Colors */}
            <div className="p-4 rounded-xl bg-surface-container-lowest/50">
              <p className="text-xs text-on-surface-variant mb-3">{locale === 'ko' ? '컬러 시스템' : 'Colors'}</p>
              <div className="flex gap-3 flex-wrap">
                {Object.entries(brand.colors).map(([key, color]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg border border-white/10" style={{ backgroundColor: color }} />
                    <div>
                      <p className="text-[10px] text-on-surface-variant">{key}</p>
                      <p className="text-xs font-mono text-on-surface">{color}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Layout & Style */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-surface-container-lowest/50 text-center">
                <p className="text-[10px] text-on-surface-variant mb-1">{locale === 'ko' ? '레이아웃' : 'Layout'}</p>
                <p className="text-sm font-bold text-on-surface">{brand.layoutStyle}</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-lowest/50 text-center">
                <p className="text-[10px] text-on-surface-variant mb-1">{locale === 'ko' ? '폰트' : 'Font'}</p>
                <p className="text-sm font-bold text-on-surface">{brand.typography}</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-lowest/50 text-center">
                <p className="text-[10px] text-on-surface-variant mb-1">{locale === 'ko' ? '모서리' : 'Corners'}</p>
                <p className="text-sm font-bold text-on-surface">{brand.cornerStyle}</p>
              </div>
            </div>
          </div>

          {/* 피드백 & 승인 */}
          {!isApproved && (
            <>
              <DesignFeedbackPanel
                locale={locale}
                onSubmit={handleFeedback}
                placeholder={locale === 'ko' ? '"더 밝은 느낌으로 해주세요", "파란색 대신 초록색으로" 등' : '"Make it brighter", "Use green instead of blue"'}
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
                {locale === 'ko' ? '브랜드 시안이 확정되었습니다' : 'Brand has been approved'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
