'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/layout/Sidebar'
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
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar project={project} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
