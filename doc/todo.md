# Servora v2 — TODO

## 우선순위 높음

- [ ] PPT 생성 토큰 제한 구현
  - 사용자별 일/월 요청 횟수 제한 (예: 무료 3회/월)
  - 슬라이드 수 상한 설정 (예: 최대 15장)
  - `ppt_build_queue` 테이블에 이미 토큰 추적 컬럼 추가됨 (input_tokens, output_tokens, total_cost_usd)

## 기능 개선

- [ ] MVP 페이지 테마 통일 (기획/디자인 페이지와 동일한 glass-card 스타일로)
- [ ] 디자인 페이지 — MVP 이후 입력 필드 disabled 처리 (현재 잠금 안내만 표시)
- [ ] PPT 다운로드 완료 후 output_url 없을 때 fallback UX 개선

## 인프라 / 배포

- [ ] PPT 빌드 데몬 구현 (ppt_build_queue 폴링)
- [ ] MVP 빌드 데몬 안정화
- [ ] Vercel 프로덕션 배포 설정

## 추후 검토

- [ ] Supabase Realtime 전환 (폴링 → 실시간 구독)
- [ ] Service Worker 기반 Push Notification (오프라인 알림)
- [ ] 크레딧/포인트 시스템 (유료화 대비)
- [ ] Service / Operation 단계 구현 (사이드바에 "Soon" 표시 중)
