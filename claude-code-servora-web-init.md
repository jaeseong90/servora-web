# [Claude Code 프롬프트] servora-web 초기 프로젝트 세팅

## GitHub 레포
```
https://github.com/jaeseong90/servora-web.git
```

## 목표

Servora v2 — AI SaaS 제작 플랫폼의 웹 본체를 Next.js + Supabase + Vercel 기반으로 구축한다.

**핵심 흐름:**
```
사용자 → 기획 질문 답변 → AI 기획안 생성(16항목) → 확정
→ 디자인 선호도 7개 선택
→ MVP 생성 요청 (DB 큐에 등록, 별도 데몬이 처리)
→ 배포된 MVP URL 확인
```

**이 프롬프트 범위: Phase 1(기획) 완전 구현 + Phase 2(선호도) + Phase 3(큐 등록/상태 조회) 골격**

---

## 기술 스택

- Next.js 15 (App Router, TypeScript)
- Supabase (PostgreSQL + Auth + RLS)
- Tailwind CSS
- Vercel 배포

---

## Step 1: Next.js 프로젝트 초기화

```bash
git clone https://github.com/jaeseong90/servora-web.git
cd servora-web
npx create-next-app@latest . --typescript --tailwind --app --src-dir --use-npm --eslint
```

`--src-dir` 옵션으로 `src/app/` 구조 사용.

---

## Step 2: 패키지 설치

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install marked               # 마크다운 렌더링
npm install -D @types/marked
```

---

## Step 3: 환경변수

`.env.local.example` 생성:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GEMINI_API_KEY=AIza...
```

`.gitignore`에 `.env.local` 추가 확인.

---

## Step 4: Supabase 클라이언트 설정

### `src/lib/supabase/client.ts` (브라우저용)

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### `src/lib/supabase/server.ts` (서버용 — API Route, Server Component)

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options))
          } catch { /* Server Component에서는 무시 */ }
        },
      },
    }
  )
}
```

### `src/lib/supabase/admin.ts` (서비스 롤 — RLS 우회)

```typescript
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

### `src/middleware.ts` (인증 미들웨어)

