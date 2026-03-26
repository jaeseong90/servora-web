'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Project } from '@/types'
import Sidebar from '@/components/layout/Sidebar'
import { t, getLocale, setLocale, type Locale } from '@/lib/i18n'

const statusConfig: Record<string, { label: string; step: number; color: string; hoverColor: string }> = {
  PLANNING: { label: 'Planning', step: 0, color: 'primary', hoverColor: 'hover:border-primary/40' },
  DESIGN: { label: 'Design', step: 1, color: 'primary', hoverColor: 'hover:border-primary/40' },
  MVP: { label: 'In Progress', step: 2, color: 'secondary', hoverColor: 'hover:border-secondary/40' },
  COMPLETED: { label: 'Completed', step: 4, color: 'secondary', hoverColor: 'hover:border-secondary/40' },
}

const workflowSteps = [
  { icon: 'event_note', label: 'Planning' },
  { icon: 'palette', label: 'Design' },
  { icon: 'rocket', label: 'MVP' },
  { icon: 'layers', label: 'Service' },
  { icon: 'settings_applications', label: 'Operation' },
]

export default function DashboardPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [showNewServiceModal, setShowNewServiceModal] = useState(false)
  const [newServiceName, setNewServiceName] = useState('')
  const [newServiceDesc, setNewServiceDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [createSuccess, setCreateSuccess] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [locale, setLocaleState] = useState<Locale>('ko')
  const [credits, setCredits] = useState<{ remaining: number; total: number } | null>(null)
  const notifyRef = useRef<HTMLDivElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'User')
      setUserEmail(user.email || '')

      const { data } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false })

      setProjects(data || [])
      setLoading(false)
      setLocaleState(getLocale())

      // 크레딧 조회
      fetch('/api/user/credits')
        .then(r => r.ok ? r.json() : null)
        .then(c => { if (c) setCredits({ remaining: c.remaining, total: c.total }) })
    }

    fetchData()
  }, [router])

  useEffect(() => {
    if (showNewServiceModal && nameInputRef.current) {
      nameInputRef.current.focus()
    }
  }, [showNewServiceModal])

  // Escape 키로 모달 닫기
  useEffect(() => {
    if (!showNewServiceModal) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !creating) {
        setShowNewServiceModal(false)
        setNewServiceName('')
        setNewServiceDesc('')
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showNewServiceModal, creating])

  // Close notification popup on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifyRef.current && !notifyRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const handleCreateService = async () => {
    if (!newServiceName.trim()) {
      alert(t('modal.nameRequired', locale))
      return
    }

    setCreating(true)

    try {
      const response = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newServiceName.trim(),
          description: newServiceDesc.trim() || null,
        }),
      })

      if (!response.ok) {
        setCreating(false)
        alert(t('modal.createFailed', locale))
        return
      }

      const { project } = await response.json()

      // 성공 애니메이션
      setCreateSuccess(true)
      await new Promise(r => setTimeout(r, 1500))

      setShowNewServiceModal(false)
      setCreating(false)
      setCreateSuccess(false)
      setNewServiceName('')
      setNewServiceDesc('')

      if (project) {
        router.push(`/projects/${project.id}/planning`)
      }
    } catch {
      setCreating(false)
      alert(t('modal.createFailed', locale))
    }
  }

  const activeCount = projects.length
  const latestProject = projects[0]
  const recentProjects = projects.slice(0, 3)

  const getStepIndex = (status: string) => {
    const cfg = statusConfig[status]
    return cfg ? cfg.step : 0
  }

  const notificationData: { service: string; time: string; action: string }[] = []

  return (
    <div className="bg-background text-on-background font-body">
      {/* New Service Modal */}
      {showNewServiceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-md" role="dialog" aria-modal="true" aria-label={t('modal.title', locale)}>
          <div className="max-w-xl w-full glass-card p-10 rounded-2xl shadow-[0_0_100px_rgba(124,58,237,0.2)] border border-outline-variant/20 relative overflow-hidden">
            {/* Glow effects */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary-container/20 rounded-full blur-[80px]" />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-secondary/10 rounded-full blur-[80px]" />
            <button
              className="absolute top-6 right-6 text-on-surface-variant hover:text-on-surface transition-colors"
              onClick={() => setShowNewServiceModal(false)}
              aria-label={locale === 'ko' ? '닫기' : 'Close'}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="relative z-10">
              {creating || createSuccess ? (
                /* 로딩/성공 상태 */
                <div className="flex flex-col items-center justify-center py-8">
                  {createSuccess ? (
                    <>
                      <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center mb-6 animate-[scale-in_0.3s_ease-out]">
                        <span className="material-symbols-outlined text-4xl text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      </div>
                      <h2 className="text-2xl font-black text-on-surface mb-2">{t('modal.success', locale)}</h2>
                      <p className="text-on-surface-variant">{t('modal.successDesc', locale)}</p>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 rounded-full bg-primary-container/20 flex items-center justify-center mb-6">
                        <div className="w-10 h-10 border-3 border-primary-container border-t-transparent rounded-full animate-spin" />
                      </div>
                      <h2 className="text-2xl font-black text-on-surface mb-2">{t('modal.creating', locale)}</h2>
                      <p className="text-on-surface-variant">{t('modal.creatingDesc', locale)}</p>
                      {/* Progress dots */}
                      <div className="flex gap-2 mt-6">
                        <div className="w-2 h-2 rounded-full bg-primary-container animate-[pulse_1.4s_ease-in-out_infinite]" />
                        <div className="w-2 h-2 rounded-full bg-primary-container animate-[pulse_1.4s_ease-in-out_0.2s_infinite]" />
                        <div className="w-2 h-2 rounded-full bg-primary-container animate-[pulse_1.4s_ease-in-out_0.4s_infinite]" />
                      </div>
                    </>
                  )}
                </div>
              ) : (
                /* 입력 폼 */
                <>
                  <div className="w-16 h-16 bg-surface-container-highest rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-outline-variant/30">
                    <span className="material-symbols-outlined text-3xl text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>add_box</span>
                  </div>
                  <h2 className="text-3xl font-black tracking-tight text-on-surface mb-2">{t('modal.title', locale)}</h2>
                  <p className="text-on-surface-variant mb-8">{t('modal.subtitle', locale)}</p>
                  <div className="space-y-6 text-left">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">{t('modal.nameLabel', locale)}</label>
                      <input
                        ref={nameInputRef}
                        className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 text-on-surface focus:ring-2 focus:ring-primary/40 focus:outline-none transition-all"
                        placeholder={t('modal.namePlaceholder', locale)}
                        type="text"
                        value={newServiceName}
                        onChange={(e) => setNewServiceName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateService()
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">{t('modal.descLabel', locale)}</label>
                      <textarea
                        className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 text-on-surface focus:ring-2 focus:ring-primary/40 focus:outline-none transition-all h-32 resize-none"
                        placeholder={t('modal.descPlaceholder', locale)}
                        value={newServiceDesc}
                        onChange={(e) => setNewServiceDesc(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 mt-10">
                    <button
                      className="flex-1 py-4 rounded-xl bg-surface-container-highest text-on-surface font-bold hover:bg-surface-container-high transition-colors"
                      onClick={() => {
                        setShowNewServiceModal(false)
                        setNewServiceName('')
                        setNewServiceDesc('')
                      }}
                    >
                      {t('modal.cancel', locale)}
                    </button>
                    <button
                      className="flex-1 py-4 rounded-xl bg-gradient-to-r from-primary-container to-secondary text-on-primary font-black shadow-lg shadow-primary-container/30 hover:scale-[1.02] active:scale-95 transition-all"
                      onClick={handleCreateService}
                    >
                      {t('modal.create', locale)}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <Sidebar
        userName={userName}
        userEmail={userEmail}
        onNewService={() => setShowNewServiceModal(true)}
        onLogout={handleLogout}
        locale={locale}
        onLocaleChange={(l) => { setLocale(l); setLocaleState(l) }}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
        credits={credits?.remaining ?? null}
      />

      {/* Main Content Area */}
      <main className="md:ml-64 min-h-screen relative flex flex-col main-content-transition">
        {/* Background Atmosphere */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary-container/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-5%] left-[5%] w-[40%] h-[40%] bg-secondary/5 blur-[100px] rounded-full" />
          <div className="absolute top-[20%] left-[20%] w-[30%] h-[30%] bg-tertiary-container/5 blur-[120px] rounded-full" />
        </div>

        {/* TopNavBar */}
        <header className="fixed top-0 right-0 w-full md:w-[calc(100%-16rem)] h-16 z-30 glass-topbar shadow-sm flex items-center justify-between px-4 md:px-8 border-b border-outline-variant/5">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50"
              onClick={() => setSidebarOpen(true)}
              aria-label={locale === 'ko' ? '메뉴 열기' : 'Open menu'}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h2 className="text-lg font-bold tracking-tight text-on-surface">Dashboard</h2>
            <div className="h-4 w-[1px] bg-outline-variant/20" />
            <div className="flex items-center gap-2 px-3 py-1 bg-surface-container-low rounded-full border border-outline-variant/10">
              <div className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(95,218,203,0.6)]" />
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">System Online</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative" ref={notifyRef}>
              <button
                className="relative w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-secondary hover:bg-surface-container/50 transition-all"
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label={locale === 'ko' ? '알림' : 'Notifications'}
                aria-expanded={showNotifications}
              >
                <span className="material-symbols-outlined">notifications</span>
                {notificationData.length > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-surface" />
                )}
              </button>
              {/* Notification Popup */}
              {showNotifications && (
                <div className="absolute top-full right-0 mt-3 w-96 glass-popup rounded-2xl overflow-hidden z-[60]">
                  <div className="p-4 border-b border-outline-variant/10 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-on-surface">{t('notify.title', locale)}</h3>
                    <button className="text-[10px] text-secondary font-bold hover:underline">{t('notify.markRead', locale)}</button>
                  </div>
                  {notificationData.length === 0 ? (
                    <div className="py-12 text-center">
                      <span className="material-symbols-outlined text-3xl text-on-surface-variant/30 mb-2">notifications_off</span>
                      <p className="text-sm text-on-surface-variant/60">
                        {locale === 'ko' ? '아직 알림이 없습니다' : 'No notifications yet'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-surface-container-highest/30 text-outline sticky top-0">
                            <tr>
                              <th className="px-4 py-2 font-bold uppercase tracking-wider">{t('notify.colService', locale)}</th>
                              <th className="px-4 py-2 font-bold uppercase tracking-wider">{t('notify.colTime', locale)}</th>
                              <th className="px-4 py-2 font-bold uppercase tracking-wider">{t('notify.colAction', locale)}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-outline-variant/10">
                            {notificationData.map((item, idx) => (
                              <tr key={idx} className="hover:bg-white/5 transition-colors">
                                <td className="px-4 py-3 font-medium text-on-surface">{item.service}</td>
                                <td className="px-4 py-3 text-on-surface-variant">{item.time}</td>
                                <td className="px-4 py-3 text-on-surface-variant">{item.action}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="p-3 bg-surface-container-highest/20 text-center border-t border-outline-variant/10">
                        <button className="text-[10px] text-outline hover:text-on-surface transition-colors font-bold uppercase tracking-widest">
                          {t('notify.viewAll', locale)}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="relative z-10 pt-24 px-4 md:px-8 pb-12 flex-1 flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center flex-1">
              <div className="text-on-surface-variant text-lg">{t('dash.loading', locale)}</div>
            </div>
          ) : (
            <>
              {/* Welcome Banner Section */}
              <div className="mb-10 relative overflow-hidden rounded-3xl bg-surface-container-low p-10 border border-outline-variant/10">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-container/10 blur-[100px] rounded-full" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                  <div>
                    <h1 className="text-4xl font-black text-on-surface tracking-tight mb-2">
                      {t('dash.welcome', locale).replace('{name}', userName)}
                    </h1>
                    <p className="text-on-surface-variant text-lg">{t('dash.subtitle', locale)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                    <div className="bg-surface-container/50 backdrop-blur-md p-6 rounded-2xl border border-outline-variant/10">
                      <div className="text-on-surface-variant text-xs font-bold mb-1 uppercase tracking-widest">{t('dash.credits', locale)}</div>
                      <div className="text-3xl font-black text-secondary">
                        {credits ? credits.remaining.toLocaleString() : '—'}
                      </div>
                    </div>
                    <div className="bg-surface-container/50 backdrop-blur-md p-6 rounded-2xl border border-outline-variant/10">
                      <div className="text-on-surface-variant text-xs font-bold mb-1 uppercase tracking-widest">{t('dash.activeServices', locale)}</div>
                      <div className="text-3xl font-black text-primary">
                        {String(activeCount).padStart(2, '0')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Workflow Summary Widget Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                {/* New Service Card */}
                <button
                  className="group relative flex flex-col justify-between p-8 rounded-3xl bg-gradient-to-br from-primary-container/20 to-surface-container-lowest border border-primary-container/20 text-left transition-all duration-300 hover:shadow-[0_0_30px_rgba(124,58,237,0.15)] overflow-hidden"
                  onClick={() => setShowNewServiceModal(true)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-container/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="h-14 w-14 rounded-2xl bg-primary-container flex items-center justify-center mb-6 shadow-xl shadow-primary-container/30 group-hover:scale-110 transition-transform relative z-10">
                    <span className="material-symbols-outlined text-3xl text-on-primary">add_box</span>
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold mb-2">{t('dash.newService', locale)}</h3>
                    <p className="text-on-surface-variant text-sm">{t('dash.newServiceDesc', locale)}</p>
                  </div>
                </button>

                {/* Recent Projects */}
                <div className="lg:col-span-2 glass-card p-8 rounded-3xl border border-outline-variant/10">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary">history</span>
                      {locale === 'ko' ? '최근 작업' : 'Recent Activity'}
                    </h3>
                  </div>
                  {recentProjects.length === 0 ? (
                    <p className="text-sm text-on-surface-variant text-center py-8">{t('dash.noService', locale)}</p>
                  ) : (
                    <div className="space-y-3">
                      {recentProjects.map((proj) => {
                        const cfg = statusConfig[proj.status] || statusConfig.PLANNING
                        const currentStep = getStepIndex(proj.status)
                        const statusPath = proj.status === 'PLANNING' ? 'planning' : proj.status === 'DESIGN' ? 'design' : 'mvp'
                        return (
                          <Link
                            key={proj.id}
                            href={`/projects/${proj.id}/${statusPath}`}
                            className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-lowest/50 border border-outline-variant/5 hover:border-primary-container/30 transition-all group"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-bold text-on-surface truncate group-hover:text-primary transition-colors">{proj.title}</h4>
                                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full ${
                                  cfg.color === 'secondary'
                                    ? 'bg-secondary/10 text-secondary border border-secondary/20'
                                    : 'bg-primary/10 text-primary border border-primary/20'
                                }`}>
                                  {cfg.label}
                                </span>
                              </div>
                              <span className="text-[11px] text-on-surface-variant">
                                {new Date(proj.updated_at || proj.created_at).toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', {
                                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                              </span>
                            </div>
                            {/* Step progress dots */}
                            <div className="flex gap-1.5">
                              {workflowSteps.slice(0, 3).map((step, idx) => (
                                <div
                                  key={step.label}
                                  className={`w-2 h-2 rounded-full ${
                                    idx < currentStep ? 'bg-secondary' : idx === currentStep ? 'bg-primary animate-pulse' : 'bg-outline/30'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="material-symbols-outlined text-on-surface-variant/30 group-hover:text-primary text-sm transition-colors">arrow_forward</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Service Card Grid */}
              <div>
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-on-surface mb-1">{t('dash.myServices', locale)}</h2>
                    <p className="text-on-surface-variant text-sm">{t('dash.myServicesDesc', locale)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2.5 rounded-xl bg-surface-container-high border border-outline-variant/10 text-on-surface-variant hover:text-secondary transition-colors">
                      <span className="material-symbols-outlined text-xl">filter_list</span>
                    </button>
                    <button className="p-2.5 rounded-xl bg-surface-container-high border border-outline-variant/10 text-secondary">
                      <span className="material-symbols-outlined text-xl">grid_view</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {projects.map((project) => {
                    const cfg = statusConfig[project.status] || statusConfig.PLANNING
                    const currentStep = getStepIndex(project.status)

                    return (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}/planning`}
                        className={`glass-card group p-6 rounded-3xl border border-outline-variant/10 ${cfg.hoverColor} transition-all duration-300 flex flex-col gap-6 cursor-pointer`}
                      >
                        {/* Workflow Step Indicators */}
                        <div className="flex flex-col gap-4 pb-4 border-b border-outline-variant/5">
                          <div className="flex gap-3">
                            {workflowSteps.map((step, idx) => {
                              const isCompleted = idx < currentStep
                              const isCurrent = idx === currentStep
                              const isLocked = idx > currentStep

                              return (
                                <div key={step.label} className={`flex flex-col items-center gap-1.5 ${isLocked ? 'opacity-20' : ''}`}>
                                  <span className={`material-symbols-outlined text-base ${
                                    isCompleted ? 'text-secondary' : isCurrent ? 'text-primary' : 'text-outline'
                                  }`}>
                                    {step.icon}
                                  </span>
                                  <div className={`w-1.5 h-1.5 rounded-full ${
                                    isCompleted
                                      ? 'bg-secondary shadow-[0_0_5px_rgba(95,218,203,0.8)]'
                                      : isCurrent
                                        ? 'bg-primary animate-pulse'
                                        : 'bg-outline'
                                  }`} />
                                  {isCurrent && (
                                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest whitespace-nowrap mt-1 ${
                                      cfg.color === 'secondary'
                                        ? 'bg-secondary/10 text-secondary border border-secondary/20'
                                        : 'bg-primary/10 text-primary border border-primary/20'
                                    }`}>
                                      {cfg.label}
                                    </span>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="flex-1">
                          <h4 className={`text-xl font-bold mb-2 group-hover:text-${cfg.color} transition-colors`}>
                            {project.title}
                          </h4>
                          {project.description && (
                            <p className="text-on-surface-variant text-sm line-clamp-2">{project.description}</p>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-4 border-t border-outline-variant/5">
                          <div className="flex flex-col">
                            <span className="text-[9px] text-outline font-bold uppercase tracking-widest mb-0.5">{t('dash.lastModified', locale)}</span>
                            <span className="text-[11px] text-on-surface-variant font-medium">
                              {new Date(project.updated_at || project.created_at).toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                              }).replace(/\./g, '.').replace(/\s/g, '')}
                            </span>
                          </div>
                          <span className={`px-4 py-2 ${
                            cfg.color === 'secondary' ? 'bg-secondary text-on-secondary' : 'bg-primary-container text-white'
                          } text-xs font-bold rounded-xl flex items-center gap-2`}>
                            {t('dash.continue', locale)} <span className="material-symbols-outlined text-sm">play_arrow</span>
                          </span>
                        </div>
                      </Link>
                    )
                  })}

                  {/* Add Service Card */}
                  <div
                    className="flex flex-col items-center justify-center p-12 rounded-3xl border-2 border-dashed border-outline-variant/20 bg-surface-container-lowest/50 text-center group hover:border-secondary/30 transition-colors cursor-pointer"
                    onClick={() => setShowNewServiceModal(true)}
                    role="button"
                    tabIndex={0}
                    aria-label={locale === 'ko' ? '새 서비스 추가' : 'Add new service'}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowNewServiceModal(true) }}
                  >
                    <div className="h-16 w-16 rounded-full bg-surface-container flex items-center justify-center mb-6 text-on-surface-variant/40 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-4xl">inventory_2</span>
                    </div>
                    <h4 className="font-bold text-on-surface-variant mb-6">{t('dash.newIdea', locale)}</h4>
                    <span className="flex items-center gap-2 py-2.5 px-6 rounded-full bg-surface-container-highest text-on-surface text-sm font-bold border border-outline-variant/30 group-hover:border-secondary/50 transition-all">
                      <span className="material-symbols-outlined text-base">add</span> {t('dash.addService', locale)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Floating Action Button */}
      <button
        className="fixed bottom-8 right-8 h-16 w-16 bg-gradient-to-br from-primary-container to-secondary rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(124,58,237,0.4)] hover:shadow-[0_15px_40px_rgba(124,58,237,0.6)] hover:-translate-y-1 active:translate-y-0 active:scale-90 transition-all z-50"
        onClick={() => setShowNewServiceModal(true)}
        aria-label={locale === 'ko' ? '새 서비스 만들기' : 'Create new service'}
      >
        <span className="material-symbols-outlined text-on-primary text-3xl">add</span>
      </button>
    </div>
  )
}
