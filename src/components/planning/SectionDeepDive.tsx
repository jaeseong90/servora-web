'use client'

import { useState, useMemo } from 'react'
import type { Locale } from '@/lib/i18n'

interface SectionDeepDiveProps {
  locale: Locale
  documentContent: string
  onSubmit: (sectionTitle: string, detail: string) => void
  disabled?: boolean
}

/** 마크다운 H2 헤더에서 섹션 목록을 추출 */
function extractSections(content: string): string[] {
  const matches = content.match(/^##\s+.+$/gm)
  if (!matches) return []
  return matches.map(m => m.replace(/^##\s+/, '').trim())
}

export default function SectionDeepDive({
  locale,
  documentContent,
  onSubmit,
  disabled = false,
}: SectionDeepDiveProps) {
  const sections = useMemo(() => extractSections(documentContent), [documentContent])
  const [selectedSection, setSelectedSection] = useState('')
  const [detail, setDetail] = useState('')

  const handleSubmit = () => {
    if (!selectedSection || !detail.trim()) return
    onSubmit(selectedSection, detail)
    setDetail('')
  }

  return (
    <div className="p-6 pt-2 space-y-5">
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-outline uppercase tracking-wider ml-1">
          {locale === 'ko' ? '대상 섹션 선택' : 'Select Section'}
        </label>
        <select
          value={selectedSection}
          onChange={(e) => setSelectedSection(e.target.value)}
          disabled={disabled}
          className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-sm text-on-surface focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all py-3 px-4 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">
            {locale === 'ko' ? '섹션을 선택하세요...' : 'Choose a section...'}
          </option>
          {sections.map((section, i) => (
            <option key={i} value={section}>{section}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-bold text-outline uppercase tracking-wider ml-1">
          {locale === 'ko' ? '강화 요청 상세 내역' : 'Enhancement Details'}
        </label>
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          disabled={disabled}
          maxLength={10000}
          className="w-full min-h-[120px] bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-sm text-on-surface focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all py-3 px-4 outline-none resize-none placeholder:text-outline/40 disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder={locale === 'ko'
            ? '구체적인 데이터 사례나 레퍼런스 등을 입력해 주세요...'
            : 'Enter specific data, examples, or references...'}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={disabled || !selectedSection || !detail.trim()}
        className="w-full py-3.5 bg-primary-container hover:bg-primary-container/90 text-white text-sm font-extrabold rounded-lg shadow-lg shadow-primary-container/10 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {locale === 'ko' ? '분석 및 강화 실행' : 'Analyze & Enhance'}
      </button>
    </div>
  )
}
