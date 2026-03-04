CREATE TABLE IF NOT EXISTS public.item_certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    certificate_provider_id UUID NOT NULL REFERENCES public.certificate_providers(id) ON DELETE RESTRICT,
    cost_eur NUMERIC(10, 2) NOT NULL,
    sale_price_eur NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.item_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization Members Access" 
ON public.item_certificates FOR ALL 
USING (
  auth.uid() IN (
    SELECT organization_members.user_id
    FROM organization_members
    WHERE organization_members.organization_id = item_certificates.organization_id
  )
);
