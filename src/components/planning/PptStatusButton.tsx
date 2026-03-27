'use client'

import type { Locale } from '@/lib/i18n'

interface PptStatusButtonProps {
  locale: Locale
  pptStatus: string | null
  pptOutputUrl: string | null
  pptRequesting: boolean
  onRequestPpt: () => void
}

const BASE = 'h-10 px-3 text-sm font-bold rounded-lg flex items-center justify-center gap-1 bg-surface-container-high border border-outline-variant/20 text-on-surface'

export default function PptStatusButton({
  locale,
  pptStatus,
  pptOutputUrl,
  pptRequesting,
  onRequestPpt,
}: PptStatusButtonProps) {
  if (pptStatus === 'PENDING' || pptStatus === 'BUILDING') {
    return (
      <span className={`${BASE} opacity-60`}>
        <span className="w-3.5 h-3.5 border-2 border-on-surface-variant border-t-transparent rounded-full animate-spin" />
        PPT
      </span>
    )
  }

  if (pptStatus === 'COMPLETED' && pptOutputUrl) {
    return (
      <a href={pptOutputUrl} download className={`${BASE} hover:bg-surface-container-highest transition-colors active:scale-95`}>
        <span className="material-symbols-outlined text-lg text-primary">slideshow</span>
        PPT
      </a>
    )
  }

  return (
    <button
      onClick={onRequestPpt}
      disabled={pptRequesting}
      className={`${BASE} hover:bg-surface-container-highest transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {pptRequesting ? (
        <span className="w-3.5 h-3.5 border-2 border-on-surface-variant border-t-transparent rounded-full animate-spin" />
      ) : (
        <span className="material-symbols-outlined text-lg text-primary">slideshow</span>
      )}
      PPT
    </button>
  )
}
