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
  const contentRef = useRef<HTMLDivElement>(null)

  const questions = questionKeys.map((key) => ({
    key,
    label: t(`plan.${key}`, locale),
    placeholder: t(`plan.${key}p`, locale),
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
    setShowForm(false)

    try {
      const response = await fetch(`/api/projects/${projectId}/planning/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionnaire }),
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
              } else if (data.type === 'error') {
                alert(`${data.message}`)
              }
            } catch { /* ignore */ }
          }
        }
      }
    } catch (err) {
      alert(t('plan.errorGenerate', locale))
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('plan.title', locale)}</h1>

      {/* 설문 폼 */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('plan.questionTitle', locale)}</h2>
          <p className="text-sm text-gray-500 mb-6">{t('plan.questionDesc', locale)}</p>

          <div className="space-y-4">
            {questions.map((q, i) => (
              <div key={q.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {i + 1}. {q.label}
                </label>
                <textarea
                  value={questionnaire[q.key] || ''}
                  onChange={(e) => setQuestionnaire(prev => ({ ...prev, [q.key]: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-sm"
                  placeholder={q.placeholder}
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="mt-6 w-full py-3 text-white bg-blue-600 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isGenerating ? t('plan.generating', locale) : t('plan.generate', locale)}
          </button>
        </div>
      )}

      {/* 기획안 표시 */}
      {displayContent && (
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('plan.title', locale)} {document ? `v${document.version}` : ''}
            </h2>
            <div className="flex gap-2">
              {!showForm && !document?.is_finalized && (
                <button
                  onClick={() => setShowForm(true)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  {t('plan.editQuestions', locale)}
                </button>
              )}
            </div>
          </div>

          {isGenerating && (
            <div className="mb-4 flex items-center gap-2 text-sm text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              {t('plan.aiWriting', locale)}
            </div>
          )}

          <div
            ref={contentRef}
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: marked(displayContent) as string }}
          />
        </div>
      )}

      {/* 피드백 / 딥다이브 / 확정 */}
      {document && !document.is_finalized && !isGenerating && (
        <div className="space-y-4">
          {/* 피드백 */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('plan.feedbackTitle', locale)}</h3>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-sm"
              placeholder={t('plan.feedbackPlaceholder', locale)}
            />
            <button
              onClick={handleFeedback}
              disabled={!feedback.trim()}
              className="mt-3 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {t('plan.feedbackSubmit', locale)}
            </button>
          </div>

          {/* 딥다이브 */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('plan.deepDiveTitle', locale)}</h3>
            <input
              value={deepDiveSection}
              onChange={(e) => setDeepDiveSection(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              placeholder={t('plan.deepDivePlaceholder', locale)}
            />
            <button
              onClick={handleDeepDive}
              disabled={!deepDiveSection.trim()}
              className="mt-3 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {t('plan.deepDiveSubmit', locale)}
            </button>
          </div>

          {/* 확정 */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <button
              onClick={handleFinalize}
              className="w-full py-3 text-white bg-green-600 rounded-lg font-medium hover:bg-green-700"
            >
              {t('plan.finalize', locale)}
            </button>
          </div>
        </div>
      )}

      {document?.is_finalized && (
        <div className="bg-green-50 rounded-xl p-6 text-center">
          <p className="text-green-700 font-medium">{t('plan.finalized', locale)}</p>
          <button
            onClick={() => router.push(`/projects/${projectId}/design`)}
            className="mt-3 px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 font-medium"
          >
            {t('plan.goDesign', locale)}
          </button>
        </div>
      )}
    </div>
  )
}
