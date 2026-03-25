'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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

  useEffect(() => {
    setLocaleState(getLocale())
    const fetchData = async () => {
      const supabase = createClient()

      // 프로젝트 상태 조회
      const { data: project } = await supabase
        .from('projects')
        .select('status')
        .eq('id', projectId)
        .single()
      if (project) setProjectStatus(project.status)

      // 디자인 선호도 조회
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

  const layoutLabelMap: Record<string, string> = {
    SIDEBAR: t('design.sidebar', locale),
    TOP_NAV: t('design.topNav', locale),
    MINIMAL: t('design.minimal', locale),
  }

  const colorModeLabelMap: Record<string, string> = {
    LIGHT: t('design.light', locale),
    DARK: t('design.dark', locale),
  }

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
                className={`px-4 py-2 text-sm rounded-xl border transition-colors ${
                  designTone === tone.value
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high'
                }`}
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
                  className="w-10 h-10 rounded-lg border border-outline-variant/20 cursor-pointer bg-transparent"
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
                  className="w-10 h-10 rounded-lg border border-outline-variant/20 cursor-pointer bg-transparent"
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
                className={`px-4 py-2 text-sm rounded-xl border transition-colors ${
                  colorMode === mode
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high'
                }`}
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
                className={`px-4 py-2 text-sm rounded-xl border transition-colors ${
                  layoutStyle === layout
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high'
                }`}
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
                className={`px-4 py-2 text-sm rounded-xl border transition-colors ${
                  fontStyle === font.value
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high'
                }`}
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
                className={`px-4 py-2 text-sm rounded-xl border transition-colors ${
                  cornerStyle === corner.value
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {t(corner.key, locale)}
              </button>
            ))}
          </div>
        </div>

        {/* 버튼 영역 */}
        {projectStatus === 'MVP' || projectStatus === 'COMPLETED' ? (
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
              disabled={loading || finalizing}
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
              disabled={loading || finalizing}
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
