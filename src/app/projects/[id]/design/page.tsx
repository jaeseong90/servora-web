'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { t, getLocale, type Locale } from '@/lib/i18n'

const toneKeys = [
  { value: '모던', key: 'design.toneModern' },
  { value: '클래식', key: 'design.toneClassic' },
  { value: '미니멀', key: 'design.toneMinimal' },
  { value: '활기찬', key: 'design.toneVibrant' },
  { value: '차분한', key: 'design.toneCalm' },
  { value: '전문적', key: 'design.toneProfessional' },
]

const colorModes = ['LIGHT', 'DARK'] as const
const layoutStyles = ['SIDEBAR', 'TOP_NAV', 'MINIMAL'] as const

const fontKeys = [
  { value: '깔끔한 고딕', key: 'design.fontGothic' },
  { value: '부드러운 둥근체', key: 'design.fontRounded' },
  { value: '세련된 세리프', key: 'design.fontSerif' },
  { value: '모던 산세리프', key: 'design.fontSansSerif' },
]

const cornerKeys = [
  { value: '직각', key: 'design.cornerSquare' },
  { value: '약간 둥근', key: 'design.cornerSlightRound' },
  { value: '많이 둥근', key: 'design.cornerRound' },
  { value: '완전 둥근', key: 'design.cornerFull' },
]

