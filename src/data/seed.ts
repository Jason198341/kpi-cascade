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
    start_date: '2026-01-01', due_date: '2026-12-31',
    sort_order: sort, created_at: NOW, updated_at: NOW,
    ...extra,
  }
}

function distributeDates(
  startStr: string,
  dueStr: string,
  milestones: { id: string; label: string; done: boolean }[],
) {
  const start = new Date(startStr)
  const due = new Date(dueStr)
  const total = due.getTime() - start.getTime()
  const count = milestones.length

  return milestones.map((m, i) => {
    const msStart = new Date(start.getTime() + total * (i / count))
    const msEnd = new Date(start.getTime() + total * ((i + 1) / count))
    return {
      ...m,
      start_date: msStart.toISOString().slice(0, 10),
      end_date: msEnd.toISOString().slice(0, 10),
    }
  })
}

// ─────────────────────────────────────────────────
// 팀 멤버: 주재원 1명 + HCN 4명
// ─────────────────────────────────────────────────
export const DEMO_MEMBERS: Profile[] = [
  { id: 'exp-moon', email: 'skypeople41@gmail.com', display_name: '문정호 (주재원)', avatar_url: null, role: 'manager', org_id: ORG, department: '내장설계팀', hire_year: 2012, position_title: '책임연구원', onboarding_completed: true, created_at: NOW },
  { id: 'hcn-raj', email: 'raj@hmil.co.in', display_name: 'Rajesh Kumar', avatar_url: null, role: 'member', org_id: ORG, department: '내장설계팀-크래시패드', hire_year: 2019, position_title: 'Senior Engineer', onboarding_completed: true, created_at: NOW },
  { id: 'hcn-priya', email: 'priya@hmil.co.in', display_name: 'Priya Sharma', avatar_url: null, role: 'member', org_id: ORG, department: '내장설계팀-도어트림', hire_year: 2020, position_title: 'Engineer', onboarding_completed: true, created_at: NOW },
  { id: 'hcn-ankit', email: 'ankit@hmil.co.in', display_name: 'Ankit Patel', avatar_url: null, role: 'member', org_id: ORG, department: '내장설계팀-시트', hire_year: 2021, position_title: 'Engineer', onboarding_completed: true, created_at: NOW },
  { id: 'hcn-neha', email: 'neha@hmil.co.in', display_name: 'Neha Gupta', avatar_url: null, role: 'member', org_id: ORG, department: '내장설계팀-트림', hire_year: 2022, position_title: 'Junior Engineer', onboarding_completed: true, created_at: NOW },
]

// ═════════════════════════════════════════════════
// DEPTH 0: 전략 목표 — 단일 최상위
// ═════════════════════════════════════════════════
const S1 = node('s1', null, 0,
  '26년 내장설계팀 종합 성과목표', '🎯',
  100, 0, '%', 1.0, 0,
  { description: '주재원 1명 + HCN 다수 | 담당: 크래시패드·도어트림·시트·트림 설계 및 현지화', priority: 'critical', start_date: '2026-01-01', due_date: '2026-12-31' },
)

// ═════════════════════════════════════════════════
// DEPTH 1: 6대 성과 영역
// ═════════════════════════════════════════════════

// ──── 1. 핵심 경쟁력 확보 (35%) ────
const T1 = node('t1', 's1', 1,
  '핵심 경쟁력 확보 — 내장 신기술 선제 발굴 및 로드맵 반영', '🚀',
  100, 0, '%', 0.35, 0,
  { description: '인도·아세안 시장 선도를 위한 내장 신기술 선제 발굴. 25년 아쉬움이었던 "신기술 선제 협의 부재"를 정면 돌파.', priority: 'critical', start_date: '2026-01-01', due_date: '2026-12-31' },
)

// ──── 2. 개발 강건화 및 재발 방지 (20%) ────
const T2 = node('t2', 's1', 1,
  '개발 강건화 — 설계 기준(Standard) 자산화', '🛡️',
  100, 0, '%', 0.20, 1,
  { description: '25년 필드 클레임·현지화 지연의 근본 원인을 "India Interior Design Standard"로 문서화. 누가 와도 같은 품질.', priority: 'high', start_date: '2026-01-01', due_date: '2026-12-31' },
)

