-- Add milestones JSONB column to kpi_nodes
-- Stores array of { id, label, done } for depth=2 action plans
ALTER TABLE kpi_nodes ADD COLUMN IF NOT EXISTS milestones jsonb DEFAULT NULL;
