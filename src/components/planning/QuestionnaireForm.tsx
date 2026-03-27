'use client'

import { useState } from 'react'
import { t, type Locale } from '@/lib/i18n'

const questionKeys = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10']
const MAX_ANSWER_LENGTH = 5000

const CATEGORY_LABELS = [
  'IDEA', 'WHY', 'PAIN POINTS', 'USER', 'CONTEXT',
  'BENEFIT', 'GOAL', 'FEATURES', 'SUCCESS', 'REFERENCE',
]

interface QuestionnaireFormProps {
  locale: Locale
  questionnaire: Record<string, string>
  isGenerating: boolean
  draftSavedAt: string | null
  readOnly?: boolean
  isSuggesting?: boolean
  suggestingKeys?: Set<string>
  onQuestionnaireChange: (q: Record<string, string>) => void
  onGenerate: () => void
  onSaveDraft: () => void
  onSuggestAll?: () => void
  onSuggestSingle?: (key: string) => void
}

export default function QuestionnaireForm({
  locale,
  questionnaire,
  isGenerating,
  draftSavedAt,
  readOnly = false,
  isSuggesting = false,
  suggestingKeys = new Set(),
  onQuestionnaireChange,
  onGenerate,
  onSaveDraft,
  onSuggestAll,
  onSuggestSingle,
}: QuestionnaireFormProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  const questions = questionKeys.map((key, i) => ({
    key,
    category: CATEGORY_LABELS[i],
    label: t(`plan.${key}`, locale),
    hint: t(`plan.${key}e`, locale),
    placeholder: t(`plan.${key}p`, locale),
    required: i < 3,
  }))

  const hasQ1 = !!questionnaire.q1?.trim()
  const busy = isGenerating || isSuggesting

  return (
    <div className="mb-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-12 gap-6">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface mb-4">
            {t('plan.questionTitle', locale)}
          </h1>
          <p className="text-on-surface-variant text-lg leading-relaxed">
            {t('plan.questionDesc', locale)}
          </p>
        </div>
      </div>

      {/* Top Action Buttons — 읽기 전용 모드에서는 숨김 */}
      {!readOnly && (
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <button
            type="button"
            disabled={busy || !hasQ1}
            onClick={onSuggestAll}
            className="px-6 py-3 rounded-lg bg-secondary/10 border border-secondary/30 text-secondary font-bold hover:bg-secondary/20 transition-all flex items-center gap-2 pulse-ai disabled:opacity-50 disabled:cursor-not-allowed disabled:animate-none"
          >
            {isSuggesting && suggestingKeys.size === 0 ? (
              <>
                <span className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                {locale === 'ko' ? 'AI 생성 중...' : 'AI Generating...'}
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                AI Suggest All
              </>
            )}
          </button>
          <div className="flex items-center gap-4">
            {draftSavedAt && (
              <span className="text-xs text-on-surface-variant/60 hidden sm:inline">
                {locale === 'ko' ? `마지막 저장: ${draftSavedAt}` : `Last saved: ${draftSavedAt}`}
              </span>
            )}
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={busy}
              className="px-6 py-3 rounded-lg bg-surface-container-high border border-outline-variant/20 text-on-surface font-semibold hover:bg-surface-container-highest transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              {locale === 'ko' ? '임시 저장' : 'Save Draft'}
            </button>
            <button
              type="button"
              onClick={onGenerate}
              disabled={busy}
              className="px-8 py-3 rounded-lg bg-gradient-to-r from-primary-container to-secondary font-extrabold shadow-xl shadow-primary-container/30 hover:scale-105 transition-all text-white disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('plan.generating', locale)}
                </span>
              ) : (
                locale === 'ko' ? '기획안 생성 시작' : 'Start Generation'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Question Cards */}
      <form className="flex flex-col gap-8" onSubmit={(e) => e.preventDefault()}>
        {questions.map((q, i) => {
          const isSuggestingThis = suggestingKeys.has(q.key)
          return (
            <div
              key={q.key}
              onClick={() => setActiveIndex(i)}
              className={`question-card w-full bg-surface-container p-8 rounded-xl relative group ${activeIndex === i ? 'card-active' : ''}`}
            >
              {/* AI Suggest button (Q2~Q10) — 읽기 전용 모드에서는 숨김 */}
              {i > 0 && !readOnly && (
                <button
                  type="button"
                  disabled={busy || !hasQ1}
                  className="absolute top-6 right-8 flex items-center gap-2 text-xs font-bold text-secondary bg-secondary/10 px-3 py-1.5 rounded-full hover:bg-secondary/20 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSuggestSingle?.(q.key)
                  }}
                >
                  {isSuggestingThis ? (
                    <>
                      <span className="w-3 h-3 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                      {locale === 'ko' ? '생성 중...' : 'Generating...'}
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">auto_awesome</span>
                      AI Suggest
                    </>
                  )}
                </button>
              )}

              <label className="block mb-4">
                <span className="text-xs font-bold text-primary tracking-widest uppercase block mb-2">
                  {String(i + 1).padStart(2, '0')}. {q.category}
                  {q.required && <span className="text-secondary ml-2">*</span>}
                </span>
                <span className="text-xl font-bold text-on-surface">{q.label}</span>
                <span className="text-xs text-on-surface-variant/60 block mt-1">{q.hint}</span>
              </label>

              <textarea
                value={questionnaire[q.key] || ''}
                onChange={(e) => onQuestionnaireChange({ ...questionnaire, [q.key]: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                maxLength={MAX_ANSWER_LENGTH}
                disabled={busy || readOnly}
                readOnly={readOnly}
                className={`w-full bg-surface-container-lowest border-none rounded-lg p-4 text-on-surface focus:ring-0 h-32 resize-none placeholder:text-on-surface-variant/30 disabled:opacity-60 disabled:cursor-not-allowed ${readOnly ? 'opacity-70' : ''} ${isSuggestingThis ? 'animate-pulse' : ''}`}
                placeholder={q.placeholder}
              />
            </div>
          )
        })}

        {/* Bottom Action Buttons — 읽기 전용 모드에서는 숨김 */}
        {!readOnly && (
          <div className="flex items-center gap-4 mb-20">
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={busy}
              className="px-8 rounded-xl bg-surface-container-high border border-outline-variant/20 text-on-surface font-semibold hover:bg-surface-container-highest transition-all flex items-center justify-center gap-2 whitespace-nowrap text-sm h-12 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined">save</span>
              {locale === 'ko' ? '임시 저장' : 'Save Draft'}
            </button>
            <button
              type="button"
              onClick={onGenerate}
              disabled={busy}
              className="flex-1 px-8 rounded-xl bg-gradient-to-r from-primary-container to-secondary font-extrabold shadow-2xl shadow-primary-container/40 hover:scale-[1.01] transition-all text-white text-sm h-12 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('plan.generating', locale)}
                </span>
              ) : (
                locale === 'ko' ? '기획안 생성 시작' : 'Start Generation'
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
