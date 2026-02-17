-- 005: Add hire_year to profiles for seniority-based expected contribution
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hire_year integer DEFAULT NULL;
