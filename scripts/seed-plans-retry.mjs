import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'
const apiKey = process.env.GEMINI_API_KEY
const systemPrompt = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'prompts', 'planner-system.txt'), 'utf-8')

// 실패한 9개만
const failedIds = [23, 24, 25, 26, 28, 29, 30, 31]

const questionnaires = {
  23: { q1:'수제 베이커리에서 주문을 접수하고 픽업 예약을 관리하는 서비스', q2:'인스타 DM으로 주문 받으니 누락되고 수량 파악이 안 됨', q3:'주문 누락, 재료 재고 파악 어려움, 픽업 시간 겹침', q4:'수제 베이커리/디저트 가게 사장님', q5:'주문 마감 전 수량 확인, 당일 픽업 스케줄 확인', q6:'주문이 체계적으로 관리되고 재고가 자동으로 계산됨', q7:'메뉴 등록하고 주문 폼 공유', q8:'메뉴/재고 관리, 주문 접수, 픽업 시간 관리, 매출 통계', q9:'인스타에 주문 링크 올리면 고객이 원하는 시간에 픽업 예약', q10:'아임웹 스토어, 네이버 스마트스토어' },
  24: { q1:'개인 운동 루틴을 기록하고 세트/횟수를 추적하는 서비스', q2:'운동할 때 이전에 몇 kg 들었는지 기억이 안 나서 기록이 필요', q3:'메모장에 적으면 찾기 어렵고, 진척 파악이 안 됨', q4:'헬스장 다니는 20~40대 일반인', q5:'운동 시작 전 이전 기록 확인, 운동 중 세트별 기록', q6:'운동 기록이 자동으로 정리되고 성장 그래프를 볼 수 있음', q7:'오늘 운동 루틴 만들고 세트별 무게/횟수 기록', q8:'루틴 생성, 운동별 세트/횟수/무게 기록, 진척 그래프, 캘린더', q9:'이번 달 벤치프레스 무게 변화를 그래프로 확인하는 것', q10:'스트롱, 헬시, 운동일지' },
  25: { q1:'동네 꽃집에서 꽃다발 주문을 접수하고 배달 스케줄을 관리하는 서비스', q2:'전화/카톡 주문이 밀리면 실수가 나고, 배달 일정 관리가 어려움', q3:'주문 내역 정리 안 됨, 배달 시간 겹침, 시즌 상품 관리 어려움', q4:'동네 꽃집 사장님', q5:'기념일 주문 몰릴 때 주문 정리, 배달 루트 확인', q6:'주문이 깔끔하게 정리되고 배달 스케줄이 한눈에', q7:'꽃다발 상품 등록하고 주문 받기', q8:'상품 관리, 주문 접수, 배달 스케줄, 매출 통계', q9:'발렌타인데이에 주문 50건 들어와도 누락 없이 처리', q10:'꽃집 청년들, 쿠팡 로켓플라워' },
  26: { q1:'소규모 펜션/게스트하우스의 객실 예약과 청소 일정을 관리하는 서비스', q2:'예약을 전화/문자로 받으니 이중 예약이 발생하고 청소 일정이 꼬임', q3:'이중 예약, 체크인/아웃 관리 혼란, 청소 스케줄 누락', q4:'펜션/게스트하우스 운영자', q5:'예약 문의 올 때 빈 객실 확인, 체크아웃 후 청소 배정', q6:'예약 현황이 캘린더로 한눈에 보이고 이중 예약 방지', q7:'객실 등록하고 캘린더에서 예약 관리', q8:'객실 관리, 예약 캘린더, 체크인/아웃, 청소 스케줄', q9:'캘린더 한 화면에서 전체 객실 예약 현황이 보이는 것', q10:'에어비앤비 호스트, 야놀자 사장님' },
  28: { q1:'동네 반찬가게에서 메뉴를 등록하고 정기 구독 주문을 관리하는 서비스', q2:'단골 고객이 매번 전화로 같은 반찬을 주문하는 게 비효율적', q3:'주문 전화 응대 번거로움, 정기 고객 관리 안 됨, 재료 발주 예측 어려움', q4:'동네 반찬가게 사장님', q5:'매일 아침 주문 확인, 주간 재료 발주 시 예상 수량 파악', q6:'정기 구독이 자동으로 관리되고 재료 발주를 예측할 수 있음', q7:'반찬 메뉴 등록하고 정기 구독 설정', q8:'메뉴 관리, 주문 접수, 정기 구독, 재료 발주 예측', q9:'월요일 배송할 정기 구독 목록이 자동으로 정리되어 있는 것', q10:'마켓컬리 정기배송, 반찬단지' },
  29: { q1:'네일샵에서 시술 예약을 받고 디자인 포트폴리오와 고객을 관리하는 서비스', q2:'인스타에 디자인 올리고 DM으로 예약 받으니 관리가 안 됨', q3:'예약 누락, 디자인 시안 공유 어려움, 고객 취향 기억 못함', q4:'네일 아티스트/네일샵 운영자', q5:'고객 시술 전 이전 디자인 확인, 빈 시간에 예약 확인', q6:'디자인 포트폴리오와 예약이 연동되어 고객이 디자인 보고 바로 예약', q7:'디자인 포트폴리오 올리고 예약 링크 공유', q8:'디자인 포트폴리오, 시술 예약, 고객별 시술 기록, 매출 통계', q9:'고객이 포트폴리오에서 디자인 고르고 바로 예약하는 것', q10:'네이버 예약, 인스타그램 비즈니스' },
  30: { q1:'소규모 농장에서 농산물을 직거래로 판매하고 정기 배송을 관리하는 서비스', q2:'마켓에 입점하면 수수료가 높고, 직거래 고객 관리가 어려움', q3:'주문 수기 관리, 배송 추적 불가, 정기 고객 관리 안 됨', q4:'소규모 농장/과수원 운영자', q5:'수확기에 주문 받고, 정기 배송 일정 관리', q6:'수수료 없이 직거래하고 정기 고객이 자동 관리됨', q7:'농산물 상품 등록하고 주문 받기', q8:'상품 관리, 주문 접수, 정기 배송 관리, 고객 관리', q9:'제철 농산물 올리면 단골 고객에게 자동으로 알림이 가는 것', q10:'오아시스, 컬리 파머스' },
  31: { q1:'가전/배관/전기 수리 기사와 고객을 연결하는 매칭 서비스', q2:'수리 필요할 때 믿을 수 있는 기사를 찾기 어렵고 비용 비교가 안 됨', q3:'수리 기사 찾기 어려움, 비용 불투명, 후기 확인 불가', q4:'집수리가 필요한 가정 + 수리 기사', q5:'급하게 수리 필요할 때, 견적 비교할 때', q6:'검증된 기사를 빠르게 찾고 투명한 비용으로 수리', q7:'수리 요청 올리면 주변 기사에게 알림', q8:'수리 요청 등록, 기사 매칭, 견적/비용, 후기 시스템', q9:'에어컨 고장 나서 올리면 30분 내에 기사 매칭되는 것', q10:'숨고, 크몽, 미소' },
}

