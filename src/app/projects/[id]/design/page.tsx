'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const toneOptions = ['모던', '클래식', '미니멀', '활기찬', '차분한', '전문적']
const colorModes = ['LIGHT', 'DARK']
const layoutStyles = ['SIDEBAR', 'TOP_NAV', 'MINIMAL']
const fontStyles = ['깔끔한 고딕', '부드러운 둥근체', '세련된 세리프', '모던 산세리프']
const cornerStyles = ['직각', '약간 둥근', '많이 둥근', '완전 둥근']

export default function DesignPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

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
        alert('저장 중 오류가 발생했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">디자인 선호도</h1>

      <div className="space-y-6">
        {/* 디자인 톤 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">디자인 톤</h3>
          <div className="grid grid-cols-3 gap-2">
            {toneOptions.map((tone) => (
              <button
                key={tone}
                onClick={() => setDesignTone(tone)}
                className={`px-4 py-2 text-sm rounded-lg border ${
                  designTone === tone
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tone}
              </button>
            ))}
          </div>
        </div>

        {/* 색상 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">브랜드 색상</h3>
          <div className="flex gap-6">
            <div>
              <label className="block text-xs text-gray-500 mb-1">주요 색상</label>
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
              <label className="block text-xs text-gray-500 mb-1">보조 색상</label>
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
          <h3 className="text-sm font-semibold text-gray-900 mb-3">색상 모드</h3>
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
                {mode === 'LIGHT' ? '라이트' : '다크'}
              </button>
            ))}
          </div>
        </div>

        {/* 레이아웃 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">레이아웃 스타일</h3>
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
                {layout === 'SIDEBAR' ? '사이드바' : layout === 'TOP_NAV' ? '상단 네비' : '미니멀'}
              </button>
            ))}
          </div>
        </div>

        {/* 폰트 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">폰트 스타일</h3>
          <div className="grid grid-cols-2 gap-2">
            {fontStyles.map((font) => (
              <button
                key={font}
                onClick={() => setFontStyle(font)}
                className={`px-4 py-2 text-sm rounded-lg border ${
                  fontStyle === font
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {font}
              </button>
            ))}
          </div>
        </div>

        {/* 모서리 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">모서리 스타일</h3>
          <div className="grid grid-cols-2 gap-2">
            {cornerStyles.map((corner) => (
              <button
                key={corner}
                onClick={() => setCornerStyle(corner)}
                className={`px-4 py-2 text-sm rounded-lg border ${
                  cornerStyle === corner
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {corner}
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
          {loading ? '저장 중...' : '저장 후 MVP 단계로 이동'}
        </button>
      </div>
    </div>
  )
}
