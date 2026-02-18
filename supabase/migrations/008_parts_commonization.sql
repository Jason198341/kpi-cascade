-- ═══════════════════════════════════════════════════════════════════════════════
-- 008_parts_commonization.sql
-- Parts Commonization (공용화) Database Schema
-- Added to KPI Cascade Supabase project (rcdflbygcjmrmcwrhpqm)
--
-- DESIGN PRINCIPLES:
--   1. Multi-tenant: every table has org_id → organizations cascade
--   2. Configurable enums: co_types + reason_categories are per-org lookup tables
--      (not CHECK constraints) — enables multi-department expansion
--   3. Excel import audit trail: import_batches table with status lifecycle
--   4. 4-level normalized hierarchy: vehicle → system → sub_part → reason_detail
--   5. RLS follows existing "same-org" pattern from 001_initial_schema.sql
--   6. Indexes designed for cross-vehicle matrix + opportunity scan queries
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1: CONFIGURABLE ENUM LOOKUP TABLES (per-org, multi-department)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE co_type_configs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department  text        NOT NULL DEFAULT 'interior',
  code        text        NOT NULL,
  label_ko    text        NOT NULL,
  label_en    text        NOT NULL DEFAULT '',
  sort_order  smallint    NOT NULL DEFAULT 0,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT co_type_configs_org_code_dept_uniq UNIQUE (org_id, department, code)
);

CREATE TABLE reason_category_configs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department  text        NOT NULL DEFAULT 'interior',
  code        text        NOT NULL,
  label_ko    text        NOT NULL,
  label_en    text        NOT NULL DEFAULT '',
  sort_order  smallint    NOT NULL DEFAULT 0,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reason_category_configs_org_code_dept_uniq UNIQUE (org_id, department, code)
);

