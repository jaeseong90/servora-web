'use client'

import { t, type Locale } from '@/lib/i18n'

const questionKeys = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10']
const MAX_ANSWER_LENGTH = 5000

interface QuestionnaireFormProps {
  locale: Locale
  questionnaire: Record<string, string>
  isGenerating: boolean
  onQuestionnaireChange: (q: Record<string, string>) => void
  onGenerate: () => void
}

export default function QuestionnaireForm({
  locale,
  questionnaire,
  isGenerating,
  onQuestionnaireChange,
  onGenerate,
}: QuestionnaireFormProps) {
  const questions = questionKeys.map((key, i) => ({
    key,
    label: t(`plan.${key}`, locale),
    hint: t(`plan.${key}h`, locale),
    example: t(`plan.${key}e`, locale),
    placeholder: t(`plan.${key}p`, locale),
    required: i < 3,
  }))

  return (
    <div className="glass-card rounded-2xl p-8 border border-outline-variant/20 mb-6">
      <h2 className="text-xl font-bold text-on-surface mb-2">{t('plan.questionTitle', locale)}</h2>
      <p className="text-sm text-on-surface-variant mb-8">{t('plan.questionDesc', locale)}</p>

      <div className="space-y-6">
        {questions.map((q, i) => (
          <div key={q.key} className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface">
              {i + 1}. {q.label} {q.required && <span className="text-secondary">*</span>}
            </label>
            <p className="text-xs text-on-surface-variant">{q.hint}</p>
            <div className="text-[11px] text-on-surface-variant/60 bg-surface-container-lowest/50 rounded-lg px-3 py-2 border border-outline-variant/10">
              {q.example}
            </div>
            <textarea
              value={questionnaire[q.key] || ''}
              onChange={(e) => onQuestionnaireChange({ ...questionnaire, [q.key]: e.target.value })}
              rows={3}
              maxLength={MAX_ANSWER_LENGTH}
              disabled={isGenerating}
              className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/20 rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-transparent outline-none resize-none text-sm text-on-surface placeholder:text-on-surface-variant/40 disabled:opacity-60 disabled:cursor-not-allowed"
              placeholder={q.placeholder}
            />
          </div>
        ))}
      </div>

      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className="mt-8 w-full py-3.5 text-white bg-gradient-to-r from-primary-container to-secondary rounded-xl font-bold shadow-lg shadow-primary-container/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {t('plan.generating', locale)}
          </>
        ) : (
          t('plan.generate', locale)
        )}
      </button>
      <p className="mt-3 text-xs text-on-surface-variant/60 text-center">
        {t('plan.generateNote', locale)}
      </p>
    </div>
  )
}