Supabase Auth 세션을 매 요청마다 갱신:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // 인증 필요한 경로
  const protectedPaths = ['/dashboard', '/projects']
  const isProtected = protectedPaths.some(p => request.nextUrl.pathname.startsWith(p))

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 로그인한 사용자가 login/signup 접근 시 대시보드로
  if (user && ['/login', '/signup'].includes(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

---

## Step 5: Supabase DB 스키마

`supabase/migrations/001_init.sql` 파일로 관리 (README에 실행 방법 안내).

```sql
-- 프로젝트
CREATE TABLE projects (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'PLANNING',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 기획 문서
CREATE TABLE planning_documents (
  id bigserial PRIMARY KEY,
  project_id bigint REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  questionnaire_data jsonb,
  version int NOT NULL DEFAULT 1,
  is_finalized boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 기획 피드백
CREATE TABLE planning_feedbacks (
  id bigserial PRIMARY KEY,
  document_id bigint REFERENCES planning_documents(id) ON DELETE CASCADE NOT NULL,
  project_id bigint REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 디자인 선호도
CREATE TABLE design_preferences (
  id bigserial PRIMARY KEY,
  project_id bigint REFERENCES projects(id) ON DELETE CASCADE UNIQUE NOT NULL,
  design_tone text,
  primary_color text DEFAULT '#2563eb',
  secondary_color text DEFAULT '#8b5cf6',
  color_mode text DEFAULT 'LIGHT',
  layout_style text DEFAULT 'SIDEBAR',
  font_style text DEFAULT '깔끔한 고딕',
  corner_style text DEFAULT '약간 둥근',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- MVP 빌드 큐 (데몬이 폴링)
CREATE TABLE mvp_build_queue (
  id bigserial PRIMARY KEY,
  project_id bigint REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  spec_json text,
  claude_md text,
  prompt text,
  result_json text,
  error_message text,
  github_repo text,
  vercel_url text,
  build_duration_ms bigint,
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

-- MVP 프로젝트
CREATE TABLE mvp_projects (
  id bigserial PRIMARY KEY,
  project_id bigint REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  spec_json text,
  github_repo text,
  vercel_url text,
  version int NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE mvp_build_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE mvp_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own planning docs" ON planning_documents
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users own feedbacks" ON planning_feedbacks
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users own design prefs" ON design_preferences
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users own build queue" ON mvp_build_queue
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users own mvp projects" ON mvp_projects
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
```

---

## Step 6: Gemini API 호출 유틸

### `src/lib/ai/gemini.ts`

```typescript
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

interface GeminiResponse {
  content: string
  inputTokens: number
  outputTokens: number
}

export async function generateWithGemini(
  systemPrompt: string,
  userPrompt: string,
  options?: { model?: string; maxTokens?: number; temperature?: number }
): Promise<GeminiResponse> {
  const model = options?.model || 'gemini-2.0-flash'
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.')

  const response = await fetch(
    `${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
          maxOutputTokens: options?.maxTokens || 8192,
          temperature: options?.temperature || 0.7,
        },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Gemini API 오류 (${response.status}): ${error}`)
  }

  const data = await response.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const usage = data.usageMetadata || {}

  return {
    content,
    inputTokens: usage.promptTokenCount || 0,
    outputTokens: usage.candidatesTokenCount || 0,
  }
}

/**
 * SSE 스트리밍 생성 (기획안 생성용)
 */
export async function* streamWithGemini(
  systemPrompt: string,
  userPrompt: string,
  options?: { model?: string; maxTokens?: number }
): AsyncGenerator<string> {
  const model = options?.model || 'gemini-2.0-flash'
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.')

  const response = await fetch(
    `${GEMINI_API_URL}/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
          maxOutputTokens: options?.maxTokens || 8192,
          temperature: 0.7,
        },
      }),
    }
  )

  if (!response.ok) throw new Error(`Gemini 스트리밍 실패: ${response.status}`)

  const reader = response.body?.getReader()
  if (!reader) throw new Error('스트림을 읽을 수 없습니다.')
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    // SSE 파싱
    for (const line of chunk.split('\n')) {
      if (line.startsWith('data: ')) {
        try {
          const json = JSON.parse(line.slice(6))
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) yield text
        } catch { /* 파싱 실패 무시 */ }
      }
    }
  }
}
```

---

## Step 7: AI 프롬프트 파일

기존 Servora v1의 프롬프트를 그대로 가져온다.

### `src/lib/prompts/planner-system.txt`

기존 `prompts/tasks/planner-system.txt` 내용 그대로 복사.
(기획안 16항목 생성 시스템 프롬프트)

### `src/lib/prompts/plan-refiner-system.txt`

기존 `prompts/tasks/plan-refiner-system.txt` 내용 그대로 복사.
(피드백 반영 프롬프트)

### `src/lib/prompts/plan-deep-diver-system.txt`

기존 `prompts/tasks/plan-deep-diver-system.txt` 내용 그대로 복사.
(딥다이브 프롬프트)

### `src/lib/prompts/mvp-spec-extractor-system.txt`

기존 `prompts/tasks/mvp-spec-extractor-system.txt` 내용 그대로 복사.
(MVP 스펙 추출 프롬프트)

**프롬프트 로딩 유틸:**

```typescript
// src/lib/prompts/index.ts
import fs from 'fs'
import path from 'path'

export function loadPrompt(name: string): string {
  const filePath = path.join(process.cwd(), 'src', 'lib', 'prompts', name)
  return fs.readFileSync(filePath, 'utf-8')
}
```

---

## Step 8: TypeScript 타입 정의

### `src/types/index.ts`

```typescript
// 프로젝트
export interface Project {
  id: number
  user_id: string
  title: string
  description: string | null
  status: 'PLANNING' | 'DESIGN' | 'MVP' | 'COMPLETED'
  created_at: string
  updated_at: string
}

// 기획 문서
export interface PlanningDocument {
  id: number
  project_id: number
  content: string
  questionnaire_data: QuestionnaireData | null
  version: number
  is_finalized: boolean
  created_at: string
}

// 설문 데이터
export interface QuestionnaireData {
  q1: string  // 서비스 핵심 아이디어
  q2: string  // 타겟 사용자
  q3: string  // 핵심 기능 3가지
  q4: string  // 차별화 포인트
  q5: string  // 수익 모델
  q6: string  // 사용자 여정
  q7: string  // 필수 데이터
  q8: string  // 외부 연동
  q9: string  // 론칭 범위
  q10: string // 성공 지표
}

// 디자인 선호도
export interface DesignPreference {
  id: number
  project_id: number
  design_tone: string | null
  primary_color: string
  secondary_color: string
  color_mode: string
  layout_style: string
  font_style: string
  corner_style: string
}

