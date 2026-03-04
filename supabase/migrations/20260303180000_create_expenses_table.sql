CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    category_id UUID NOT NULL REFERENCES public.expense_categories(id) ON DELETE CASCADE,
    amount_eur NUMERIC(10, 2) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    is_recurring BOOLEAN DEFAULT false,
    recurring_interval VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization Members Access" 
ON public.expenses FOR ALL 
USING (
  auth.uid() IN (
    SELECT organization_members.user_id
    FROM organization_members
    WHERE organization_members.organization_id = expenses.organization_id
  )
);
