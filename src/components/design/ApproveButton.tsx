'use client'

import { useState } from 'react'
import type { Locale } from '@/lib/i18n'

interface ApproveButtonProps {
  locale: Locale
  onApprove: () => Promise<void>
  disabled?: boolean
  label?: string
}

export default function ApproveButton({ locale, onApprove, disabled, label }: ApproveButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      await onApprove()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      className="px-6 py-3 text-sm font-bold text-white bg-secondary rounded-xl hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center gap-2"
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <span className="material-symbols-outlined text-sm">check_circle</span>
      )}
      {label || (locale === 'ko' ? '좋아요, 진행해주세요' : 'Looks good, proceed')}
    </button>
  )
}
