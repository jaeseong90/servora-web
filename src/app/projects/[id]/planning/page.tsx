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
  const [allDocuments, setAllDocuments] = useState<PlanningDocument[]>([])
  const [document, setDocument] = useState<PlanningDocument | null>(null)
  const [streamContent, setStreamContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [deepDiveSection, setDeepDiveSection] = useState('')
  const [showForm, setShowForm] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [pptRequesting, setPptRequesting] = useState(false)
  const [pptStatus, setPptStatus] = useState<string | null>(null) // null=미요청, PENDING, BUILDING, COMPLETED, FAILED
  const [pptOutputUrl, setPptOutputUrl] = useState<string | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
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

  // 브라우저 알림 권한 요청
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // 현재 문서의 PPT 큐 상태 조회 + 폴링
  useEffect(() => {
    if (!document) { setPptStatus(null); return }
    const checkPpt = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('ppt_build_queue')
        .select('status, output_url')
        .eq('document_id', document.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      const newStatus = data?.status || null
      setPptOutputUrl(data?.output_url || null)
      // 상태 변경 시 알림
      if (pptStatus && newStatus !== pptStatus) {
        if (newStatus === 'COMPLETED') {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Servora', { body: locale === 'ko' ? 'PPT 생성이 완료되었습니다!' : 'PPT generation is complete!', icon: '/favicon.ico' })
          }
        } else if (newStatus === 'FAILED') {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Servora', { body: locale === 'ko' ? 'PPT 생성에 실패했습니다.' : 'PPT generation failed.', icon: '/favicon.ico' })
          }
        }
      }
      setPptStatus(newStatus)
    }
    checkPpt()
    // PENDING/BUILDING일 때 5초 폴링
    if (pptStatus === 'PENDING' || pptStatus === 'BUILDING') {
      const interval = setInterval(checkPpt, 5000)
      return () => clearInterval(interval)
    }
  }, [document, pptStatus, locale])

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
                setShowForm(false)
                setStreamContent(prev => prev + data.text)
              } else if (data.type === 'complete') {
                await reloadDocuments()
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
                await reloadDocuments()
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
                await reloadDocuments()
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

  const handleRequestPpt = async () => {
    if (!document) return
    setPptRequesting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('ppt_build_queue').insert({
        project_id: Number(projectId),
        document_id: document.id,
        status: 'PENDING',
      })
      if (error) {
        alert(locale === 'ko' ? 'PPT 생성 요청에 실패했습니다.' : 'Failed to request PPT generation.')
      } else {
        setPptStatus('PENDING')
        alert(locale === 'ko' ? 'PPT 생성이 요청되었습니다. 완료되면 알림을 드립니다.' : 'PPT generation requested. You will be notified when ready.')
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

    // PDF용 임시 컨테이너 (밝은 배경)
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

  const hasFinalized = allDocuments.some(doc => doc.is_finalized)
  const displayContent = streamContent || document?.content || ''

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
          <button onClick={() => setErrorMsg('')} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* 설문 폼 */}
      {showForm && (
        <div className="glass-card rounded-2xl p-8 border border-outline-variant/20 mb-6 relative">
          {/* 생성 중 오버레이 */}
          {isGenerating && (
            <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-3 border-secondary border-t-transparent rounded-full animate-spin" />
              <p className="text-on-surface font-bold">{t('plan.generating', locale)}</p>
              <p className="text-sm text-on-surface-variant">{t('plan.generateNote', locale)}</p>
            </div>
          )}
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

      {/* 기획안 표시 — v1 스타일 2컬럼 레이아웃 */}
      {displayContent && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6 mb-6">
          {/* 메인: 기획안 */}
          <div>
            <div className="glass-card rounded-2xl border border-outline-variant/20 mb-6">
              {/* 헤더 */}
              <div className="flex items-center justify-between px-8 pt-6 pb-4 border-b border-outline-variant/10">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-on-surface">
                    {document ? `v${document.version}` : ''}
                  </span>
                  {document?.is_finalized && (
                    <span className="px-2 py-0.5 text-[10px] font-bold text-secondary bg-secondary/10 border border-secondary/20 rounded-full uppercase tracking-wider">
                      {locale === 'ko' ? '확정' : 'Finalized'}
                    </span>
                  )}
                  {isGenerating && (
                    <span className="px-2 py-0.5 text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <span className="w-2 h-2 border border-primary border-t-transparent rounded-full animate-spin" />
                      {t('plan.aiWriting', locale)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!showForm && !hasFinalized && (
                    <>
                      <button
                        onClick={() => setShowForm(true)}
                        className="px-3 py-1.5 text-xs font-medium text-on-surface-variant bg-surface-container-high rounded-lg hover:bg-surface-container-highest transition-colors"
                      >
                        {t('plan.editQuestions', locale)}
                      </button>
                      <button
                        onClick={handleFinalize}
                        className="px-3 py-1.5 text-xs font-bold text-secondary border border-secondary/30 bg-secondary/10 rounded-lg hover:bg-secondary/20 transition-colors"
                      >
                        {locale === 'ko' ? '확정' : 'Finalize'}
                      </button>
                    </>
                  )}
                  {document && (
                    <button
                      onClick={handleExportPdf}
                      className="px-3 py-1.5 text-xs font-medium text-on-surface-variant bg-surface-container-high rounded-lg hover:bg-surface-container-highest transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                      PDF
                    </button>
                  )}
                  {document && document.is_finalized && (
                    pptStatus === 'PENDING' || pptStatus === 'BUILDING' ? (
                      <span className="px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-1">
                        <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        {pptStatus === 'PENDING' ? (locale === 'ko' ? 'PPT 대기' : 'PPT Queued') : (locale === 'ko' ? 'PPT 생성 중' : 'PPT Building')}
                      </span>
                    ) : pptStatus === 'COMPLETED' ? (
                      pptOutputUrl ? (
                        <a
                          href={pptOutputUrl}
                          download
                          className="px-3 py-1.5 text-xs font-medium text-secondary bg-secondary/10 border border-secondary/20 rounded-lg hover:bg-secondary/20 transition-colors flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">download</span>
                          {locale === 'ko' ? 'PPT 다운로드' : 'Download PPT'}
                        </a>
                      ) : (
                        <span className="px-3 py-1.5 text-xs font-medium text-secondary bg-secondary/10 border border-secondary/20 rounded-lg flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          {locale === 'ko' ? 'PPT 완료' : 'PPT Ready'}
                        </span>
                      )
                    ) : pptStatus === 'FAILED' ? (
                      <button
                        onClick={handleRequestPpt}
                        disabled={pptRequesting}
                        className="px-3 py-1.5 text-xs font-medium text-error bg-error/10 border border-error/20 rounded-lg hover:bg-error/20 transition-colors flex items-center gap-1 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-sm">refresh</span>
                        {pptRequesting ? (locale === 'ko' ? '요청 중...' : 'Requesting...') : (locale === 'ko' ? 'PPT 재요청' : 'PPT Retry')}
                      </button>
                    ) : (
                      <button
                        onClick={handleRequestPpt}
                        disabled={pptRequesting}
                        className="px-3 py-1.5 text-xs font-medium text-on-surface-variant bg-surface-container-high rounded-lg hover:bg-surface-container-highest transition-colors flex items-center gap-1 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-sm">slideshow</span>
                        {pptRequesting ? (locale === 'ko' ? '요청 중...' : 'Requesting...') : 'PPT'}
                      </button>
                    )
                  )}
                  {document && (
                    <span className="text-xs text-on-surface-variant">
                      {new Date(document.created_at).toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US')}
                    </span>
                  )}
                </div>
              </div>

              {/* 기획안 본문 */}
              <div
                ref={contentRef}
                className="px-8 py-6 leading-[1.8] text-[14px] [&_h1]:text-[24px] [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-3 [&_h1]:text-on-surface [&_h2]:text-[20px] [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-on-surface [&_h3]:text-[16px] [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-on-surface [&_p]:mb-3 [&_p]:text-on-surface-variant [&_ul]:ml-6 [&_ul]:mb-3 [&_ol]:ml-6 [&_ol]:mb-3 [&_li]:mb-1 [&_li]:text-on-surface-variant [&_strong]:text-on-surface [&_code]:bg-surface-container-highest [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[13px] [&_blockquote]:border-l-2 [&_blockquote]:border-primary-container/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-on-surface-variant/80 [&_table]:w-full [&_table]:border-collapse [&_th]:bg-surface-container-high [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-xs [&_th]:font-bold [&_td]:px-3 [&_td]:py-2 [&_td]:border-t [&_td]:border-outline-variant/10"
                dangerouslySetInnerHTML={{ __html: marked(displayContent) as string }}
              />
            </div>

            {/* 피드백 / 딥다이브 / 확정 — 기획안 하단 */}
            {document && !hasFinalized && !isGenerating && (
              <div className="space-y-4">
                {/* 피드백 */}
                <div className="glass-card rounded-2xl p-6 border border-outline-variant/20">
                  <h3 className="text-sm font-bold text-on-surface mb-3">{t('plan.feedbackTitle', locale)}</h3>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/20 rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-transparent outline-none resize-y text-sm text-on-surface placeholder:text-on-surface-variant/40"
                    placeholder={t('plan.feedbackPlaceholder', locale)}
                  />
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={handleFeedback}
                      disabled={!feedback.trim()}
                      className="px-5 py-2.5 text-sm font-bold text-white bg-primary-container rounded-xl hover:bg-primary-container/80 disabled:opacity-50 transition-colors"
                    >
                      {t('plan.feedbackSubmit', locale)}
                    </button>
                  </div>
                </div>

                {/* 딥다이브 */}
                <div className="glass-card rounded-2xl p-6 border border-outline-variant/20">
                  <h3 className="text-sm font-bold text-on-surface mb-2">{t('plan.deepDiveTitle', locale)}</h3>
                  <p className="text-xs text-on-surface-variant mb-3">
                    {locale === 'ko' ? '특정 섹션을 더 깊이 있게 보강하고 싶다면 선택해주세요.' : 'Select a section to deep dive and enhance.'}
                  </p>
                  <select
                    value={deepDiveSection}
                    onChange={(e) => setDeepDiveSection(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/20 rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-transparent outline-none text-sm text-on-surface appearance-none cursor-pointer"
                  >
                    <option value="">{locale === 'ko' ? '섹션을 선택하세요' : 'Select a section'}</option>
                    {[
                      { ko: '1. 서비스 개요', en: '1. Service Overview' },
                      { ko: '2. 기획 배경 및 문제 정의', en: '2. Background & Problem' },
                      { ko: '3. 목표 및 기대 효과', en: '3. Goals & Expected Impact' },
                      { ko: '4. 주요 사용자 정의', en: '4. Target Users' },
                      { ko: '5. 사용자 사용 맥락 및 핵심 이용 장면', en: '5. User Context & Scenarios' },
                      { ko: '6. 서비스 핵심 가치', en: '6. Core Value' },
                      { ko: '7. 핵심 기능 구성', en: '7. Core Features' },
                      { ko: '8. 주요 화면 및 정보 구조', en: '8. Key Screens & IA' },
                      { ko: '9. 운영 및 관리자 기능', en: '9. Admin Features' },
                      { ko: '10. 계정 / 권한 / 사용자 구분', en: '10. Accounts & Permissions' },
                      { ko: '11. 운영 정책 및 기본 운영 흐름', en: '11. Operation Policy' },
                      { ko: '12. 데이터 및 외부 연동 고려사항', en: '12. Data & Integrations' },
                      { ko: '13. 비기능 요구사항', en: '13. Non-functional Requirements' },
                      { ko: '14. 제약사항 / 가정 / 리스크', en: '14. Constraints & Risks' },
                      { ko: '15. 단계별 추진 방향', en: '15. Roadmap' },
                      { ko: '16. 성공 판단 기준 및 검토 포인트', en: '16. Success Criteria' },
                    ].map((s) => (
                      <option key={s.ko} value={s.ko}>{locale === 'ko' ? s.ko : s.en}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleDeepDive}
                    disabled={!deepDiveSection.trim()}
                    className="mt-3 px-5 py-2.5 text-sm font-bold text-white bg-tertiary-container rounded-xl hover:bg-tertiary-container/80 disabled:opacity-50 transition-colors"
                  >
                    {t('plan.deepDiveSubmit', locale)}
                  </button>
                </div>

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

          {/* 사이드바: 버전 히스토리 */}
          <div className="hidden lg:block">
            <div className="glass-card rounded-2xl p-5 border border-outline-variant/20 sticky top-8">
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">
                {locale === 'ko' ? '버전 히스토리' : 'Version History'}
              </h3>
              <div className="space-y-1.5 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {allDocuments.map((doc) => {
                  const isActive = document?.id === doc.id
                  return (
                    <button
                      key={doc.id}
                      onClick={() => { setDocument(doc); setStreamContent('') }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors ${
                        isActive
                          ? 'bg-primary-container/15 border border-primary-container/20'
                          : 'hover:bg-surface-container-high/50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-bold ${isActive ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                          v{doc.version}
                        </span>
                        {doc.is_finalized && (
                          <span className="text-[9px] font-bold text-secondary uppercase">Finalized</span>
                        )}
                      </div>
                      <span className="text-[11px] text-on-surface-variant">
                        {new Date(doc.created_at).toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
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
