-- Audit Logs table for tracking all user actions
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,                -- 'create', 'update', 'delete', 'sell', 'login', 'invite_member', etc.
  entity_type TEXT NOT NULL,           -- 'item', 'expense', 'member', 'settings', etc.
  entity_id UUID,                      -- can be NULL for bulk actions
  changes JSONB,                       -- { field: { old: ..., new: ... } }
  metadata JSONB,                      -- additional info (IP, User-Agent, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_audit_logs_org_created ON audit_logs (organization_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);

-- RLS: Only org members can read their audit logs, nobody can modify them
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Read-only access for organization members
CREATE POLICY "Org members can read audit logs"
  ON audit_logs
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- No INSERT/UPDATE/DELETE policies for clients — only the trigger (SECURITY DEFINER) can write
