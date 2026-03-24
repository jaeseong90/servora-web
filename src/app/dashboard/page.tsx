'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Project } from '@/types'
import Sidebar from '@/components/layout/Sidebar'

export default function DashboardPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProjects = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      setProjects(data || [])
      setLoading(false)
    }

    fetchProjects()
  }, [router])

  const statusLabels: Record<string, { label: string; color: string }> = {
    PLANNING: { label: '기획 중', color: 'bg-yellow-100 text-yellow-800' },
    DESIGN: { label: '디자인', color: 'bg-purple-100 text-purple-800' },
    MVP: { label: 'MVP', color: 'bg-blue-100 text-blue-800' },
    COMPLETED: { label: '완료', color: 'bg-green-100 text-green-800' },
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">내 프로젝트</h1>
          <Link
            href="/projects/new"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            + 새 프로젝트
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">로딩 중...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">아직 프로젝트가 없습니다.</p>
            <Link
              href="/projects/new"
              className="px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-medium"
            >
              첫 프로젝트 만들기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const status = statusLabels[project.status] || statusLabels.PLANNING
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}/planning`}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 truncate">{project.title}</h3>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  {project.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{project.description}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    {new Date(project.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
