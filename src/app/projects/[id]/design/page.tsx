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
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setLocaleState(getLocale())
    const fetchPreference = async () => {
      const supabase = createClient()
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
    fetchPreference()
  }, [projectId])

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/design/preference`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          design_tone: designTone,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          color_mode: colorMode,
          layout_style: layoutStyle,
          font_style: fontStyle,
          corner_style: cornerStyle,
        }),
      })

      if (response.ok) {
        setSaved(true)
        router.push(`/projects/${projectId}/mvp`)
        router.refresh()
      } else {
        alert(t('design.saveError', locale))
      }
    } finally {
      setLoading(false)
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
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('design.title', locale)}</h1>

      <div className="space-y-6">
        {/* 디자인 톤 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('design.tone', locale)}</h3>
          <div className="grid grid-cols-3 gap-2">
            {toneKeys.map((tone) => (
              <button
                key={tone.value}
                onClick={() => setDesignTone(tone.value)}
                className={`px-4 py-2 text-sm rounded-lg border ${
                  designTone === tone.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t(tone.key, locale)}
              </button>
            ))}
          </div>
        </div>

        {/* 색상 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('design.brandColor', locale)}</h3>
          <div className="flex gap-6">
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('design.primaryColor', locale)}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <span className="text-sm text-gray-600">{primaryColor}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('design.secondaryColor', locale)}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <span className="text-sm text-gray-600">{secondaryColor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 색상 모드 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('design.colorMode', locale)}</h3>
          <div className="flex gap-2">
            {colorModes.map((mode) => (
              <button
                key={mode}
                onClick={() => setColorMode(mode)}
                className={`px-4 py-2 text-sm rounded-lg border ${
                  colorMode === mode
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {colorModeLabelMap[mode]}
              </button>
            ))}
          </div>
        </div>

        {/* 레이아웃 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('design.layoutStyle', locale)}</h3>
          <div className="grid grid-cols-3 gap-2">
            {layoutStyles.map((layout) => (
              <button
                key={layout}
                onClick={() => setLayoutStyle(layout)}
                className={`px-4 py-2 text-sm rounded-lg border ${
                  layoutStyle === layout
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {layoutLabelMap[layout]}
              </button>
            ))}
          </div>
        </div>

        {/* 폰트 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('design.fontStyle', locale)}</h3>
          <div className="grid grid-cols-2 gap-2">
            {fontKeys.map((font) => (
              <button
                key={font.value}
                onClick={() => setFontStyle(font.value)}
                className={`px-4 py-2 text-sm rounded-lg border ${
                  fontStyle === font.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t(font.key, locale)}
              </button>
            ))}
          </div>
        </div>

        {/* 모서리 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('design.cornerStyle', locale)}</h3>
          <div className="grid grid-cols-2 gap-2">
            {cornerKeys.map((corner) => (
              <button
                key={corner.value}
                onClick={() => setCornerStyle(corner.value)}
                className={`px-4 py-2 text-sm rounded-lg border ${
                  cornerStyle === corner.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t(corner.key, locale)}
              </button>
            ))}
          </div>
        </div>

        {/* 저장 */}
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full py-3 text-white bg-blue-600 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? t('design.saving', locale) : t('design.save', locale)}
        </button>
      </div>
    </div>
  )
}
