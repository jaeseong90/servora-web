<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Servora Web — 프로젝트 가이드

## 기술 스택
- Next.js 16 (App Router, Turbopack) + React 19
- Supabase (Auth, DB, Realtime)
- Tailwind CSS 4
- Gemini 2.5 Flash (AI 생성)
- Upstash Redis (Rate Limiting)
- Vercel 배포

## 주요 흐름
```
Planning (기획안 생성/피드백) → Design (선호도 + MVP 지침 생성) → MVP (코드 생성)
```

## 디렉토리 구조
- `src/app/` — 페이지 및 API routes
- `src/components/planning/` — Planning 페이지 컴포넌트 (QuestionnaireForm, PlanViewer, FeedbackPanel, PptStatusButton, VersionHistory)
- `src/components/layout/` — Sidebar, ProjectSidebar
- `src/components/landing/` — LandingLocaleToggle
- `src/lib/ai/gemini.ts` — Gemini API (일반 생성 + SSE 스트리밍)
- `src/lib/planning/` — createStreamingResponse, insertDocumentWithVersion
- `src/lib/ratelimit/` — Upstash 기반 Rate Limiting
- `src/lib/usage/` — 토큰 사용량 추적
- `src/lib/prompts/` — AI 시스템 프롬프트 (.txt)
- `src/lib/supabase/` — client, server, admin
- `src/lib/i18n/` — 한국어/영어 다국어
- `src/proxy.ts` — 인증 미들웨어 + CSRF 방어 (Next.js 16의 middleware → proxy 전환)
- `supabase/migrations/` — DB 마이그레이션 SQL

## 코딩 규칙
- API route에는 반드시 zod 입력 검증, checkAiRateLimit (AI 호출 시), logTokenUsage 적용
- dangerouslySetInnerHTML 사용 시 DOMPurify.sanitize() 필수
- Gemini API 키는 x-goog-api-key 헤더로 전달 (URL 쿼리스트링 금지)
- 프로젝트 상태 전이 검증 (PLANNING → DESIGN → MVP → COMPLETED)
- 클라이언트에서 Supabase 직접 INSERT/UPDATE 금지 → API route 경유
- Next.js 16: middleware 대신 proxy.ts 사용
