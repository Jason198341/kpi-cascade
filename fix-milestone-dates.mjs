// One-time script: Add start_date / end_date to every milestone in Supabase
const URL = 'https://rcdflbygcjmrmcwrhpqm.supabase.co/rest/v1/kpi_nodes'
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjZGZsYnlnY2ptcm1jd3JocHFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTMzMDI4NSwiZXhwIjoyMDg2OTA2Mjg1fQ.***REMOVED***'

const updates = [
  // 1. NI1i 고정모델 스킨 기반 목업 (03-01 ~ 06-30)
  {
    id: '7927361c-d0aa-4135-8bbf-2cae65d08db1',
    milestones: [
      { id: 'm1', done: false, label: 'NI1i 고정모델 스킨 기반 목업 제작 완료 및 마스터벅 장착 (4월 중순)', start_date: '2026-03-01', end_date: '2026-04-15' },
      { id: 'm2', done: false, label: '칵핏/도어부 수납성/사용성 평가항목 설정 및 체크리스트 확정 (4월 말)', start_date: '2026-04-16', end_date: '2026-04-30' },
      { id: 'm3', done: false, label: '유관부문 초대 합동평가 실시 — 목업 기반 사용성 검증 (5월 초)', start_date: '2026-05-01', end_date: '2026-05-08' },
      { id: 'm4', done: false, label: '평가 결과 정리 및 설계 개선점 도출·피드백 반영 (5월 중순)', start_date: '2026-05-09', end_date: '2026-05-20' },
      { id: 'm5', done: false, label: '6월 ALL도 반영 완료 — 최종 도면 확정 및 출도 (6월)', start_date: '2026-06-01', end_date: '2026-06-30' },
    ],
  },
  // 2. 마사지 시트 및 급속 냉각 시트 HMTC 기술 (02-18 ~ 09-30)
  {
    id: '461dee21-6083-4942-89c3-81975e835b45',
    milestones: [
      { id: 'm1', done: false, label: 'HMTC 기술 협업 킥오프 — Tangtring 접촉이력, 펠티에 BM(NIO ET9 Tear-Down), 중국 OEM 마사지 스펙, 공압 모듈 원가 데이터 수집 완료 (3월)', start_date: '2026-02-18', end_date: '2026-03-31' },
      { id: 'm2', done: false, label: '기술 베리에이션 정리 — 마사지(공압/롤러/핫스톤) + 급속냉각(팬최적화/펠티에/하이브리드) 기술 옵션 비교 분석 및 문서화 (4월)', start_date: '2026-04-01', end_date: '2026-04-30' },
      { id: 'm3', done: false, label: '마사지 시트 인도 적용 사양서(안) + 급속 냉각 적용 타당성 검토서 작성 완료 (5~6월)', start_date: '2026-05-01', end_date: '2026-06-30' },
      { id: 'm4', done: false, label: '협력사 소싱 조사 및 공급업체 평가 보고서 완료 — 중국 통합모듈+열전소자 업체 BM, 모듈당 원가·양산성 평가 + 기술 문서 체계화 (7월)', start_date: '2026-07-01', end_date: '2026-07-31' },
      { id: 'm5', done: false, label: '인도 TRM 반영 + 중장기 통합 웰니스 시트 로드맵(안) 확정 — 마사지+급속냉각+DMS 연동 구상 포함 (8월)', start_date: '2026-08-01', end_date: '2026-08-31' },
      { id: 'm6', done: false, label: '상세 기술 내재화 완료 — 기술 리포트 최종 정리 및 관련 부문 공유 (9월)', start_date: '2026-09-01', end_date: '2026-09-30' },
    ],
  },
  // 3. IIT Bombay 산학협력 (02-20 ~ 06-30)
  {
    id: 'ddd36ba6-cf90-4acf-8c07-cca46ecc3bfe',
    milestones: [
      { id: 'm1', done: false, label: 'IRCC 기술 포트폴리오 사전 미팅 @IIT Bombay 완료 (2/20)', start_date: '2026-02-20', end_date: '2026-02-20' },
      { id: 'm2', done: false, label: '폴리머 복합소재 특허 4건 기술 검토 (천연섬유+PP / CFRP 하이브리드 / 탄소 그래핀) 완료', start_date: '2026-02-21', end_date: '2026-03-07' },
      { id: 'm3', done: false, label: '사전 검토 자료 기술PR팀 공유 (3월 초)', start_date: '2026-03-01', end_date: '2026-03-07' },
      { id: 'm4', done: false, label: '본사 전문가 의견 수렴 및 단/중/장기 협업 로드맵 수립', start_date: '2026-03-08', end_date: '2026-03-21' },
      { id: 'm5', done: false, label: '협업 타당성 최종 결정 및 우선순위 확정 (3월 말)', start_date: '2026-03-22', end_date: '2026-03-31' },
    ],
  },
  // 4. NI1i 2열 시트 고급화 (02-11 ~ 06-15)
  {
    id: '821af83b-2313-423a-8ffe-5ea832ef699d',
    milestones: [
      { id: 'm1', done: false, label: '상품 컨센서스 마무리 및 사양 운영안 협의 (상품기획서 기준) + 권역/UX 의견 수렴 완료 (3월 초)', start_date: '2026-02-11', end_date: '2026-03-07' },
      { id: 'm2', done: false, label: '협력사 프레임 업체 선정 및 설계 최적화 방향 협의 (3월 중순)', start_date: '2026-03-08', end_date: '2026-03-15' },
      { id: 'm3', done: false, label: '프레임 컨셉 확정 — 공압 방식 모드/강도 사양, 스킨 정합성 및 패키지 검토 완료 (4월 초)', start_date: '2026-03-16', end_date: '2026-04-07' },
      { id: 'm4', done: false, label: '프레임 구조 해석 완료 및 업체 일정 검토 마무리 (4월 말)', start_date: '2026-04-08', end_date: '2026-04-30' },
      { id: 'm5', done: false, label: '프레임 출도 완료 (5월)', start_date: '2026-05-01', end_date: '2026-05-20' },
      { id: 'm6', done: false, label: '시작품 제작 및 실차 장착 검증 (5월 말~6월 초)', start_date: '2026-05-21', end_date: '2026-06-07' },
      { id: 'm7', done: false, label: '최종 사양 확정 및 양산 적용 계획 수립 (6월 15일)', start_date: '2026-06-08', end_date: '2026-06-15' },
    ],
  },
  // 5. Wing 형상 헤드레스트 (02-18 ~ 06-30)
  {
    id: '129b1cca-a17b-41ce-8a81-fea26d0bca05',
    milestones: [
      { id: 'm1', done: true, label: 'Wing 형상 헤드레스트 설계 검토 및 안전성(후방충돌) 해석', start_date: '2026-02-18', end_date: '2026-03-31' },
      { id: 'm2', done: true, label: '협력사 금형 협의 및 원가 확정', start_date: '2026-04-01', end_date: '2026-05-15' },
      { id: 'm3', done: false, label: 'MQ4i 시작차 적용 검증 및 양산 확정', start_date: '2026-05-16', end_date: '2026-06-30' },
    ],
  },
  // 6. 시트 커버 컨벤셔널 폼 (04-01 ~ 2027-02-28)
  {
    id: '368bbacf-912c-4b05-8a83-47db1e35d71d',
    milestones: [
      { id: 'm1', done: false, label: '컨벤셔널 폼 물성 비교 검토 및 품질 영향도 분석', start_date: '2026-04-01', end_date: '2026-07-31' },
      { id: 'm2', done: false, label: '협력사 협의 및 원가 확정', start_date: '2026-08-01', end_date: '2026-11-30' },
      { id: 'm3', done: false, label: 'SX3i 적용 검증 및 양산 확정', start_date: '2026-12-01', end_date: '2027-02-28' },
    ],
  },
  // 7. 2세대 경량 시트백 프레임 (03-01 ~ 08-31)
  {
    id: 'b16c2863-c6ad-48f5-a5cb-be4fc8deeea4',
    milestones: [
      { id: 'm1', done: true, label: '2세대 프레임 설계 최적화 검토 및 경량화 효과 해석', start_date: '2026-03-01', end_date: '2026-04-30' },
      { id: 'm2', done: true, label: '협력사 금형·공정 협의 및 원가 확정', start_date: '2026-05-01', end_date: '2026-06-15' },
      { id: 'm3', done: false, label: 'BC4i CUV 시작차 적용 검증 및 양산 확정', start_date: '2026-06-16', end_date: '2026-08-31' },
    ],
  },
  // 8. 릴렉션 컴포트 시트 전동→매뉴얼 (03-01 ~ 10-31)
  {
    id: '130112a0-2a19-4d78-8ff8-272a8ca74fb6',
    milestones: [
      { id: 'm1', done: true, label: '매뉴얼 리클라이너 설계 검토 및 기존 전동 사양 대비 기능·품질 영향도 분석', start_date: '2026-03-01', end_date: '2026-05-15' },
      { id: 'm2', done: false, label: '협력사 협의 및 매뉴얼 사양 원가 확정', start_date: '2026-05-16', end_date: '2026-08-15' },
      { id: 'm3', done: false, label: 'HE1i 시작차 적용 검증 및 양산 확정', start_date: '2026-08-16', end_date: '2026-10-31' },
    ],
  },
  // 9. i-Size 버튼 현지화 (04-01 ~ 2027-02-28)
  {
    id: 'b8deb9e0-c66a-47ec-8245-624b4a565eb7',
    milestones: [
      { id: 'm1', done: true, label: '현지 업체 소싱 및 품질 동등성 검토', start_date: '2026-04-01', end_date: '2026-07-31' },
      { id: 'm2', done: false, label: '현지화 시작품 제작 및 시험 평가', start_date: '2026-08-01', end_date: '2026-11-30' },
      { id: 'm3', done: false, label: 'SX3i 양산 적용 확정', start_date: '2026-12-01', end_date: '2027-02-28' },
    ],
  },
  // 10. 1열 경제형 에르고 모션 시트 (02-18 ~ 06-30)
  {
    id: 'de1fd4f3-dcb1-4947-a0e2-fdfcbe295ff3',
    milestones: [
      { id: 'm1', done: true, label: '경제형 에르고 모션 사양 정의 — 기존 대비 삭제/간소화 항목 확정', start_date: '2026-02-18', end_date: '2026-03-15' },
      { id: 'm2', done: true, label: '협력사 설계 협의 및 경제형 모듈 원가 확정', start_date: '2026-03-16', end_date: '2026-04-15' },
      { id: 'm3', done: true, label: '시작품 제작 및 성능·품질 검증', start_date: '2026-04-16', end_date: '2026-05-15' },
      { id: 'm4', done: false, label: 'MQ4i 양산 적용 확정 및 도면 출도', start_date: '2026-05-16', end_date: '2026-06-30' },
    ],
  },
  // 11. PP+TD20 -> PP/PE 소재 변경 (02-18 ~ 09-15)
  {
    id: 'ed2e4724-5d9d-4424-82f8-d7103f1e256c',
    milestones: [
      { id: 'm1', done: false, label: '경쟁차 PP/PE 적용 현황 및 물성 벤치마킹 조사', start_date: '2026-02-18', end_date: '2026-03-31' },
      { id: 'm2', done: false, label: '차종별 적용부위 현실화 검토 (충돌/강성/스크래치/조립성 고려) 및 관련부문 협의', start_date: '2026-04-01', end_date: '2026-05-15' },
      { id: 'm3', done: false, label: '적용 타겟 차종 설정 및 절감 원가/중량 분석 (대당 1.0kg/2,000원 목표)', start_date: '2026-05-16', end_date: '2026-06-15' },
      { id: 'm4', done: false, label: '협력사 미팅 및 PP/PE 소재 시험·평가 진행', start_date: '2026-06-16', end_date: '2026-07-31' },
      { id: 'm5', done: false, label: '인도네시아 재료팀·본사 재료팀 협의 후 인도 적용 여부 최종 결정', start_date: '2026-08-01', end_date: '2026-09-15' },
    ],
  },
  // 12. Active Recognition — 캐빈 카메라 졸음감지 (02-18 ~ 09-15)
  {
    id: '06f774bd-c4e5-415f-a4b7-4ae458614b7e',
    milestones: [
      { id: 'm1', done: false, label: '배경기술 학습(DMS/EAR/IR카메라/CAN통신) 및 중국 벤치마킹(BYD·GWM·NIO) 자료 정리 — 내장팀 공유용 기초자료 작성', start_date: '2026-02-18', end_date: '2026-03-15' },
      { id: 'm2', done: false, label: '퀵 PoC 모델 제작 — Python+웹캠(졸음감지) + Arduino/서보(시트 모터 햅틱 시뮬레이션) 연동 데모', start_date: '2026-03-16', end_date: '2026-04-15' },
      { id: 'm3', done: false, label: 'ECU 아키텍처 검토 — 기존 IVI/ADCU 탑재(Option A) vs 독립 DMS ECU(Option B), CAN 메시지 설계(DBC), 전원/통신 사양 정리', start_date: '2026-04-16', end_date: '2026-05-15' },
      { id: 'm4', done: false, label: 'DMS 소프트웨어 검증 — FaceMesh/EAR 알고리즘 정확도, State Machine 로직, 엣지 AI 경량화(INT8 양자화) 최적화 테스트', start_date: '2026-05-16', end_date: '2026-06-15' },
      { id: 'm5', done: false, label: '협력사 서베이 — IR 카메라 모듈, DMS ECU, 시트 모터 미세제어 가능 업체 리스트업 및 재료비(BOM) 개략 추정', start_date: '2026-06-16', end_date: '2026-07-15' },
      { id: 'm6', done: false, label: '기술 문서 작성 및 내장설계팀 공유 — 시스템 구성도, 로드맵, BOM 템플릿, 시트 모터 내구 신뢰성 검토 요청서, 양산 적용 시나리오', start_date: '2026-07-16', end_date: '2026-08-15' },
      { id: 'm7', done: false, label: '유관부문(전장시험팀·바디선행·전자팀) 합동 컨셉 평가회 실시 — PoC 데모 시연, 양산 실현성 판단, 후속 선행과제 등록 여부 결정', start_date: '2026-08-16', end_date: '2026-09-15' },
    ],
  },
  // 13. 카울크로스바 상세 설계 (02-18 ~ 07-31)
  {
    id: '03678128-207b-4f3f-90c0-79a74809d50e',
    milestones: [
      { id: 'm1', done: false, label: '양산차 카울크로스바 현황 조사 — 차종별(SP3i, HE1, MQ4i 등) 사양·구조·재질·중량·원가 비교표 작성', start_date: '2026-02-18', end_date: '2026-03-31' },
      { id: 'm2', done: false, label: '패키지 검토사항 정리 — 주변 부품(HVAC 덕트, 와이어링, 스티어링 컬럼, ECU 브라켓 등) 간섭·공차·조립 시퀀스 체크리스트 작성', start_date: '2026-04-01', end_date: '2026-04-30' },
      { id: 'm3', done: false, label: '최적화 사례 분석 — 경량화(알루미늄/복합소재), 공용화, 원가절감 적용 사례 벤치마킹 및 설계 가이드 정리', start_date: '2026-05-01', end_date: '2026-05-31' },
      { id: 'm4', done: false, label: '라인 점검결과 반영 — 조립 불량, 작업성 이슈, 품질 클레임 이력 조사 및 설계 피드백 정리', start_date: '2026-06-01', end_date: '2026-06-30' },
      { id: 'm5', done: false, label: '종합 업무 매뉴얼 완성 및 내장설계팀 공유 — 설계 기준서, 체크리스트, BOM 템플릿, 라인 피드백 통합 문서화 + 팀 내 공유회 실시', start_date: '2026-07-01', end_date: '2026-07-31' },
    ],
  },
  // 14. 시트 사양 최적화 (02-18 ~ 06-30)
  {
    id: '05bb9a5b-e5e9-4243-a22b-985549a67702',
    milestones: [
      { id: 'm1', done: true, label: '현행 선진형 사양 대비 최적화 항목 정의 — 삭제/간소화 리스트 확정', start_date: '2026-02-18', end_date: '2026-03-15' },
      { id: 'm2', done: true, label: '상품 협의 및 사양 운영안 합의', start_date: '2026-03-16', end_date: '2026-04-15' },
      { id: 'm3', done: true, label: '협력사 원가 확정 및 설계 반영', start_date: '2026-04-16', end_date: '2026-05-15' },
      { id: 'm4', done: false, label: 'MQ4i 양산 적용 확정 및 도면 출도', start_date: '2026-05-16', end_date: '2026-06-30' },
    ],
  },
  // 15. IIT Bombay ICONS-CMMM 학회 (02-18 ~ 03-31)
  {
    id: '9b65f59d-be5a-4b27-8d5d-9d2dbdd9870d',
    milestones: [
      { id: 'm1', done: false, label: 'IRCC 기술 포트폴리오 사전 미팅 및 학회 참석 대상 세션/논문 사전 선별 (2/말)', start_date: '2026-02-18', end_date: '2026-02-28' },
      { id: 'm2', done: false, label: 'ICONS-CMMM 컨퍼런스 참석 — 폴리머 복합소재 4건 특허 기술 검토 및 교수진 네트워킹 (3/초)', start_date: '2026-03-01', end_date: '2026-03-07' },
      { id: 'm3', done: false, label: '학회 참석 결과 보고서 작성 및 재료센터 공유 — 향후 초청 세미나 후보 교수 리스트업 (3/말)', start_date: '2026-03-08', end_date: '2026-03-31' },
    ],
  },
  // 16. 서연이화 테크쇼 (02-18 ~ 03-06)
  {
    id: '04ff5c5e-5f04-4296-a5fa-ee21998778a4',
    milestones: [
      { id: 'm1', done: false, label: '전시물 사전 확인 — 서연이화 전시 품목 리스트 접수 및 전시물 실물/샘플 상태 점검 (2/말)', start_date: '2026-02-18', end_date: '2026-02-25' },
      { id: 'm2', done: false, label: '기술자료 사전 보고 — 전시 기술 소개자료(PPT/포스터) 내용 검토 및 팀장 사전 보고 완료 (2/말)', start_date: '2026-02-26', end_date: '2026-02-28' },
      { id: 'm3', done: false, label: '테크쇼 당일 운영 및 사후 피드백 정리 — 참석자 Q&A, 적용 검토 의견 취합, 후속 협업 사항 정리 (3/5)', start_date: '2026-03-01', end_date: '2026-03-06' },
    ],
  },
  // 17. Pre-SR 단계 공용화 (02-01 ~ 12-31)
  {
    id: '0fece111-69f8-478e-a5ec-1dc282016992',
    milestones: [
      { id: 'ps1', done: true, label: 'Pre-SR 분석 프레임워크 — 베이스 차종 선정 기준, C/O 가능 부품군 분류, 원가 Gap 산출 공식 표준화', start_date: '2026-02-01', end_date: '2026-03-31' },
      { id: 'ps2', done: false, label: 'KS2 시범 적용 — 베이스(SP3i) 대비 시스템별 C/O율·절감액 산출, 비C/O 사유 파레토 분석', start_date: '2026-04-01', end_date: '2026-06-30' },
      { id: 'ps3', done: false, label: '역제안 프로세스 문서화 — 디자인 선정모델 前 공용화 역제안 의무 적용 절차·양식·승인 체계', start_date: '2026-07-01', end_date: '2026-09-30' },
      { id: 'ps4', done: false, label: '전 차종 확대 계획 — 29년 양산 차종 전체 Pre-SR 분석 일정·담당·목표값 수립', start_date: '2026-10-01', end_date: '2026-12-31' },
    ],
  },
  // 18. C/O 관리 프로세스 (02-18 ~ 12-31)
  {
    id: '7b5b621c-edf5-4f6a-ab34-09f48b551858',
    milestones: [
      { id: 'm1', done: false, label: '양산차 C/O 현황 DB 구축 — 상반기(AY·QU2i·SP3i), 하반기(MQ4i·BC4i·HEi) 차종별 시스템/부품 레벨 C/O 현황 데이터 수집 및 엑셀 표준 양식 확정', start_date: '2026-02-18', end_date: '2026-04-15' },
      { id: 'm2', done: false, label: '베이스 차종 1레벨 마스터리스트 선행 구축 — 전 부품 리스트 + 구매단가 + 공급사 정보 + C/O 타입(1레벨/2레벨/신규개발) 분류 체계 정립', start_date: '2026-04-16', end_date: '2026-05-31' },
      { id: 'm3', done: false, label: 'C/O vs 신규개발 원가 Gap 산출 — 양산 시점 예상 구매단가(임율 상승분 포함) 대비 C/O 기존 단가 비교, 부품별·시스템별 절감 효과 사전 추정', start_date: '2026-06-01', end_date: '2026-07-15' },
      { id: 'm4', done: false, label: '디자인 선정모델 前 역제안 프로세스 수립 — 설계단 재료비 단위 C/O율 관리, C/O 절감액 데이터 기반 역제안 전 차종 의무 적용 프로세스 문서화', start_date: '2026-07-16', end_date: '2026-08-31' },
      { id: 'm5', done: false, label: 'KS2 시범 적용 완료 — C/O 412$(목표 336$), Pre-SR 581$(목표 477$) 달성 검증 및 파레토 분석(비C/O 사유별 건수/비용/누적비율)', start_date: '2026-09-01', end_date: '2026-10-15' },
      { id: 'm6', done: false, label: '크로스 차종 C/O 매트릭스 완성 — 차종×시스템 매트릭스에서 C/O율·절감액 시각화, 공용화 기회(Opportunity) 자동 스캔 로직 확립', start_date: '2026-10-16', end_date: '2026-11-30' },
      { id: 'm7', done: false, label: '인도연구소 표준 프로세스 정착 — Pre-SR 단계 이전 공용화 효과 선행 확보 체계 구축 및 29년 양산 전 차종 확대 전개 계획 수립', start_date: '2026-12-01', end_date: '2026-12-31' },
    ],
  },
  // 19. 공용화 데이터베이스 시스템 (01-01 ~ 12-31)
  {
    id: '6ce0b35a-2988-4796-b001-4e4f33d4931a',
    milestones: [
      { id: 'db1', done: true, label: 'DB 스키마 설계 완료 — 7개 테이블(co_vehicles, co_systems, co_sub_parts, co_reason_details, import_batches, co_type_configs, reason_category_configs) + 3개 뷰 설계', start_date: '2026-01-01', end_date: '2026-02-15' },
      { id: 'db2', done: false, label: '엑셀 표준 양식 확정 — 차종·시스템·부품·사유 4레벨 입력 템플릿 + 유효성 검증 룰 정의', start_date: '2026-02-16', end_date: '2026-03-31' },
      { id: 'db3', done: false, label: '하드코딩 기반 UI 프로토타입 — Dashboard/MasterList/Analytics/Opportunity/DataEntry 5개 뷰 구현', start_date: '2026-04-01', end_date: '2026-05-31' },
      { id: 'db4', done: false, label: '서버 SQL DB 구축 — 사내 보안 서버 PostgreSQL 설치, 마이그레이션 실행, RLS 정책 적용', start_date: '2026-06-01', end_date: '2026-07-15' },
      { id: 'db5', done: false, label: '엑셀→SQL 파이프라인 — xlsx 파싱→미리보기→배치 upsert, import_batches 이력 추적', start_date: '2026-07-16', end_date: '2026-08-31' },
      { id: 'db6', done: false, label: '부서 확장 — Interior 외 타 부서(Exterior, Electronics) enum 추가, 멀티 부서 대시보드', start_date: '2026-09-01', end_date: '2026-10-31' },
      { id: 'db7', done: false, label: '사내 전팀 협업 도구 전환 — 권한 관리, 실시간 동기화, 사용자 교육 및 운영 가이드 배포', start_date: '2026-11-01', end_date: '2026-12-31' },
    ],
  },
]

async function patch(id, milestones) {
  const res = await fetch(`${URL}?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'apikey': KEY,
      'Authorization': `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ milestones }),
  })
  if (!res.ok) {
    const text = await res.text()
    console.error(`FAIL ${id}: ${res.status} ${text}`)
    return false
  }
  return true
}

async function main() {
  console.log(`Updating ${updates.length} nodes with milestone dates...`)
  let ok = 0
  for (const u of updates) {
    const success = await patch(u.id, u.milestones)
    if (success) {
      const count = u.milestones.length
      console.log(`  OK ${u.id.slice(0, 8)} — ${count} milestones`)
      ok++
    }
  }
  console.log(`\nDone: ${ok}/${updates.length} nodes updated.`)
}

main()
