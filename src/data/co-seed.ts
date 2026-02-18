import type { CoVehicle } from '@/types/commonization'

/**
 * Hardcoded seed data for C/O (Parts Commonization) prototyping.
 * Based on Indian market vehicle development data.
 * Will be replaced by Supabase-backed data once server DB is set up.
 */
export const CO_VEHICLES: CoVehicle[] = [
  {
    code: 'KS2',
    name: 'KS2 (India SUV)',
    stage: 'Pre-SOP',
    sopDate: '2026 H2',
    half: 'H2',
    vehicleType: '개발',
    salesVolume: 45000,
    systems: [
      {
        systemName: 'IP (Instrument Panel)',
        systemPartNo: 'IP-KS2-001',
        coTypeCode: 'level1_co',
        baseVehicleCode: 'SP3i',
        subParts: [
          { partName: 'IP Upper', partNo: 'IP-U-001', isCo: true, coSourceVehicle: 'SP3i', coPartNo: 'IP-U-SP3', supplier: 'Motherson', supplierRegion: 'India', materialCostUsd: 28.5 },
          { partName: 'IP Lower', partNo: 'IP-L-001', isCo: true, coSourceVehicle: 'SP3i', coPartNo: 'IP-L-SP3', supplier: 'Motherson', supplierRegion: 'India', materialCostUsd: 22.0 },
          { partName: 'IP Center Fascia', partNo: 'IP-CF-001', isCo: false, supplier: 'Minda', supplierRegion: 'India', materialCostUsd: 35.0, reasonDetail: {
            categoryCode: 'design', baseSpec: 'SP3i 직선형 패시아', newSpec: 'KS2 곡면 패시아', diffDescription: '디자인 차별화로 곡면 적용', designIntent: 'KS2 고급감 표현', impactArea: 'IP 센터', coPossibility: 'low', additionalCostUsd: 12.5
          }},
          { partName: 'Glove Box', partNo: 'IP-GB-001', isCo: true, coSourceVehicle: 'SP3i', coPartNo: 'IP-GB-SP3', supplier: 'Motherson', supplierRegion: 'India', materialCostUsd: 8.5 },
          { partName: 'Cluster Visor', partNo: 'IP-CV-001', isCo: false, supplier: 'Minda', supplierRegion: 'India', materialCostUsd: 6.0, reasonDetail: {
            categoryCode: 'spec_change', baseSpec: '7인치 클러스터', newSpec: '10.25인치 디지털', diffDescription: '클러스터 크기 변경', designIntent: '대형 디지털 계기판 적용', impactArea: 'Cluster', coPossibility: 'none', additionalCostUsd: 4.0
          }},
        ]
      },
      {
        systemName: 'Door Trim (Front)',
        systemPartNo: 'DT-F-KS2-001',
        coTypeCode: 'level2_co',
        baseVehicleCode: 'SP3i',
        subParts: [
          { partName: 'Door Upper Trim', partNo: 'DT-U-001', isCo: true, coSourceVehicle: 'SP3i', coPartNo: 'DT-U-SP3', supplier: 'Motherson', supplierRegion: 'India', materialCostUsd: 15.0 },
          { partName: 'Door Armrest', partNo: 'DT-AR-001', isCo: false, supplier: 'Motherson', supplierRegion: 'India', materialCostUsd: 12.0, reasonDetail: {
            categoryCode: 'design', baseSpec: 'SP3i 하드 암레스트', newSpec: 'KS2 소프트 패드', diffDescription: '소프트 패드 적용으로 질감 향상', designIntent: '프리미엄 터치감', impactArea: 'Door', coPossibility: 'medium', coCondition: '소프트 패드를 SP3i에도 적용 시 공용화 가능', additionalCostUsd: 3.5
          }},
          { partName: 'Door Map Pocket', partNo: 'DT-MP-001', isCo: true, coSourceVehicle: 'SP3i', coPartNo: 'DT-MP-SP3', supplier: 'Minda', supplierRegion: 'India', materialCostUsd: 4.0 },
          { partName: 'Door Handle Bezel', partNo: 'DT-HB-001', isCo: false, supplier: 'Continental', supplierRegion: 'Germany', materialCostUsd: 7.5, reasonDetail: {
            categoryCode: 'new_spec', baseSpec: '일반 도어핸들', newSpec: '전동 도어핸들', diffDescription: '전동 도어핸들 신규 적용', designIntent: '스마트 엔트리 연동', impactArea: 'Door', coPossibility: 'none', additionalCostUsd: 15.0
          }},
        ]
      },
      {
        systemName: 'Console',
        systemPartNo: 'CS-KS2-001',
        coTypeCode: 'level1_co',
        baseVehicleCode: 'SP3i',
        subParts: [
          { partName: 'Console Upper', partNo: 'CS-U-001', isCo: true, coSourceVehicle: 'SP3i', coPartNo: 'CS-U-SP3', supplier: 'Motherson', supplierRegion: 'India', materialCostUsd: 18.0 },
          { partName: 'Console Box', partNo: 'CS-BX-001', isCo: true, coSourceVehicle: 'SP3i', coPartNo: 'CS-BX-SP3', supplier: 'Motherson', supplierRegion: 'India', materialCostUsd: 10.0 },
          { partName: 'Shift Knob', partNo: 'CS-SK-001', isCo: false, supplier: 'Minda', supplierRegion: 'India', materialCostUsd: 5.5, reasonDetail: {
            categoryCode: 'shape_diff', baseSpec: '구형 노브', newSpec: '신형 크롬 노브', diffDescription: '형상 변경', designIntent: '인테리어 통일성', impactArea: 'Console', coPossibility: 'high', coCondition: 'SP3i FL에서 동일 노브 적용 예정', additionalCostUsd: 2.0
          }},
          { partName: 'Cup Holder', partNo: 'CS-CH-001', isCo: true, coSourceVehicle: 'SP3i', coPartNo: 'CS-CH-SP3', supplier: 'Minda', supplierRegion: 'India', materialCostUsd: 3.0 },
        ]
      },
      {
        systemName: 'Headliner',
        systemPartNo: 'HL-KS2-001',
        coTypeCode: 'new_dev',
        baseVehicleCode: '-',
        subParts: [
          { partName: 'Headliner Main', partNo: 'HL-M-001', isCo: false, supplier: 'IAC', supplierRegion: 'India', materialCostUsd: 32.0, reasonDetail: {
            categoryCode: 'shape_diff', baseSpec: '-', newSpec: 'KS2 전용 루프 형상', diffDescription: '차체 형상 완전 상이', designIntent: '신규 차체 대응', impactArea: 'Roof', coPossibility: 'none', additionalCostUsd: 32.0
          }},
          { partName: 'Sunvisor LH', partNo: 'HL-SV-L-001', isCo: false, supplier: 'IAC', supplierRegion: 'India', materialCostUsd: 4.5, reasonDetail: {
            categoryCode: 'regulation', baseSpec: 'SP3i 썬바이저', newSpec: 'KS2 내화성 강화', diffDescription: '인도 신규 내화 법규 대응', designIntent: '법규 대응', impactArea: 'Safety', coPossibility: 'none', additionalCostUsd: 1.5
          }},
          { partName: 'Sunvisor RH', partNo: 'HL-SV-R-001', isCo: false, supplier: 'IAC', supplierRegion: 'India', materialCostUsd: 4.5, reasonDetail: {
            categoryCode: 'regulation', baseSpec: 'SP3i 썬바이저', newSpec: 'KS2 내화성 강화', diffDescription: '인도 신규 내화 법규 대응', designIntent: '법규 대응', impactArea: 'Safety', coPossibility: 'none', additionalCostUsd: 1.5
          }},
          { partName: 'Assist Grip', partNo: 'HL-AG-001', isCo: false, supplier: 'IAC', supplierRegion: 'India', materialCostUsd: 2.0, reasonDetail: {
            categoryCode: 'performance', baseSpec: '60N', newSpec: '80N 강도', diffDescription: '강도 기준 상향', designIntent: '내구 신뢰성 향상', impactArea: 'Headliner', coPossibility: 'medium', coCondition: 'SP3i FL에서 80N 동일 적용 시 공용화 가능', additionalCostUsd: 0.8
          }},
        ]
      },
      {
        systemName: 'Seat (1st Row)',
        systemPartNo: 'ST-1R-KS2-001',
        coTypeCode: 'level2_co',
        baseVehicleCode: 'AY',
        subParts: [
          { partName: 'Seat Frame', partNo: 'ST-FR-001', isCo: true, coSourceVehicle: 'AY', coPartNo: 'ST-FR-AY', supplier: 'Dymos', supplierRegion: 'Korea', materialCostUsd: 85.0 },
          { partName: 'Seat Cushion Pad', partNo: 'ST-CP-001', isCo: true, coSourceVehicle: 'AY', coPartNo: 'ST-CP-AY', supplier: 'Dymos', supplierRegion: 'India', materialCostUsd: 18.0 },
          { partName: 'Seat Cover', partNo: 'ST-CV-001', isCo: false, supplier: 'Dymos', supplierRegion: 'India', materialCostUsd: 25.0, reasonDetail: {
            categoryCode: 'design', baseSpec: 'AY 패턴', newSpec: 'KS2 전용 패턴', diffDescription: '시트 커버 디자인 차별화', designIntent: 'KS2 인테리어 컨셉', impactArea: 'Seat', coPossibility: 'low', additionalCostUsd: 8.0
          }},
          { partName: 'Headrest', partNo: 'ST-HR-001', isCo: true, coSourceVehicle: 'AY', coPartNo: 'ST-HR-AY', supplier: 'Dymos', supplierRegion: 'India', materialCostUsd: 12.0 },
          { partName: 'Seat Heater', partNo: 'ST-HT-001', isCo: false, supplier: 'Gentherm', supplierRegion: 'USA', materialCostUsd: 22.0, reasonDetail: {
            categoryCode: 'new_spec', baseSpec: '-', newSpec: '시트 히터 신규 사양', diffDescription: '인도 시장 시트 히터 신규 적용', designIntent: '겨울 프리미엄 사양 추가', impactArea: 'Seat', coPossibility: 'high', coCondition: 'AY FL 시트 히터 동일 적용 확정 시', additionalCostUsd: 22.0
          }},
        ]
      },
    ]
  },
  {
    code: 'MQ4i',
    name: 'MQ4i (India Sedan)',
    stage: 'Design',
    sopDate: '2027 H1',
    half: 'H1',
    vehicleType: '개발',
    salesVolume: 35000,
    systems: [
      {
        systemName: 'IP (Instrument Panel)',
        systemPartNo: 'IP-MQ4i-001',
        coTypeCode: 'level1_co',
        baseVehicleCode: 'QU2i',
        subParts: [
          { partName: 'IP Upper', partNo: 'IP-U-MQ4-001', isCo: true, coSourceVehicle: 'QU2i', coPartNo: 'IP-U-QU2', supplier: 'Motherson', supplierRegion: 'India', materialCostUsd: 30.0 },
          { partName: 'IP Lower', partNo: 'IP-L-MQ4-001', isCo: true, coSourceVehicle: 'QU2i', coPartNo: 'IP-L-QU2', supplier: 'Motherson', supplierRegion: 'India', materialCostUsd: 24.0 },
          { partName: 'IP Side Cover LH', partNo: 'IP-SC-L-001', isCo: true, coSourceVehicle: 'QU2i', coPartNo: 'IP-SC-L-QU2', supplier: 'Minda', supplierRegion: 'India', materialCostUsd: 3.0 },
          { partName: 'IP Side Cover RH', partNo: 'IP-SC-R-001', isCo: true, coSourceVehicle: 'QU2i', coPartNo: 'IP-SC-R-QU2', supplier: 'Minda', supplierRegion: 'India', materialCostUsd: 3.0 },
          { partName: 'Crash Pad', partNo: 'IP-CPD-001', isCo: false, supplier: 'Motherson', supplierRegion: 'India', materialCostUsd: 18.0, reasonDetail: {
            categoryCode: 'regulation', baseSpec: 'QU2i 기존', newSpec: 'BNVSAP Phase-3', diffDescription: '인도 신규 충돌 법규 대응', designIntent: '법규 강화 대응', impactArea: 'IP', coPossibility: 'none', additionalCostUsd: 5.0
          }},
        ]
      },
      {
        systemName: 'Door Trim (Front)',
        systemPartNo: 'DT-F-MQ4i-001',
        coTypeCode: 'level1_co',
        baseVehicleCode: 'QU2i',
        subParts: [
          { partName: 'Door Upper Trim', partNo: 'DT-U-MQ4-001', isCo: true, coSourceVehicle: 'QU2i', coPartNo: 'DT-U-QU2', supplier: 'Motherson', supplierRegion: 'India', materialCostUsd: 14.0 },
          { partName: 'Door Armrest', partNo: 'DT-AR-MQ4-001', isCo: true, coSourceVehicle: 'QU2i', coPartNo: 'DT-AR-QU2', supplier: 'Motherson', supplierRegion: 'India', materialCostUsd: 11.0 },
          { partName: 'Door Map Pocket', partNo: 'DT-MP-MQ4-001', isCo: true, coSourceVehicle: 'QU2i', coPartNo: 'DT-MP-QU2', supplier: 'Minda', supplierRegion: 'India', materialCostUsd: 3.5 },
        ]
      },
      {
        systemName: 'Console',
        systemPartNo: 'CS-MQ4i-001',
        coTypeCode: 'level2_co',
        baseVehicleCode: 'QU2i',
        subParts: [
          { partName: 'Console Upper', partNo: 'CS-U-MQ4-001', isCo: true, coSourceVehicle: 'QU2i', coPartNo: 'CS-U-QU2', supplier: 'Motherson', supplierRegion: 'India', materialCostUsd: 16.0 },
          { partName: 'Console Box', partNo: 'CS-BX-MQ4-001', isCo: false, supplier: 'Motherson', supplierRegion: 'India', materialCostUsd: 12.0, reasonDetail: {
            categoryCode: 'spec_change', baseSpec: 'QU2i 일반형', newSpec: 'MQ4i 냉장형', diffDescription: '냉장 콘솔박스 사양 추가', designIntent: '프리미엄 사양', impactArea: 'Console', coPossibility: 'low', additionalCostUsd: 8.0
          }},
          { partName: 'Wireless Charger', partNo: 'CS-WC-001', isCo: false, supplier: 'Continental', supplierRegion: 'Germany', materialCostUsd: 15.0, reasonDetail: {
            categoryCode: 'new_spec', baseSpec: '-', newSpec: '15W 무선충전', diffDescription: '무선충전 신규 적용', designIntent: '편의사양 추가', impactArea: 'Console', coPossibility: 'high', coCondition: 'QU2i FL에도 동일 15W 적용 예정', additionalCostUsd: 15.0
          }},
        ]
      },
      {
        systemName: 'Seat (1st Row)',
        systemPartNo: 'ST-1R-MQ4i-001',
        coTypeCode: 'level1_co',
        baseVehicleCode: 'AY',
        subParts: [
          { partName: 'Seat Frame', partNo: 'ST-FR-MQ4-001', isCo: true, coSourceVehicle: 'AY', coPartNo: 'ST-FR-AY', supplier: 'Dymos', supplierRegion: 'Korea', materialCostUsd: 85.0 },
          { partName: 'Seat Cushion Pad', partNo: 'ST-CP-MQ4-001', isCo: true, coSourceVehicle: 'AY', coPartNo: 'ST-CP-AY', supplier: 'Dymos', supplierRegion: 'India', materialCostUsd: 18.0 },
          { partName: 'Seat Cover', partNo: 'ST-CV-MQ4-001', isCo: false, supplier: 'Dymos', supplierRegion: 'India', materialCostUsd: 22.0, reasonDetail: {
            categoryCode: 'design', baseSpec: 'AY 패턴', newSpec: 'MQ4i 전용', diffDescription: 'MQ4i 인테리어 패턴 적용', designIntent: '차별화된 인테리어', impactArea: 'Seat', coPossibility: 'low', additionalCostUsd: 6.0
          }},
          { partName: 'Headrest', partNo: 'ST-HR-MQ4-001', isCo: true, coSourceVehicle: 'AY', coPartNo: 'ST-HR-AY', supplier: 'Dymos', supplierRegion: 'India', materialCostUsd: 12.0 },
        ]
      },
    ]
  },
  {
    code: 'SP3i',
    name: 'SP3i (양산 SUV)',
    stage: 'Production',
    sopDate: '2024 H1',
    half: 'H1',
    vehicleType: '양산',
    salesVolume: 60000,
    systems: [
      {
        systemName: 'IP (Instrument Panel)',
        systemPartNo: 'IP-SP3i-001',
        coTypeCode: 'level1_co',
        baseVehicleCode: 'SP3',
        subParts: [
          { partName: 'IP Upper', partNo: 'IP-U-SP3', isCo: true, coSourceVehicle: 'SP3', coPartNo: 'IP-U-SP3-BASE', supplier: 'Motherson', supplierRegion: 'India', materialCostUsd: 27.0 },
          { partName: 'IP Lower', partNo: 'IP-L-SP3', isCo: true, coSourceVehicle: 'SP3', coPartNo: 'IP-L-SP3-BASE', supplier: 'Motherson', supplierRegion: 'India', materialCostUsd: 21.0 },
          { partName: 'Glove Box', partNo: 'IP-GB-SP3', isCo: true, coSourceVehicle: 'SP3', coPartNo: 'IP-GB-SP3-BASE', supplier: 'Motherson', supplierRegion: 'India', materialCostUsd: 8.0 },
        ]
      },
      {
        systemName: 'Console',
        systemPartNo: 'CS-SP3i-001',
        coTypeCode: 'level1_co',
        baseVehicleCode: 'SP3',
        subParts: [
          { partName: 'Console Upper', partNo: 'CS-U-SP3', isCo: true, coSourceVehicle: 'SP3', coPartNo: 'CS-U-SP3-BASE', supplier: 'Motherson', supplierRegion: 'India', materialCostUsd: 17.0 },
          { partName: 'Console Box', partNo: 'CS-BX-SP3', isCo: true, coSourceVehicle: 'SP3', coPartNo: 'CS-BX-SP3-BASE', supplier: 'Motherson', supplierRegion: 'India', materialCostUsd: 9.0 },
          { partName: 'Cup Holder', partNo: 'CS-CH-SP3', isCo: true, coSourceVehicle: 'SP3', coPartNo: 'CS-CH-SP3-BASE', supplier: 'Minda', supplierRegion: 'India', materialCostUsd: 2.8 },
        ]
      },
    ]
  },
]