export default function DesignPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [locale, setLocaleState] = useState<Locale>('ko')
  const [designTone, setDesignTone] = useState('모던')
  const [primaryColor, setPrimaryColor] = useState('#2563eb')
  const [secondaryColor, setSecondaryColor] = useState('#8b5cf6')
  const [colorMode, setColorMode] = useState('LIGHT')
  const [layoutStyle, setLayoutStyle] = useState('SIDEBAR')
  const [fontStyle, setFontStyle] = useState('깔끔한 고딕')
  const [cornerStyle, setCornerStyle] = useState('약간 둥근')
  const [loading, setLoading] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [projectStatus, setProjectStatus] = useState<string>('DESIGN')

  // MVP 지침 상태
  const [mvpGuidelines, setMvpGuidelines] = useState('')
  const [guidelinesVersion, setGuidelinesVersion] = useState(0)
  const [generatingGuidelines, setGeneratingGuidelines] = useState(false)
  const [guidelinesTab, setGuidelinesTab] = useState<'preview' | 'edit'>('preview')
  const [editingGuidelines, setEditingGuidelines] = useState('')
  const [savingGuidelines, setSavingGuidelines] = useState(false)
  const [guidelinesError, setGuidelinesError] = useState('')

  useEffect(() => {
    setLocaleState(getLocale())
    const fetchData = async () => {
      const supabase = createClient()

      const { data: project } = await supabase
        .from('projects')
        .select('status')
        .eq('id', projectId)
        .single()
      if (project) setProjectStatus(project.status)

      const { data } = await supabase
        .from('design_preferences')
        .select('*')
        .eq('project_id', projectId)
        .single()

      if (data) {
        setDesignTone(data.design_tone || '모던')
        setPrimaryColor(data.primary_color)
        setSecondaryColor(data.secondary_color)
        setColorMode(data.color_mode)
        setLayoutStyle(data.layout_style)
        setFontStyle(data.font_style)
        setCornerStyle(data.corner_style)
        setSaved(true)
        if (data.mvp_guidelines) {
          setMvpGuidelines(data.mvp_guidelines)
          setEditingGuidelines(data.mvp_guidelines)
          setGuidelinesVersion(data.guidelines_version || 0)
        }
      }
    }
    fetchData()
  }, [projectId])

  const designPayload = {
    design_tone: designTone,
    primary_color: primaryColor,
    secondary_color: secondaryColor,
    color_mode: colorMode,
    layout_style: layoutStyle,
    font_style: fontStyle,
    corner_style: cornerStyle,
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/design/preference`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(designPayload),
      })

      if (response.ok) {
        setSaved(true)
      } else {
        alert(t('design.saveError', locale))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleFinalize = async () => {
    if (!mvpGuidelines) {
      alert(locale === 'ko' ? '먼저 MVP 구현 지침을 생성해주세요.' : 'Please generate MVP guidelines first.')
      return
    }

    setFinalizing(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/design/preference`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...designPayload, finalize: true }),
      })

      if (response.ok) {
        setSaved(true)
        setProjectStatus('MVP')
        router.push(`/projects/${projectId}/mvp`)
        router.refresh()
      } else {
        alert(t('design.saveError', locale))
      }
    } finally {
      setFinalizing(false)
    }
  }

  // --- MVP 지침 생성 ---

  const handleGenerateGuidelines = async () => {
    if (!saved) await handleSave()

    setGeneratingGuidelines(true)
    setMvpGuidelines('')
    setGuidelinesError('')
    setGuidelinesTab('preview')

    try {
      const response = await fetch(`/api/projects/${projectId}/design/generate-guidelines`, {
        method: 'POST',
      })

      if (!response.ok) {
        if (response.status === 429) {
          setGuidelinesError(locale === 'ko' ? '요청이 너무 빠릅니다. 잠시 후 다시 시도해주세요.' : 'Too many requests.')
        } else {
          const data = await response.json().catch(() => null)
          setGuidelinesError(data?.error || (locale === 'ko' ? '지침 생성에 실패했습니다.' : 'Failed to generate guidelines.'))
        }
        return
      }

      const reader = response.body?.getReader()
      if (!reader) return
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          try {
            const parsed = JSON.parse(line.slice(6))
            if (parsed.type === 'chunk') {
              accumulated += parsed.text
              setMvpGuidelines(accumulated)
            } else if (parsed.type === 'complete') {
              setGuidelinesVersion(parsed.version)
              setEditingGuidelines(accumulated)
            } else if (parsed.type === 'error') {
              setGuidelinesError(parsed.message)
            }
          } catch { /* SSE parse skip */ }
        }
      }
    } catch {
      setGuidelinesError(locale === 'ko' ? '지침 생성 중 오류가 발생했습니다.' : 'Error generating guidelines.')
    } finally {
      setGeneratingGuidelines(false)
    }
  }

  const handleSaveGuidelines = async () => {
    setSavingGuidelines(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/design/guidelines`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mvp_guidelines: editingGuidelines }),
      })
      if (response.ok) {
        setMvpGuidelines(editingGuidelines)
        setGuidelinesTab('preview')
      }
    } finally {
      setSavingGuidelines(false)
    }
  }

  const layoutLabelMap: Record<string, string> = {
    SIDEBAR: t('design.sidebar', locale),
    TOP_NAV: t('design.topNav', locale),
    MINIMAL: t('design.minimal', locale),
  }

  const colorModeLabelMap: Record<string, string> = {
    LIGHT: t('design.light', locale),
    DARK: t('design.dark', locale),
  }

  const isLocked = projectStatus === 'MVP' || projectStatus === 'COMPLETED'

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-on-surface mb-6">{t('design.title', locale)}</h1>

      <div className="space-y-6">
        {/* 디자인 톤 */}
        <div className="glass-card rounded-2xl p-6 border border-outline-variant/20">
          <h3 className="text-sm font-bold text-on-surface mb-3">{t('design.tone', locale)}</h3>
          <div className="grid grid-cols-3 gap-2">
            {toneKeys.map((tone) => (
              <button
                key={tone.value}
                onClick={() => setDesignTone(tone.value)}
                disabled={isLocked}
                className={`px-4 py-2 text-sm rounded-xl border transition-colors ${
                  designTone === tone.value
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {t(tone.key, locale)}
              </button>
            ))}
          </div>
        </div>

        {/* 색상 */}
        <div className="glass-card rounded-2xl p-6 border border-outline-variant/20">
          <h3 className="text-sm font-bold text-on-surface mb-3">{t('design.brandColor', locale)}</h3>
          <div className="flex gap-6">
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">{t('design.primaryColor', locale)}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  disabled={isLocked}
                  className="w-10 h-10 rounded-lg border border-outline-variant/20 cursor-pointer bg-transparent disabled:opacity-50"
                />
                <span className="text-sm text-on-surface-variant">{primaryColor}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">{t('design.secondaryColor', locale)}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  disabled={isLocked}
                  className="w-10 h-10 rounded-lg border border-outline-variant/20 cursor-pointer bg-transparent disabled:opacity-50"
                />
                <span className="text-sm text-on-surface-variant">{secondaryColor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 색상 모드 */}
        <div className="glass-card rounded-2xl p-6 border border-outline-variant/20">
          <h3 className="text-sm font-bold text-on-surface mb-3">{t('design.colorMode', locale)}</h3>
          <div className="flex gap-2">
            {colorModes.map((mode) => (
              <button
                key={mode}
                onClick={() => setColorMode(mode)}
                disabled={isLocked}
                className={`px-4 py-2 text-sm rounded-xl border transition-colors ${
                  colorMode === mode
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {colorModeLabelMap[mode]}
              </button>
            ))}
          </div>
        </div>

        {/* 레이아웃 */}
        <div className="glass-card rounded-2xl p-6 border border-outline-variant/20">
          <h3 className="text-sm font-bold text-on-surface mb-3">{t('design.layoutStyle', locale)}</h3>
          <div className="grid grid-cols-3 gap-2">
            {layoutStyles.map((layout) => (
              <button
                key={layout}
                onClick={() => setLayoutStyle(layout)}
                disabled={isLocked}
                className={`px-4 py-2 text-sm rounded-xl border transition-colors ${
                  layoutStyle === layout
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {layoutLabelMap[layout]}
              </button>
            ))}
          </div>
        </div>

        {/* 폰트 */}
        <div className="glass-card rounded-2xl p-6 border border-outline-variant/20">
          <h3 className="text-sm font-bold text-on-surface mb-3">{t('design.fontStyle', locale)}</h3>
          <div className="grid grid-cols-2 gap-2">
            {fontKeys.map((font) => (
              <button
                key={font.value}
                onClick={() => setFontStyle(font.value)}
                disabled={isLocked}
                className={`px-4 py-2 text-sm rounded-xl border transition-colors ${
                  fontStyle === font.value
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {t(font.key, locale)}
              </button>
            ))}
          </div>
        </div>

        {/* 모서리 */}
        <div className="glass-card rounded-2xl p-6 border border-outline-variant/20">
          <h3 className="text-sm font-bold text-on-surface mb-3">{t('design.cornerStyle', locale)}</h3>
          <div className="grid grid-cols-2 gap-2">
            {cornerKeys.map((corner) => (
              <button
                key={corner.value}
                onClick={() => setCornerStyle(corner.value)}
                disabled={isLocked}
                className={`px-4 py-2 text-sm rounded-xl border transition-colors ${
                  cornerStyle === corner.value
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {t(corner.key, locale)}
              </button>
            ))}
          </div>
        </div>

        {/* ━━━ MVP 구현 지침 ━━━ */}
        <div className="glass-card rounded-2xl p-6 border border-outline-variant/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-tertiary-container/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-tertiary-container text-lg">description</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-on-surface">
                {locale === 'ko' ? 'MVP 구현 지침' : 'MVP Implementation Guidelines'}
              </h3>
              <p className="text-[11px] text-on-surface-variant">
                {locale === 'ko'
                  ? '기획안을 분석하여 화면 구성, 데이터 구조, UI 지침을 자동 생성합니다'
                  : 'Auto-generates screen layouts, data structures, and UI guidelines from your plan'}
              </p>
            </div>
          </div>

          {/* 에러 메시지 */}
          {guidelinesError && (
            <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-sm">error</span>
              <p className="text-sm text-error">{guidelinesError}</p>
              <button onClick={() => setGuidelinesError('')} className="ml-auto text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          )}

          {/* 지침이 없고 생성 중이 아닐 때 */}
          {!mvpGuidelines && !generatingGuidelines && (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-3">auto_awesome</span>
              <p className="text-sm text-on-surface-variant mb-4">
                {locale === 'ko'
                  ? '디자인 선호도를 저장한 후 지침을 생성하세요'
                  : 'Save design preferences, then generate guidelines'}
              </p>
              <button
                onClick={handleGenerateGuidelines}
                disabled={isLocked}
                className="px-6 py-2.5 text-sm font-bold text-white bg-tertiary-container rounded-xl hover:bg-tertiary-container/80 disabled:opacity-50 transition-colors flex items-center gap-2 mx-auto"
              >
                <span className="material-symbols-outlined text-lg">auto_awesome</span>
                {locale === 'ko' ? '지침 생성하기' : 'Generate Guidelines'}
              </button>
            </div>
          )}

          {/* 생성 중 */}
          {generatingGuidelines && (
            <div className="mb-3 flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-tertiary-container border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-tertiary-container font-medium">
                {locale === 'ko' ? '지침 생성 중...' : 'Generating...'}
              </span>
            </div>
          )}

          {/* 지침 콘텐츠 */}
          {(mvpGuidelines || generatingGuidelines) && (
            <>
              {/* 탭 헤더 */}
              {!generatingGuidelines && (
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-1 bg-surface-container-highest/30 rounded-lg p-0.5">
                    <button
                      onClick={() => setGuidelinesTab('preview')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        guidelinesTab === 'preview'
                          ? 'bg-surface-container-highest text-on-surface'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {locale === 'ko' ? '미리보기' : 'Preview'}
                    </button>
                    {!isLocked && (
                      <button
                        onClick={() => { setGuidelinesTab('edit'); setEditingGuidelines(mvpGuidelines) }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          guidelinesTab === 'edit'
                            ? 'bg-surface-container-highest text-on-surface'
                            : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        {locale === 'ko' ? '편집' : 'Edit'}
                      </button>
                    )}
                  </div>
                  {!isLocked && (
                    <button
                      onClick={handleGenerateGuidelines}
                      className="text-xs text-on-surface-variant hover:text-tertiary-container transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">refresh</span>
                      {locale === 'ko' ? '다시 생성' : 'Regenerate'}
                    </button>
                  )}
                </div>
              )}

              {/* 미리보기 탭 */}
              {guidelinesTab === 'preview' && (
                <div
                  className="px-1 py-2 leading-[1.8] text-[14px] [&_h2]:text-[18px] [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-on-surface [&_h3]:text-[15px] [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-on-surface [&_p]:mb-3 [&_p]:text-on-surface-variant [&_ul]:ml-6 [&_ul]:mb-3 [&_ol]:ml-6 [&_ol]:mb-3 [&_li]:mb-1 [&_li]:text-on-surface-variant [&_strong]:text-on-surface [&_code]:bg-surface-container-highest [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[13px] [&_table]:w-full [&_table]:border-collapse [&_th]:bg-surface-container-high [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-xs [&_th]:font-bold [&_td]:px-3 [&_td]:py-2 [&_td]:border-t [&_td]:border-outline-variant/10 [&_pre]:bg-surface-container-highest [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:text-[13px] [&_pre]:mb-4 max-h-[600px] overflow-y-auto custom-scrollbar"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked(mvpGuidelines) as string) }}
                />
              )}

              {/* 편집 탭 */}
              {guidelinesTab === 'edit' && (
                <div>
                  <textarea
                    value={editingGuidelines}
                    onChange={(e) => setEditingGuidelines(e.target.value)}
                    rows={20}
                    maxLength={200000}
                    className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/20 rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-transparent outline-none resize-y text-sm text-on-surface font-mono placeholder:text-on-surface-variant/40"
                    placeholder="마크다운으로 작성..."
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={handleSaveGuidelines}
                      disabled={savingGuidelines}
                      className="px-5 py-2 text-sm font-bold text-white bg-primary-container rounded-xl hover:bg-primary-container/80 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                      {savingGuidelines ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          {locale === 'ko' ? '저장 중...' : 'Saving...'}
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-sm">save</span>
                          {locale === 'ko' ? '수정 저장' : 'Save Changes'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {guidelinesVersion > 0 && !generatingGuidelines && (
                <p className="text-[11px] text-on-surface-variant/50 mt-2">
                  v{guidelinesVersion}
                </p>
              )}
            </>
          )}
        </div>

        {/* 버튼 영역 */}
        {isLocked ? (
          <div className="glass-card rounded-2xl p-4 border border-outline-variant/20 text-center">
            <span className="text-sm text-on-surface-variant flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-lg">lock</span>
              {locale === 'ko' ? '디자인이 확정되었습니다' : 'Design has been finalized'}
            </span>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={loading || finalizing || generatingGuidelines}
              className="flex-1 py-3.5 text-sm font-bold text-on-surface-variant bg-surface-container-high rounded-xl hover:bg-surface-container-highest active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-surface-variant border-t-transparent rounded-full animate-spin" />
                  {locale === 'ko' ? '저장 중...' : 'Saving...'}
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">save</span>
                  {locale === 'ko' ? '저장' : 'Save'}
                </>
              )}
            </button>
            <button
              onClick={handleFinalize}
              disabled={loading || finalizing || generatingGuidelines || !mvpGuidelines}
              className="flex-1 py-3.5 text-sm font-bold text-white bg-primary-container rounded-xl hover:bg-primary-container/90 hover:shadow-lg hover:shadow-primary-container/30 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {finalizing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {locale === 'ko' ? '확정 중...' : 'Finalizing...'}
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  {locale === 'ko' ? '확정 후 MVP 단계로' : 'Finalize & Go to MVP'}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
