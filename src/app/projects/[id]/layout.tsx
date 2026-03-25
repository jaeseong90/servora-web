'use client'

import { useEffect, useState } from 'react'
import { useParams, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ProjectSidebar from '@/components/layout/ProjectSidebar'
import type { Project } from '@/types'

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const pathname = usePathname()
  const [project, setProject] = useState<Project | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const fetchProject = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('id', params.id)
        .single()
      setProject(data)
    }
    if (params.id) fetchProject()
  }, [params.id, pathname])

  return (
    <div className="flex min-h-screen bg-background text-on-background">
      <ProjectSidebar
        project={project}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 z-30 glass-topbar flex items-center px-4 border-b border-outline-variant/5">
        <button
          className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <span className="ml-2 text-sm font-bold text-on-surface truncate">{project?.title || 'Servora'}</span>
      </div>
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-18 md:pt-8">{children}</main>
    </div>
  )
}
