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
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[15px] top-2 bottom-4 w-[1px] bg-outline-variant/20" />

      <div className="max-h-[264px] overflow-y-auto no-scrollbar space-y-0">
        {documents.map((doc) => {
          const isActive = activeDocId === doc.id
          return (
            <div
              key={doc.id}
              onClick={() => onSelect(doc)}
              className={`relative pl-10 py-4 cursor-pointer transition-colors rounded-r-lg ${
                isActive
                  ? 'version-item-active bg-primary/5'
                  : 'hover:bg-white/5'
              }`}
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-bold ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>
                    v{doc.version}
                  </p>
                  {isActive && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/20 text-primary rounded mr-2">
                      CURRENT
                    </span>
                  )}
                  {doc.is_finalized && !isActive && (
                    <span className="text-[9px] font-bold text-secondary uppercase mr-2">
                      {locale === 'ko' ? '확정' : 'Finalized'}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-outline mt-1 font-mono">
                  {new Date(doc.created_at).toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
