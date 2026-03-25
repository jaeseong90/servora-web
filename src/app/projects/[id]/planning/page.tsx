'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { t, getLocale, type Locale } from '@/lib/i18n'
import type { Project, PlanningDocument } from '@/types'
import QuestionnaireForm from '@/components/planning/QuestionnaireForm'
import PlanViewer from '@/components/planning/PlanViewer'
import FeedbackPanel from '@/components/planning/FeedbackPanel'
import DeepDivePanel from '@/components/planning/DeepDivePanel'
import VersionHistory from '@/components/planning/VersionHistory'

export default function PlanningPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [locale, setLocaleState] = useState<Locale>('ko')
  const [project, setProject] = useState<Project | null>(null)
  const [questionnaire, setQuestionnaire] = useState<Record<string, string>>({})
  const [allDocuments, setAllDocuments] = useState<PlanningDocument[]>([])
  const [document, setDocument] = useState<PlanningDocument | null>(null)
  const [streamContent, setStreamContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [deepDiveSection, setDeepDiveSection] = useState('')
  const [showForm, setShowForm] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [pptRequesting, setPptRequesting] = useState(false)
  const [pptStatus, setPptStatus] = useState<string | null>(null)
  const [pptOutputUrl, setPptOutputUrl] = useState<string | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const contentRef = useRef<HTMLDivElement>(null)

  // --- Data fetching ---

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

      const { data: docs } = await supabase
        .from('planning_documents')
        .select('*')
        .eq('project_id', projectId)
        .order('version', { ascending: false })

      if (docs && docs.length > 0) {
        setAllDocuments(docs)
        setDocument(docs[0])
        setShowForm(false)
        if (docs[0].questionnaire_data) {
          setQuestionnaire(docs[0].questionnaire_data as Record<string, string>)
        }
      }
      setInitialLoading(false)
    }
    fetchData()
  }, [projectId])

  const reloadDocuments = async () => {
    const supabase = createClient()
    const { data: docs } = await supabase
      .from('planning_documents')
      .select('*')
      .eq('project_id', projectId)
      .order('version', { ascending: false })
    if (docs && docs.length > 0) {
      setAllDocuments(docs)
      setDocument(docs[0])
    }
  }

  // --- Browser notification permission ---

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // --- PPT Realtime subscription ---

  useEffect(() => {
    if (!document) { setPptStatus(null); return }
    const supabase = createClient()

    // 초기 상태 조회
    const fetchInitial = async () => {
      const { data } = await supabase
        .from('ppt_build_queue')
        .select('status, output_url')
        .eq('document_id', document.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      setPptStatus(data?.status || null)
      setPptOutputUrl(data?.output_url || null)
    }
    fetchInitial()

    // Realtime 구독
    const channel = supabase
      .channel(`ppt-${document.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ppt_build_queue',
        filter: `document_id=eq.${document.id}`,
      }, (payload) => {
        const row = payload.new as { status?: string; output_url?: string }
        const newStatus = row.status || null
        setPptOutputUrl(row.output_url || null)

        // 상태 변경 시 알림
        if (newStatus === 'COMPLETED' || newStatus === 'FAILED') {
          if ('Notification' in window && Notification.permission === 'granted') {
            const body = newStatus === 'COMPLETED'
              ? (locale === 'ko' ? 'PPT 생성이 완료되었습니다!' : 'PPT generation is complete!')
              : (locale === 'ko' ? 'PPT 생성에 실패했습니다.' : 'PPT generation failed.')
            new Notification('Servora', { body, icon: '/favicon.ico' })
          }
        }
        setPptStatus(newStatus)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [document, locale])

  // --- SSE stream reader (shared) ---

  const readStream = async (
    response: Response,
    onChunk?: () => void,
    onComplete?: () => void,
  ) => {
    const reader = response.body?.getReader()
    if (!reader) return
    const decoder = new TextDecoder()
    const STREAM_TIMEOUT_MS = 120_000 // 2분 타임아웃
    let lastChunkTime = Date.now()

    while (true) {
      const timeSinceLast = Date.now() - lastChunkTime
      if (timeSinceLast > STREAM_TIMEOUT_MS) {
        setErrorMsg(locale === 'ko' ? '응답 시간이 초과되었습니다. 다시 시도해주세요.' : 'Response timed out. Please try again.')
        reader.cancel()
        break
      }

      const { done, value } = await reader.read()
      if (done) break
      lastChunkTime = Date.now()
      const chunk = decoder.decode(value, { stream: true })
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data: ')) continue
        try {
          const data = JSON.parse(line.slice(6))
          if (data.type === 'chunk') {
            setShowForm(false)
            setStreamContent(prev => prev + data.text)
            onChunk?.()
          } else if (data.type === 'complete') {
            await reloadDocuments()
            onComplete?.()
          } else if (data.type === 'error') {
            setErrorMsg(data.message)
            setShowForm(true)
          }
        } catch { /* SSE parse skip */ }
      }
    }
  }

  // --- Handlers ---

  const handleGenerate = async () => {
    const filledCount = Object.values(questionnaire).filter(v => v.trim()).length
    if (filledCount < 3) {
      alert(t('plan.minQuestions', locale))
      return
    }

    setIsGenerating(true)
    setStreamContent('')
    setErrorMsg('')

    try {
      const response = await fetch(`/api/projects/${projectId}/planning/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionnaire }),
      })

      if (!response.ok) {
        if (response.status === 429) {
          setErrorMsg(locale === 'ko' ? '요청이 너무 빠릅니다. 잠시 후 다시 시도해주세요.' : 'Too many requests. Please wait a moment.')
        } else {
          const data = await response.json().catch(() => null)
          setErrorMsg(data?.error || t('plan.errorGenerate', locale))
        }
        return
      }

      await readStream(response)
    } catch {
      setErrorMsg(t('plan.errorGenerate', locale))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleFeedback = async () => {
    if (!feedback.trim()) return

    setIsGenerating(true)
    setStreamContent('')
    setErrorMsg('')

    try {
      const response = await fetch(`/api/projects/${projectId}/planning/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback, currentContent: document?.content }),
      })

      if (!response.ok) {
        if (response.status === 429) {
          setErrorMsg(locale === 'ko' ? '요청이 너무 빠릅니다. 잠시 후 다시 시도해주세요.' : 'Too many requests. Please wait a moment.')
        } else {
          setErrorMsg(t('plan.errorGenerate', locale))
        }
        return
      }

      await readStream(response, undefined, () => setFeedback(''))
    } catch {
      setErrorMsg(t('plan.errorGenerate', locale))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDeepDive = async () => {
    if (!deepDiveSection.trim()) return

    setIsGenerating(true)
    setStreamContent('')
    setErrorMsg('')

    try {
      const response = await fetch(`/api/projects/${projectId}/planning/deep-dive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: deepDiveSection, currentContent: document?.content }),
      })

      if (!response.ok) {
        if (response.status === 429) {
          setErrorMsg(locale === 'ko' ? '요청이 너무 빠릅니다. 잠시 후 다시 시도해주세요.' : 'Too many requests. Please wait a moment.')
        } else {
          setErrorMsg(t('plan.errorGenerate', locale))
        }
        return
      }

      await readStream(response, undefined, () => setDeepDiveSection(''))
    } catch {
      setErrorMsg(t('plan.errorGenerate', locale))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRequestPpt = async () => {
    if (!document) return
    setPptRequesting(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/planning/ppt-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: document.id }),
      })

      if (response.ok) {
        setPptStatus('PENDING')
        alert(locale === 'ko' ? 'PPT 생성이 요청되었습니다. 완료되면 알림을 드립니다.' : 'PPT generation requested. You will be notified when ready.')
      } else {
        const data = await response.json()
        if (response.status === 409) {
          setPptStatus(data.status || 'PENDING')
        } else {
          alert(locale === 'ko' ? 'PPT 생성 요청에 실패했습니다.' : 'Failed to request PPT generation.')
        }
      }
    } catch {
      alert(locale === 'ko' ? 'PPT 생성 요청 중 오류가 발생했습니다.' : 'An error occurred while requesting PPT generation.')
    } finally {
      setPptRequesting(false)
    }
  }

  const handleExportPdf = async () => {
    if (!contentRef.current || !document) return
    const html2pdf = (await import('html2pdf.js')).default

    const clone = contentRef.current.cloneNode(true) as HTMLElement
    clone.style.background = '#ffffff'
    clone.style.color = '#1a1a1a'
    clone.style.padding = '40px'
    clone.style.fontSize = '13px'
    clone.style.lineHeight = '1.8'
    clone.querySelectorAll('h1, h2, h3').forEach((el) => {
      ;(el as HTMLElement).style.color = '#111111'
    })
    clone.querySelectorAll('p, li, span').forEach((el) => {
      ;(el as HTMLElement).style.color = '#333333'
    })

    const container = window.document.createElement('div')
    container.style.position = 'absolute'
    container.style.left = '-9999px'
    container.appendChild(clone)
    window.document.body.appendChild(container)

    const title = project?.title || 'plan'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (html2pdf() as any)
      .set({
        margin: [15, 15, 15, 15],
        filename: `${title}_v${document.version}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      })
      .from(clone)
      .save()

    window.document.body.removeChild(container)
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

  // --- Derived state ---

  const hasFinalized = allDocuments.some(doc => doc.is_finalized)
  const displayContent = streamContent || document?.content || ''

  // --- Render ---

  if (initialLoading) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center py-32">
        <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
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
          <button onClick={() => setErrorMsg('')} className="text-on-surface-variant hover:text-on-surface" aria-label={locale === 'ko' ? '닫기' : 'Close'}>
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* 설문 폼 */}
      {showForm && (
        <QuestionnaireForm
          locale={locale}
          questionnaire={questionnaire}
          isGenerating={isGenerating}
          onQuestionnaireChange={setQuestionnaire}
          onGenerate={handleGenerate}
        />
      )}

      {/* 기획안 표시 */}
      {displayContent && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6 mb-6">
          <div>
            <PlanViewer
              locale={locale}
              document={document}
              displayContent={displayContent}
              isGenerating={isGenerating}
              hasFinalized={hasFinalized}
              showForm={showForm}
              pptStatus={pptStatus}
              pptOutputUrl={pptOutputUrl}
              pptRequesting={pptRequesting}
              contentRef={contentRef}
              onShowForm={() => setShowForm(true)}
              onFinalize={handleFinalize}
              onExportPdf={handleExportPdf}
              onRequestPpt={handleRequestPpt}
            />

            {/* 피드백 / 딥다이브 / 확정 */}
            {document && !hasFinalized && !isGenerating && (
              <div className="space-y-4">
                <FeedbackPanel
                  locale={locale}
                  feedback={feedback}
                  onFeedbackChange={setFeedback}
                  onSubmit={handleFeedback}
                />

                <DeepDivePanel
                  locale={locale}
                  section={deepDiveSection}
                  onSectionChange={setDeepDiveSection}
                  onSubmit={handleDeepDive}
                />

                {/* 기획안 확정 */}
                <div className="rounded-2xl p-6 border border-primary-container/30 bg-gradient-to-br from-primary-container/10 to-surface-container-low">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-container/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-on-surface">
                        {locale === 'ko' ? '기획안 확정' : 'Finalize Plan'}
                      </h3>
                      <p className="text-[11px] text-on-surface-variant">
                        {locale === 'ko' ? '확정 후 디자인 단계로 이동합니다' : 'Move to Design phase after finalizing'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleFinalize}
                    className="w-full py-3.5 text-sm font-bold text-white bg-primary-container rounded-xl hover:bg-primary-container/90 hover:shadow-lg hover:shadow-primary-container/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">task_alt</span>
                    {locale === 'ko' ? '기획안 확정하기' : 'Finalize Plan'}
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <VersionHistory
            locale={locale}
            documents={allDocuments}
            activeDocId={document?.id}
            onSelect={(doc) => { setDocument(doc); setStreamContent('') }}
          />
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
