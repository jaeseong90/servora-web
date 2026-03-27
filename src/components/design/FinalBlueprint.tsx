'use client'

import { useState } from 'react'
import type { Locale } from '@/lib/i18n'
import type { DesignBlueprint } from '@/types'

interface FinalBlueprintProps {
  locale: Locale
  projectId: string
  blueprint: DesignBlueprint
  onFinalize: () => Promise<void>
}

export default function FinalBlueprint({
  locale,
  projectId,
  blueprint,
  onFinalize,
}: FinalBlueprintProps) {
  const [finalizing, setFinalizing] = useState(false)
  const [error, setError] = useState('')

  const handleFinalize = async () => {
    setFinalizing(true)
    setError('')
    try {
      await onFinalize()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
      setFinalizing(false)
    }
  }

  if (blueprint.finalized) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-secondary/20 bg-secondary/5">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-secondary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          <h3 className="text-lg font-bold text-on-surface">
            {locale === 'ko' ? '디자인이 확정되었습니다!' : 'Design has been finalized!'}
          </h3>
        </div>
        <p className="text-sm text-on-surface-variant">
          {locale === 'ko' ? 'MVP 제작이 시작됩니다.' : 'MVP production will begin.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="glass-card rounded-2xl p-6 border border-outline-variant/20">
        <h3 className="text-lg font-bold text-on-surface mb-5">
          {locale === 'ko' ? '최종 제작 청사진' : 'Final Blueprint'}
        </h3>

        {/* Brand Summary */}
        {blueprint.brand && (
          <div className="p-4 rounded-xl bg-surface-container-lowest/50 mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-on-surface-variant">
                {locale === 'ko' ? '브랜드' : 'Brand'}
              </p>
              <div className="flex gap-1">
                {Object.values(blueprint.brand.colors).map((color, i) => (
                  <div key={i} className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
            <p className="text-sm text-on-surface">{blueprint.brand.tone} · {blueprint.brand.personality}</p>
          </div>
        )}

        {/* Screens Summary */}
        {blueprint.architecture && (
          <div className="p-4 rounded-xl bg-surface-container-lowest/50 mb-4">
            <p className="text-xs font-bold text-on-surface-variant mb-3">
              {locale === 'ko'
                ? `만들어질 페이지 (${blueprint.architecture.screens.length}개)`
                : `Pages (${blueprint.architecture.screens.length})`}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {blueprint.architecture.screens.map(screen => (
                <div key={screen.id} className="flex items-center gap-2 text-sm text-on-surface">
                  <span className="material-symbols-outlined text-sm text-purple-400" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  {screen.displayName}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Managed Info Summary */}
        {blueprint.screenDetails.length > 0 && (
          <div className="p-4 rounded-xl bg-surface-container-lowest/50 mb-4">
            <p className="text-xs font-bold text-on-surface-variant mb-3">
              {locale === 'ko' ? '관리되는 정보' : 'Managed Information'}
            </p>
            <div className="space-y-2">
              {blueprint.screenDetails.map(detail => {
                const screen = blueprint.architecture?.screens.find(s => s.id === detail.screenId)
                return (
                  <div key={detail.screenId}>
                    <p className="text-xs text-purple-400 mb-1">{screen?.displayName || detail.screenId}</p>
                    <div className="flex flex-wrap gap-1">
                      {detail.managedInfo.map((info, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                          {info.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Key Features Highlight */}
        {blueprint.screenDetails.some(d => d.keyFeatures.length > 0) && (
          <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10">
            <p className="text-xs font-bold text-purple-400 mb-2">
              {locale === 'ko' ? '특별한 기능들' : 'Key Features'}
            </p>
            <ul className="space-y-1">
              {blueprint.screenDetails.flatMap(d => d.keyFeatures).map((f, i) => (
                <li key={i} className="text-sm text-on-surface flex items-center gap-2">
                  <span className="text-purple-400">✦</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-error/10 border border-error/20 flex items-center gap-2">
          <span className="material-symbols-outlined text-error text-sm">error</span>
          <p className="text-sm text-error flex-1">{error}</p>
          <button onClick={() => setError('')} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Finalize Button */}
      <button
        onClick={handleFinalize}
        disabled={finalizing}
        className="w-full py-4 text-base font-bold text-white bg-gradient-to-r from-purple-600 to-purple-500 rounded-2xl hover:from-purple-500 hover:to-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99] flex items-center justify-center gap-3 shadow-lg shadow-purple-500/20"
      >
        {finalizing ? (
          <>
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {locale === 'ko' ? '최종 확정 중...' : 'Finalizing...'}
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-xl">rocket_launch</span>
            {locale === 'ko' ? 'MVP 제작 시작하기' : 'Start MVP Production'}
          </>
        )}
      </button>
    </div>
  )
}
