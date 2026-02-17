import type { KpiNode, Depth } from '@/types'

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
    weight, status: 'active', priority: 'medium',
    start_date: '2026-01-01', due_date: '2026-06-30',
    sort_order: sort, created_at: NOW, updated_at: NOW,
    ...extra,
  }
}

// Depth 0: Strategic Goals
const REVENUE = node('s1', null, 0, '연 매출 500억 달성', '💰', 500, 280, '억원', 1.0, 0)
const RETENTION = node('s2', null, 0, '고객 유지율 95%', '🤝', 95, 88, '%', 1.0, 1)
const INNOVATION = node('s3', null, 0, '신제품 3건 출시', '🚀', 3, 1, '건', 1.0, 2)

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
const A1 = node('a1', 't1', 2, 'Q2 대형 고객 5건 미팅', '📞', 5, 3, '건', 0.4, 0)
const A2 = node('a2', 't1', 2, '기존 고객 업셀링 캠페인', '💎', 100, 70, '%', 0.3, 1)
const A3 = node('a3', 't1', 2, '영업 프로세스 자동화', '⚙️', 100, 55, '%', 0.3, 2)

// Depth 2: Actions under Marketing
const A4 = node('a4', 't2', 2, '콘텐츠 마케팅 30건', '📝', 30, 22, '건', 0.5, 0)
const A5 = node('a5', 't2', 2, 'SEO 키워드 순위 개선', '🔍', 100, 80, '%', 0.5, 1)

// Depth 2: Actions under Support
const A6 = node('a6', 't4', 2, '응답 시간 1시간 이내', '⏱️', 100, 85, '%', 0.5, 0)
const A7 = node('a7', 't4', 2, 'FAQ 자동화 구축', '🤖', 100, 60, '%', 0.5, 1)

// Depth 2: Actions under NPS
const A8 = node('a8', 't5', 2, 'UX 리디자인 Phase 1', '🎨', 100, 75, '%', 0.6, 0)
const A9 = node('a9', 't5', 2, '피드백 수집 시스템', '📋', 100, 50, '%', 0.4, 1)

// Depth 2: Actions under R&D
const A10 = node('a10', 't6', 2, 'MVP 프로토타입 완료', '🔧', 100, 40, '%', 0.5, 0, { status: 'at_risk' })
const A11 = node('a11', 't6', 2, '기술 검증 테스트', '🧪', 100, 55, '%', 0.5, 1)

// Depth 2: Actions under Design
const A12 = node('a12', 't7', 2, '사용자 인터뷰 20건', '🗣️', 20, 14, '건', 0.4, 0)
const A13 = node('a13', 't7', 2, '프로토타입 사용성 테스트', '🧩', 100, 45, '%', 0.6, 1)

export const SEED_NODES: KpiNode[] = [
  REVENUE, RETENTION, INNOVATION,
  SALES_GROWTH, MARKETING_LEADS, PARTNERSHIPS,
  SUPPORT_QUALITY, PRODUCT_NPS,
  RND_DELIVERY, DESIGN_SPRINT,
  A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13,
]
