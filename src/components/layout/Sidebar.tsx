'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Project } from '@/types'

interface SidebarProps {
  project?: Project | null
}

const steps = [
  { key: 'planning', label: '기획', path: 'planning', requiredStatus: ['PLANNING', 'DESIGN', 'MVP', 'COMPLETED'] },
  { key: 'design', label: '디자인', path: 'design', requiredStatus: ['DESIGN', 'MVP', 'COMPLETED'] },
  { key: 'mvp', label: 'MVP', path: 'mvp', requiredStatus: ['MVP', 'COMPLETED'] },
]

function getStepState(stepKey: string, projectStatus: string) {
  const statusOrder = ['PLANNING', 'DESIGN', 'MVP', 'COMPLETED']
  const stepIndex = steps.findIndex(s => s.key === stepKey)
  const currentIndex = statusOrder.indexOf(projectStatus)

  if (stepIndex < currentIndex) return 'completed'
  if (stepIndex === currentIndex) return 'active'
  return 'locked'
}

export default function Sidebar({ project }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      {/* 로고 */}
      <div className="px-6 py-5 border-b border-gray-200">
        <Link href="/dashboard" className="text-xl font-bold text-blue-600">
          Servora
        </Link>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
            pathname === '/dashboard'
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <span className="w-5 text-center">&#x1F4CB;</span>
          대시보드
        </Link>

        {project && (
          <>
            <div className="pt-4 pb-2 px-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">프로젝트</p>
              <p className="text-sm font-medium text-gray-900 mt-1 truncate">{project.title}</p>
            </div>

            {steps.map((step) => {
              const state = getStepState(step.key, project.status)
              const isActive = pathname.includes(`/projects/${project.id}/${step.path}`)
              const isAccessible = step.requiredStatus.includes(project.status)

              return (
                <div key={step.key}>
                  {isAccessible ? (
                    <Link
                      href={`/projects/${project.id}/${step.path}`}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="w-5 text-center">
                        {state === 'completed' ? '\u2705' : step.key === 'planning' ? '\u270F\uFE0F' : step.key === 'design' ? '\uD83C\uDFA8' : '\uD83D\uDE80'}
                      </span>
                      {step.label}
                      {state === 'completed' && (
                        <span className="ml-auto text-xs text-green-600">완료</span>
                      )}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 cursor-not-allowed">
                      <span className="w-5 text-center">{'\uD83D\uDD12'}</span>
                      {step.label}
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}
      </nav>

      {/* 로그아웃 */}
      <div className="px-4 py-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          로그아웃
        </button>
      </div>
    </aside>
  )
}
