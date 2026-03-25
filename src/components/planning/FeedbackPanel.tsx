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
    <div className="glass-card rounded-2xl p-6 border border-outline-variant/20">
      <h3 className="text-sm font-bold text-on-surface mb-3">{t('plan.feedbackTitle', locale)}</h3>
      <textarea
        value={feedback}
        onChange={(e) => onFeedbackChange(e.target.value)}
        rows={4}
        className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/20 rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-transparent outline-none resize-y text-sm text-on-surface placeholder:text-on-surface-variant/40"
        placeholder={t('plan.feedbackPlaceholder', locale)}
      />
      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={onSubmit}
          disabled={!feedback.trim()}
          className="px-5 py-2.5 text-sm font-bold text-white bg-primary-container rounded-xl hover:bg-primary-container/80 disabled:opacity-50 transition-colors"
        >
          {t('plan.feedbackSubmit', locale)}
        </button>
      </div>
    </div>
  )
}
