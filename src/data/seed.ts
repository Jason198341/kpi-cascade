import type { KpiNode, Depth, Profile } from '@/types'

const ORG = 'demo-org-id'
const NOW = new Date().toISOString()

function node(
  id: string, parentId: string | null, depth: Depth,
  title: string, emoji: string,
  target: number, current: number, unit: string,
  weight: number, sort: number,
  extra?: Partial<KpiNode>,
): KpiNode {
  return {
    id, org_id: ORG, parent_id: parentId, depth, title,
    description: null, emoji, owner_id: null,
    target_value: target, current_value: current, unit,
    weight, milestones: null, status: 'active', priority: 'medium',
    start_date: '2026-01-01', due_date: '2026-06-30',
    sort_order: sort, created_at: NOW, updated_at: NOW,
    ...extra,
  }
}

// Demo team members
export const DEMO_MEMBERS: Profile[] = [
  { id: 'demo-user', email: 'jason@cascade.io', display_name: '문정호', avatar_url: null, role: 'executive', org_id: ORG, department: '경영', hire_year: 2010, position_title: '상무', onboarding_completed: true, created_at: NOW },
  { id: 'demo-kim', email: 'kim@cascade.io', display_name: '김영수', avatar_url: null, role: 'manager', org_id: ORG, department: '영업팀', hire_year: 2015, position_title: '팀장', onboarding_completed: true, created_at: NOW },
  { id: 'demo-lee', email: 'lee@cascade.io', display_name: '이수진', avatar_url: null, role: 'manager', org_id: ORG, department: '마케팅팀', hire_year: 2017, position_title: '팀장', onboarding_completed: true, created_at: NOW },
  { id: 'demo-park', email: 'park@cascade.io', display_name: '박지민', avatar_url: null, role: 'member', org_id: ORG, department: 'R&D팀', hire_year: 2021, position_title: '주임', onboarding_completed: true, created_at: NOW },
  { id: 'demo-choi', email: 'choi@cascade.io', display_name: '최하늘', avatar_url: null, role: 'member', org_id: ORG, department: 'CS팀', hire_year: 2023, position_title: '사원', onboarding_completed: true, created_at: NOW },
]

// Depth 0: Strategic Goals (weights sum to 1.0)
const REVENUE = node('s1', null, 0, '연 매출 500억 달성', '💰', 500, 280, '억원', 0.50, 0)
const RETENTION = node('s2', null, 0, '고객 유지율 95%', '🤝', 95, 88, '%', 0.30, 1)
const INNOVATION = node('s3', null, 0, '신제품 3건 출시', '🚀', 3, 1, '건', 0.20, 2)

// Depth 1: Team KPIs under Revenue
const SALES_GROWTH = node('t1', 's1', 1, '영업팀 매출 성장', '📈', 100, 65, '%', 0.5, 0)
const MARKETING_LEADS = node('t2', 's1', 1, '마케팅 리드 생성', '🎯', 100, 72, '%', 0.3, 1)
const PARTNERSHIPS = node('t3', 's1', 1, '파트너십 확대', '🤝', 100, 45, '%', 0.2, 2)

// Depth 1: Team KPIs under Retention
const SUPPORT_QUALITY = node('t4', 's2', 1, 'CS 만족도 향상', '⭐', 100, 82, '%', 0.4, 0)
const PRODUCT_NPS = node('t5', 's2', 1, '제품 NPS 개선', '📊', 100, 70, '%', 0.6, 1)

// Depth 1: Team KPIs under Innovation
const RND_DELIVERY = node('t6', 's3', 1, 'R&D 프로젝트 납기', '🔬', 100, 50, '%', 0.5, 0)
const DESIGN_SPRINT = node('t7', 's3', 1, '디자인 스프린트 완료', '🎨', 100, 60, '%', 0.5, 1)

// Depth 2: Actions under Sales Growth
const A1 = node('a1', 't1', 2, 'Q2 대형 고객 5건 미팅', '📞', 5, 3, '건', 0.40, 0, {
  owner_id: 'demo-kim',
  milestones: [
    { id: 'm1-1', label: '타겟 고객 리스트 확정', done: true },
    { id: 'm1-2', label: '1차 컨택 완료', done: true },
    { id: 'm1-3', label: '미팅 일정 확정', done: true },
    { id: 'm1-4', label: '제안서 발송', done: false },
    { id: 'm1-5', label: '미팅 완료', done: false },
  ],
})
const A2 = node('a2', 't1', 2, '기존 고객 업셀링 캠페인', '💎', 4, 3, '건', 0.35, 1, {
  owner_id: 'demo-kim',
  milestones: [
    { id: 'm2-1', label: '대상 고객 세분화', done: true },
    { id: 'm2-2', label: '캠페인 기획안 완성', done: true },
    { id: 'm2-3', label: '이메일 발송', done: true },
    { id: 'm2-4', label: '후속 미팅 진행', done: false },
  ],
})
const A3 = node('a3', 't1', 2, '영업 프로세스 자동화', '⚙️', 5, 3, '건', 0.25, 2, {
  owner_id: 'demo-park',
  milestones: [
    { id: 'm3-1', label: 'CRM 도구 선정', done: true },
    { id: 'm3-2', label: '파이프라인 설계', done: true },
    { id: 'm3-3', label: '데이터 이관', done: true },
    { id: 'm3-4', label: '팀 교육', done: false },
    { id: 'm3-5', label: '자동화 룰 적용', done: false },
  ],
})

