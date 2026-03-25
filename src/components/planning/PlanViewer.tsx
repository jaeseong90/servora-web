'use client'

import { type RefObject } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { t, type Locale } from '@/lib/i18n'
import type { PlanningDocument } from '@/types'
import PptStatusButton from './PptStatusButton'

interface PlanViewerProps {
  locale: Locale
  document: PlanningDocument | null
  displayContent: string
  isGenerating: boolean
  hasFinalized: boolean
  showForm: boolean
  pptStatus: string | null
  pptOutputUrl: string | null
  pptRequesting: boolean
  contentRef: RefObject<HTMLDivElement | null>
  onShowForm: () => void
  onFinalize: () => void
  onExportPdf: () => void
  onRequestPpt: () => void
}

export default function PlanViewer({
  locale,
  document,
  displayContent,
  isGenerating,
  hasFinalized,
  showForm,
  pptStatus,
  pptOutputUrl,
  pptRequesting,
  contentRef,
  onShowForm,
  onFinalize,
  onExportPdf,
  onRequestPpt,
}: PlanViewerProps) {
  return (
    <div className="glass-card rounded-2xl border border-outline-variant/20 mb-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-8 pt-6 pb-4 border-b border-outline-variant/10">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-on-surface">
            {document ? `v${document.version}` : ''}
          </span>
          {document?.is_finalized && (
            <span className="px-2 py-0.5 text-[10px] font-bold text-secondary bg-secondary/10 border border-secondary/20 rounded-full uppercase tracking-wider">
              {locale === 'ko' ? '확정' : 'Finalized'}
            </span>
          )}
          {isGenerating && (
            <span className="px-2 py-0.5 text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 rounded-full uppercase tracking-wider flex items-center gap-1">
              <span className="w-2 h-2 border border-primary border-t-transparent rounded-full animate-spin" />
              {t('plan.aiWriting', locale)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!showForm && !hasFinalized && (
            <>
              <button
                onClick={onShowForm}
                className="px-3 py-1.5 text-xs font-medium text-on-surface-variant bg-surface-container-high rounded-lg hover:bg-surface-container-highest transition-colors"
              >
                {t('plan.editQuestions', locale)}
              </button>
              <button
                onClick={onFinalize}
                className="px-3 py-1.5 text-xs font-bold text-secondary border border-secondary/30 bg-secondary/10 rounded-lg hover:bg-secondary/20 transition-colors"
              >
                {locale === 'ko' ? '확정' : 'Finalize'}
              </button>
            </>
          )}
          {document && (
            <button
              onClick={onExportPdf}
              className="px-3 py-1.5 text-xs font-medium text-on-surface-variant bg-surface-container-high rounded-lg hover:bg-surface-container-highest transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
              PDF
            </button>
          )}
          {document && document.is_finalized && (
            <PptStatusButton
              locale={locale}
              pptStatus={pptStatus}
              pptOutputUrl={pptOutputUrl}
              pptRequesting={pptRequesting}
              onRequestPpt={onRequestPpt}
            />
          )}
          {document && (
            <span className="text-xs text-on-surface-variant">
              {new Date(document.created_at).toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US')}
            </span>
          )}
        </div>
      </div>

      {/* 기획안 본문 */}
      <div
        ref={contentRef}
        className="px-8 py-6 leading-[1.8] text-[14px] [&_h1]:text-[24px] [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-3 [&_h1]:text-on-surface [&_h2]:text-[20px] [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-on-surface [&_h3]:text-[16px] [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-on-surface [&_p]:mb-3 [&_p]:text-on-surface-variant [&_ul]:ml-6 [&_ul]:mb-3 [&_ol]:ml-6 [&_ol]:mb-3 [&_li]:mb-1 [&_li]:text-on-surface-variant [&_strong]:text-on-surface [&_code]:bg-surface-container-highest [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[13px] [&_blockquote]:border-l-2 [&_blockquote]:border-primary-container/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-on-surface-variant/80 [&_table]:w-full [&_table]:border-collapse [&_th]:bg-surface-container-high [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-xs [&_th]:font-bold [&_td]:px-3 [&_td]:py-2 [&_td]:border-t [&_td]:border-outline-variant/10"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked(displayContent) as string) }}
      />
    </div>
  )
}