// ──── 3. 인재 육성 및 조직 발전 (20%) ────
const T3 = node('t3', 's1', 1,
  '인재 육성 — HCN 자립 설계 조직 구축', '👥',
  100, 0, '%', 0.20, 2,
  { description: '주재원은 Doer→Approver로 전환. HCN이 설계하고 주재원이 최종 승인하는 구조. 귀임 이후에도 조직이 지속되는 유일한 방법.', priority: 'high', start_date: '2026-01-01', due_date: '2026-12-31' },
)

// ──── 4. 루틴 및 조직 확대 업무 (10%) ────
const T4 = node('t4', 's1', 1,
  '루틴 — 법규·협력사 Zero-Risk 운영 체계', '⚖️',
  100, 0, '%', 0.10, 3,
  { description: '25년 이슈였던 법규 대응 미흡을 프로세스로 잠금. AIS/CMVR 모니터링 + 협력사 품질 정기 점검.', priority: 'medium', start_date: '2026-01-01', due_date: '2026-12-31' },
)

// ──── 5. 인도기술연구소 업무보고 (5%) ────
const T5 = node('t5', 's1', 1,
  '업무보고 — 내장설계팀 혁신 성과 대외 가시화', '📊',
  100, 0, '%', 0.05, 4,
  { description: '루틴 보고 제외, 혁신 사례 중심의 연구소 내부 성과 보고.', priority: 'low', start_date: '2026-01-01', due_date: '2026-12-31' },
)

// ──── 6. 조직 기여도 및 키맨 역할 (10%) ────
const T6 = node('t6', 's1', 1,
  '조직 기여도 — 실(室) 단위 공통 과제 주도', '🤝',
  100, 0, '%', 0.10, 5,
  { description: '타 팀 설계·품질 이슈 협업 중재 + 실 단위 TFT 세부 과제 오너십.', priority: 'medium', start_date: '2026-01-01', due_date: '2026-12-31' },
)

// ═════════════════════════════════════════════════
// DEPTH 2: 액션 플랜 (마일스톤 + 데드라인)
// ═════════════════════════════════════════════════

// ────────────────────────────────────────────
// T1 하위: 핵심 경쟁력 확보 (3 액션)
// ────────────────────────────────────────────

const A1 = node('a1', 't1', 2,
  '인도 특화 내장 신기술 발굴 및 제품기획 공식 제안', '💡',
  5, 0, '건', 0.45, 0,
  {
    owner_id: 'exp-moon', priority: 'critical',
    description: '크래시패드 2건, 도어트림 1건, 시트 1건, 트림 1건. 단순 수집이 아닌 제품기획·권역본부와 사전 협의하여 28~29년 SOP 차종 로드맵에 실제 등재.',
    start_date: '2026-01-06', due_date: '2026-06-30',
    milestones: [
      { id: 'a1-m1', label: '글로벌 내장 트렌드 리서치 완료 (CES/Auto Expo)', done: false, start_date: '2026-01-06', end_date: '2026-02-14' },
      { id: 'a1-m2', label: '인도 현지 Tier-1 업체 신소재/신공법 벤치마킹 3회', done: false, start_date: '2026-02-17', end_date: '2026-03-31' },
      { id: 'a1-m3', label: '크래시패드 신기술 제안서 2건 작성 (제품기획 사전 협의)', done: false, start_date: '2026-03-03', end_date: '2026-04-30' },
      { id: 'a1-m4', label: '도어트림·시트·트림 신기술 제안서 3건 작성', done: false, start_date: '2026-04-01', end_date: '2026-05-30' },
      { id: 'a1-m5', label: '권역본부 공식 제안 완료 → 차종 로드맵 반영 협의', done: false, start_date: '2026-06-02', end_date: '2026-06-30' },
    ],
  },
)

