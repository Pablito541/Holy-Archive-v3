DO $$
DECLARE
  org record;
BEGIN
  FOR org IN SELECT id FROM public.organizations LOOP
    -- Only insert if the org has 0 categories, so we don't duplicate on re-runs
    IF NOT EXISTS (SELECT 1 FROM public.expense_categories WHERE organization_id = org.id) THEN
      INSERT INTO public.expense_categories (organization_id, name, created_at) VALUES
        (org.id, 'Abonnements & Lizenzen', now()),
        (org.id, 'Verpackungsmaterial', now()),
        (org.id, 'Reinigung & Aufbereitung', now()),
        (org.id, 'Server & Software', now()),
        (org.id, 'Fotografie & Ausstattung', now()),
        (org.id, 'Reisekosten', now()),
        (org.id, 'Bürobedarf', now()),
        (org.id, 'Steuern & Steuerberater', now()),
        (org.id, 'Miete & Lager', now()),
        (org.id, 'Marketing & Werbung', now()),
        (org.id, 'Sonstiges', now());
    END IF;
  END LOOP;
END;
$$;
