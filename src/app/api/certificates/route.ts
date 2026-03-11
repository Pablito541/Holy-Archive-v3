import { NextRequest } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabase-api';
import { getAuthenticatedUser, getUserOrgId, unauthorizedResponse, forbiddenResponse } from '@/lib/api/auth';
import { successResponse, errorResponse, createdResponse } from '@/lib/api/response';
import { validateRequired, validatePositiveNumber } from '@/lib/api/validation';

// GET /api/certificates — List certificates for current org
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const orgId = await getUserOrgId(user.id);
  if (!orgId) return forbiddenResponse();

  try {
    const supabase = await createAuthenticatedClient();
    const { data, error } = await supabase
      .from('item_certificates')
      .select('*, provider:certificate_providers(*), item:items(id, brand, model)')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) return errorResponse(error.message, 500);

    return successResponse(data);
  } catch (err: any) {
    return errorResponse(err.message || 'Interner Serverfehler', 500);
  }
}

// POST /api/certificates — Create a new certificate
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const orgId = await getUserOrgId(user.id);
  if (!orgId) return forbiddenResponse();

  try {
    const body = await request.json();

    const reqErr = validateRequired(body, ['item_id', 'certificate_provider_id', 'cost_eur']);
    if (reqErr) return errorResponse(reqErr);

    const costErr = validatePositiveNumber(body.cost_eur, 'cost_eur');
    if (costErr) return errorResponse(costErr);

    const supabase = await createAuthenticatedClient();

    const { data, error } = await supabase
      .from('item_certificates')
      .insert({
        organization_id: orgId,
        item_id: body.item_id,
        certificate_provider_id: body.certificate_provider_id,
        cost_eur: body.cost_eur,
      })
      .select('*, provider:certificate_providers(*)')
      .single();

    if (error) return errorResponse(error.message, 500);

    return createdResponse(data);
  } catch (err: any) {
    return errorResponse(err.message || 'Interner Serverfehler', 500);
  }
}