const A2 = node('a2', 't1', 2,
  '차종 로드맵 반영 POC 검증 완료', '🔬',
  2, 0, '건', 0.35, 1,
  {
    owner_id: 'exp-moon', priority: 'high',
    description: '대상: 크레타 후속 / 엑스터급. 신기술 제안 중 실현 가능성 높은 2건을 POC(Proof of Concept)로 검증.',
    start_date: '2026-04-01', due_date: '2026-09-30',
    milestones: [
      { id: 'a2-m1', label: 'POC 대상 기술 2건 선정 (경영진 승인)', done: false, start_date: '2026-04-01', end_date: '2026-04-30' },
      { id: 'a2-m2', label: 'POC 1호: 시제품 제작 및 시험 계획 수립', done: false, start_date: '2026-05-01', end_date: '2026-06-15' },
      { id: 'a2-m3', label: 'POC 1호: 시험 완료 및 결과 보고', done: false, start_date: '2026-06-16', end_date: '2026-07-31' },
      { id: 'a2-m4', label: 'POC 2호: 시제품 제작 및 시험 완료', done: false, start_date: '2026-07-01', end_date: '2026-09-15' },
      { id: 'a2-m5', label: 'POC 결과 종합 → 28~29 SOP 차종 적용 확정', done: false, start_date: '2026-09-15', end_date: '2026-09-30' },
    ],
  },
)

const A3 = node('a3', 't1', 2,
  '인도네시아 등 아세안 내장 트렌드 분석 → 권역본부 공유', '🌏',
  1, 0, '건', 0.20, 2,
  {
    owner_id: 'exp-moon', priority: 'medium',
    description: '인도 경험 기반 아세안 확장. 인도네시아·베트남 등 내장 시장 트렌드 분석 보고서 작성.',
    start_date: '2026-07-01', due_date: '2026-12-15',
    milestones: [
      { id: 'a3-m1', label: '아세안 주요 시장 내장 부품 현황 데이터 수집', done: false, start_date: '2026-07-01', end_date: '2026-08-31' },
      { id: 'a3-m2', label: '인도 vs 아세안 내장 요구사항 비교 분석', done: false, start_date: '2026-09-01', end_date: '2026-10-31' },
      { id: 'a3-m3', label: '트렌드 분석 보고서 완성 → 권역본부 공유', done: false, start_date: '2026-11-01', end_date: '2026-12-15' },
    ],
  },
)

// ────────────────────────────────────────────
// T2 하위: 개발 강건화 (4 액션)
// ────────────────────────────────────────────

const A4 = node('a4', 't2', 2,
  '25년 필드 클레임 TOP 5 → 설계 체크리스트 표준화', '📋',
  4, 0, '파트', 0.30, 0,
  {
    owner_id: 'exp-moon', priority: 'critical',
    description: '크래시패드·도어트림·시트·트림 4개 파트 전체. 클레임 원인 분석 → 체크리스트 → India Interior Design Standard 문서화.',
    start_date: '2026-01-06', due_date: '2026-03-31',
    milestones: [
      { id: 'a4-m1', label: '25년 필드 클레임 TOP 5 원인 분석 워크숍 (전 파트 합동)', done: false, start_date: '2026-01-06', end_date: '2026-01-17' },
      { id: 'a4-m2', label: '크래시패드 설계 체크리스트 초안 → 리뷰', done: false, start_date: '2026-01-20', end_date: '2026-02-07' },
      { id: 'a4-m3', label: '도어트림 설계 체크리스트 초안 → 리뷰', done: false, start_date: '2026-02-10', end_date: '2026-02-28' },
      { id: 'a4-m4', label: '시트·트림 설계 체크리스트 초안 → 리뷰', done: false, start_date: '2026-03-02', end_date: '2026-03-21' },
      { id: 'a4-m5', label: 'India Interior Design Standard v1.0 발행 (4파트 통합)', done: false, start_date: '2026-03-24', end_date: '2026-03-31' },
    ],
  },
)

const A5 = node('a5', 't2', 2,
  '인도 현지 환경 대응 내구 테스트 시나리오 수립', '🌡️',
  3, 0, '항목', 0.25, 1,
  {
    owner_id: 'hcn-raj', priority: 'high',
    description: '고온 40℃+, 먼지, 몬순 등 인도 현지 환경 특화 내장 내구 시험 시나리오.',
    start_date: '2026-02-01', due_date: '2026-06-30',
    milestones: [
      { id: 'a5-m1', label: '기존 HMC 내구 시험 기준 vs 인도 필드 데이터 Gap 분석', done: false, start_date: '2026-02-01', end_date: '2026-03-15' },
      { id: 'a5-m2', label: '고온·먼지 환경 시험 시나리오 초안 작성', done: false, start_date: '2026-03-17', end_date: '2026-04-30' },
      { id: 'a5-m3', label: '몬순(습도·침수) 환경 시험 시나리오 초안 작성', done: false, start_date: '2026-04-14', end_date: '2026-05-31' },
      { id: 'a5-m4', label: '3개 시나리오 최종 검증 → Standard 등재', done: false, start_date: '2026-06-02', end_date: '2026-06-30' },
    ],
  },
)