// Depth 2: Actions under Marketing
const A4 = node('a4', 't2', 2, '콘텐츠 마케팅 30건', '📝', 6, 4, '건', 0.50, 0, {
  owner_id: 'demo-lee',
  milestones: [
    { id: 'm4-1', label: '콘텐츠 캘린더 수립', done: true },
    { id: 'm4-2', label: '블로그 10건 발행', done: true },
    { id: 'm4-3', label: '소셜미디어 10건 발행', done: true },
    { id: 'm4-4', label: '뉴스레터 10건 발송', done: true },
    { id: 'm4-5', label: '성과 분석 리포트', done: false },
    { id: 'm4-6', label: '차기 전략 수립', done: false },
  ],
})
const A5 = node('a5', 't2', 2, 'SEO 키워드 순위 개선', '🔍', 4, 3, '건', 0.50, 1, {
  owner_id: 'demo-lee',
  milestones: [
    { id: 'm5-1', label: '키워드 리서치 완료', done: true },
    { id: 'm5-2', label: '온페이지 최적화', done: true },
    { id: 'm5-3', label: '백링크 구축', done: true },
    { id: 'm5-4', label: '순위 모니터링 대시보드', done: false },
  ],
})

// Depth 2: Actions under Support
const A6 = node('a6', 't4', 2, '응답 시간 1시간 이내', '⏱️', 4, 3, '건', 0.50, 0, {
  owner_id: 'demo-choi',
  milestones: [
    { id: 'm6-1', label: '현재 응답 시간 분석', done: true },
    { id: 'm6-2', label: '자동 라우팅 설정', done: true },
    { id: 'm6-3', label: '우선순위 분류 체계 도입', done: true },
    { id: 'm6-4', label: '1시간 SLA 달성 검증', done: false },
  ],
})
const A7 = node('a7', 't4', 2, 'FAQ 자동화 구축', '🤖', 5, 2, '건', 0.50, 1, {
  owner_id: 'demo-choi',
  milestones: [
    { id: 'm7-1', label: '상위 50 질문 수집', done: true },
    { id: 'm7-2', label: '챗봇 시나리오 설계', done: true },
    { id: 'm7-3', label: '챗봇 개발', done: false },
    { id: 'm7-4', label: '테스트 및 피드백', done: false },
    { id: 'm7-5', label: '프로덕션 배포', done: false },
  ],
})

// Depth 2: Actions under NPS
const A8 = node('a8', 't5', 2, 'UX 리디자인 Phase 1', '🎨', 4, 3, '건', 0.60, 0, {
  owner_id: 'demo-park',
  milestones: [
    { id: 'm8-1', label: '사용자 리서치', done: true },
    { id: 'm8-2', label: '와이어프레임 완성', done: true },
    { id: 'm8-3', label: 'UI 디자인 확정', done: true },
    { id: 'm8-4', label: '개발 구현 완료', done: false },
  ],
})
const A9 = node('a9', 't5', 2, '피드백 수집 시스템', '📋', 3, 1, '건', 0.40, 1, {
  owner_id: 'demo-user',
  milestones: [
    { id: 'm9-1', label: '피드백 양식 설계', done: true },
    { id: 'm9-2', label: '인앱 위젯 개발', done: false },
    { id: 'm9-3', label: '대시보드 구축', done: false },
  ],
})

// Depth 2: Actions under R&D
const A10 = node('a10', 't6', 2, 'MVP 프로토타입 완료', '🔧', 5, 2, '건', 0.60, 0, {
  owner_id: 'demo-user',
  status: 'at_risk',
  milestones: [
    { id: 'm10-1', label: '기술 스택 결정', done: true },
    { id: 'm10-2', label: '코어 기능 구현', done: true },
    { id: 'm10-3', label: 'API 연동', done: false },
    { id: 'm10-4', label: '내부 테스트', done: false },
    { id: 'm10-5', label: '데모 준비', done: false },
  ],
})
const A11 = node('a11', 't6', 2, '기술 검증 테스트', '🧪', 4, 2, '건', 0.40, 1, {
  owner_id: 'demo-park',
  milestones: [
    { id: 'm11-1', label: '테스트 계획 수립', done: true },
    { id: 'm11-2', label: '성능 벤치마크', done: true },
    { id: 'm11-3', label: '보안 취약점 검사', done: false },
    { id: 'm11-4', label: '최종 검증 보고서', done: false },
  ],
})

// Depth 2: Actions under Design
const A12 = node('a12', 't7', 2, '사용자 인터뷰 20건', '🗣️', 4, 3, '건', 0.50, 0, {
  owner_id: 'demo-lee',
  milestones: [
    { id: 'm12-1', label: '인터뷰 대상 선정', done: true },
    { id: 'm12-2', label: '인터뷰 가이드 작성', done: true },
    { id: 'm12-3', label: '인터뷰 진행 (20건)', done: true },
    { id: 'm12-4', label: '인사이트 정리 보고서', done: false },
  ],
})
const A13 = node('a13', 't7', 2, '프로토타입 사용성 테스트', '🧩', 3, 1, '건', 0.50, 1, {
  owner_id: 'demo-kim',
  milestones: [
    { id: 'm13-1', label: '테스트 시나리오 설계', done: true },
    { id: 'm13-2', label: '참가자 모집 및 진행', done: false },
    { id: 'm13-3', label: '결과 분석 및 개선안', done: false },
  ],
})

export const SEED_NODES: KpiNode[] = [
  REVENUE, RETENTION, INNOVATION,
  SALES_GROWTH, MARKETING_LEADS, PARTNERSHIPS,
  SUPPORT_QUALITY, PRODUCT_NPS,
  RND_DELIVERY, DESIGN_SPRINT,
  A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13,
]
