'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ProjectSidebar from '@/components/layout/ProjectSidebar'
import type { Project } from '@/types'

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const [project, setProject] = useState<Project | null>(null)

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
  }, [params.id])

  return (
    <div className="flex min-h-screen bg-background text-on-background">
      <ProjectSidebar project={project} />
      <main className="flex-1 ml-64 p-8">{children}</main>
    </div>
  )
}
