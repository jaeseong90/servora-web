'use client'

import type { Locale } from '@/lib/i18n'
import type { PlanningDocument } from '@/types'

interface VersionHistoryProps {
  locale: Locale
  documents: PlanningDocument[]
  activeDocId: number | undefined
  onSelect: (doc: PlanningDocument) => void
}

export default function VersionHistory({
  locale,
  documents,
  activeDocId,
  onSelect,
}: VersionHistoryProps) {
  return (
    <div className="hidden lg:block">
      <div className="glass-card rounded-2xl p-5 border border-outline-variant/20 sticky top-8">
        <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">
          {locale === 'ko' ? '버전 히스토리' : 'Version History'}
        </h3>
        <div className="space-y-1.5 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {documents.map((doc) => {
            const isActive = activeDocId === doc.id
            return (
              <button
                key={doc.id}
                onClick={() => onSelect(doc)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-primary-container/15 border border-primary-container/20'
                    : 'hover:bg-surface-container-high/50 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-bold ${isActive ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                    v{doc.version}
                  </span>
                  {doc.is_finalized && (
                    <span className="text-[9px] font-bold text-secondary uppercase">Finalized</span>
                  )}
                </div>
                <span className="text-[11px] text-on-surface-variant">
                  {new Date(doc.created_at).toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
