-- 004: Enable virtual team members (members without auth accounts)
-- Required for: Settings → Team Member Management feature

-- 1. Drop FK constraint on profiles.id → auth.users(id)
--    This allows inserting team members who don't have Supabase Auth accounts
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Drop FK constraint on kpi_nodes.owner_id → auth.users(id)
--    This allows assigning virtual members as KPI owners
ALTER TABLE kpi_nodes DROP CONSTRAINT IF EXISTS kpi_nodes_owner_id_fkey;

-- 3. Add FK from kpi_nodes.owner_id → profiles.id instead (safer reference)
ALTER TABLE kpi_nodes ADD CONSTRAINT kpi_nodes_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 4. Relax RLS policies so org members can manage team members
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (
  auth.uid() = id
  OR org_id IN (SELECT p.org_id FROM profiles p WHERE p.id = auth.uid())
);

DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (
  auth.uid() = id
  OR org_id IN (SELECT p.org_id FROM profiles p WHERE p.id = auth.uid())
);

-- 5. Add department column if not exists (may already exist from manual ALTER)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department text DEFAULT NULL;
