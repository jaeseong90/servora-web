'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* 헤더 */}
      <header className="px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-blue-600">Servora</h1>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            로그인
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            회원가입
          </Link>
        </div>
      </header>

      {/* 히어로 */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          아이디어를 SaaS로,
          <br />
          <span className="text-blue-600">AI가 만들어 드립니다</span>
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mb-8">
          10개 질문에 답하면 AI가 기획안을 작성하고, 디자인을 선택하면 MVP를 자동으로 생성합니다.
          코딩 없이 나만의 SaaS를 시작하세요.
        </p>
        <div className="flex gap-4">
          <Link
            href="/signup"
            className="px-8 py-3 text-lg font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200"
          >
            무료로 시작하기
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 text-lg font-semibold text-blue-600 bg-white rounded-xl hover:bg-gray-50 border border-blue-200"
          >
            로그인
          </Link>
        </div>

        {/* 단계 소개 */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl w-full">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-3xl mb-3 font-bold text-blue-600">1</div>
            <h3 className="font-semibold text-gray-900 mb-2">기획</h3>
            <p className="text-sm text-gray-600">
              10개 질문에 답하면 AI가 16항목의 상세 기획안을 작성합니다.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-3xl mb-3 font-bold text-blue-600">2</div>
            <h3 className="font-semibold text-gray-900 mb-2">디자인</h3>
            <p className="text-sm text-gray-600">
              색상, 레이아웃, 폰트 등 7가지 디자인 선호도를 선택합니다.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-3xl mb-3 font-bold text-blue-600">3</div>
            <h3 className="font-semibold text-gray-900 mb-2">MVP 생성</h3>
            <p className="text-sm text-gray-600">
              AI가 자동으로 MVP를 만들고 배포합니다. URL로 바로 확인하세요.
            </p>
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="px-6 py-4 text-center text-sm text-gray-500">
        &copy; 2026 Servora. All rights reserved.
      </footer>
    </div>
  )
}