const A6 = node('a6', 't2', 2,
  '현지화 부품 개발 지연율 전년 대비 50% 감소', '⏱️',
  50, 0, '%감소', 0.25, 2,
  {
    owner_id: 'exp-moon', priority: 'high',
    description: '현지화 부품 개발 일정 관리 프로세스 재정비. 주간 트래킹 + 조기 경보 체계.',
    start_date: '2026-01-06', due_date: '2026-12-31',
    milestones: [
      { id: 'a6-m1', label: '25년 현지화 부품 지연 원인 분석 (파트별 Top 3)', done: false, start_date: '2026-01-06', end_date: '2026-01-31' },
      { id: 'a6-m2', label: '주간 일정 트래킹 시트 + 조기경보 기준 수립', done: false, start_date: '2026-02-03', end_date: '2026-02-28' },
      { id: 'a6-m3', label: 'Q1 지연율 측정 → 베이스라인 확정', done: false, start_date: '2026-03-03', end_date: '2026-03-31' },
      { id: 'a6-m4', label: 'Q2 중간 점검 → 프로세스 보정', done: false, start_date: '2026-06-16', end_date: '2026-06-30' },
      { id: 'a6-m5', label: 'Q3 점검: 지연율 30% 감소 달성 확인', done: false, start_date: '2026-09-15', end_date: '2026-09-30' },
      { id: 'a6-m6', label: '연말 최종 집계: 50% 감소 목표 달성 확인', done: false, start_date: '2026-12-15', end_date: '2026-12-31' },
    ],
  },
)

const A7 = node('a7', 't2', 2,
  '설계 기준의 협력사·HCN 적용 완료 (적용률 100%)', '✅',
  100, 0, '%', 0.20, 3,
  {
    owner_id: 'hcn-priya', priority: 'medium',
    description: 'Design Standard v1.0 기준을 협력사 설계 프로세스 및 HCN 업무에 전면 적용.',
    start_date: '2026-04-01', due_date: '2026-09-30',
    milestones: [
      { id: 'a7-m1', label: 'Standard 교육 자료 제작 (EN/HI 이중 언어)', done: false, start_date: '2026-04-01', end_date: '2026-04-30' },
      { id: 'a7-m2', label: 'HCN 대상 집중 교육 (4파트, 각 1일)', done: false, start_date: '2026-05-05', end_date: '2026-05-30' },
      { id: 'a7-m3', label: '주요 협력사 대상 설명회 및 적용 합의', done: false, start_date: '2026-06-02', end_date: '2026-06-30' },
      { id: 'a7-m4', label: '적용률 점검 → 100% 달성 확인 (체크리스트 감사)', done: false, start_date: '2026-09-01', end_date: '2026-09-30' },
    ],
  },
)

// ────────────────────────────────────────────
// T3 하위: 인재 육성 (4 액션)
// ────────────────────────────────────────────

const A8 = node('a8', 't3', 2,
  '내장 설계 업무 매뉴얼 작성 (HCN 주도, 주재원 QC)', '📖',
  15, 0, '건', 0.30, 0,
  {
    owner_id: 'hcn-raj', priority: 'high',
    description: '파트별 최소 3~4건. HCN이 직접 작성하고 주재원이 품질 검수.',
    start_date: '2026-02-01', due_date: '2026-12-15',
    milestones: [
      { id: 'a8-m1', label: '매뉴얼 작성 대상 업무 목록 확정 (15건)', done: false, start_date: '2026-02-01', end_date: '2026-02-28' },
      { id: 'a8-m2', label: '크래시패드 매뉴얼 4건 초안 완성', done: false, start_date: '2026-03-03', end_date: '2026-05-31' },
      { id: 'a8-m3', label: '도어트림 매뉴얼 4건 초안 완성', done: false, start_date: '2026-04-01', end_date: '2026-07-31' },
      { id: 'a8-m4', label: '시트 매뉴얼 3건 초안 완성', done: false, start_date: '2026-06-02', end_date: '2026-09-30' },
      { id: 'a8-m5', label: '트림 매뉴얼 4건 초안 완성', done: false, start_date: '2026-07-01', end_date: '2026-10-31' },
      { id: 'a8-m6', label: '주재원 QC 완료 → 전 매뉴얼 최종 발행', done: false, start_date: '2026-11-03', end_date: '2026-12-15' },
    ],
  },
)

