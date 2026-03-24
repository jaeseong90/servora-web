# Servora (써보라)

AI 기반 SaaS 제작 플랫폼. 아이디어만 입력하면 기획 → 디자인 → MVP까지.

## 기술 스택
- Next.js 15 (App Router, TypeScript)
- Supabase (PostgreSQL, Auth, RLS)
- Tailwind CSS
- Vercel

## 로컬 개발

1. 의존성 설치
   ```
   npm install
   ```

2. 환경변수 설정
   ```
   cp .env.local.example .env.local
   # Supabase, Gemini API 키 입력
   ```

3. Supabase DB 스키마 적용
   ```
   # Supabase Dashboard > SQL Editor에서 supabase/migrations/001_init.sql 실행
   ```

4. 개발 서버 실행
   ```
   npm run dev
   ```

5. 접속
   ```
   http://localhost:3000
   ```

## 배포
Vercel에 GitHub 레포 연결하면 자동 배포.