// MVP 빌드 큐
export interface MvpBuildQueue {
  id: number
  project_id: number
  status: 'PENDING' | 'BUILDING' | 'COMPLETED' | 'FAILED'
  spec_json: string | null
  github_repo: string | null
  vercel_url: string | null
  error_message: string | null
  build_duration_ms: number | null
  created_at: string
  completed_at: string | null
}

// MVP 프로젝트
export interface MvpProject {
  id: number
  project_id: number
  spec_json: string | null
  github_repo: string | null
  vercel_url: string | null
  version: number
  created_at: string
}
```

---

## Step 9: 페이지 구현

### 공통 레이아웃 `src/app/layout.tsx`

최소한의 HTML 셸 + Tailwind + 한국어 설정.

### `src/app/page.tsx` — 랜딩 페이지

간단한 소개 + "시작하기" 버튼 → /login 또는 /signup

### `src/app/login/page.tsx` — 로그인

Supabase Auth (이메일/비밀번호). `supabase.auth.signInWithPassword()`.

### `src/app/signup/page.tsx` — 회원가입

Supabase Auth. `supabase.auth.signUp()`.

### `src/app/dashboard/page.tsx` — 프로젝트 목록

프로젝트 카드 목록 + "새 프로젝트 만들기" 버튼.
`supabase.from('projects').select('*').order('created_at', { ascending: false })`.

### `src/app/projects/new/page.tsx` — 프로젝트 생성

제목 + 설명 입력 → `supabase.from('projects').insert(...)` → redirect.

### `src/app/projects/[id]/planning/page.tsx` — 기획 (Phase 1)

핵심 페이지. 10개 질문 폼 + AI 생성 + 기획안 표시 + 피드백/딥다이브 + 확정.
기존 planning.html + planning.js의 로직을 React로 재작성.

### `src/app/projects/[id]/design/page.tsx` — 디자인 선호도 (Phase 2)

디자인 톤, 컬러피커, 색상 모드, 레이아웃, 폰트, 모서리 선택.
저장 후 MVP 페이지로 이동.

### `src/app/projects/[id]/mvp/page.tsx` — MVP (Phase 3)

"MVP 생성" 버튼 → 큐 등록 → 폴링으로 상태 확인 → 완료 시 Vercel URL 표시.

---

## Step 10: API Routes

### `src/app/api/projects/[id]/planning/generate/route.ts`

SSE 스트리밍으로 기획안 생성.

```typescript
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { streamWithGemini } from '@/lib/ai/gemini'
import { loadPrompt } from '@/lib/prompts'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  // 프로젝트 조회
  const { data: project } = await supabase
    .from('projects').select('*').eq('id', projectId).single()
  if (!project || project.user_id !== user.id)
    return new Response('Not found', { status: 404 })

  // 설문 데이터 가져오기
  const body = await request.json()
  const questionnaire = body.questionnaire as Record<string, string>

  const systemPrompt = loadPrompt('planner-system.txt')
  const userPrompt = buildPlannerUserPrompt(questionnaire)

  // SSE 스트리밍
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullContent = ''
        for await (const chunk of streamWithGemini(systemPrompt, userPrompt)) {
          fullContent += chunk
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`))
        }

        // DB 저장
        const latestDoc = await supabase
          .from('planning_documents')
          .select('version')
          .eq('project_id', projectId)
          .order('version', { ascending: false })
          .limit(1)
          .single()

        const nextVersion = (latestDoc.data?.version || 0) + 1

        await supabase.from('planning_documents').insert({
          project_id: Number(projectId),
          content: fullContent,
          questionnaire_data: questionnaire,
          version: nextVersion,
        })

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'complete', version: nextVersion })}\n\n`))
      } catch (error: any) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

