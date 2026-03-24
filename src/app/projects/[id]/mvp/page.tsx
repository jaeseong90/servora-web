'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import type { MvpBuildQueue } from '@/types'

export default function MvpPage() {
  const params = useParams()
  const projectId = params.id as string

  const [buildStatus, setBuildStatus] = useState<MvpBuildQueue | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/mvp/status`)
      if (response.ok) {
        const data = await response.json()
        setBuildStatus(data.build || null)
      }
    } catch { /* ignore */ }
  }, [projectId])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  // 폴링: PENDING 또는 BUILDING 상태일 때 5초마다 확인
  useEffect(() => {
    if (!buildStatus) return
    if (buildStatus.status !== 'PENDING' && buildStatus.status !== 'BUILDING') return

    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [buildStatus, fetchStatus])

  const handleGenerate = async () => {
    if (!confirm('MVP 생성을 요청하시겠습니까?')) return

    setGenerating(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/mvp/generate`, {
        method: 'POST',
      })

      if (response.ok) {
        await fetchStatus()
      } else {
        const data = await response.json()
        alert(data.error || 'MVP 생성 요청 중 오류가 발생했습니다.')
      }
    } catch {
      alert('MVP 생성 요청 중 오류가 발생했습니다.')
    } finally {
      setGenerating(false)
    }
  }

  const statusDisplay: Record<string, { label: string; color: string; description: string }> = {
    PENDING: {
      label: '대기 중',
      color: 'bg-yellow-100 text-yellow-800',
      description: 'MVP 생성 요청이 큐에 등록되었습니다. 곧 처리가 시작됩니다.',
    },
    BUILDING: {
      label: '빌드 중',
      color: 'bg-blue-100 text-blue-800',
      description: 'AI가 MVP를 생성하고 있습니다. 잠시만 기다려주세요.',
    },
    COMPLETED: {
      label: '완료',
      color: 'bg-green-100 text-green-800',
      description: 'MVP가 성공적으로 생성되었습니다!',
    },
    FAILED: {
      label: '실패',
      color: 'bg-red-100 text-red-800',
      description: 'MVP 생성 중 오류가 발생했습니다.',
    },
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">MVP 생성</h1>

      {!buildStatus ? (
        <div className="bg-white rounded-xl p-8 shadow-sm text-center">
          <div className="text-4xl mb-4">&#x1F680;</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">MVP를 생성할 준비가 되었습니다</h2>
          <p className="text-sm text-gray-600 mb-6">
            확정된 기획안과 디자인 선호도를 바탕으로 AI가 MVP를 자동으로 생성합니다.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-8 py-3 text-white bg-blue-600 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? '요청 중...' : 'MVP 생성 요청'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 상태 카드 */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusDisplay[buildStatus.status]?.color}`}>
                {statusDisplay[buildStatus.status]?.label}
              </span>
              {(buildStatus.status === 'PENDING' || buildStatus.status === 'BUILDING') && (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            <p className="text-sm text-gray-600">
              {statusDisplay[buildStatus.status]?.description}
            </p>

            {buildStatus.build_duration_ms && (
              <p className="mt-2 text-xs text-gray-400">
                빌드 시간: {Math.round(buildStatus.build_duration_ms / 1000)}초
              </p>
            )}
          </div>

          {/* 결과 */}
          {buildStatus.status === 'COMPLETED' && (
            <div className="bg-green-50 rounded-xl p-6">
              <h3 className="font-semibold text-green-900 mb-3">배포 완료</h3>
              {buildStatus.vercel_url && (
                <div className="mb-3">
                  <label className="block text-xs text-green-700 mb-1">Vercel URL</label>
                  <a
                    href={buildStatus.vercel_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm break-all"
                  >
                    {buildStatus.vercel_url}
                  </a>
                </div>
              )}
              {buildStatus.github_repo && (
                <div>
                  <label className="block text-xs text-green-700 mb-1">GitHub 레포</label>
                  <a
                    href={buildStatus.github_repo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm break-all"
                  >
                    {buildStatus.github_repo}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* 에러 */}
          {buildStatus.status === 'FAILED' && buildStatus.error_message && (
            <div className="bg-red-50 rounded-xl p-6">
              <h3 className="font-semibold text-red-900 mb-2">오류 상세</h3>
              <p className="text-sm text-red-700">{buildStatus.error_message}</p>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="mt-4 px-6 py-2 text-white bg-red-600 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
              >
                다시 시도
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
