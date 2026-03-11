-- Generic audit log trigger function
-- Fires on INSERT, UPDATE, DELETE on tracked tables
-- Uses SECURITY DEFINER to bypass RLS on audit_logs table
CREATE OR REPLACE FUNCTION log_changes()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  audit_action TEXT;
  audit_entity_id UUID;
  audit_org_id UUID;
  audit_user_id UUID;
  audit_changes JSONB;
  old_data JSONB;
  new_data JSONB;
  diff_key TEXT;
  diff_changes JSONB := '{}';
BEGIN
  -- Determine the action
  IF TG_OP = 'INSERT' THEN
    audit_action := 'create';
  ELSIF TG_OP = 'UPDATE' THEN
    -- Check if this is a sell (status changed to 'sold') or a soft-delete
    IF TG_TABLE_NAME = 'items' THEN
      IF NEW.status = 'sold' AND (OLD.status IS DISTINCT FROM 'sold') THEN
        audit_action := 'sell';
      ELSIF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
        audit_action := 'delete';
      ELSE
        audit_action := 'update';
      END IF;
    ELSIF TG_TABLE_NAME = 'expenses' THEN
      IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
        audit_action := 'delete';
      ELSE
        audit_action := 'update';
      END IF;
    ELSE
      audit_action := 'update';
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    audit_action := 'delete';
  END IF;

  -- Get entity ID and organization_id
  IF TG_OP = 'DELETE' THEN
    audit_entity_id := OLD.id;
    audit_org_id := OLD.organization_id;
  ELSE
    audit_entity_id := NEW.id;
    audit_org_id := NEW.organization_id;
  END IF;

  -- Get the current authenticated user (may be NULL for service-role calls)
  audit_user_id := COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::UUID);

  -- Calculate changes for UPDATE operations
  IF TG_OP = 'UPDATE' THEN
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
    
    FOR diff_key IN SELECT jsonb_object_keys(new_data)
    LOOP
      -- Skip internal/timestamp fields
      IF diff_key IN ('created_at', 'updated_at') THEN
        CONTINUE;
      END IF;
      
      IF (old_data ->> diff_key) IS DISTINCT FROM (new_data ->> diff_key) THEN
        diff_changes := diff_changes || jsonb_build_object(
          diff_key, jsonb_build_object(
            'old', old_data -> diff_key,
            'new', new_data -> diff_key
          )
        );
      END IF;
    END LOOP;
    audit_changes := diff_changes;
  ELSIF TG_OP = 'INSERT' THEN
    audit_changes := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    audit_changes := to_jsonb(OLD);
  END IF;

  -- Insert the audit log entry
  INSERT INTO audit_logs (organization_id, user_id, action, entity_type, entity_id, changes)
  VALUES (audit_org_id, audit_user_id, audit_action, TG_TABLE_NAME, audit_entity_id, audit_changes);

  -- Return appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Attach trigger to items table
CREATE TRIGGER items_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON items
  FOR EACH ROW EXECUTE FUNCTION log_changes();

-- Attach trigger to expenses table
CREATE TRIGGER expenses_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON expenses
  FOR EACH ROW EXECUTE FUNCTION log_changes();

-- Attach trigger to item_certificates table
CREATE TRIGGER item_certificates_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON item_certificates
  FOR EACH ROW EXECUTE FUNCTION log_changes();
