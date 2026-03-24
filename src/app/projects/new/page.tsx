'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/layout/Sidebar'

export default function NewProjectPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('프로젝트 제목을 입력하세요.')
      return
    }

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data, error: insertError } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push(`/projects/${data.id}/planning`)
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-lg mx-auto">
          <div className="mb-6">
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
              &larr; 대시보드로 돌아가기
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-6">새 프로젝트 만들기</h1>

          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm space-y-5">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>
            )}

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                프로젝트 제목 *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="예: 반려동물 돌봄 서비스"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                간단한 설명
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                placeholder="프로젝트에 대한 간단한 설명을 입력하세요"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-white bg-blue-600 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '생성 중...' : '프로젝트 생성'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
