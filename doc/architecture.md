# Servora v2 — 아키텍처 & 서비스 구조

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                      Vercel (호스팅)                      │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Next.js 16 App Router                  │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │ │
│  │  │  Pages   │  │   API    │  │   Static Assets  │  │ │
│  │  │ (Client) │  │ Routes   │  │   (CSS/Fonts)    │  │ │
│  │  └────┬─────┘  └────┬─────┘  └──────────────────┘  │ │
│  └───────┼──────────────┼──────────────────────────────┘ │
└──────────┼──────────────┼────────────────────────────────┘
           │              │
    ┌──────▼──────┐ ┌─────▼──────┐
    │  Supabase   │ │  Gemini    │
    │  (DB/Auth/  │ │  2.5 Flash │
    │   Storage)  │ │  (AI/LLM)  │
    └──────┬──────┘ └────────────┘
           │
    ┌──────▼──────┐
    │   데몬      │
    │ (폴링 기반)  │
    │ MVP 빌드    │
    │ PPT 빌드    │
    └─────────────┘
```

## 프로젝트 워크플로우

```
프로젝트 생성 (PLANNING)
    │
    ▼
기획 단계 ── 설문 10개 입력
    │         → AI 기획안 생성 (Gemini 스트리밍)
    │         → 피드백 반영 / 딥다이브 (버전 관리)
    │         → 기획안 확정
    ▼
디자인 단계 (DESIGN)
    │         → 톤/색상/레이아웃/폰트/모서리 설정
    │         → 저장 (수정 가능) / 확정 후 MVP 이동
    ▼
MVP 단계 (MVP)
    │         → MVP 스펙 추출 (Gemini)
    │         → 빌드 큐 등록 → 데몬이 빌드
    │         → GitHub 리포 + Vercel 배포
    ▼
완료 (COMPLETED)
```

## 디렉토리 구조

```
src/
├── app/                          # Next.js App Router
│   ├── api/projects/[id]/        # API 라우트
│   │   ├── planning/             #   기획 (generate, feedback, deep-dive, finalize)
│   │   ├── design/preference/    #   디자인 선호도 (GET/POST)
│   │   └── mvp/                  #   MVP (generate, status)
│   ├── dashboard/                # 대시보드 (프로젝트 목록)
│   ├── login/                    # 로그인
│   ├── signup/                   # 회원가입
│   └── projects/[id]/            # 프로젝트 상세
│       ├── planning/             #   기획 페이지
│       ├── design/               #   디자인 페이지
│       ├── mvp/                  #   MVP 페이지
│       └── layout.tsx            #   프로젝트 레이아웃 (사이드바)
├── components/layout/            # 공통 레이아웃 컴포넌트
│   ├── Sidebar.tsx               #   메인 사이드바
│   └── ProjectSidebar.tsx        #   프로젝트 사이드바
├── lib/
│   ├── ai/gemini.ts              # Gemini API 클라이언트
│   ├── i18n/index.ts             # 다국어 (ko/en)
│   ├── prompts/                  # AI 프롬프트 파일
│   │   ├── planner-system.txt    #   기획안 생성
│   │   ├── plan-refiner-system.txt    # 피드백 반영
│   │   ├── plan-deep-diver-system.txt # 딥다이브
│   │   └── mvp-spec-extractor-system.txt # MVP 스펙 추출
│   └── supabase/                 # Supabase 클라이언트
│       ├── client.ts             #   브라우저용
│       ├── server.ts             #   서버용 (SSR)
│       └── admin.ts              #   Admin (service role)
└── types/index.ts                # TypeScript 타입 정의
```

## DB 테이블 구조

| 테이블 | 용도 | 주요 컬럼 |
|--------|------|-----------|
| `projects` | 프로젝트 | user_id, title, status (PLANNING/DESIGN/MVP/COMPLETED) |
| `planning_documents` | 기획 문서 | project_id, content, questionnaire_data, version, is_finalized |
| `planning_feedbacks` | 기획 피드백 | document_id, project_id, content |
| `design_preferences` | 디자인 설정 | project_id (UNIQUE), tone/color/layout/font/corner |
| `mvp_build_queue` | MVP 빌드 큐 | project_id, status, spec_json, github_repo, vercel_url |
| `mvp_projects` | MVP 결과 | project_id, spec_json, github_repo, vercel_url, version |
| `ppt_build_queue` | PPT 빌드 큐 | project_id, document_id, status, slide_json, output_url, 토큰 사용량 |

- 모든 테이블에 RLS(Row Level Security) 적용
- 사용자는 자신의 프로젝트 데이터만 접근 가능

## API 라우트

| 엔드포인트 | 메서드 | 역할 |
|-----------|--------|------|
| `/api/projects/[id]/planning/generate` | POST | 기획안 AI 생성 (SSE 스트리밍) |
| `/api/projects/[id]/planning/feedback` | POST | 피드백 반영 (새 버전, 스트리밍) |
| `/api/projects/[id]/planning/deep-dive` | POST | 딥다이브 보강 (새 버전, 스트리밍) |
| `/api/projects/[id]/planning/finalize` | POST | 기획안 확정 → 상태 DESIGN |
| `/api/projects/[id]/design/preference` | GET | 디자인 선호도 조회 |
| `/api/projects/[id]/design/preference` | POST | 디자인 선호도 저장 (finalize 플래그로 MVP 전환) |
| `/api/projects/[id]/mvp/generate` | POST | MVP 스펙 추출 + 빌드 큐 등록 (중복 방지) |
| `/api/projects/[id]/mvp/status` | GET | MVP 빌드 상태 조회 |

## 비동기 처리 (데몬)

MVP 빌드와 PPT 빌드는 큐 기반 비동기 처리:

1. 웹에서 큐 테이블에 `PENDING` 레코드 삽입
2. 별도 데몬이 큐를 폴링하여 처리
3. 상태: `PENDING → BUILDING → COMPLETED / FAILED`
4. 프론트에서 5초 간격 폴링으로 상태 감지
5. 완료/실패 시 브라우저 Notification API로 알림