const A9 = node('a9', 't3', 2,
  'HCN 단독 설계 검토 역량 평가 (분기 1회 × 4회)', '📝',
  4, 0, '회', 0.25, 1,
  {
    owner_id: 'exp-moon', priority: 'medium',
    description: 'HCN 각 담당자별 설계 검토 능력을 분기마다 평가. 성장 추이 트래킹.',
    start_date: '2026-01-06', due_date: '2026-12-31',
    milestones: [
      { id: 'a9-m1', label: '역량 평가 기준표 수립 (평가 항목 + 스코어 체계)', done: false, start_date: '2026-01-06', end_date: '2026-01-31' },
      { id: 'a9-m2', label: 'Q1 역량 평가 실시 → 베이스라인 확정', done: false, start_date: '2026-03-17', end_date: '2026-03-31' },
      { id: 'a9-m3', label: 'Q2 역량 평가 실시 → 1분기 대비 성장도 측정', done: false, start_date: '2026-06-16', end_date: '2026-06-30' },
      { id: 'a9-m4', label: 'Q3 역량 평가 실시', done: false, start_date: '2026-09-15', end_date: '2026-09-30' },
      { id: 'a9-m5', label: 'Q4 역량 평가 실시 → 연간 성장 종합 보고', done: false, start_date: '2026-12-15', end_date: '2026-12-31' },
    ],
  },
)

const A10 = node('a10', 't3', 2,
  '주재원 Approval 체계 확립 (설계 결과물 검수 프로세스 문서화)', '🔏',
  1, 0, '건', 0.25, 2,
  {
    owner_id: 'exp-moon', priority: 'critical',
    description: '주재원이 직접 설계하는 비중↓, HCN 설계 → 주재원 최종 승인 구조로 전환. 1분기 내 완료 필수.',
    start_date: '2026-01-06', due_date: '2026-03-31',
    milestones: [
      { id: 'a10-m1', label: '현행 설계 프로세스 분석 (주재원 관여 비중 측정)', done: false, start_date: '2026-01-06', end_date: '2026-01-17' },
      { id: 'a10-m2', label: 'Approval 프로세스 설계 (검수 체크포인트 + 권한 매트릭스)', done: false, start_date: '2026-01-20', end_date: '2026-02-14' },
      { id: 'a10-m3', label: '프로세스 문서화 완료 → HCN 공유 및 교육', done: false, start_date: '2026-02-17', end_date: '2026-03-07' },
      { id: 'a10-m4', label: '파일럿 적용 (1개 프로젝트) → 보완 → 전면 시행', done: false, start_date: '2026-03-10', end_date: '2026-03-31' },
    ],
  },
)

const A11 = node('a11', 't3', 2,
  'HCN 자립 업무 비율 전년 대비 30%p 향상', '📈',
  30, 0, '%p', 0.20, 3,
  {
    owner_id: 'exp-moon', priority: 'high',
    description: 'HCN 담당자별 자립도 평가. "주재원 도움 없이 단독 수행 가능한 업무" 비율을 측정하고 개선.',
    start_date: '2026-01-06', due_date: '2026-12-31',
    milestones: [
      { id: 'a11-m1', label: 'HCN 업무별 자립도 현황 측정 (베이스라인)', done: false, start_date: '2026-01-06', end_date: '2026-02-28' },
      { id: 'a11-m2', label: '담당자별 역량 Gap 분석 → 개인별 육성 계획 수립', done: false, start_date: '2026-03-03', end_date: '2026-03-31' },
      { id: 'a11-m3', label: '상반기 OJT + 매뉴얼 학습 → 중간 자립도 측정', done: false, start_date: '2026-04-01', end_date: '2026-06-30' },
      { id: 'a11-m4', label: '하반기 실전 단독 수행 → 연말 자립도 최종 측정', done: false, start_date: '2026-07-01', end_date: '2026-12-15' },
      { id: 'a11-m5', label: '30%p 향상 달성 확인 → 성과 보고', done: false, start_date: '2026-12-16', end_date: '2026-12-31' },
    ],
  },
)

