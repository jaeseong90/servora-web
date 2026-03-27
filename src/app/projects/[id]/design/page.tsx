'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getLocale, type Locale } from '@/lib/i18n'
import type { DesignBlueprint, PhaseStatus, BrandIdentity, ServiceArchitecture as ServiceArchitectureType, ScreenDetail } from '@/types'

import DesignStepIndicator from '@/components/design/DesignStepIndicator'
import BrandConsultation from '@/components/design/BrandConsultation'
import ServiceArchitecture from '@/components/design/ServiceArchitecture'
import ScreenDeepDive from '@/components/design/ScreenDeepDive'
import FinalBlueprint from '@/components/design/FinalBlueprint'

const DEFAULT_PHASE_STATUS: Record<string, PhaseStatus> = {
  '1': 'pending', '2': 'pending', '3': 'pending', '4': 'pending',
}

const EMPTY_BLUEPRINT: DesignBlueprint = {
  brand: null, architecture: null, screenDetails: [], entities: [], finalized: false,
}

export default function DesignPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [locale, setLocaleState] = useState<Locale>('ko')
  const [loading, setLoading] = useState(true)
  const [projectStatus, setProjectStatus] = useState('DESIGN')
  const [blueprint, setBlueprint] = useState<DesignBlueprint>(EMPTY_BLUEPRINT)
  const [currentPhase, setCurrentPhase] = useState(1)
  const [phaseStatus, setPhaseStatus] = useState<Record<string, PhaseStatus>>(DEFAULT_PHASE_STATUS)
  const [error, setError] = useState('')

  // 데이터 로드
  useEffect(() => {
    setLocaleState(getLocale())
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/design/blueprint`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setProjectStatus(data.projectStatus)
        if (data.blueprint) setBlueprint(data.blueprint)
        if (data.currentPhase) setCurrentPhase(Math.max(data.currentPhase, 1))
        if (data.phaseStatus) setPhaseStatus(data.phaseStatus)
      } catch {
        setError(locale === 'ko' ? '데이터를 불러오는데 실패했습니다.' : 'Failed to load data.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [projectId, locale])

  // Phase approve handler
  const handleApprove = useCallback(async (phase: number) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/design/phase/${phase}/approve`, {
        method: 'POST',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || '승인에 실패했습니다.')
      }
      const data = await res.json()
      setPhaseStatus(data.phaseStatus)
      setCurrentPhase(data.currentPhase)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    }
  }, [projectId])

  // Finalize handler
  const handleFinalize = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/design/finalize`, {
        method: 'POST',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || '확정에 실패했습니다.')
      }
      const data = await res.json()
      setBlueprint(data.blueprint)
      setProjectStatus('MVP')
      router.push(`/projects/${projectId}/mvp`)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    }
  }, [projectId, router])

  // Brand update
  const handleBrandUpdate = useCallback((brand: BrandIdentity) => {
    setBlueprint(prev => ({ ...prev, brand }))
    setPhaseStatus(prev => ({ ...prev, '1': 'review' }))
  }, [])

  // Architecture update
  const handleArchitectureUpdate = useCallback((architecture: ServiceArchitectureType) => {
    setBlueprint(prev => ({ ...prev, architecture }))
    setPhaseStatus(prev => ({ ...prev, '2': 'review' }))
  }, [])

  // Screen details update
  const handleScreenDetailUpdate = useCallback((screenDetails: ScreenDetail[]) => {
    setBlueprint(prev => ({ ...prev, screenDetails }))
  }, [])

  const isLocked = projectStatus === 'MVP' || projectStatus === 'COMPLETED'

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <span className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-on-surface-variant">{locale === 'ko' ? '로딩 중...' : 'Loading...'}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Step Indicator */}
      <DesignStepIndicator
        locale={locale}
        currentPhase={currentPhase}
        phaseStatus={phaseStatus}
        onStepClick={setCurrentPhase}
      />

      {/* Global Error */}
      {error && (
        <div className="mb-6 p-3 rounded-lg bg-error/10 border border-error/20 flex items-center gap-2">
          <span className="material-symbols-outlined text-error text-sm">error</span>
          <p className="text-sm text-error flex-1">{error}</p>
          <button onClick={() => setError('')} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Locked State */}
      {isLocked && (
        <div className="mb-6 glass-card rounded-2xl p-4 border border-outline-variant/20 text-center">
          <span className="text-sm text-on-surface-variant flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-lg">lock</span>
            {locale === 'ko' ? '디자인이 확정되었습니다' : 'Design has been finalized'}
          </span>
        </div>
      )}

      {/* Phase Content */}
      {currentPhase === 1 && (
        <BrandConsultation
          locale={locale}
          projectId={projectId}
          brand={blueprint.brand}
          phaseStatus={phaseStatus['1']}
          onBrandUpdate={handleBrandUpdate}
          onApprove={() => handleApprove(1)}
        />
      )}

      {currentPhase === 2 && (
        <ServiceArchitecture
          locale={locale}
          projectId={projectId}
          architecture={blueprint.architecture}
          phaseStatus={phaseStatus['2']}
          onArchitectureUpdate={handleArchitectureUpdate}
          onApprove={() => handleApprove(2)}
        />
      )}

      {currentPhase === 3 && blueprint.architecture && (
        <ScreenDeepDive
          locale={locale}
          projectId={projectId}
          screens={blueprint.architecture.screens}
          screenDetails={blueprint.screenDetails}
          phaseStatus={phaseStatus['3']}
          onScreenDetailUpdate={handleScreenDetailUpdate}
          onApprove={() => handleApprove(3)}
        />
      )}

      {currentPhase === 4 && (
        <FinalBlueprint
          locale={locale}
          projectId={projectId}
          blueprint={blueprint}
          onFinalize={handleFinalize}
        />
      )}
    </div>
  )
}
