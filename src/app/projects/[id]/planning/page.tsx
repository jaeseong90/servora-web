'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { marked } from 'marked'
import type { Project, PlanningDocument, QuestionnaireData } from '@/types'

const questions = [
  { key: 'q1', label: '서비스 핵심 아이디어', placeholder: '어떤 서비스를 만들고 싶으신가요?' },
  { key: 'q2', label: '타겟 사용자', placeholder: '누구를 위한 서비스인가요?' },
  { key: 'q3', label: '핵심 기능 3가지', placeholder: '가장 중요한 기능 3가지를 알려주세요.' },
  { key: 'q4', label: '차별화 포인트', placeholder: '기존 서비스와 어떻게 다른가요?' },
  { key: 'q5', label: '수익 모델', placeholder: '어떻게 수익을 낼 계획인가요?' },
  { key: 'q6', label: '사용자 여정', placeholder: '사용자가 서비스를 어떻게 이용하나요?' },
  { key: 'q7', label: '필수 데이터', placeholder: '서비스에 꼭 필요한 데이터는 무엇인가요?' },
  { key: 'q8', label: '외부 연동', placeholder: '외부 서비스와 연동이 필요한가요?' },
  { key: 'q9', label: 'MVP 론칭 범위', placeholder: '처음에 어디까지 만들고 싶으신가요?' },
  { key: 'q10', label: '성공 지표', placeholder: '성공을 어떻게 측정할 건가요?' },
]

export default function PlanningPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [questionnaire, setQuestionnaire] = useState<Record<string, string>>({})
  const [document, setDocument] = useState<PlanningDocument | null>(null)
  const [streamContent, setStreamContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [deepDiveSection, setDeepDiveSection] = useState('')
  const [showForm, setShowForm] = useState(true)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchData = async () => {
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
      alert('최소 3개 이상의 질문에 답해주세요.')
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
                // 문서 새로 로드
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
                alert(`오류: ${data.message}`)
              }
            } catch { /* ignore */ }
          }
        }
      }
    } catch (err) {
      alert('기획안 생성 중 오류가 발생했습니다.')
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
    if (!confirm('기획안을 확정하시겠습니까? 확정 후에는 디자인 단계로 이동합니다.')) return

    try {
      const response = await fetch(`/api/projects/${projectId}/planning/finalize`, {
        method: 'POST',
      })
      if (response.ok) {
        router.push(`/projects/${projectId}/design`)
        router.refresh()
      } else {
        alert('확정 중 오류가 발생했습니다.')
      }
    } catch {
      alert('확정 중 오류가 발생했습니다.')
    }
  }

  const displayContent = streamContent || document?.content || ''

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">기획</h1>

      {/* 설문 폼 */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">서비스 기획 질문</h2>
          <p className="text-sm text-gray-500 mb-6">최소 3개 이상 답변해주세요. 자세할수록 좋은 기획안이 나옵니다.</p>

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
            {isGenerating ? 'AI가 기획안을 작성 중...' : 'AI 기획안 생성'}
          </button>
        </div>
      )}

      {/* 기획안 표시 */}
      {displayContent && (
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              기획안 {document ? `v${document.version}` : ''}
            </h2>
            <div className="flex gap-2">
              {!showForm && !document?.is_finalized && (
                <button
                  onClick={() => setShowForm(true)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  질문 수정
                </button>
              )}
            </div>
          </div>

          {isGenerating && (
            <div className="mb-4 flex items-center gap-2 text-sm text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              AI가 작성 중...
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
            <h3 className="text-sm font-semibold text-gray-900 mb-3">피드백 반영</h3>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-sm"
              placeholder="수정하고 싶은 내용을 입력하세요"
            />
            <button
              onClick={handleFeedback}
              disabled={!feedback.trim()}
              className="mt-3 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              피드백 반영
            </button>
          </div>

          {/* 딥다이브 */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">섹션 딥다이브</h3>
            <input
              value={deepDiveSection}
              onChange={(e) => setDeepDiveSection(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              placeholder="깊이 분석할 섹션 번호 또는 이름 (예: 7. 핵심 기능 구성)"
            />
            <button
              onClick={handleDeepDive}
              disabled={!deepDiveSection.trim()}
              className="mt-3 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              딥다이브
            </button>
          </div>

          {/* 확정 */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <button
              onClick={handleFinalize}
              className="w-full py-3 text-white bg-green-600 rounded-lg font-medium hover:bg-green-700"
            >
              기획안 확정 &rarr; 디자인 단계로 이동
            </button>
          </div>
        </div>
      )}

      {document?.is_finalized && (
        <div className="bg-green-50 rounded-xl p-6 text-center">
          <p className="text-green-700 font-medium">기획안이 확정되었습니다.</p>
          <button
            onClick={() => router.push(`/projects/${projectId}/design`)}
            className="mt-3 px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 font-medium"
          >
            디자인 단계로 이동
          </button>
        </div>
      )}
    </div>
  )
}