// ────────────────────────────────────────────
// T4 하위: 루틴 — 법규·협력사 (3 액션)
// ────────────────────────────────────────────

const A12 = node('a12', 't4', 2,
  'AIS/CMVR 내장 법규 모니터링 → 미준수 0건', '📜',
  0, 0, '건(미준수)', 0.40, 0,
  {
    owner_id: 'hcn-priya', priority: 'high',
    description: '인도 AIS/CMVR 내장 관련 법규 변경 실시간 모니터링. 연간 미준수 이슈 제로 목표.',
    start_date: '2026-01-06', due_date: '2026-12-31',
    milestones: [
      { id: 'a12-m1', label: '현행 AIS/CMVR 내장 관련 조항 목록화 완료', done: false, start_date: '2026-01-06', end_date: '2026-01-31' },
      { id: 'a12-m2', label: '법규 모니터링 프로세스 수립 (월 1회 점검 + 알림 체계)', done: false, start_date: '2026-02-03', end_date: '2026-02-28' },
      { id: 'a12-m3', label: '상반기 법규 변경 대응 현황 점검', done: false, start_date: '2026-06-16', end_date: '2026-06-30' },
      { id: 'a12-m4', label: '하반기 법규 변경 대응 현황 점검 → 연간 0건 확인', done: false, start_date: '2026-12-15', end_date: '2026-12-31' },
    ],
  },
)

const A13 = node('a13', 't4', 2,
  '협력사 부품 품질 정기 점검 (분기 1회 × 4회)', '🏭',
  4, 0, '회', 0.35, 1,
  {
    owner_id: 'hcn-ankit', priority: 'medium',
    description: '시트·트림 포함 현지 주요 협력사 대상 분기별 부품 품질 점검.',
    start_date: '2026-01-06', due_date: '2026-12-31',
    milestones: [
      { id: 'a13-m1', label: '점검 체크리스트 및 대상 협력사 리스트 확정', done: false, start_date: '2026-01-06', end_date: '2026-01-31' },
      { id: 'a13-m2', label: 'Q1 정기 점검 실시 → 결과 보고', done: false, start_date: '2026-03-10', end_date: '2026-03-31' },
      { id: 'a13-m3', label: 'Q2 정기 점검 실시 → 결과 보고', done: false, start_date: '2026-06-09', end_date: '2026-06-30' },
      { id: 'a13-m4', label: 'Q3 정기 점검 실시 → 결과 보고', done: false, start_date: '2026-09-07', end_date: '2026-09-30' },
      { id: 'a13-m5', label: 'Q4 정기 점검 실시 → 연간 종합 보고', done: false, start_date: '2026-12-08', end_date: '2026-12-31' },
    ],
  },
)

const A14 = node('a14', 't4', 2,
  '법규 변경 → HCN 공유 및 설계 반영 (2주 이내)', '⚡',
  100, 0, '%', 0.25, 2,
  {
    owner_id: 'hcn-neha', priority: 'medium',
    description: '법규 변경 발생 시 2주 이내 HCN 공유 + 설계 반영 완료. 연간 반영률 100%.',
    start_date: '2026-01-06', due_date: '2026-12-31',
    milestones: [
      { id: 'a14-m1', label: '법규 변경 → 설계 반영 워크플로우 문서화', done: false, start_date: '2026-01-06', end_date: '2026-02-14' },
      { id: 'a14-m2', label: '워크플로우 HCN 전원 교육 완료', done: false, start_date: '2026-02-17', end_date: '2026-02-28' },
      { id: 'a14-m3', label: '상반기 실적 점검 (변경 건수 vs 반영 건수)', done: false, start_date: '2026-06-16', end_date: '2026-06-30' },
      { id: 'a14-m4', label: '연말 실적 최종 점검 → 100% 달성 확인', done: false, start_date: '2026-12-15', end_date: '2026-12-31' },
    ],
  },
)

