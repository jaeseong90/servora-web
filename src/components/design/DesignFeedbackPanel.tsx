'use client'

import { useState } from 'react'
import type { Locale } from '@/lib/i18n'

interface DesignFeedbackPanelProps {
  locale: Locale
  onSubmit: (feedback: string) => Promise<void>
  disabled?: boolean
  placeholder?: string
}

export default function DesignFeedbackPanel({
  locale,
  onSubmit,
  disabled,
  placeholder,
}: DesignFeedbackPanelProps) {
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!feedback.trim() || submitting) return
    setSubmitting(true)
    try {
      await onSubmit(feedback.trim())
      setFeedback('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-4 border-t border-outline-variant/10 pt-4">
      <div className="flex gap-3">
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }
          }}
          rows={2}
          maxLength={2000}
          disabled={disabled || submitting}
          placeholder={placeholder || (locale === 'ko' ? '수정하고 싶은 내용을 입력하세요...' : 'Tell us what to change...')}
          className="flex-1 px-4 py-3 bg-surface-container-lowest border border-outline-variant/20 rounded-xl focus:ring-2 focus:ring-purple-500/40 focus:border-transparent outline-none resize-none text-sm text-on-surface placeholder:text-on-surface-variant/40 disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={!feedback.trim() || disabled || submitting}
          className="self-end px-5 py-3 text-sm font-bold text-white bg-purple-600 rounded-xl hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shrink-0"
        >
          {submitting ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="material-symbols-outlined text-sm">send</span>
          )}
          {locale === 'ko' ? '수정 요청' : 'Request Change'}
        </button>
      </div>
    </div>
  )
}
