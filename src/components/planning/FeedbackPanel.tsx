'use client'

import { t, type Locale } from '@/lib/i18n'

interface FeedbackPanelProps {
  locale: Locale
  feedback: string
  onFeedbackChange: (value: string) => void
  onSubmit: () => void
}

export default function FeedbackPanel({
  locale,
  feedback,
  onFeedbackChange,
  onSubmit,
}: FeedbackPanelProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-outline uppercase tracking-wider ml-1">
          {t('plan.feedbackTitle', locale)}
        </label>
        <textarea
          value={feedback}
          onChange={(e) => onFeedbackChange(e.target.value)}
          rows={4}
          maxLength={10000}
          className="w-full min-h-[120px] bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-sm text-on-surface focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all py-3 px-4 outline-none resize-none placeholder:text-outline/40"
          placeholder={t('plan.feedbackPlaceholder', locale)}
        />
      </div>
      <button
        onClick={onSubmit}
        disabled={!feedback.trim()}
        className="w-full py-3.5 bg-primary-container hover:bg-primary-container/90 text-white text-sm font-extrabold rounded-lg shadow-lg shadow-primary-container/10 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {t('plan.feedbackSubmit', locale)}
      </button>
    </div>
  )
}