function buildPlannerUserPrompt(q: Record<string, string>): string {
  return `아래 설문 답변을 기반으로 서비스 기획안을 작성해주세요.

1. 서비스 핵심 아이디어: ${q.q1 || '(미입력)'}
2. 타겟 사용자: ${q.q2 || '(미입력)'}
3. 핵심 기능 3가지: ${q.q3 || '(미입력)'}
4. 차별화 포인트: ${q.q4 || '(미입력)'}
5. 수익 모델: ${q.q5 || '(미입력)'}
6. 사용자 여정: ${q.q6 || '(미입력)'}
7. 필수 데이터: ${q.q7 || '(미입력)'}
8. 외부 연동: ${q.q8 || '(미입력)'}
9. MVP 론칭 범위: ${q.q9 || '(미입력)'}
10. 성공 지표: ${q.q10 || '(미입력)'}
`
}
```

### `src/app/api/projects/[id]/planning/feedback/route.ts`

피드백 반영 → 새 버전 생성. 동일 SSE 패턴.

### `src/app/api/projects/[id]/planning/deep-dive/route.ts`

섹션 딥다이브 → 새 버전 생성. 동일 SSE 패턴.

### `src/app/api/projects/[id]/planning/finalize/route.ts`

기획안 확정 → `is_finalized = true` + `project.status = 'DESIGN'`.

### `src/app/api/projects/[id]/design/preference/route.ts`

GET: 선호도 조회 / POST: 저장 + `project.status = 'MVP'`.

### `src/app/api/projects/[id]/mvp/generate/route.ts`

스펙 추출 (Gemini) → `mvp_build_queue` INSERT (status='PENDING').

### `src/app/api/projects/[id]/mvp/status/route.ts`

`mvp_build_queue` 최신 상태 조회 (프론트에서 폴링).

---

## Step 11: 사이드바 컴포넌트

### `src/components/layout/Sidebar.tsx`

```
Servora 로고
──────────
📋 대시보드       (/dashboard)
──────────
프로젝트명
  📝 기획         (/projects/[id]/planning)
  🎨 디자인       (/projects/[id]/design)
  🚀 MVP         (/projects/[id]/mvp)
──────────
로그아웃
```

현재 프로젝트 상태에 따라 단계 활성/비활성:
- PLANNING: 기획만 활성
- DESIGN: 기획(완료 표시) + 디자인 활성
- MVP: 기획(완료) + 디자인(완료) + MVP 활성

---

## Step 12: README.md

```markdown
# Servora (써보라)

AI 기반 SaaS 제작 플랫폼. 아이디어만 입력하면 기획 → 디자인 → MVP까지.

## 기술 스택
- Next.js 15 (App Router, TypeScript)
- Supabase (PostgreSQL, Auth, RLS)
- Tailwind CSS
- Vercel

## 로컬 개발

1. 의존성 설치
   npm install

2. 환경변수 설정
   cp .env.local.example .env.local
   # Supabase, Gemini API 키 입력

3. Supabase DB 스키마 적용
   # Supabase Dashboard > SQL Editor에서 supabase/migrations/001_init.sql 실행

4. 개발 서버 실행
   npm run dev

5. 접속
   http://localhost:3000

## 배포
Vercel에 GitHub 레포 연결하면 자동 배포.
```

---

## 실행 순서

1. git clone + Next.js 프로젝트 초기화
2. 패키지 설치 (@supabase/supabase-js, @supabase/ssr, marked)
3. .env.local.example 생성
4. Supabase 클라이언트 설정 (client.ts, server.ts, admin.ts)
5. middleware.ts (인증)
6. DB 스키마 파일 생성 (supabase/migrations/001_init.sql)
7. TypeScript 타입 정의 (src/types/index.ts)
8. Gemini API 유틸 (src/lib/ai/gemini.ts)
9. 프롬프트 파일 복사 (기존 v1에서 4개)
10. 프롬프트 로더 (src/lib/prompts/index.ts)
11. 공통 레이아웃 (layout.tsx) + 사이드바
12. 랜딩 페이지 (page.tsx)
13. 로그인/회원가입 (Supabase Auth)
14. 대시보드 (프로젝트 목록 + 생성)
15. 기획 페이지 (설문 → SSE 생성 → 피드백 → 확정)
16. 기획 API Routes (generate, feedback, deep-dive, finalize)
17. 디자인 선호도 페이지
18. 디자인 API Route (preference)
19. MVP 페이지 (상태 조회 + 폴링)
20. MVP API Routes (generate, status)
21. README.md
22. npm run build — 빌드 확인
23. git add + commit + push

## 핵심 제약사항

1. **기존 v1 프롬프트 텍스트를 그대로 사용** — planner-system.txt 등 4개 파일의 내용은 기존과 동일
2. **Supabase RLS 필수** — 모든 테이블에 RLS 정책 적용
3. **SSE 스트리밍** — 기획안 생성은 반드시 SSE로 실시간 전달
4. **한국어 UI** — 모든 텍스트 한국어
5. **반응형** — 모바일에서도 사용 가능
6. **Tailwind 다크모드 지원** — 선택적이지만 준비되면 좋음
7. **Vercel 배포 호환** — `npm run build`가 성공해야 함
8. **MVP 생성 자체는 이 프로젝트에서 하지 않음** — 큐에 등록만. 실제 생성은 별도 데몬