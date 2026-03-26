'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { t, type Locale } from '@/lib/i18n'

interface SidebarProps {
  userName: string
  userEmail: string
  onNewService: () => void
  onLogout: () => void
  locale?: Locale
  onLocaleChange?: (l: Locale) => void
  mobileOpen?: boolean
  onMobileClose?: () => void
  credits?: number | null
}

export default function Sidebar({ userName, userEmail, onNewService, onLogout, locale = 'ko', onLocaleChange, mobileOpen = false, onMobileClose, credits }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [showUserPopup, setShowUserPopup] = useState(false)

  const isDashboard = pathname === '/dashboard'

  const renderContent = (isMobile: boolean) => {
    // 모바일에서는 항상 펼침 상태
    const c = !isMobile && collapsed

    return (
      <div className="flex flex-col h-full py-8 justify-between">
        {/* Section 1: Branding & Action */}
        <div className={`flex flex-col gap-6 ${c ? 'px-4 items-center' : 'px-6'}`}>
          <div className={`flex items-center ${c ? 'flex-col gap-4' : 'justify-between'}`}>
            <Link href="/dashboard" className="flex items-center gap-3" onClick={isMobile ? onMobileClose : undefined}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-container to-secondary flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>token</span>
              </div>
              {!c && (
                <h1 className="text-xl font-bold bg-gradient-to-br from-primary-container to-secondary bg-clip-text text-transparent tracking-tight">
                  Servora
                </h1>
              )}
            </Link>
            <button
              onClick={() => {
                if (isMobile) { onMobileClose?.() } else { setCollapsed(!collapsed) }
              }}
              className="text-on-surface-variant hover:text-secondary transition-colors p-1 rounded-md hover:bg-surface-container-high"
              aria-label={isMobile ? (locale === 'ko' ? '닫기' : 'Close') : (c ? (locale === 'ko' ? '메뉴 열기' : 'Open menu') : (locale === 'ko' ? '메뉴 접기' : 'Collapse menu'))}
            >
              <span className="material-symbols-outlined">
                {isMobile ? 'close' : c ? 'menu' : 'menu_open'}
              </span>
            </button>
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => { onNewService(); if (isMobile) onMobileClose?.() }}
              className={`bg-gradient-to-r from-primary-container via-[#9333ea] to-secondary text-white font-semibold shadow-[0_0_20px_rgba(124,58,237,0.3)] flex items-center justify-center gap-2 hover:shadow-[0_0_25px_rgba(124,58,237,0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 border-none ${
                c ? 'w-12 h-12 rounded-full p-0' : 'w-full h-11 rounded-lg'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              {!c && <span className="text-[13px] tracking-wide">New Service</span>}
            </button>
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 mt-10 space-y-8 overflow-y-auto custom-scrollbar">
          {/* Console Section */}
          <nav className="space-y-1">
            {!c && (
              <div className="px-6 mb-2">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-outline">Console</span>
              </div>
            )}
            <Link
              href="/dashboard"
              onClick={isMobile ? onMobileClose : undefined}
              className={`flex items-center gap-4 py-2.5 px-6 transition-all duration-200 ${
                isDashboard
                  ? 'bg-primary-container/20 text-white border-l-2 border-secondary'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50'
              } ${c ? 'justify-center px-0' : ''}`}
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={isDashboard ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                dashboard
              </span>
              {!c && (
                <span className={`text-sm tracking-tight ${isDashboard ? 'font-bold' : 'font-medium'}`}>
                  Dashboard
                </span>
              )}
            </Link>
            <div
              className={`flex items-center gap-4 py-2.5 px-6 text-on-surface-variant opacity-30 cursor-not-allowed ${
                c ? 'justify-center px-0' : ''
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">account_tree</span>
              {!c && <span className="text-sm font-medium">Select Service</span>}
            </div>
          </nav>

          {/* Service Tools Section */}
          <nav className="space-y-1">
            {!c && (
              <div className="px-6 mb-2">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-outline">Service Tools</span>
              </div>
            )}
            {['Planning', 'Design', 'MVP'].map((label) => (
              <div key={label} className={`flex items-center gap-4 text-on-surface-variant py-2.5 px-6 opacity-30 cursor-not-allowed ${c ? 'justify-center px-0' : ''}`}>
                <span className="material-symbols-outlined text-[20px]">
                  {label === 'Planning' ? 'event_note' : label === 'Design' ? 'palette' : 'rocket'}
                </span>
                {!c && <span className="text-sm font-medium">{label}</span>}
              </div>
            ))}
            {['Service', 'Operation'].map((label) => (
              <div key={label} className={`flex items-center justify-between py-2.5 px-6 opacity-40 cursor-not-allowed ${c ? 'justify-center px-0' : ''}`}>
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-[20px]">
                    {label === 'Service' ? 'layers' : 'settings_applications'}
                  </span>
                  {!c && <span className="text-sm font-medium">{label}</span>}
                </div>
                {!c && (
                  <span className="text-[9px] bg-surface-container-highest text-on-surface px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Soon</span>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Section 4: Utility & User */}
        <div className="mt-auto space-y-1 relative">
          <a href="#" className={`flex items-center gap-4 text-on-surface-variant hover:text-on-surface py-2 px-6 transition-colors text-xs font-medium ${c ? 'justify-center px-0' : ''}`}>
            <span className="material-symbols-outlined text-[18px]">mail</span>
            {!c && <span>{t('nav.contact', locale)}</span>}
          </a>
          <a href="#" className={`flex items-center gap-4 text-on-surface-variant hover:text-on-surface py-2 px-6 transition-colors text-xs font-medium ${c ? 'justify-center px-0' : ''}`}>
            <span className="material-symbols-outlined text-[18px]">support_agent</span>
            {!c && <span>{t('nav.support', locale)}</span>}
          </a>

          {/* Language Switcher */}
          {onLocaleChange && (
            <div className={`flex items-center gap-1 py-2 ${c ? 'justify-center px-2' : 'px-6'}`}>
              <span className={`material-symbols-outlined text-[18px] text-on-surface-variant ${c ? '' : 'mr-2'}`}>translate</span>
              {!c && (
                <>
                  <button
                    onClick={() => onLocaleChange('ko')}
                    className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                      locale === 'ko' ? 'bg-primary-container/30 text-on-surface font-bold' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    한국어
                  </button>
                  <button
                    onClick={() => onLocaleChange('en')}
                    className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                      locale === 'en' ? 'bg-primary-container/30 text-on-surface font-bold' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    EN
                  </button>
                </>
              )}
            </div>
          )}

          {/* User Profile Section */}
          <div
            className={`mt-4 pt-4 border-t border-outline-variant/10 relative ${c ? 'px-4' : 'px-6'}`}
            onMouseEnter={() => setShowUserPopup(true)}
            onMouseLeave={() => setShowUserPopup(false)}
          >
            <div className={`flex items-center gap-3 p-2 rounded-xl hover:bg-surface-container-high transition-colors cursor-pointer ${c ? 'justify-center' : ''}`}>
              <div className="relative w-9 h-9 rounded-full overflow-hidden border border-primary-container/20 flex-shrink-0 bg-surface-container-highest flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant text-lg">person</span>
              </div>
              {!c && (
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
                <div className="py-2">
                  <a href="#" className="flex items-center gap-3 px-4 py-2.5 text-xs text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors">
                    <span className="material-symbols-outlined text-lg">person</span> {t('nav.myInfo', locale)}
                  </a>
                  <a href="#" className="flex items-center justify-between px-4 py-2.5 text-xs text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-lg">database</span> {t('nav.remainCredits', locale)}
                    </div>
                    <span className="text-[10px] font-bold text-secondary">{credits != null ? credits.toLocaleString() : '—'}</span>
                  </a>
                  <a href="#" className="flex items-center gap-3 px-4 py-2.5 text-xs text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors">
                    <span className="material-symbols-outlined text-lg">payments</span> Billing
                  </a>
                </div>
                <div className="py-2 border-t border-outline-variant/10">
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-error/80 hover:text-error hover:bg-error/10 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">logout</span> {t('nav.logout', locale)}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex h-screen fixed left-0 top-0 flex-col glass-sidebar z-50 shadow-[20px_0_40px_-5px_rgba(0,0,0,0.4)] ${
          collapsed ? 'w-20' : 'w-64'
        }`}
        style={{ transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        {renderContent(false)}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/60 z-40" onClick={onMobileClose} />
          <aside className="md:hidden fixed left-0 top-0 w-72 h-screen flex flex-col glass-sidebar z-50 shadow-[20px_0_40px_-5px_rgba(0,0,0,0.4)]">
            {renderContent(true)}
          </aside>
        </>
      )}
    </>
  )
}
