'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Project } from '@/types'

interface ProjectSidebarProps {
  project: Project | null
  mobileOpen?: boolean
  onMobileClose?: () => void
}

const steps = [
  { key: 'planning', label: 'Planning', icon: 'event_note', path: 'planning', requiredStatus: ['PLANNING', 'DESIGN', 'MVP', 'COMPLETED'] },
  { key: 'design', label: 'Design', icon: 'palette', path: 'design', requiredStatus: ['DESIGN', 'MVP', 'COMPLETED'] },
  { key: 'mvp', label: 'MVP', icon: 'rocket', path: 'mvp', requiredStatus: ['MVP', 'COMPLETED'] },
]

function getStepState(stepKey: string, projectStatus: string) {
  const statusOrder = ['PLANNING', 'DESIGN', 'MVP', 'COMPLETED']
  const stepIndex = steps.findIndex(s => s.key === stepKey)
  const currentIndex = statusOrder.indexOf(projectStatus)
  if (stepIndex < currentIndex) return 'completed'
  if (stepIndex === currentIndex) return 'active'
  return 'locked'
}

export default function ProjectSidebar({ project, mobileOpen = false, onMobileClose }: ProjectSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [showUserPopup, setShowUserPopup] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'User')
        setUserEmail(user.email || '')
      }
    }
    fetchUser()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const sidebarContent = (
      <div className="flex flex-col h-full py-8 justify-between">
        {/* Branding */}
        <div className={`flex flex-col gap-6 ${collapsed ? 'px-4 items-center' : 'px-6'}`}>
          <div className={`flex items-center ${collapsed ? 'flex-col gap-4' : 'justify-between'}`}>
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-container to-secondary flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>token</span>
              </div>
              {!collapsed && (
                <h1 className="text-xl font-bold bg-gradient-to-br from-primary-container to-secondary bg-clip-text text-transparent tracking-tight">
                  Servora
                </h1>
              )}
            </Link>
            <button
              onClick={() => { if (onMobileClose) onMobileClose(); else setCollapsed(!collapsed); }}
              className="text-on-surface-variant hover:text-secondary transition-colors p-1 rounded-md hover:bg-surface-container-high"
            >
              <span className="material-symbols-outlined">
                {collapsed ? 'menu' : 'menu_open'}
              </span>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 mt-10 space-y-8 overflow-y-auto custom-scrollbar">
          {/* Console */}
          <nav className="space-y-1">
            {!collapsed && (
              <div className="px-6 mb-2">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-outline">Console</span>
              </div>
            )}
            <Link
              href="/dashboard"
              className={`flex items-center gap-4 py-2.5 px-6 transition-all duration-200 text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50 ${collapsed ? 'justify-center px-0' : ''}`}
            >
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              {!collapsed && <span className="text-sm font-medium tracking-tight">Dashboard</span>}
            </Link>
            {project && (
              <div className={`flex items-center gap-4 py-2.5 px-6 bg-primary-container/20 text-white border-l-2 border-secondary ${collapsed ? 'justify-center px-0' : ''}`}>
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>account_tree</span>
                {!collapsed && <span className="text-sm font-bold tracking-tight truncate">{project.title}</span>}
              </div>
            )}
          </nav>

          {/* Service Tools */}
          <nav className="space-y-1">
            {!collapsed && (
              <div className="px-6 mb-2">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-outline">Service Tools</span>
              </div>
            )}
            {steps.map((step) => {
              if (!project) return null
              const state = getStepState(step.key, project.status)
              const isActive = pathname.includes(`/projects/${project.id}/${step.path}`)
              const isAccessible = step.requiredStatus.includes(project.status)

              if (!isAccessible) {
                return (
                  <div key={step.key} className={`flex items-center gap-4 text-on-surface-variant py-2.5 px-6 opacity-30 cursor-not-allowed ${collapsed ? 'justify-center px-0' : ''}`}>
                    <span className="material-symbols-outlined text-[20px]">{step.icon}</span>
                    {!collapsed && <span className="text-sm font-medium">{step.label}</span>}
                  </div>
                )
              }

              return (
                <Link
                  key={step.key}
                  href={`/projects/${project.id}/${step.path}`}
                  className={`flex items-center gap-4 py-2.5 px-6 transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-container/20 text-white border-l-2 border-secondary'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50'
                  } ${collapsed ? 'justify-center px-0' : ''}`}
                >
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {step.icon}
                  </span>
                  {!collapsed && (
                    <span className={`text-sm tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                      {step.label}
                    </span>
                  )}
                  {!collapsed && state === 'completed' && (
                    <span className="ml-auto text-[9px] font-bold text-secondary uppercase tracking-widest">Done</span>
                  )}
                </Link>
              )
            })}
            {/* Locked future items */}
            <div className={`flex items-center justify-between py-2.5 px-6 opacity-40 cursor-not-allowed ${collapsed ? 'justify-center px-0' : ''}`}>
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-[20px]">layers</span>
                {!collapsed && <span className="text-sm font-medium">Service</span>}
              </div>
              {!collapsed && (
                <span className="text-[9px] bg-surface-container-highest text-on-surface px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Soon</span>
              )}
            </div>
            <div className={`flex items-center justify-between py-2.5 px-6 opacity-40 cursor-not-allowed ${collapsed ? 'justify-center px-0' : ''}`}>
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-[20px]">settings_applications</span>
                {!collapsed && <span className="text-sm font-medium">Operation</span>}
              </div>
              {!collapsed && (
                <span className="text-[9px] bg-surface-container-highest text-on-surface px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Soon</span>
              )}
            </div>
          </nav>
        </div>

        {/* Bottom: User */}
        <div className="mt-auto space-y-1 relative">
          {!collapsed && (
            <div className="px-6 mb-4">
              <a href="#" className="w-full flex items-center justify-between p-3 bg-surface-container-highest/40 rounded-xl border border-outline-variant/10 hover:bg-surface-container-highest/60 transition-colors group">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-secondary">Upgrade Plan</span>
                  <span className="text-[10px] text-on-surface-variant">Unlock Enterprise</span>
                </div>
                <span className="material-symbols-outlined text-secondary group-hover:translate-x-1 transition-transform text-sm">upgrade</span>
              </a>
            </div>
          )}
          <div
            className={`mt-4 pt-4 border-t border-outline-variant/10 relative ${collapsed ? 'px-4' : 'px-6'}`}
            onMouseEnter={() => setShowUserPopup(true)}
            onMouseLeave={() => setShowUserPopup(false)}
          >
            <div className={`flex items-center gap-3 p-2 rounded-xl hover:bg-surface-container-high transition-colors cursor-pointer ${collapsed ? 'justify-center' : ''}`}>
              <div className="relative w-9 h-9 rounded-full overflow-hidden border border-primary-container/20 hover:border-primary-container/50 transition-colors flex-shrink-0 bg-surface-container-highest flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant text-lg">person</span>
              </div>
              {!collapsed && (
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-bold truncate text-on-surface">{userName}</span>
                  <span className="text-[10px] text-on-surface-variant truncate">{userEmail}</span>
                </div>
              )}
            </div>
            {showUserPopup && (
              <div className="absolute bottom-full left-6 w-56 mb-2 glass-popup rounded-2xl overflow-hidden z-[60]">
                <div className="p-4 border-b border-outline-variant/10">
                  <p className="text-[10px] text-outline uppercase font-bold tracking-widest mb-1">Account</p>
                  <p className="text-sm font-bold text-on-surface">{userName}</p>
                </div>
                <div className="py-2 border-t border-outline-variant/10">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-error/80 hover:text-error hover:bg-error/10 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">logout</span> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  )

  return (
    <>
      {/* Desktop */}
      <aside
        className={`hidden md:flex h-screen fixed left-0 top-0 flex-col glass-sidebar z-50 shadow-[20px_0_40px_-5px_rgba(0,0,0,0.4)] ${
          collapsed ? 'w-20' : 'w-64'
        }`}
        style={{ transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/60 z-40" onClick={onMobileClose} />
          <aside className="md:hidden fixed left-0 top-0 w-72 h-screen flex flex-col glass-sidebar z-50 shadow-[20px_0_40px_-5px_rgba(0,0,0,0.4)]">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  )
}
