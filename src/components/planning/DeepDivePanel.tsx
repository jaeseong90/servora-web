'use client'

import { t, type Locale } from '@/lib/i18n'

const SECTIONS = [
  { ko: '1. 서비스 개요', en: '1. Service Overview' },
  { ko: '2. 기획 배경 및 문제 정의', en: '2. Background & Problem' },
  { ko: '3. 목표 및 기대 효과', en: '3. Goals & Expected Impact' },
  { ko: '4. 주요 사용자 정의', en: '4. Target Users' },
  { ko: '5. 사용자 사용 맥락 및 핵심 이용 장면', en: '5. User Context & Scenarios' },
  { ko: '6. 서비스 핵심 가치', en: '6. Core Value' },
  { ko: '7. 핵심 기능 구성', en: '7. Core Features' },
  { ko: '8. 주요 화면 및 정보 구조', en: '8. Key Screens & IA' },
  { ko: '9. 운영 및 관리자 기능', en: '9. Admin Features' },
  { ko: '10. 계정 / 권한 / 사용자 구분', en: '10. Accounts & Permissions' },
  { ko: '11. 운영 정책 및 기본 운영 흐름', en: '11. Operation Policy' },
  { ko: '12. 데이터 및 외부 연동 고려사항', en: '12. Data & Integrations' },
  { ko: '13. 비기능 요구사항', en: '13. Non-functional Requirements' },
  { ko: '14. 제약사항 / 가정 / 리스크', en: '14. Constraints & Risks' },
  { ko: '15. 단계별 추진 방향', en: '15. Roadmap' },
  { ko: '16. 성공 판단 기준 및 검토 포인트', en: '16. Success Criteria' },
]

interface DeepDivePanelProps {
  locale: Locale
  section: string
  onSectionChange: (value: string) => void
  onSubmit: () => void
}

export default function DeepDivePanel({
  locale,
  section,
  onSectionChange,
  onSubmit,
}: DeepDivePanelProps) {
  return (
    <div className="glass-card rounded-2xl p-6 border border-outline-variant/20">
      <h3 className="text-sm font-bold text-on-surface mb-2">{t('plan.deepDiveTitle', locale)}</h3>
      <p className="text-xs text-on-surface-variant mb-3">
        {locale === 'ko' ? '특정 섹션을 더 깊이 있게 보강하고 싶다면 선택해주세요.' : 'Select a section to deep dive and enhance.'}
      </p>
      <select
        value={section}
        onChange={(e) => onSectionChange(e.target.value)}
        className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/20 rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-transparent outline-none text-sm text-on-surface appearance-none cursor-pointer"
      >
        <option value="">{locale === 'ko' ? '섹션을 선택하세요' : 'Select a section'}</option>
        {SECTIONS.map((s) => (
          <option key={s.ko} value={s.ko}>{locale === 'ko' ? s.ko : s.en}</option>
        ))}
      </select>
      <button
        onClick={onSubmit}
        disabled={!section.trim()}
        className="mt-3 px-5 py-2.5 text-sm font-bold text-white bg-tertiary-container rounded-xl hover:bg-tertiary-container/80 disabled:opacity-50 transition-colors"
      >
        {t('plan.deepDiveSubmit', locale)}
      </button>
    </div>
  )
}
