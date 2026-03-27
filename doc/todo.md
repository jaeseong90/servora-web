# Servora v2 — TODO

## 완료

- [x] MVP 스펙 추출 파이프라인 구현 (Gemini JSON 스펙 → 사용자 리뷰 → 결정적 빌드)
- [x] app-config.ts 결정적 생성 (JSON 스펙 → TypeScript 순수 변환, AI 불필요)
- [x] SQL 마이그레이션 결정적 생성 (JSON 스펙 → SQL 순수 변환)
- [x] Claude Code 역할 축소 (빌드 에러 수정 + 커스텀 페이지만, max-turns 20→10)
- [x] MVP 스펙 리뷰 UI (시각적 보기 + JSON 편집 + 확정)
- [x] `/api/projects/[id]/mvp/spec` API (GET/PUT/POST)
- [x] MvpBuildQueue 타입에 SPEC_REVIEW 상태 추가

## 우선순위 높음

- [ ] PPT 생성 토큰 제한 구현
  - 사용자별 일/월 요청 횟수 제한 (예: 무료 3회/월)
  - 슬라이드 수 상한 설정 (예: 최대 15장)
  - `ppt_build_queue` 테이블에 이미 토큰 추적 컬럼 추가됨

## 기능 개선

- [ ] MVP 스펙 리뷰 — 시각적 편집 모드 (JSON 없이 직접 필드/엔티티 추가/삭제)
- [ ] 템플릿에 고객용 화면 패턴 추가 (예약 신청, 상품 탐색 등)
- [ ] 스펙 JSON에서 커스텀 페이지 유형 자동 감지 → 결정적 생성
- [ ] PPT 다운로드 완료 후 output_url 없을 때 fallback UX 개선
- [ ] 빌드 성공률 추적 + 실패 패턴 분석

## 인프라 / 배포

- [ ] PPT 빌드 데몬 구현 (ppt_build_queue 폴링)
- [ ] MVP 빌드 데몬 안정화
- [ ] Vercel 프로덕션 배포 설정

## 추후 검토

- [ ] Supabase Realtime 전환 (폴링 → 실시간 구독)
- [ ] Service Worker 기반 Push Notification (오프라인 알림)
- [ ] 크레딧/포인트 시스템 (유료화 대비)
- [ ] Service / Operation 단계 구현 (사이드바에 "Soon" 표시 중)
- [ ] 스펙 템플릿 라이브러리 (업종별 사전 정의)