// ────────────────────────────────────────────
// T5 하위: 업무보고 (1 액션)
// ────────────────────────────────────────────

const A15 = node('a15', 't5', 2,
  '연구소 내부 성과 보고 (혁신 사례 중심, 연 2회)', '🎤',
  2, 0, '회', 1.0, 0,
  {
    owner_id: 'exp-moon', priority: 'medium',
    description: '보고 주제: ①인도 특화 내장 신기술 적용 로드맵 ②현지 환경 기반 내구 검증 체계 구축 ③HCN 자립 설계 중간 성과',
    start_date: '2026-03-01', due_date: '2026-12-15',
    milestones: [
      { id: 'a15-m1', label: '상반기 보고 주제 선정 및 자료 준비', done: false, start_date: '2026-03-01', end_date: '2026-05-31' },
      { id: 'a15-m2', label: '상반기 성과 보고 완료', done: false, start_date: '2026-06-01', end_date: '2026-06-30' },
      { id: 'a15-m3', label: '하반기 보고 주제 선정 및 자료 준비', done: false, start_date: '2026-09-01', end_date: '2026-11-15' },
      { id: 'a15-m4', label: '하반기 성과 보고 완료', done: false, start_date: '2026-11-17', end_date: '2026-12-15' },
    ],
  },
)

// ────────────────────────────────────────────
// T6 하위: 조직 기여도 (2 액션)
// ────────────────────────────────────────────

const A16 = node('a16', 't6', 2,
  '타 팀 설계·품질 이슈 협업 중재 (연 2건)', '🤝',
  2, 0, '건', 0.50, 0,
  {
    owner_id: 'exp-moon', priority: 'medium',
    description: '다른 설계팀 또는 품질팀의 이슈 발생 시 적극 중재/지원. 키맨 역할 발휘.',
    start_date: '2026-01-06', due_date: '2026-12-31',
    milestones: [
      { id: 'a16-m1', label: '상반기 타 팀 이슈 협업 1건 수행 완료', done: false, start_date: '2026-01-06', end_date: '2026-06-30' },
      { id: 'a16-m2', label: '하반기 타 팀 이슈 협업 1건 수행 완료', done: false, start_date: '2026-07-01', end_date: '2026-12-31' },
    ],
  },
)

const A17 = node('a17', 't6', 2,
  '실(室) 단위 TFT 세부 과제 오너십 보유 (1건)', '🎯',
  1, 0, '건', 0.50, 1,
  {
    owner_id: 'exp-moon', priority: 'medium',
    description: '차량개발실 단위 공통 TFT 과제 참여 시, 세부 과제의 오너로서 책임 수행.',
    start_date: '2026-01-06', due_date: '2026-12-31',
    milestones: [
      { id: 'a17-m1', label: 'TFT 과제 선정 및 오너십 확보', done: false, start_date: '2026-01-06', end_date: '2026-03-31' },
      { id: 'a17-m2', label: '과제 중간 진척 보고', done: false, start_date: '2026-06-01', end_date: '2026-06-30' },
      { id: 'a17-m3', label: '과제 완료 → 결과 보고', done: false, start_date: '2026-10-01', end_date: '2026-12-31' },
    ],
  },
)

// ═════════════════════════════════════════════════
// EXPORT
// ═════════════════════════════════════════════════

export const SEED_NODES: KpiNode[] = [
  // Depth 0
  S1,
  // Depth 1
  T1, T2, T3, T4, T5, T6,
  // Depth 2: 핵심 경쟁력 (3)
  A1, A2, A3,
  // Depth 2: 개발 강건화 (4)
  A4, A5, A6, A7,
  // Depth 2: 인재 육성 (4)
  A8, A9, A10, A11,
  // Depth 2: 루틴 (3)
  A12, A13, A14,
  // Depth 2: 업무보고 (1)
  A15,
  // Depth 2: 조직 기여도 (2)
  A16, A17,
]

// Total: 1 (Depth 0) + 6 (Depth 1) + 17 (Depth 2) = 24 nodes