CREATE INDEX idx_co_type_configs_org ON co_type_configs(org_id, department);
CREATE INDEX idx_reason_category_configs_org ON reason_category_configs(org_id, department);


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2: EXCEL IMPORT BATCH TRACKING
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE import_batches (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  uploaded_by       uuid        NOT NULL REFERENCES profiles(id),
  department        text        NOT NULL DEFAULT 'interior',
  original_filename text        NOT NULL,
  file_size_bytes   bigint,
  status            text        NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','validating','validated','committed','failed','rolled_back')),
  vehicle_count     integer     NOT NULL DEFAULT 0,
  system_count      integer     NOT NULL DEFAULT 0,
  subpart_count     integer     NOT NULL DEFAULT 0,
  reason_count      integer     NOT NULL DEFAULT 0,
  parse_errors      jsonb       NOT NULL DEFAULT '[]'::jsonb,
  validated_at      timestamptz,
  committed_at      timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_import_batches_org ON import_batches(org_id, created_at DESC);
CREATE INDEX idx_import_batches_uploader ON import_batches(uploaded_by);
CREATE INDEX idx_import_batches_status ON import_batches(org_id, status);

CREATE TRIGGER import_batches_updated
  BEFORE UPDATE ON import_batches
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 3: VEHICLE TABLE (차종)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE co_vehicles (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  import_batch_id uuid        REFERENCES import_batches(id) ON DELETE SET NULL,
  vehicle_code    text        NOT NULL,
  vehicle_name    text        NOT NULL,
  stage           text        NOT NULL DEFAULT 'Pre-SOP',
  sop_date        text,
  half            text        NOT NULL DEFAULT 'H2' CHECK (half IN ('H1','H2')),
  vehicle_type    text        NOT NULL DEFAULT '개발' CHECK (vehicle_type IN ('양산','개발')),
  sales_volume    integer     NOT NULL DEFAULT 0,
  is_active       boolean     NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT co_vehicles_org_code_uniq UNIQUE (org_id, vehicle_code)
);

CREATE INDEX idx_co_vehicles_org ON co_vehicles(org_id, is_active);
CREATE INDEX idx_co_vehicles_batch ON co_vehicles(import_batch_id);

CREATE TRIGGER co_vehicles_updated
  BEFORE UPDATE ON co_vehicles
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 4: SYSTEM TABLE (1레벨 시스템)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE co_systems (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  import_batch_id   uuid        REFERENCES import_batches(id) ON DELETE SET NULL,
  vehicle_id        uuid        NOT NULL REFERENCES co_vehicles(id) ON DELETE CASCADE,
  system_name       text        NOT NULL,
  system_part_no    text,
  co_type_code      text        NOT NULL,
  base_vehicle_code text        NOT NULL DEFAULT '-',
  total_sub_parts   integer     NOT NULL DEFAULT 0,
  co_sub_parts      integer     NOT NULL DEFAULT 0,
  co_cost_usd       numeric(12,4) NOT NULL DEFAULT 0,
  new_dev_cost_usd  numeric(12,4) NOT NULL DEFAULT 0,
  is_active         boolean     NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT co_systems_vehicle_name_uniq UNIQUE (vehicle_id, system_name)
);

CREATE INDEX idx_co_systems_org ON co_systems(org_id, is_active);
CREATE INDEX idx_co_systems_vehicle ON co_systems(vehicle_id);
CREATE INDEX idx_co_systems_base_vehicle ON co_systems(org_id, base_vehicle_code);
CREATE INDEX idx_co_systems_co_type ON co_systems(org_id, co_type_code);
CREATE INDEX idx_co_systems_batch ON co_systems(import_batch_id);

CREATE TRIGGER co_systems_updated
  BEFORE UPDATE ON co_systems
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 5: SUB-PART TABLE (2레벨 부품)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE co_sub_parts (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  import_batch_id   uuid        REFERENCES import_batches(id) ON DELETE SET NULL,
  system_id         uuid        NOT NULL REFERENCES co_systems(id) ON DELETE CASCADE,
  part_name         text        NOT NULL,
  part_no           text        NOT NULL,
  is_co             boolean     NOT NULL DEFAULT false,
  co_source_vehicle text,
  co_part_no        text,
  non_co_reason     text,
  supplier          text        NOT NULL DEFAULT '-',
  supplier_region   text        NOT NULL DEFAULT '-',
  material_cost_usd numeric(12,4) NOT NULL DEFAULT 0,
  is_active         boolean     NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT co_sub_parts_system_partno_uniq UNIQUE (system_id, part_no)
);

CREATE INDEX idx_co_sub_parts_org ON co_sub_parts(org_id, is_active);
CREATE INDEX idx_co_sub_parts_system ON co_sub_parts(system_id);
CREATE INDEX idx_co_sub_parts_is_co ON co_sub_parts(system_id, is_co);
CREATE INDEX idx_co_sub_parts_batch ON co_sub_parts(import_batch_id);
CREATE INDEX idx_co_sub_parts_supplier ON co_sub_parts(org_id, supplier);

CREATE TRIGGER co_sub_parts_updated
  BEFORE UPDATE ON co_sub_parts
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 6: REASON DETAIL TABLE (비C/O 사유)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE co_reason_details (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  import_batch_id     uuid        REFERENCES import_batches(id) ON DELETE SET NULL,
  sub_part_id         uuid        NOT NULL REFERENCES co_sub_parts(id) ON DELETE CASCADE,
  reason_category_code text       NOT NULL,
  base_spec           text        NOT NULL DEFAULT '-',
  new_spec            text        NOT NULL DEFAULT '-',
  diff_description    text        NOT NULL DEFAULT '-',
  design_intent       text        NOT NULL DEFAULT '-',
  impact_area         text        NOT NULL DEFAULT '-',
  co_possibility      text        NOT NULL DEFAULT 'none'
                      CHECK (co_possibility IN ('high','medium','low','none')),
  co_condition        text,
  additional_cost_usd numeric(12,4) NOT NULL DEFAULT 0,
  is_active           boolean     NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT co_reason_details_sub_part_uniq UNIQUE (sub_part_id)
);

CREATE INDEX idx_co_reason_details_org ON co_reason_details(org_id, is_active);
CREATE INDEX idx_co_reason_details_sub_part ON co_reason_details(sub_part_id);
CREATE INDEX idx_co_reason_details_possibility ON co_reason_details(org_id, co_possibility);
CREATE INDEX idx_co_reason_details_category ON co_reason_details(org_id, reason_category_code);
CREATE INDEX idx_co_reason_details_batch ON co_reason_details(import_batch_id);

CREATE TRIGGER co_reason_details_updated
  BEFORE UPDATE ON co_reason_details
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 7: STORED FUNCTION — RECOMPUTE SYSTEM AGGREGATES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION recompute_co_system_aggregates(p_system_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE co_systems
  SET
    total_sub_parts  = (SELECT COUNT(*) FROM co_sub_parts WHERE system_id = p_system_id AND is_active = true),
    co_sub_parts     = (SELECT COUNT(*) FILTER (WHERE is_co = true) FROM co_sub_parts WHERE system_id = p_system_id AND is_active = true),
    co_cost_usd      = (SELECT COALESCE(SUM(material_cost_usd) FILTER (WHERE is_co = true), 0) FROM co_sub_parts WHERE system_id = p_system_id AND is_active = true),
    new_dev_cost_usd = (SELECT COALESCE(SUM(material_cost_usd) FILTER (WHERE is_co = false), 0) FROM co_sub_parts WHERE system_id = p_system_id AND is_active = true)
  WHERE id = p_system_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION trg_co_sub_parts_sync_aggregates()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM recompute_co_system_aggregates(OLD.system_id);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' AND OLD.system_id <> NEW.system_id THEN
    PERFORM recompute_co_system_aggregates(OLD.system_id);
    PERFORM recompute_co_system_aggregates(NEW.system_id);
  ELSE
    PERFORM recompute_co_system_aggregates(NEW.system_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER co_sub_parts_sync_aggregates
  AFTER INSERT OR UPDATE OR DELETE ON co_sub_parts
  FOR EACH ROW EXECUTE FUNCTION trg_co_sub_parts_sync_aggregates();


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 8: VIEWS — CROSS-VEHICLE MATRIX AND OPPORTUNITY SCAN
-- ─────────────────────────────────────────────────────────────────────────────

CREATE VIEW co_matrix_raw AS
SELECT
  v.org_id,
  v.vehicle_code AS target_vehicle_code,
  v.vehicle_name AS target_vehicle_name,
  v.vehicle_type, v.half, v.sales_volume,
  s.system_name, s.base_vehicle_code, s.co_type_code,
  s.total_sub_parts, s.co_sub_parts,
  s.co_cost_usd, s.new_dev_cost_usd,
  CASE WHEN s.total_sub_parts > 0
    THEN ROUND((s.co_sub_parts::numeric / s.total_sub_parts * 100), 1)
    ELSE 0
  END AS co_rate_pct,
  s.new_dev_cost_usd - s.co_cost_usd AS savings_usd
FROM co_vehicles v
JOIN co_systems s ON s.vehicle_id = v.id
WHERE v.is_active = true AND s.is_active = true;

CREATE VIEW co_opportunities AS
SELECT
  v.org_id, v.vehicle_code, v.vehicle_name,
  s.system_name,
  sp.part_name, sp.part_no, sp.supplier, sp.supplier_region, sp.material_cost_usd,
  rd.reason_category_code, rd.co_possibility, rd.co_condition,
  rd.additional_cost_usd, rd.diff_description, rd.design_intent
FROM co_vehicles v
JOIN co_systems s ON s.vehicle_id = v.id
JOIN co_sub_parts sp ON sp.system_id = s.id
JOIN co_reason_details rd ON rd.sub_part_id = sp.id
WHERE v.is_active = true AND s.is_active = true
  AND sp.is_active = true AND rd.is_active = true
  AND rd.co_possibility IN ('high','medium');

CREATE VIEW co_source_summary AS
SELECT
  s.org_id, s.base_vehicle_code,
  COUNT(DISTINCT v.vehicle_code) AS adopted_by_vehicle_count,
  COUNT(*) AS systems_shared,
  SUM(s.co_sub_parts) AS parts_shared,
  SUM(s.new_dev_cost_usd - s.co_cost_usd) AS total_savings_usd
FROM co_systems s
JOIN co_vehicles v ON v.id = s.vehicle_id
WHERE s.is_active = true AND v.is_active = true
  AND s.base_vehicle_code <> '-' AND s.base_vehicle_code IS NOT NULL
GROUP BY s.org_id, s.base_vehicle_code;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 9: ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE co_type_configs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE reason_category_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_batches          ENABLE ROW LEVEL SECURITY;
ALTER TABLE co_vehicles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE co_systems              ENABLE ROW LEVEL SECURITY;
ALTER TABLE co_sub_parts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE co_reason_details       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "co_type_configs_org" ON co_type_configs FOR ALL USING (
  org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "reason_category_configs_org" ON reason_category_configs FOR ALL USING (
  org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "import_batches_org" ON import_batches FOR ALL USING (
  org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "co_vehicles_org" ON co_vehicles FOR ALL USING (
  org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "co_systems_org" ON co_systems FOR ALL USING (
  org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "co_sub_parts_org" ON co_sub_parts FOR ALL USING (
  org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "co_reason_details_org" ON co_reason_details FOR ALL USING (
  org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid())
);


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 10: SEED DEFAULT ENUM VALUES
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO co_type_configs (org_id, department, code, label_ko, label_en, sort_order)
SELECT o.id, 'interior', v.code, v.label_ko, v.label_en, v.sort_order
FROM organizations o
CROSS JOIN (VALUES
  ('level1_co',  '1레벨 C/O',      'Level 1 Full C/O',      0),
  ('level2_co',  '2레벨 부분 C/O', 'Level 2 Partial C/O',   1),
  ('new_dev',    '신규개발',        'New Development',        2)
) AS v(code, label_ko, label_en, sort_order)
ON CONFLICT (org_id, department, code) DO NOTHING;

INSERT INTO reason_category_configs (org_id, department, code, label_ko, label_en, sort_order)
SELECT o.id, 'interior', v.code, v.label_ko, v.label_en, v.sort_order
FROM organizations o
CROSS JOIN (VALUES
  ('design',      '디자인',   'Design Differentiation',    0),
  ('spec_change', '사양변경', 'Specification Change',      1),
  ('regulation',  '법규',     'Regulation/Compliance',     2),
  ('new_spec',    '신규사양', 'New Specification',         3),
  ('shape_diff',  '형상차이', 'Shape/Geometry Difference', 4),
  ('performance', '성능',     'Performance Requirement',   5)
) AS v(code, label_ko, label_en, sort_order)
ON CONFLICT (org_id, department, code) DO NOTHING;