async function generatePlan(projectId, questionnaire) {
  const nvl = (v) => (v && v.trim()) ? v.trim() : '(미입력)'
  const userPrompt = `아래 사용자의 답변을 바탕으로 웹서비스 기획안을 작성해주세요.

---

[입력값]
- 답변1_만들고싶은서비스: ${nvl(questionnaire.q1)}
- 답변2_서비스를만들고싶은이유: ${nvl(questionnaire.q2)}
- 답변3_현재가장불편하거나아쉬운점: ${nvl(questionnaire.q3)}
- 답변4_가장많이쓸사용자: ${nvl(questionnaire.q4)}
- 답변5_사용상황: ${nvl(questionnaire.q5)}
- 답변6_사용자에게가장좋아질점: ${nvl(questionnaire.q6)}
- 답변7_제일먼저해보고싶은것: ${nvl(questionnaire.q7)}
- 답변8_꼭있어야하는기능: ${nvl(questionnaire.q8)}
- 답변9_잘만들어졌다고느끼는모습: ${nvl(questionnaire.q9)}
- 답변10_참고하고싶은서비스나방식: ${nvl(questionnaire.q10)}

---

위 입력값을 기반으로 16개 항목의 기획안을 작성해주세요.
`

  const response = await fetch(
    `${GEMINI_API_URL}/gemini-2.5-flash:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { maxOutputTokens: 16384, temperature: 0.7 },
      }),
    }
  )

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Gemini error (${response.status}): ${err.substring(0, 100)}`)
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

async function main() {
  for (const id of failedIds) {
    const q = questionnaires[id]
    if (!q) continue
    try {
      console.log(`[${id}] Generating...`)
      const content = await generatePlan(id, q)
      if (!content) { console.log(`[${id}] Empty`); continue }
      const { error } = await supabase.from('planning_documents').insert({
        project_id: id, content, questionnaire_data: q, version: 1,
      })
      if (error) console.log(`[${id}] DB: ${error.message}`)
      else console.log(`[${id}] Done (${content.length} chars)`)
    } catch (e) {
      console.log(`[${id}] ${e.message}`)
    }
    console.log('--- waiting 10s ---')
    await new Promise(r => setTimeout(r, 10000))
  }
  console.log('All done!')
}

main()
