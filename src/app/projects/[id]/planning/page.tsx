'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { t, getLocale, type Locale } from '@/lib/i18n'
import type { Project, PlanningDocument } from '@/types'
import QuestionnaireForm from '@/components/planning/QuestionnaireForm'
import PlanViewer from '@/components/planning/PlanViewer'
import FeedbackPanel from '@/components/planning/FeedbackPanel'
import SectionDeepDive from '@/components/planning/SectionDeepDive'
import VersionHistory from '@/components/planning/VersionHistory'
import PptStatusButton from '@/components/planning/PptStatusButton'
import GenerationOverlay from '@/components/planning/GenerationOverlay'
import PlanningStepIndicator from '@/components/planning/PlanningStepIndicator'

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
  const [showForm, setShowForm] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [pptRequesting, setPptRequesting] = useState(false)
  const [pptStatus, setPptStatus] = useState<string | null>(null)
  const [pptLoading, setPptLoading] = useState(false)
  const [pptOutputUrl, setPptOutputUrl] = useState<string | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [showOverlay, setShowOverlay] = useState(false)
  const [overlayComplete, setOverlayComplete] = useState(false)
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [suggestingKeys, setSuggestingKeys] = useState<Set<string>>(new Set())
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
      } else {
        // 기존 문서가 없으면 localStorage 임시 저장 데이터 복원
        try {
          const draftKey = `planning_draft_${projectId}`
          const saved = localStorage.getItem(draftKey)
          if (saved) {
            const { questionnaire: savedQ, savedAt } = JSON.parse(saved)
            if (savedQ && Object.values(savedQ as Record<string, string>).some(v => v.trim())) {
              setQuestionnaire(savedQ)
              setDraftSavedAt(savedAt || null)
            }
          }
        } catch { /* localStorage parse error skip */ }
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
    if (!document) { setPptStatus(null); setPptLoading(false); return }
    const supabase = createClient()

    // 초기 상태 조회
    setPptLoading(true)
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
      setPptLoading(false)
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

  // --- Toast auto-hide ---

  useEffect(() => {
    if (!toastMsg) return
    const timer = setTimeout(() => setToastMsg(null), 3000)
    return () => clearTimeout(timer)
  }, [toastMsg])

  // --- Handlers ---

  const handleSuggestAll = async () => {
    if (!questionnaire.q1?.trim()) return
    setIsSuggesting(true)
    setSuggestingKeys(new Set())
    try {
      const response = await fetch(`/api/projects/${projectId}/planning/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionnaire, mode: 'all' }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setErrorMsg(data?.error || (locale === 'ko' ? 'AI 답변 생성에 실패했습니다.' : 'AI suggestion failed.'))
        return
      }
      const { suggestions } = await response.json()
      setQuestionnaire(prev => ({ ...prev, ...suggestions }))
      setToastMsg(locale === 'ko' ? 'AI 답변이 생성되었습니다.' : 'AI suggestions generated.')
    } catch {
      setErrorMsg(locale === 'ko' ? 'AI 답변 생성 중 오류가 발생했습니다.' : 'Error generating AI suggestions.')
    } finally {
      setIsSuggesting(false)
    }
  }

  const handleSuggestSingle = async (key: string) => {
    if (!questionnaire.q1?.trim()) return
    setSuggestingKeys(prev => new Set(prev).add(key))
    try {
      const response = await fetch(`/api/projects/${projectId}/planning/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionnaire, mode: 'single', targetKey: key }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setErrorMsg(data?.error || (locale === 'ko' ? 'AI 답변 생성에 실패했습니다.' : 'AI suggestion failed.'))
        return
      }
      const { suggestions } = await response.json()
      setQuestionnaire(prev => ({ ...prev, ...suggestions }))
    } catch {
      setErrorMsg(locale === 'ko' ? 'AI 답변 생성 중 오류가 발생했습니다.' : 'Error generating AI suggestions.')
    } finally {
      setSuggestingKeys(prev => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  const handleSaveDraft = () => {
    try {
      const draftKey = `planning_draft_${projectId}`
      const now = new Date()
      const savedAt = now.toLocaleTimeString(locale === 'ko' ? 'ko-KR' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
      localStorage.setItem(draftKey, JSON.stringify({ questionnaire, savedAt }))
      setDraftSavedAt(savedAt)
      setToastMsg(locale === 'ko' ? '임시 저장되었습니다.' : 'Draft saved.')
    } catch {
      setToastMsg(locale === 'ko' ? '임시 저장에 실패했습니다.' : 'Failed to save draft.')
    }
  }

  const handleGenerate = async () => {
    const filledCount = Object.values(questionnaire).filter(v => v.trim()).length
    if (filledCount < 3) {
      alert(t('plan.minQuestions', locale))
      return
    }

    setIsGenerating(true)
    setStreamContent('')
    setErrorMsg('')
    setShowOverlay(true)
    setOverlayComplete(false)

    try {
      const response = await fetch(`/api/projects/${projectId}/planning/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionnaire }),
      })

      if (!response.ok) {
        setShowOverlay(false)
        if (response.status === 429) {
          setErrorMsg(locale === 'ko' ? '요청이 너무 빠릅니다. 잠시 후 다시 시도해주세요.' : 'Too many requests. Please wait a moment.')
        } else {
          const data = await response.json().catch(() => null)
          setErrorMsg(data?.error || t('plan.errorGenerate', locale))
        }
        return
      }

      let overlayDismissed = false
      await readStream(
        response,
        () => {
          // 첫 번째 청크 수신 시 오버레이 완료 표시 후 닫기
          if (!overlayDismissed) {
            overlayDismissed = true
            setOverlayComplete(true)
            setTimeout(() => setShowOverlay(false), 1500)
            // 생성 성공 → 임시 저장 데이터 삭제
            try { localStorage.removeItem(`planning_draft_${projectId}`) } catch { /* skip */ }
            setDraftSavedAt(null)
          }
        },
      )
    } catch {
      setShowOverlay(false)
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

  const handleDeepDive = async (sectionTitle: string, detail: string) => {
    setIsGenerating(true)
    setStreamContent('')
    setErrorMsg('')

    try {
      const response = await fetch(`/api/projects/${projectId}/planning/deep-dive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionTitle, detail, currentContent: document?.content }),
      })

      if (!response.ok) {
        if (response.status === 429) {
          setErrorMsg(locale === 'ko' ? '요청이 너무 빠릅니다. 잠시 후 다시 시도해주세요.' : 'Too many requests. Please wait a moment.')
        } else {
          setErrorMsg(t('plan.errorGenerate', locale))
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
  // 현재 보고 있는 스텝 (showForm이면 0, 아니면 1)
  const activeStep: 0 | 1 = showForm && !isGenerating ? 0 : 1

  const handleStepClick = (step: 0 | 1) => {
    if (step === 0 && !isGenerating) {
      setShowForm(true)
    } else if (step === 1 && displayContent) {
      setShowForm(false)
    }
  }

  // --- Render ---

  if (initialLoading) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center py-32">
        <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-10">
      {/* 스텝 인디케이터 */}
      <PlanningStepIndicator
        locale={locale}
        activeStep={activeStep}
        hasDocument={!!document}
        hasFinalized={hasFinalized}
        onStepClick={handleStepClick}
      />

      {/* 생성 진행 오버레이 */}
      <GenerationOverlay
        locale={locale}
        visible={showOverlay}
        isComplete={overlayComplete}
      />

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

      {/* 설문 폼 — 기획안이 이미 존재하면 읽기 전용 */}
      {showForm && !isGenerating && (
        <QuestionnaireForm
          locale={locale}
          questionnaire={questionnaire}
          isGenerating={isGenerating}
          draftSavedAt={draftSavedAt}
          readOnly={!!document}
          isSuggesting={isSuggesting}
          suggestingKeys={suggestingKeys}
          onQuestionnaireChange={setQuestionnaire}
          onGenerate={handleGenerate}
          onSaveDraft={handleSaveDraft}
          onSuggestAll={handleSuggestAll}
          onSuggestSingle={handleSuggestSingle}
        />
      )}

      {/* 기획안 표시 — 설문 폼이 보일 때는 숨김 */}
      {displayContent && !showForm && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-6">
          {/* 좌측: 헤더 액션 + 문서 본문 */}
          <div className="lg:col-span-8 space-y-6">
            {/* 헤더 액션 바 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-surface-container-low p-6 md:p-8 rounded-xl border-t border-outline-variant/10 shadow-xl gap-4 sm:gap-6">
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-2 items-start">
                  {document && (
                    <span className="px-3 py-1 bg-secondary/10 text-secondary text-[10px] font-bold rounded-full border border-secondary/20 tracking-wider uppercase">
                      v{document.version} {document.is_finalized ? (locale === 'ko' ? '확정' : 'FINALIZED') : ''}
                    </span>
                  )}
                  <h1 className="text-2xl md:text-3xl font-black text-on-surface tracking-tight">
                    {project?.title || (locale === 'ko' ? '기획안' : 'Plan')}
                  </h1>
                </div>
                {document && (
                  <p className="text-on-surface-variant text-sm font-medium">
                    {locale === 'ko' ? '최종 수정일: ' : 'Last modified: '}
                    {new Date(document.created_at).toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', {
                      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-3 min-h-[40px] items-center">
                <button
                  onClick={handleExportPdf}
                  className="flex items-center h-10 bg-surface-container-high hover:bg-surface-container-highest transition-colors text-sm font-bold text-on-surface rounded-lg border border-outline-variant/20 active:scale-95 px-3 justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-lg text-primary">picture_as_pdf</span>
                  PDF
                </button>
                {document?.is_finalized && (
                  pptLoading ? (
                    <span className="flex items-center h-10 px-3 rounded-lg bg-surface-container-high/50 backdrop-blur-sm border border-outline-variant/10 text-on-surface-variant/40 text-sm gap-1 animate-pulse">
                      <span className="material-symbols-outlined text-sm">slideshow</span>
                      PPT
                    </span>
                  ) : (
                    <PptStatusButton
                      locale={locale}
                      pptStatus={pptStatus}
                      pptOutputUrl={pptOutputUrl}
                      pptRequesting={pptRequesting}
                      onRequestPpt={handleRequestPpt}
                    />
                  )
                )}
                {!hasFinalized && !isGenerating && (
                  <button
                    onClick={handleFinalize}
                    className="flex items-center h-10 bg-gradient-to-r from-primary-container to-secondary text-sm font-bold rounded-lg shadow-lg shadow-primary-container/20 active:scale-95 transition-transform px-4 text-white justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    {locale === 'ko' ? '기획안 확정' : 'Finalize Plan'}
                  </button>
                )}
              </div>
            </div>

            {/* 기획안 본문 */}
            <PlanViewer
              locale={locale}
              document={document}
              displayContent={displayContent}
              isGenerating={isGenerating}
              contentRef={contentRef}
            />
          </div>

          {/* 우측: 사이드바 */}
          <div className="lg:col-span-4 space-y-6">
            {/* 버전 히스토리 */}
            <details className="sidebar-card group rounded-xl overflow-hidden" open>
              <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-surface-container-high transition-all">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-xl font-bold">history</span>
                  <h3 className="text-sm font-bold text-on-surface tracking-tight">
                    {locale === 'ko' ? '버전 히스토리' : 'Version History'}
                  </h3>
                </div>
                <span className="material-symbols-outlined text-primary group-open:rotate-180 transition-transform duration-300 font-bold">expand_more</span>
              </summary>
              <div className="px-6 pb-6 pt-0">
                <VersionHistory
                  locale={locale}
                  documents={allDocuments}
                  activeDocId={document?.id}
                  onSelect={(doc) => { setDocument(doc); setStreamContent('') }}
                />
              </div>
            </details>

            {/* 섹션 딥다이브 */}
            {document && !hasFinalized && !isGenerating && (
              <details className="sidebar-card group rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-surface-container-high transition-all">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary text-xl font-bold">insights</span>
                    <h3 className="text-sm font-bold text-on-surface tracking-tight">
                      {locale === 'ko' ? '섹션 딥다이브' : 'Section Deep Dive'}
                    </h3>
                  </div>
                  <span className="material-symbols-outlined text-secondary group-open:rotate-180 transition-transform duration-300 font-bold">expand_more</span>
                </summary>
                <SectionDeepDive
                  locale={locale}
                  documentContent={displayContent}
                  onSubmit={handleDeepDive}
                  disabled={isGenerating}
                />
              </details>
            )}

            {/* 피드백 & 리뷰 */}
            {document && !hasFinalized && !isGenerating && (
              <details className="sidebar-card group rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-surface-container-high transition-all">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-tertiary text-xl font-bold">reviews</span>
                    <h3 className="text-sm font-bold text-on-surface tracking-tight">
                      {locale === 'ko' ? '피드백 & 리뷰' : 'Feedback & Review'}
                    </h3>
                  </div>
                  <span className="material-symbols-outlined text-tertiary group-open:rotate-180 transition-transform duration-300 font-bold">expand_more</span>
                </summary>
                <div className="p-6 pt-2">
                  <FeedbackPanel
                    locale={locale}
                    feedback={feedback}
                    onFeedbackChange={setFeedback}
                    onSubmit={handleFeedback}
                  />
                </div>
              </details>
            )}
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

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-surface-container-highest border border-secondary/50 text-secondary px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          <span className="font-bold">{toastMsg}</span>
        </div>
      )}
    </div>
  )
}
