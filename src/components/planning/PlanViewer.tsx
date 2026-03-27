'use client'

import { type RefObject } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import type { Locale } from '@/lib/i18n'
import type { PlanningDocument } from '@/types'

interface PlanViewerProps {
  locale: Locale
  document: PlanningDocument | null
  displayContent: string
  isGenerating: boolean
  contentRef: RefObject<HTMLDivElement | null>
}

export default function PlanViewer({
  locale,
  document,
  displayContent,
  isGenerating,
  contentRef,
}: PlanViewerProps) {
  return (
    <div className="bg-surface-container-low rounded-xl shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary-container to-secondary opacity-60" />

      {isGenerating && (
        <div className="px-10 pt-6 flex items-center gap-2">
          <span className="w-2 h-2 border border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
            {locale === 'ko' ? 'AI 작성 중...' : 'AI Writing...'}
          </span>
        </div>
      )}

      <div
        ref={contentRef}
        className="p-10 md:p-16 leading-[1.8] text-[14px] [&_h1]:text-[24px] [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-3 [&_h1]:text-on-surface [&_h2]:text-[20px] [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-on-surface [&_h3]:text-[16px] [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-on-surface [&_p]:mb-3 [&_p]:text-on-surface-variant [&_ul]:ml-6 [&_ul]:mb-3 [&_ol]:ml-6 [&_ol]:mb-3 [&_li]:mb-1 [&_li]:text-on-surface-variant [&_strong]:text-on-surface [&_code]:bg-surface-container-highest [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[13px] [&_blockquote]:border-l-2 [&_blockquote]:border-primary-container/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-on-surface-variant/80 [&_table]:w-full [&_table]:border-collapse [&_th]:bg-surface-container-high [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-xs [&_th]:font-bold [&_td]:px-3 [&_td]:py-2 [&_td]:border-t [&_td]:border-outline-variant/10"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked(displayContent) as string) }}
      />
    </div>
  )
}
