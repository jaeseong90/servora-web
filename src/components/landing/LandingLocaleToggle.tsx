'use client'

import { useState } from 'react'
import { getLocale, setLocale, type Locale } from '@/lib/i18n'

export default function LandingLocaleToggle() {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== 'undefined') return getLocale()
    return 'ko'
  })

  const switchLocale = (l: Locale) => {
    setLocale(l)
    setLocaleState(l)
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => switchLocale('ko')}
        className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
          locale === 'ko' ? 'bg-white/20 text-white font-bold' : 'text-white/60 hover:text-white'
        }`}
      >
        한국어
      </button>
      <button
        onClick={() => switchLocale('en')}
        className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
          locale === 'en' ? 'bg-white/20 text-white font-bold' : 'text-white/60 hover:text-white'
        }`}
      >
        EN
      </button>
    </div>
  )
}
