'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { marked } from 'marked'
import { t, getLocale, type Locale } from '@/lib/i18n'
import type { Project, PlanningDocument, QuestionnaireData } from '@/types'

const questionKeys = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10']

export default function PlanningPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [locale, setLocaleState] = useState<Locale>('ko')
  const [project, setProject] = useState<Project | null>(null)
  const [questionnaire, setQuestionnaire] = useState<Record<string, string>>({})
  const [document, setDocument] = useState<PlanningDocument | null>(null)
  const [streamContent, setStreamContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [deepDiveSection, setDeepDiveSection] = useState('')
  const [showForm, setShowForm] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const contentRef = useRef<HTMLDivElement>(null)

  const questions = questionKeys.map((key, i) => ({
    key,
    label: t(`plan.${key}`, locale),
    hint: t(`plan.${key}h`, locale),
    example: t(`plan.${key}e`, locale),
    placeholder: t(`plan.${key}p`, locale),
    required: i < 3,
  }))

  useEffect(() => {
    const fetchData = async () => {
      setLocaleState(getLocale())
      const supabase = createClient()

      const { data: proj } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()
      setProject(proj)

      const { data: doc } = await supabase
        .from('planning_documents')
        .select('*')
        .eq('project_id', projectId)
        .order('version', { ascending: false })
        .limit(1)
        .single()

      if (doc) {
        setDocument(doc)
        setShowForm(false)
        if (doc.questionnaire_data) {
          setQuestionnaire(doc.questionnaire_data as Record<string, string>)
        }
      }
    }
    fetchData()
  }, [projectId])

  const handleGenerate = async () => {
    const filledCount = Object.values(questionnaire).filter(v => v.trim()).length
    if (filledCount < 3) {
      alert(t('plan.minQuestions', locale))
      return
    }

    setIsGenerating(true)
    setStreamContent('')
    setErrorMsg('')
    setShowForm(false)

    try {
      const response = await fetch(`/api/projects/${projectId}/planning/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionnaire }),
      })

      if (!response.ok) {
        setErrorMsg(t('plan.errorGenerate', locale))
        setShowForm(true)
        setIsGenerating(false)
        return
      }

      const reader = response.body?.getReader()
      if (!reader) {
        setErrorMsg(t('plan.errorGenerate', locale))
        setShowForm(true)
        setIsGenerating(false)
        return
      }
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })

        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'chunk') {
                setStreamContent(prev => prev + data.text)
              } else if (data.type === 'complete') {
                const supabase = createClient()
                const { data: doc } = await supabase
                  .from('planning_documents')
                  .select('*')
                  .eq('project_id', projectId)
                  .order('version', { ascending: false })
                  .limit(1)
                  .single()
                if (doc) setDocument(doc)
              } else if (data.type === 'error') {
                setErrorMsg(data.message)
                setShowForm(true)
              }
            } catch { /* ignore */ }
          }
        }
      }
    } catch {
      setErrorMsg(t('plan.errorGenerate', locale))
      setShowForm(true)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleFeedback = async () => {
    if (!feedback.trim()) return

    setIsGenerating(true)
    setStreamContent('')

    try {
      const response = await fetch(`/api/projects/${projectId}/planning/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback, currentContent: document?.content }),
      })

      const reader = response.body?.getReader()
      if (!reader) return
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'chunk') {
                setStreamContent(prev => prev + data.text)
              } else if (data.type === 'complete') {
                const supabase = createClient()
                const { data: doc } = await supabase
                  .from('planning_documents')
                  .select('*')
                  .eq('project_id', projectId)
                  .order('version', { ascending: false })
                  .limit(1)
                  .single()
                if (doc) setDocument(doc)
                setFeedback('')
              }
            } catch { /* ignore */ }
          }
        }
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDeepDive = async () => {
    if (!deepDiveSection.trim()) return

    setIsGenerating(true)
    setStreamContent('')

    try {
      const response = await fetch(`/api/projects/${projectId}/planning/deep-dive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: deepDiveSection, currentContent: document?.content }),
      })

      const reader = response.body?.getReader()
      if (!reader) return
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'chunk') {
                setStreamContent(prev => prev + data.text)
              } else if (data.type === 'complete') {
                const supabase = createClient()
                const { data: doc } = await supabase
                  .from('planning_documents')
                  .select('*')
                  .eq('project_id', projectId)
                  .order('version', { ascending: false })
                  .limit(1)
                  .single()
                if (doc) setDocument(doc)
                setDeepDiveSection('')
              }
            } catch { /* ignore */ }
          }
        }
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleFinalize = async () => {
    if (!confirm(t('plan.finalizeConfirm', locale))) return

    try {
      const response = await fetch(`/api/projects/${projectId}/planning/finalize`, {
        method: 'POST',
      })
      if (response.ok) {
        router.push(`/projects/${projectId}/design`)
        router.refresh()
      } else {
        alert(t('plan.errorFinalize', locale))
      }
    } catch {
      alert(t('plan.errorFinalize', locale))
    }
  }

  const displayContent = streamContent || document?.content || ''

  return (
    <div className="max-w-4xl mx-auto">
      {/* 에러 메시지 */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 flex items-start gap-3">
          <span className="material-symbols-outlined text-error text-lg mt-0.5">error</span>
          <div className="flex-1">
            <p className="text-sm text-error font-medium">{errorMsg}</p>
            <p className="text-xs text-on-surface-variant mt-1">
              {locale === 'ko' ? '잠시 후 다시 시도해주세요.' : 'Please try again in a moment.'}
            </p>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* 설문 폼 */}
      {showForm && (
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
                  onChange={(e) => setQuestionnaire(prev => ({ ...prev, [q.key]: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/20 rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-transparent outline-none resize-none text-sm text-on-surface placeholder:text-on-surface-variant/40"
                  placeholder={q.placeholder}
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="mt-8 w-full py-3.5 text-white bg-gradient-to-r from-primary-container to-secondary rounded-xl font-bold shadow-lg shadow-primary-container/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {isGenerating ? t('plan.generating', locale) : t('plan.generate', locale)}
          </button>
          <p className="mt-3 text-xs text-on-surface-variant/60 text-center">
            {t('plan.generateNote', locale)}
          </p>
        </div>
      )}

      {/* 기획안 표시 */}
      {displayContent && (
        <div className="glass-card rounded-2xl p-8 border border-outline-variant/20 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-on-surface">
              {t('plan.title', locale)} {document ? `v${document.version}` : ''}
            </h2>
            <div className="flex gap-2">
              {!showForm && !document?.is_finalized && (
                <button
                  onClick={() => setShowForm(true)}
                  className="px-3 py-1.5 text-xs font-medium text-on-surface-variant bg-surface-container-high rounded-lg hover:bg-surface-container-highest transition-colors"
                >
                  {t('plan.editQuestions', locale)}
                </button>
              )}
            </div>
          </div>

          {isGenerating && (
            <div className="mb-4 flex items-center gap-2 text-sm text-secondary">
              <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
              {t('plan.aiWriting', locale)}
            </div>
          )}

          <div
            ref={contentRef}
            className="prose prose-sm prose-invert max-w-none prose-headings:text-on-surface prose-p:text-on-surface-variant prose-strong:text-on-surface prose-li:text-on-surface-variant"
            dangerouslySetInnerHTML={{ __html: marked(displayContent) as string }}
          />
        </div>
      )}

      {/* 피드백 / 딥다이브 / 확정 */}
      {document && !document.is_finalized && !isGenerating && (
        <div className="space-y-4">
          {/* 피드백 */}
          <div className="glass-card rounded-2xl p-6 border border-outline-variant/20">
            <h3 className="text-sm font-bold text-on-surface mb-3">{t('plan.feedbackTitle', locale)}</h3>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/20 rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-transparent outline-none resize-none text-sm text-on-surface placeholder:text-on-surface-variant/40"
              placeholder={t('plan.feedbackPlaceholder', locale)}
            />
            <button
              onClick={handleFeedback}
              disabled={!feedback.trim()}
              className="mt-3 px-4 py-2 text-sm font-bold text-white bg-primary-container rounded-xl hover:bg-primary-container/80 disabled:opacity-50 transition-colors"
            >
              {t('plan.feedbackSubmit', locale)}
            </button>
          </div>

          {/* 딥다이브 */}
          <div className="glass-card rounded-2xl p-6 border border-outline-variant/20">
            <h3 className="text-sm font-bold text-on-surface mb-3">{t('plan.deepDiveTitle', locale)}</h3>
            <input
              value={deepDiveSection}
              onChange={(e) => setDeepDiveSection(e.target.value)}
              className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/20 rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-transparent outline-none text-sm text-on-surface placeholder:text-on-surface-variant/40"
              placeholder={t('plan.deepDivePlaceholder', locale)}
            />
            <button
              onClick={handleDeepDive}
              disabled={!deepDiveSection.trim()}
              className="mt-3 px-4 py-2 text-sm font-bold text-white bg-tertiary-container rounded-xl hover:bg-tertiary-container/80 disabled:opacity-50 transition-colors"
            >
              {t('plan.deepDiveSubmit', locale)}
            </button>
          </div>

          {/* 확정 */}
          <div className="glass-card rounded-2xl p-6 border border-outline-variant/20">
            <button
              onClick={handleFinalize}
              className="w-full py-3.5 text-white bg-gradient-to-r from-secondary to-secondary/80 rounded-xl font-bold hover:shadow-lg transition-all"
            >
              {t('plan.finalize', locale)}
            </button>
          </div>
        </div>
      )}

      {document?.is_finalized && (
        <div className="glass-card rounded-2xl p-8 border border-secondary/30 text-center bg-secondary/5">
          <p className="text-secondary font-bold text-lg">{t('plan.finalized', locale)}</p>
          <button
            onClick={() => router.push(`/projects/${projectId}/design`)}
            className="mt-4 px-8 py-3 text-white bg-secondary rounded-xl hover:bg-secondary/80 font-bold transition-colors"
          >
            {t('plan.goDesign', locale)}
          </button>
        </div>
      )}
    </div>
  )
}
