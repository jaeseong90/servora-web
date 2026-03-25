'use client'

import type { Locale } from '@/lib/i18n'

interface PptStatusButtonProps {
  locale: Locale
  pptStatus: string | null
  pptOutputUrl: string | null
  pptRequesting: boolean
  onRequestPpt: () => void
}

export default function PptStatusButton({
  locale,
  pptStatus,
  pptOutputUrl,
  pptRequesting,
  onRequestPpt,
}: PptStatusButtonProps) {
  if (pptStatus === 'PENDING' || pptStatus === 'BUILDING') {
    return (
      <span className="px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-1">
        <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        {pptStatus === 'PENDING'
          ? (locale === 'ko' ? 'PPT 대기' : 'PPT Queued')
          : (locale === 'ko' ? 'PPT 생성 중' : 'PPT Building')}
      </span>
    )
  }

  if (pptStatus === 'COMPLETED') {
    return pptOutputUrl ? (
      <a
        href={pptOutputUrl}
        download
        className="px-3 py-1.5 text-xs font-medium text-secondary bg-secondary/10 border border-secondary/20 rounded-lg hover:bg-secondary/20 transition-colors flex items-center gap-1"
      >
        <span className="material-symbols-outlined text-sm">download</span>
        {locale === 'ko' ? 'PPT 다운로드' : 'Download PPT'}
      </a>
    ) : (
      <span className="px-3 py-1.5 text-xs font-medium text-secondary bg-secondary/10 border border-secondary/20 rounded-lg flex items-center gap-1">
        <span className="material-symbols-outlined text-sm">check_circle</span>
        {locale === 'ko' ? 'PPT 완료' : 'PPT Ready'}
      </span>
    )
  }

  if (pptStatus === 'FAILED') {
    return (
      <button
        onClick={onRequestPpt}
        disabled={pptRequesting}
        className="px-3 py-1.5 text-xs font-medium text-error bg-error/10 border border-error/20 rounded-lg hover:bg-error/20 transition-colors flex items-center gap-1 disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-sm">refresh</span>
        {pptRequesting
          ? (locale === 'ko' ? '요청 중...' : 'Requesting...')
          : (locale === 'ko' ? 'PPT 재요청' : 'PPT Retry')}
      </button>
    )
  }

  return (
    <button
      onClick={onRequestPpt}
      disabled={pptRequesting}
      className="px-3 py-1.5 text-xs font-medium text-on-surface-variant bg-surface-container-high rounded-lg hover:bg-surface-container-highest transition-colors flex items-center gap-1 disabled:opacity-50"
    >
      <span className="material-symbols-outlined text-sm">slideshow</span>
      {pptRequesting ? (locale === 'ko' ? '요청 중...' : 'Requesting...') : 'PPT'}
    </button>
  )
}
