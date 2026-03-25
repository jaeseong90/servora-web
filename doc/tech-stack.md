# Servora v2 — 기술 스택

## 프레임워크 & 런타임

| 영역 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | Next.js | 16.2.1 |
| UI | React | 19.2.4 |
| 언어 | TypeScript | 5.x |
| 스타일링 | Tailwind CSS | 4.x (PostCSS) |

## 백엔드 & 데이터

| 영역 | 기술 | 비고 |
|------|------|------|
| 데이터베이스 | Supabase (PostgreSQL) | RLS 적용, 7개 테이블 |
| 인증 | Supabase Auth | 이메일/비밀번호, SSR 쿠키 기반 |
| 스토리지 | Supabase Storage | PPT 파일 저장 |
| AI/LLM | Google Gemini 2.5 Flash | 기획안 생성, MVP 스펙 추출 |

## 주요 라이브러리

| 라이브러리 | 용도 |
|-----------|------|
| `@supabase/ssr` | SSR 환경 Supabase 클라이언트 |
| `@supabase/supabase-js` | Supabase JavaScript SDK |
| `marked` | Markdown → HTML 변환 |
| `html2pdf.js` | 기획안 PDF 다운로드 |

## 배포

| 영역 | 기술 |
|------|------|
| 호스팅 | Vercel |
| 환경변수 | Vercel + `.env.local` |

## 환경변수

```
NEXT_PUBLIC_SUPABASE_URL      # Supabase 프로젝트 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY # Supabase 공개 키
SUPABASE_SERVICE_ROLE_KEY     # Supabase Admin 키 (서버 전용)
GEMINI_API_KEY                # Google Gemini API 키
```

## 디자인 시스템

- Material Design 3 기반 다크 테마 색상 변수
- 글래스모르피즘 UI (glass-card, glass-sidebar, glass-popup)
- Material Symbols Outlined 아이콘
- 커스텀 스크롤바
- 다국어 지원 (한국어/영어)
