import Link from 'next/link'
import LandingAnimations from '@/components/landing/LandingAnimations'
import LandingLocaleToggle from '@/components/landing/LandingLocaleToggle'
import './landing.css'

export default function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Servora',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: '아이디어만 입력하면 AI가 기획 → 디자인 → MVP까지 자동으로 만들어 드립니다.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'KRW',
    },
  }

  return (
    <div className="landing-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingAnimations />


      {/* NAV */}
      <header id="nav">
        <Link href="/" className="nav-logo">
          <img src="/img/favicon-32x32.png" className="nav-icon" alt="" />Servora
        </Link>
        <nav className="nav-links">
          <a href="#">Support</a>
          <a href="#">Pricing</a>
        </nav>
        <div className="flex items-center gap-3">
          <LandingLocaleToggle />
          <Link href="/login" className="nav-sign">Sign in</Link>
        </div>
      </header>

      {/* HERO */}
      <section id="hero">
        <div className="hero-noise"></div>
        <h1 className="hero-title">{"생각이 "}<span className="grad">서비스가</span><br />되는 순간</h1>
        <p className="hero-sub">하나의 문장만 있어도 시작할 수 있습니다. Servora는 당신의 생각을 AI와 함께 천천히 꺼내고 하나의 서비스로 구체화합니다.</p>
        <div className="btn-row">
          <Link href="/signup"><button className="btn-p">아이디어 꺼내기</button></Link>
          <a href="#cases"><button className="btn-s">{"아이디어 살펴보기 \u2192"}</button></a>
        </div>
        <div className="hero-visual">
          <div className="hv-browser">
            <div className="hv-bar">
              <div className="hd hd-r"></div>
              <div className="hd hd-y"></div>
              <div className="hd hd-g"></div>
              <div className="hv-url">servora.io/new</div>
            </div>
            <div className="hv-app">
              <div className="hv-row">
                <div className="hv-icon">{"💡"}</div>
                <div>
                  <div className="hv-lbl">아이디어 입력</div>
                  <div className="hv-val">동네 소규모 자영업자들이 쉽게 예약을 관리하고 고객과 소통할 수 있는 서비스<span className="cursor"></span></div>
                </div>
              </div>
              <div className="hv-stages">
                <div className="sp on"><div className="sp-l">기획안</div><div className="sp-v">완료</div></div>
                <div className="sp on"><div className="sp-l">시안</div><div className="sp-v">완료</div></div>
                <div className="sp on"><div className="sp-l">MVP</div><div className="sp-v">완료</div></div>
                <div className="sp"><div className="sp-l">서비스</div><div className="sp-v">{"생성 중\u2026"}</div></div>
              </div>
            </div>
          </div>
        </div>
        <div className="scroll-cue">
          <span>Scroll</span>
          <div className="scroll-line"></div>
        </div>
      </section>

      {/* BH Brand Hero */}
      <div id="bh-brand-hero">
        <canvas id="bh-hero-canvas" aria-hidden="true"></canvas>
        <svg id="bh-hero-svg" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <filter id="bh-idea-glow-f" x="-70%" y="-70%" width="240%" height="240%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="bh-idea-fade-f" x="-70%" y="-70%" width="240%" height="240%">
              <feGaussianBlur id="bh-idea-blur-node" in="SourceGraphic" stdDeviation="12" />
            </filter>
            <filter id="bh-sentence-fade-f" x="-70%" y="-70%" width="240%" height="240%">
              <feGaussianBlur id="bh-sentence-blur-node" in="SourceGraphic" stdDeviation="16" />
            </filter>
          </defs>
          <g id="bh-idea-group" opacity="0" filter="url(#bh-idea-fade-f)">
            <text id="bh-idea-text" x="50%" y="42%" textAnchor="middle" dominantBaseline="middle"
              fontFamily="Inter, sans-serif" fontWeight="900" fontSize="92" letterSpacing="1"
              fill="rgba(240,240,255,0.96)">idea</text>
          </g>
          <g id="bh-sentence-group" opacity="0" filter="url(#bh-sentence-fade-f)">
            <text id="bh-sentence-text" x="50%" y="42%" textAnchor="middle" dominantBaseline="middle"
              fontFamily="Inter, sans-serif" fontWeight="500" fontSize="22" letterSpacing="20"
              fill="rgba(240,240,255,0.88)">{"예약 관리 서비스를 만들고 싶어요"}</text>
          </g>
          <g id="bh-tree-group" opacity="0"></g>
        </svg>
        <div id="bh-hero-ui" aria-label="예약 관리 서비스 완성 화면">
          <div className="cards-scene">
            {/* Left card */}
            <div className="ui-card card-bg card-left">
              <div className="card-mini-hero">
                <div className="card-mini-blob"></div>
                <div className="card-mini-header">
                  <div className="mini-header-title">일정 관리</div>
                  <div className="mini-header-val">{"18건"}</div>
                </div>
              </div>
              <div className="card-mini-body">
                <div className="mini-week-row">
                  <div className="mini-day">월</div><div className="mini-day">화</div>
                  <div className="mini-day active">수</div><div className="mini-day">목</div>
                  <div className="mini-day">금</div><div className="mini-day">토</div><div className="mini-day">일</div>
                </div>
                <div className="mini-stat-list">
                  <div className="mini-stat-row"><span className="mini-stat-name">오전</span><div className="mini-stat-bar-wrap"><div className="mini-stat-bar-fill f1"></div></div><span className="mini-stat-pct">78%</span></div>
                  <div className="mini-stat-row"><span className="mini-stat-name">오후</span><div className="mini-stat-bar-wrap"><div className="mini-stat-bar-fill f2"></div></div><span className="mini-stat-pct">55%</span></div>
                  <div className="mini-stat-row"><span className="mini-stat-name">저녁</span><div className="mini-stat-bar-wrap"><div className="mini-stat-bar-fill f3"></div></div><span className="mini-stat-pct">90%</span></div>
                </div>
              </div>
            </div>
            {/* Right card */}
            <div className="ui-card card-bg card-right">
              <div className="card-mini-hero">
                <div className="card-mini-blob"></div>
                <div className="card-mini-header">
                  <div className="mini-header-title">고객 관리</div>
                  <div className="mini-header-val">{"142명"}</div>
                </div>
              </div>
              <div className="card-mini-body">
                <div className="mini-week-row">
                  <div className="mini-day">1주</div><div className="mini-day">2주</div>
                  <div className="mini-day active">3주</div><div className="mini-day">4주</div>
                </div>
                <div className="mini-stat-list" style={{ marginTop: '4px' }}>
                  <div className="mini-stat-row"><span className="mini-stat-name">신규</span><div className="mini-stat-bar-wrap"><div className="mini-stat-bar-fill f3"></div></div><span className="mini-stat-pct">{"12명"}</span></div>
                  <div className="mini-stat-row"><span className="mini-stat-name">재방문</span><div className="mini-stat-bar-wrap"><div className="mini-stat-bar-fill f1" style={{ width: '88%' }}></div></div><span className="mini-stat-pct">88%</span></div>
                  <div className="mini-stat-row"><span className="mini-stat-name">완료</span><div className="mini-stat-bar-wrap"><div className="mini-stat-bar-fill f2" style={{ width: '94%' }}></div></div><span className="mini-stat-pct">94%</span></div>
                </div>
              </div>
            </div>
            {/* Main card */}
            <div className="ui-card card-main">
              <div className="card-hero-area">
                <div className="card-hero-bg"></div>
                <div className="card-hero-content">
                  <div className="hero-top-bar">
                    <span className="hero-title">예약 현황</span>
                    <span className="hero-live"><span className="live-dot"></span>Live</span>
                  </div>
                  <div className="hero-date">{"2026년 3월 20일 \u00B7 목요일"}</div>
                  <div className="hero-stats-row">
                    <div className="hero-stat-pill"><span className="hsp-val">0</span><span className="hsp-lbl">전체</span></div>
                    <div className="hero-stat-pill teal"><span className="hsp-val">0</span><span className="hsp-lbl">완료율</span></div>
                    <div className="hero-stat-pill blue"><span className="hsp-val">0</span><span className="hsp-lbl">오늘</span></div>
                  </div>
                </div>
              </div>
              <div className="hero-progress-bar"><div className="hero-progress-fill"></div></div>
              <div className="card-app-body">
                <div className="app-section-header">
                  <span className="app-section-title">오늘의 예약</span>
                  <span className="app-section-badge">3</span>
                </div>
                <div className="app-booking-list">
                  <div className="booking-item"><div className="bi-avatar av1">지</div><div className="bi-info"><span className="bi-name">김지은</span><span className="bi-svc">{"컷 + 펌"}</span></div><span className="bi-time">10:00</span><span className="bi-tag confirmed">확정</span></div>
                  <div className="booking-item"><div className="bi-avatar av2">수</div><div className="bi-info"><span className="bi-name">이수현</span><span className="bi-svc">네일 케어</span></div><span className="bi-time">11:30</span><span className="bi-tag waiting">대기</span></div>
                  <div className="booking-item"><div className="bi-avatar av3">민</div><div className="bi-info"><span className="bi-name">박민서</span><span className="bi-svc">두피 트리트먼트</span></div><span className="bi-time">14:00</span><span className="bi-tag confirmed">확정</span></div>
                </div>
              </div>
              <div className="card-bottom-nav">
                <div className="nav-item active"><div className="nav-icon">{"⊙"}</div><span>홈</span></div>
                <div className="nav-item"><div className="nav-icon">{"⊞"}</div><span>예약</span></div>
                <div className="nav-item"><div className="nav-icon">{"⊚"}</div><span>고객</span></div>
                <div className="nav-item"><div className="nav-icon">{"⊛"}</div><span>설정</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <section id="features">
        <div className="feat-hdr">
          <h2 className="sec-title">{"기획하고, 시안을 보고,"}<br />출시하세요</h2>
          <p className="sec-sub">Servora는 기획안 작성부터 화면 시안, MVP 제작, 이후 운영 단계까지 서비스가 만들어지는 흐름 전체를 연결합니다.</p>
        </div>
        <div id="feat-driver">
          <div id="feat-pin">
            <div className="feat-tabs">
              <div className="feat-menu">
                <div className="feat-item active" data-tab="0">
                  <div className="feat-item-num">기획안</div>
                  <div className="feat-item-title">아이디어를 서비스 기획안으로 정리합니다</div>
                  <div className="feat-item-desc">하나의 문장, 짧은 설명, 메모 수준의 입력만 있어도 괜찮습니다. Servora는 아이디어의 목적, 사용자, 문제, 핵심 가치를 정리해 기획안 초안으로 구체화합니다.</div>
                  <div className="feat-item-note">무엇을 만들지 막막한 순간에도, 시작 가능한 형태로 정리됩니다</div>
                </div>
                <div className="feat-item" data-tab="1">
                  <div className="feat-item-num">시안</div>
                  <div className="feat-item-title">구조를 화면으로 빠르게 확인합니다</div>
                  <div className="feat-item-desc">기획안과 정보구조를 바탕으로 주요 화면 시안을 생성합니다. 텍스트로만 상상하던 서비스를 실제 화면 흐름으로 확인할 수 있습니다.</div>
                  <div className="feat-item-note">{"머릿속 서비스가 처음으로 '보이는 형태'가 됩니다"}</div>
                </div>
                <div className="feat-item" data-tab="2">
                  <div className="feat-item-num">MVP</div>
                  <div className="feat-item-title">검토 가능한 MVP로 이어집니다</div>
                  <div className="feat-item-desc">시안에서 끝나지 않고 실제 검토 가능한 MVP 형태까지 연결합니다. 핵심 기능 중심으로 빠르게 구성해 아이디어를 현실적인 단계로 끌어올립니다.</div>
                  <div className="feat-item-note">출시를 위한 첫 번째 형태를 더 빠르게 확인할 수 있습니다</div>
                </div>
                <div className="feat-item" data-tab="3">
                  <div className="feat-item-num">{"서비스 "}<span className="coming-soon">COMING SOON</span></div>
                  <div className="feat-item-title">서비스로 이어지는 다음 단계를 준비합니다</div>
                  <div className="feat-item-desc">기획안, 시안, MVP를 넘어 실제 서비스 구축 흐름으로 연결될 수 있도록 준비합니다.</div>
                  <div className="feat-item-note">생성된 결과물이 다음 제작 단계의 기반이 됩니다</div>
                </div>
                <div className="feat-item" data-tab="4">
                  <div className="feat-item-num">{"운영 "}<span className="coming-soon">COMING SOON</span></div>
                  <div className="feat-item-title">만든 뒤에도 계속 다듬고 운영합니다</div>
                  <div className="feat-item-desc">서비스는 만드는 순간보다 운영하는 과정이 더 길 수 있습니다. 수정, 정리, 관리, 개선까지 이어지는 운영 관점의 흐름도 함께 준비합니다.</div>
                  <div className="feat-item-note">출시 이후의 서비스도 계속 자라날 수 있도록</div>
                </div>
              </div>
              <div className="feat-panels">
                {/* Panel 0 - Plan */}
                <div className="feat-panel active" data-tab="0">
                  <div className="fi-vis">
                    <div className="fv">
                      <div className="glp-input">
                        <div className="glp-input-ic">{"💡"}</div>
                        <div className="glp-input-txt">동네 자영업자 예약 관리 서비스<span className="cursor"></span></div>
                      </div>
                      <div className="glp-arrow">{"↓ AI 기획 생성 중"}</div>
                      <div className="glp-grid">
                        <div className="glp-sec glp-sec--active"><div className="glp-sec-h">서비스 개요</div><div className="glp-sec-t">{"소규모 자영업자 예약\u00B7고객 관리 플랫폼"}</div></div>
                        <div className="glp-sec"><div className="glp-sec-h">{"기획 배경 \u00B7 문제 정의"}</div><div className="glp-sec-t">{"수기 관리 비효율, 예약 누락\u00B7이탈 빈발"}</div></div>
                        <div className="glp-sec"><div className="glp-sec-h">목표 및 기대효과</div><div className="glp-sec-t">{"예약 누락 0%, 재방문율 +30%"}</div></div>
                        <div className="glp-sec"><div className="glp-sec-h">주요 사용자 정의</div><div className="glp-sec-t">{"미용실\u00B7네일샵\u00B7카페 소상공인"}</div></div>
                        <div className="glp-sec"><div className="glp-sec-h">{"사용 맥락 \u00B7 핵심 이용 장면"}</div><div className="glp-sec-t">영업 중 빠른 예약 확인 및 즉시 응대</div></div>
                        <div className="glp-sec"><div className="glp-sec-h">서비스 핵심 가치</div><div className="glp-sec-t">단순하고 빠른 예약 자동화</div></div>
                        <div className="glp-sec"><div className="glp-sec-h">핵심 기능 구성</div><div className="glp-sec-t">{"캘린더 \u00B7 알림 \u00B7 고객DB \u00B7 매출 현황"}</div></div>
                        <div className="glp-sec"><div className="glp-sec-h">{"주요 화면 \u00B7 정보 구조"}</div><div className="glp-sec-t">{"홈 \u00B7 예약 \u00B7 고객 \u00B7 통계 4개 탭 구조"}</div></div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Panel 1 - Design */}
                <div className="feat-panel" data-tab="1">
                  <div className="fi-vis">
                    <div className="fv" style={{ padding: '16px' }}>
                      <svg viewBox="0 0 300 195" style={{ width: '100%', height: '100%' }} xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <filter id="gf2"><feGaussianBlur stdDeviation="2.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                          <linearGradient id="lg-p" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#7c3aed" stopOpacity=".9" /><stop offset="100%" stopColor="#818cf8" stopOpacity=".9" /></linearGradient>
                        </defs>
                        <path d="M 150,35 C 150,58 75,62 75,80" stroke="rgba(196,181,253,.35)" strokeWidth="1.5" fill="none" />
                        <path d="M 150,35 C 150,55 200,62 200,80" stroke="rgba(110,231,216,.32)" strokeWidth="1.5" fill="none" />
                        <path d="M 150,35 C 150,58 260,62 260,80" stroke="rgba(96,165,250,.3)" strokeWidth="1.5" fill="none" />
                        <path d="M 75,100 C 75,132 25,148 25,161" stroke="rgba(196,181,253,.2)" strokeWidth="1" fill="none" />
                        <path d="M 75,100 C 75,132 75,148 75,161" stroke="rgba(196,181,253,.2)" strokeWidth="1" fill="none" />
                        <path d="M 75,100 C 75,132 125,148 125,161" stroke="rgba(196,181,253,.2)" strokeWidth="1" fill="none" />
                        <path d="M 200,100 C 200,132 175,148 175,161" stroke="rgba(110,231,216,.2)" strokeWidth="1" fill="none" />
                        <path d="M 200,100 C 200,132 225,148 225,161" stroke="rgba(110,231,216,.2)" strokeWidth="1" fill="none" />
                        <path d="M 260,100 C 260,132 275,148 275,161" stroke="rgba(96,165,250,.2)" strokeWidth="1" fill="none" />
                        <rect x="118" y="11" width="64" height="24" rx="12" fill="rgba(124,58,237,.18)" stroke="url(#lg-p)" strokeWidth="1.4" filter="url(#gf2)" />
                        <text x="150" y="27" textAnchor="middle" fill="rgba(255,255,255,.95)" fontSize="9.5" fontFamily="Inter,sans-serif" fontWeight="700">서비스</text>
                        <rect x="41" y="80" width="68" height="20" rx="10" fill="rgba(124,58,237,.14)" stroke="rgba(196,181,253,.45)" strokeWidth="1" />
                        <text x="75" y="93" textAnchor="middle" fill="rgba(255,255,255,.88)" fontSize="8.5" fontFamily="Inter,sans-serif" fontWeight="600">예약관리</text>
                        <rect x="176" y="80" width="48" height="20" rx="10" fill="rgba(110,231,216,.1)" stroke="rgba(110,231,216,.42)" strokeWidth="1" />
                        <text x="200" y="93" textAnchor="middle" fill="rgba(255,255,255,.88)" fontSize="8.5" fontFamily="Inter,sans-serif" fontWeight="600">고객</text>
                        <rect x="234" y="80" width="52" height="20" rx="10" fill="rgba(96,165,250,.1)" stroke="rgba(147,197,253,.4)" strokeWidth="1" />
                        <text x="260" y="93" textAnchor="middle" fill="rgba(255,255,255,.88)" fontSize="8.5" fontFamily="Inter,sans-serif" fontWeight="600">설정</text>
                        <rect x="5" y="161" width="40" height="17" rx="8.5" fill="rgba(124,58,237,.1)" stroke="rgba(196,181,253,.28)" strokeWidth=".9" />
                        <text x="25" y="173" textAnchor="middle" fill="rgba(255,255,255,.68)" fontSize="7.5" fontFamily="Inter,sans-serif">캘린더</text>
                        <rect x="55" y="161" width="40" height="17" rx="8.5" fill="rgba(124,58,237,.1)" stroke="rgba(196,181,253,.28)" strokeWidth=".9" />
                        <text x="75" y="173" textAnchor="middle" fill="rgba(255,255,255,.68)" fontSize="7.5" fontFamily="Inter,sans-serif">신규예약</text>
                        <rect x="105" y="161" width="40" height="17" rx="8.5" fill="rgba(124,58,237,.1)" stroke="rgba(196,181,253,.28)" strokeWidth=".9" />
                        <text x="125" y="173" textAnchor="middle" fill="rgba(255,255,255,.68)" fontSize="7.5" fontFamily="Inter,sans-serif">알림</text>
                        <rect x="155" y="161" width="40" height="17" rx="8.5" fill="rgba(110,231,216,.08)" stroke="rgba(110,231,216,.25)" strokeWidth=".9" />
                        <text x="175" y="173" textAnchor="middle" fill="rgba(255,255,255,.68)" fontSize="7.5" fontFamily="Inter,sans-serif">고객 DB</text>
                        <rect x="205" y="161" width="40" height="17" rx="8.5" fill="rgba(110,231,216,.08)" stroke="rgba(110,231,216,.25)" strokeWidth=".9" />
                        <text x="225" y="173" textAnchor="middle" fill="rgba(255,255,255,.68)" fontSize="7.5" fontFamily="Inter,sans-serif">방문이력</text>
                        <rect x="255" y="161" width="40" height="17" rx="8.5" fill="rgba(96,165,250,.08)" stroke="rgba(147,197,253,.22)" strokeWidth=".9" />
                        <text x="275" y="173" textAnchor="middle" fill="rgba(255,255,255,.68)" fontSize="7.5" fontFamily="Inter,sans-serif">프로필</text>
                      </svg>
                    </div>
                  </div>
                </div>
                {/* Panel 2 - MVP */}
                <div className="feat-panel" data-tab="2">
                  <div className="fi-vis">
                    <div className="fv">
                      <div className="mvp-device">
                        <div className="mvp-bar">
                          <div className="mvp-dot" style={{ background: '#ff5f56' }}></div>
                          <div className="mvp-dot" style={{ background: '#febc2e' }}></div>
                          <div className="mvp-dot" style={{ background: '#28c840' }}></div>
                          <div style={{ flex: 1, margin: '0 8px', background: 'rgba(255,255,255,.05)', borderRadius: '3px', padding: '3px 8px', fontSize: '8px', color: 'rgba(255,255,255,.22)', textAlign: 'center' }}>servora.io/app/reservations</div>
                        </div>
                        <div className="mvp-nav">
                          <div className="mvp-ntab">홈</div>
                          <div className="mvp-ntab on">예약</div>
                          <div className="mvp-ntab">고객</div>
                          <div className="mvp-ntab">통계</div>
                        </div>
                        <div className="mvp-body">
                          <div className="mvp-cal">
                            <div className="mvp-cd" style={{ fontSize: '6px', color: 'rgba(255,255,255,.2)' }}>월</div><div className="mvp-cd" style={{ fontSize: '6px', color: 'rgba(255,255,255,.2)' }}>화</div><div className="mvp-cd" style={{ fontSize: '6px', color: 'rgba(255,255,255,.2)' }}>수</div><div className="mvp-cd" style={{ fontSize: '6px', color: 'rgba(255,255,255,.2)' }}>목</div><div className="mvp-cd" style={{ fontSize: '6px', color: 'rgba(255,255,255,.2)' }}>금</div><div className="mvp-cd" style={{ fontSize: '6px', color: 'rgba(255,255,255,.2)' }}>토</div><div className="mvp-cd" style={{ fontSize: '6px', color: 'rgba(255,255,255,.2)' }}>일</div>
                            <div className="mvp-cd">17</div><div className="mvp-cd has">18</div><div className="mvp-cd today">19</div><div className="mvp-cd has">20</div><div className="mvp-cd">21</div><div className="mvp-cd has">22</div><div className="mvp-cd">23</div>
                          </div>
                          <div className="mvp-resv">
                            <div className="mvp-resv-dot" style={{ background: '#c4b5fd', boxShadow: '0 0 5px #c4b5fd' }}></div>
                            <div className="mvp-resv-info"><div className="mvp-resv-nm">{"김민지 \u00B7 커트+염색"}</div><div className="mvp-resv-tm">{"10:00 \u2013 11:30"}</div></div>
                            <div className="mvp-resv-st" style={{ color: '#4ade80' }}>확정</div>
                          </div>
                          <div className="mvp-resv">
                            <div className="mvp-resv-dot" style={{ background: '#818cf8', boxShadow: '0 0 5px #818cf8' }}></div>
                            <div className="mvp-resv-info"><div className="mvp-resv-nm">{"박서연 \u00B7 네일아트"}</div><div className="mvp-resv-tm">{"14:00 \u2013 15:00"}</div></div>
                            <div className="mvp-resv-st" style={{ color: '#fbbf24' }}>대기</div>
                          </div>
                        </div>
                      </div>
                      <div className="mvp-live-bar">
                        <div className="mvp-live-dot"></div>
                        <div className="mvp-live-txt">{"MVP 서비스 \u2014 실시간 운영 중"}</div>
                        <div className="mvp-live-num">{"오늘 예약 8건"}</div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Panel 3 - Service Build */}
                <div className="feat-panel" data-tab="3">
                  <div className="fi-vis">
                    <div className="fv">
                      <div className="svc-pipe">
                        <div className="svc-stage done">
                          <div className="svc-ic">{"✅"}</div>
                          <div className="svc-info"><div className="svc-name">{"기획 \u00B7 설계 완료"}</div><div className="svc-detail">{"기획안 \u00B7 IA 구조 \u00B7 화면 시안 확정"}</div></div>
                          <div className="svc-badge done">Done</div>
                        </div>
                        <div className="svc-stage done">
                          <div className="svc-ic">{"🎨"}</div>
                          <div className="svc-info"><div className="svc-name">UI 코드 생성</div><div className="svc-detail">{"React 컴포넌트 32개 \u00B7 Tailwind CSS"}</div></div>
                          <div className="svc-badge done">Done</div>
                        </div>
                        <div className="svc-stage active">
                          <div className="svc-ic">{"⚙️"}</div>
                          <div className="svc-info"><div className="svc-name">{"API 연결 \u00B7 배포"}</div><div className="svc-detail">{"Vercel 배포 \u00B7 DB 연결 진행 중"}</div></div>
                          <div className="svc-badge run">Running</div>
                        </div>
                        <div className="svc-stage">
                          <div className="svc-ic">{"🚀"}</div>
                          <div className="svc-info"><div className="svc-name">서비스 출시</div><div className="svc-detail">{"도메인 연결 \u00B7 모니터링 설정 예정"}</div></div>
                          <div className="svc-badge wait">대기 중</div>
                        </div>
                      </div>
                      <div className="svc-commit">
                        <div className="svc-commit-hash">a3f9c12</div>
                        <div className="svc-commit-msg">feat: 예약 캘린더 컴포넌트 완성</div>
                        <div className="svc-commit-time">2분 전</div>
                      </div>
                      <div className="svc-commit">
                        <div className="svc-commit-hash">b8d4e71</div>
                        <div className="svc-commit-msg">fix: 알림 발송 타이밍 조정</div>
                        <div className="svc-commit-time">17분 전</div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Panel 4 - Ops */}
                <div className="feat-panel" data-tab="4">
                  <div className="fi-vis">
                    <div className="fv">
                      <div className="ops-kpi">
                        <div className="ops-card ops-card--purple">
                          <div className="ops-v ops-v--purple">1,247</div>
                          <div className="ops-l">총 예약 건</div>
                          <div className="ops-trend">{"↑ 23% 이번 주"}</div>
                        </div>
                        <div className="ops-card ops-card--teal">
                          <div className="ops-v ops-v--teal">98%</div>
                          <div className="ops-l">서비스 가동률</div>
                          <div className="ops-trend">안정 운영 중</div>
                        </div>
                        <div className="ops-card ops-card--green">
                          <div className="ops-v ops-v--green">4.9</div>
                          <div className="ops-l">평균 만족도</div>
                          <div className="ops-trend">{"★ 94건 리뷰"}</div>
                        </div>
                      </div>
                      <div className="ops-spark">
                        <svg viewBox="0 0 260 26" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#7c3aed" stopOpacity=".35" />
                              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path d="M0,22 L22,20 L44,17 L66,19 L88,13 L110,10 L132,8 L154,11 L176,6 L198,4 L220,2 L242,1 L260,0" stroke="#c4b5fd" strokeWidth="1.5" fill="none" />
                          <path d="M0,22 L22,20 L44,17 L66,19 L88,13 L110,10 L132,8 L154,11 L176,6 L198,4 L220,2 L242,1 L260,0 L260,26 L0,26 Z" fill="url(#spark-fill)" />
                        </svg>
                      </div>
                      <div className="ops-feed">
                        <div className="ops-fitem">
                          <div className="ops-fstar">{"★★★★★"}</div>
                          <div className="ops-ftxt">예약 알림 덕분에 노쇼가 확 줄었어요</div>
                          <div className="ops-fuser">김민지</div>
                        </div>
                        <div className="ops-fitem">
                          <div className="ops-fstar">{"★★★★★"}</div>
                          <div className="ops-ftxt">매출 현황 보는 게 너무 편해졌습니다</div>
                          <div className="ops-fuser">박서연</div>
                        </div>
                        <div className="ops-fitem">
                          <div className="ops-fstar">{"★★★★☆"}</div>
                          <div className="ops-ftxt">고객 메모 기능이 특히 유용해요</div>
                          <div className="ops-fuser">이수진</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section id="trust">
        <h2 className="sec-title" style={{ margin: '0 auto 16px', maxWidth: '580px' }}>수많은 아이디어가 실제 결과물로 이어지고 있습니다</h2>
        <p className="sec-sub" style={{ margin: '0 auto' }}>아이디어는 기획안이 되고, 시안이 되고, 실제 서비스 형태로 계속 이어집니다.</p>
        <div className="trust-stats">
          <div className="ts"><div className="ts-v">1,210+</div><div className="ts-l">생성된 아이디어</div></div>
          <div className="ts"><div className="ts-v ts-v--cyan">830+</div><div className="ts-l">완성된 시안</div></div>
          <div className="ts"><div className="ts-v ts-v--teal">710+</div><div className="ts-l">출시된 서비스</div></div>
          <div className="ts"><div className="ts-v ts-v--pink">97%</div><div className="ts-l">{"아이디어 → 출시 전환율"}</div></div>
        </div>
        <div className="ptitle">함께 만들고 있는 팀들</div>
        <div className="partners">
          <div className="pname">Starship</div>
          <div className="pname">Linkflow</div>
          <div className="pname">Nextdoor</div>
          <div className="pname">Mosaik</div>
          <div className="pname">Orbit Labs</div>
          <div className="pname">Pageloom</div>
        </div>
      </section>

      {/* USE CASES */}
      <section id="cases">
        <h2 className="sec-title" style={{ textAlign: 'center', margin: '0 auto 16px' }}>{"다양한 서비스가"}<br />Servora로 시작됩니다</h2>
        <p className="sec-sub" style={{ textAlign: 'center', margin: '0 auto' }}>하나의 아이디어가 어떤 형태의 서비스로 이어질 수 있는지 직접 확인해보세요</p>
        <div className="cases-grid">
          <a href="https://stripe.com/" target="_blank" rel="noopener" className="cc cc-real">
            <div className="cc-vis cc-vis-real" style={{ padding: 0, background: '#000' }}>
              <img src="https://image.thum.io/get/width/600/crop/320/https://stripe.com/" alt="stripe.com 스크린샷" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} loading="lazy" />
              <div className="cc-real-overlay"><span className="cc-real-link">{"stripe.com \u2192"}</span></div>
              <span className="cc-badge cb-mvp">Live</span>
            </div>
            <div className="cc-body">
              <div className="cc-title">Stripe</div>
              <div className="cc-sub">전 세계 수백만 기업이 사용하는 온라인 결제 인프라. 개발자 친화적인 API로 결제를 빠르게 연동합니다.</div>
              <div className="cc-meta"><div className="cc-av" style={{ background: 'linear-gradient(135deg,#635bff,#8b83ff)' }}></div><div className="cc-au">stripe.com</div></div>
            </div>
          </a>
          <a href="https://www.promptclip.kr/" target="_blank" rel="noopener" className="cc cc-real">
            <div className="cc-vis cc-vis-real" style={{ padding: 0, background: '#000' }}>
              <img src="https://image.thum.io/get/width/600/crop/320/https://www.promptclip.kr/" alt="promptclip.kr 스크린샷" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} loading="lazy" />
              <div className="cc-real-overlay"><span className="cc-real-link">{"promptclip.kr \u2192"}</span></div>
              <span className="cc-badge cb-mvp">Live</span>
            </div>
            <div className="cc-body">
              <div className="cc-title">PromptClip</div>
              <div className="cc-sub">AI 프롬프트를 클립처럼 저장하고 공유하는 서비스. Servora로 기획부터 출시까지.</div>
              <div className="cc-meta"><div className="cc-av" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}></div><div className="cc-au">Servora 출시 사례</div></div>
            </div>
          </a>
          <a href="https://land-book.com" target="_blank" rel="noopener" className="cc cc-real">
            <div className="cc-vis cc-vis-real" style={{ padding: 0, background: '#000' }}>
              <img src="https://image.thum.io/get/width/600/crop/320/https://land-book.com" alt="land-book.com 스크린샷" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} loading="lazy" />
              <div className="cc-real-overlay"><span className="cc-real-link">{"land-book.com \u2192"}</span></div>
              <span className="cc-badge cb-mvp">Live</span>
            </div>
            <div className="cc-body">
              <div className="cc-title">Land-book</div>
              <div className="cc-sub">최고의 랜딩 페이지 디자인을 엄선해 모아놓은 갤러리. 서비스 기획 시 레퍼런스로 활용하세요.</div>
              <div className="cc-meta"><div className="cc-av" style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}></div><div className="cc-au">land-book.com</div></div>
            </div>
          </a>
          <a href="https://www.siteinspire.com" target="_blank" rel="noopener" className="cc cc-real">
            <div className="cc-vis cc-vis-real" style={{ padding: 0, background: '#000' }}>
              <img src="https://image.thum.io/get/width/600/crop/320/https://www.siteinspire.com" alt="siteinspire.com 스크린샷" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} loading="lazy" />
              <div className="cc-real-overlay"><span className="cc-real-link">{"siteinspire.com \u2192"}</span></div>
              <span className="cc-badge cb-mvp">Live</span>
            </div>
            <div className="cc-body">
              <div className="cc-title">Siteinspire</div>
              <div className="cc-sub">수준 높은 웹 디자인 사례만 엄선한 인스피레이션 큐레이션 사이트.</div>
              <div className="cc-meta"><div className="cc-av" style={{ background: 'linear-gradient(135deg,#94a3b8,#475569)' }}></div><div className="cc-au">siteinspire.com</div></div>
            </div>
          </a>
          <a href="https://godly.website" target="_blank" rel="noopener" className="cc cc-real">
            <div className="cc-vis cc-vis-real" style={{ padding: 0, background: '#000' }}>
              <img src="https://image.thum.io/get/width/600/crop/320/https://godly.website" alt="godly.website 스크린샷" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} loading="lazy" />
              <div className="cc-real-overlay"><span className="cc-real-link">{"godly.website \u2192"}</span></div>
              <span className="cc-badge cb-mvp">Live</span>
            </div>
            <div className="cc-body">
              <div className="cc-title">Godly</div>
              <div className="cc-sub">모션과 인터랙션이 돋보이는 웹사이트 인스피레이션 컬렉션.</div>
              <div className="cc-meta"><div className="cc-av" style={{ background: 'linear-gradient(135deg,#a855f7,#ec4899)' }}></div><div className="cc-au">godly.website</div></div>
            </div>
          </a>
          <a href="https://www.lapa.ninja" target="_blank" rel="noopener" className="cc cc-real">
            <div className="cc-vis cc-vis-real" style={{ padding: 0, background: '#000' }}>
              <img src="https://image.thum.io/get/width/600/crop/320/https://www.lapa.ninja" alt="lapa.ninja 스크린샷" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} loading="lazy" />
              <div className="cc-real-overlay"><span className="cc-real-link">{"lapa.ninja \u2192"}</span></div>
              <span className="cc-badge cb-mvp">Live</span>
            </div>
            <div className="cc-body">
              <div className="cc-title">Lapa Ninja</div>
              <div className="cc-sub">{"랜딩 페이지\u00B7앱 디자인 레퍼런스를 카테고리별로 정리한 컬렉션."}</div>
              <div className="cc-meta"><div className="cc-av" style={{ background: 'linear-gradient(135deg,#f97316,#ef4444)' }}></div><div className="cc-au">lapa.ninja</div></div>
            </div>
          </a>
          <a href="https://www.nngroup.com/" target="_blank" rel="noopener" className="cc cc-real">
            <div className="cc-vis cc-vis-real" style={{ padding: 0, background: '#000' }}>
              <img src="https://image.thum.io/get/width/600/crop/320/https://www.nngroup.com/" alt="nngroup.com 스크린샷" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} loading="lazy" />
              <div className="cc-real-overlay"><span className="cc-real-link">{"nngroup.com \u2192"}</span></div>
              <span className="cc-badge cb-mvp">Live</span>
            </div>
            <div className="cc-body">
              <div className="cc-title">NN/g Nielsen Norman</div>
              <div className="cc-sub">사용자 경험 연구 기반의 UX 가이드라인과 심층 아티클.</div>
              <div className="cc-meta"><div className="cc-av" style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}></div><div className="cc-au">nngroup.com</div></div>
            </div>
          </a>
          <a href="https://www.smashingmagazine.com/" target="_blank" rel="noopener" className="cc cc-real">
            <div className="cc-vis cc-vis-real" style={{ padding: 0, background: '#000' }}>
              <img src="https://image.thum.io/get/width/600/crop/320/https://www.smashingmagazine.com/" alt="smashingmagazine.com 스크린샷" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} loading="lazy" />
              <div className="cc-real-overlay"><span className="cc-real-link">{"smashingmagazine.com \u2192"}</span></div>
              <span className="cc-badge cb-mvp">Live</span>
            </div>
            <div className="cc-body">
              <div className="cc-title">Smashing Magazine</div>
              <div className="cc-sub">{"웹 개발\u00B7디자인 실무 아티클과 튜토리얼. 기획부터 개발까지 깊이 있는 인사이트."}</div>
              <div className="cc-meta"><div className="cc-av" style={{ background: 'linear-gradient(135deg,#e11d48,#f97316)' }}></div><div className="cc-au">smashingmagazine.com</div></div>
            </div>
          </a>
          <a href="https://www.figma.com/resource-library/" target="_blank" rel="noopener" className="cc cc-real">
            <div className="cc-vis cc-vis-real" style={{ padding: 0, background: '#000' }}>
              <img src="https://image.thum.io/get/width/600/crop/320/https://www.figma.com/resource-library/" alt="figma.com 스크린샷" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} loading="lazy" />
              <div className="cc-real-overlay"><span className="cc-real-link">{"figma.com/resource-library \u2192"}</span></div>
              <span className="cc-badge cb-mvp">Live</span>
            </div>
            <div className="cc-body">
              <div className="cc-title">Figma Resource Library</div>
              <div className="cc-sub">Figma 공식 디자인 리소스 및 가이드. UI 시안 제작 시 바로 활용 가능.</div>
              <div className="cc-meta"><div className="cc-av" style={{ background: 'linear-gradient(135deg,#a259ff,#1abcfe)' }}></div><div className="cc-au">figma.com</div></div>
            </div>
          </a>
          <a href="https://webflow.com/blog" target="_blank" rel="noopener" className="cc cc-real">
            <div className="cc-vis cc-vis-real" style={{ padding: 0, background: '#000' }}>
              <img src="https://image.thum.io/get/width/600/crop/320/https://webflow.com/blog" alt="webflow.com 스크린샷" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} loading="lazy" />
              <div className="cc-real-overlay"><span className="cc-real-link">{"webflow.com/blog \u2192"}</span></div>
              <span className="cc-badge cb-mvp">Live</span>
            </div>
            <div className="cc-body">
              <div className="cc-title">Webflow Blog</div>
              <div className="cc-sub">{"웹 디자인\u00B7노코드 개발 인사이트와 튜토리얼. 서비스 구현 아이디어를 얻어보세요."}</div>
              <div className="cc-meta"><div className="cc-av" style={{ background: 'linear-gradient(135deg,#4353ff,#146ef5)' }}></div><div className="cc-au">webflow.com</div></div>
            </div>
          </a>
          {/* Placeholder cards */}
          <div className="cc">
            <div className="cc-vis">
              <div className="cc-lines">
                <div className="ccl" style={{ width: '70%', background: 'rgba(124,58,237,.22)' }}></div>
                <div className="ccl" style={{ width: '50%' }}></div>
                <div className="ccl" style={{ width: '82%' }}></div>
                <div className="ccl" style={{ width: '42%' }}></div>
              </div>
              <span className="cc-badge cb-mvp">MVP</span>
            </div>
            <div className="cc-body">
              <div className="cc-title">동네 자영업자 예약 서비스</div>
              <div className="cc-sub">미용실, 네일샵을 위한 예약 관리. 아이디어 입력부터 MVP까지 4시간.</div>
              <div className="cc-meta"><div className="cc-av" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}></div><div className="cc-au">{"박지수 \u00B7 1인 창업자"}</div></div>
            </div>
          </div>
          <div className="cc">
            <div className="cc-vis">
              <div className="cc-lines">
                <div className="ccl" style={{ width: '80%', background: 'rgba(96,165,250,.18)' }}></div>
                <div className="ccl" style={{ width: '55%' }}></div>
                <div className="ccl" style={{ width: '68%' }}></div>
                <div className="ccl" style={{ width: '45%' }}></div>
              </div>
              <span className="cc-badge cb-beta">Beta</span>
            </div>
            <div className="cc-body">
              <div className="cc-title">팀 프로젝트 관리 도구</div>
              <div className="cc-sub">스타트업 내부 팀을 위한 경량 프로젝트 보드. IA부터 시안까지 자동 생성.</div>
              <div className="cc-meta"><div className="cc-av" style={{ background: 'linear-gradient(135deg,#4f46e5,#60a5fa)' }}></div><div className="cc-au">{"김민준 \u00B7 프로덕트 매니저"}</div></div>
            </div>
          </div>
          <div className="cc">
            <div className="cc-vis">
              <div className="cc-lines">
                <div className="ccl" style={{ width: '62%', background: 'rgba(110,231,216,.15)' }}></div>
                <div className="ccl" style={{ width: '78%' }}></div>
                <div className="ccl" style={{ width: '48%' }}></div>
                <div className="ccl" style={{ width: '66%' }}></div>
              </div>
              <span className="cc-badge cb-wip">In progress</span>
            </div>
            <div className="cc-body">
              <div className="cc-title">로컬 커뮤니티 플랫폼</div>
              <div className="cc-sub">동네 기반 모임과 정보 공유 서비스. 사이드 프로젝트로 시작해 MVP 단계.</div>
              <div className="cc-meta"><div className="cc-av" style={{ background: 'linear-gradient(135deg,#06b6d4,#6EE7D8)' }}></div><div className="cc-au">{"이서연 \u00B7 사이드 프로젝터"}</div></div>
            </div>
          </div>
          <div className="cc">
            <div className="cc-vis">
              <div className="cc-lines">
                <div className="ccl" style={{ width: '58%', background: 'rgba(240,171,252,.13)' }}></div>
                <div className="ccl" style={{ width: '75%' }}></div>
                <div className="ccl" style={{ width: '52%' }}></div>
                <div className="ccl" style={{ width: '72%' }}></div>
              </div>
              <span className="cc-badge cb-mvp">MVP</span>
            </div>
            <div className="cc-body">
              <div className="cc-title">신사업 기획안 자동화</div>
              <div className="cc-sub">제안서 작성에 드는 시간을 80% 절감. 팀 전체가 기획안 생성에 Servora 활용.</div>
              <div className="cc-meta"><div className="cc-av" style={{ background: 'linear-gradient(135deg,#c084fc,#818cf8)' }}></div><div className="cc-au">{"최현우 \u00B7 신사업팀 리드"}</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta">
        <h2 className="cta-title">아이디어를 바로<br />구체화해보세요</h2>
        <img src="/img/CTA.gif" className="cta-gif" alt="" />
        <div className="btn-row">
          <Link href="/signup"><button className="btn-p btn--lg">아이디어 꺼내기</button></Link>
          <a href="#cases"><button className="btn-s btn--lg">{"아이디어 살펴보기 \u2192"}</button></a>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="foot">
        <div className="foot-logo">Servora</div>
        <div className="foot-copy">{"© 2026 Servora. All rights reserved."}</div>
        <div className="foot-links">
          <a href="#">Support</a>
          <a href="#">Pricing</a>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
        </div>
      </footer>
    </div>
  )
}
