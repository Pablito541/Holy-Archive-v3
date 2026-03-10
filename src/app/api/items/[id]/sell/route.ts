import { NextRequest } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabase-api';
import { getAuthenticatedUser, getUserOrgId, unauthorizedResponse, forbiddenResponse } from '@/lib/api/auth';
import { successResponse, errorResponse } from '@/lib/api/response';
import { validateRequired, validatePositiveNumber } from '@/lib/api/validation';

// POST /api/items/:id/sell — Mark an item as sold
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const orgId = await getUserOrgId(user.id);
  if (!orgId) return forbiddenResponse();

  const { id } = await params;

  try {
    const body = await request.json();

    const reqErr = validateRequired(body, ['sale_price_eur', 'sale_channel']);
    if (reqErr) return errorResponse(reqErr);

    const priceErr = validatePositiveNumber(body.sale_price_eur, 'sale_price_eur');
    if (priceErr) return errorResponse(priceErr);

    if (body.platform_fees_eur !== undefined) {
      const feesErr = validatePositiveNumber(body.platform_fees_eur, 'platform_fees_eur');
      if (feesErr) return errorResponse(feesErr);
    }

    if (body.shipping_cost_eur !== undefined) {
      const shipErr = validatePositiveNumber(body.shipping_cost_eur, 'shipping_cost_eur');
      if (shipErr) return errorResponse(shipErr);
    }

    const supabase = await createAuthenticatedClient();

    // Update item to sold
    const { data, error } = await supabase
      .from('items')
      .update({
        status: 'sold',
        sale_price_eur: body.sale_price_eur,
        sale_date: body.sale_date || new Date().toISOString(),
        sale_channel: body.sale_channel,
        platform_fees_eur: body.platform_fees_eur || 0,
        shipping_cost_eur: body.shipping_cost_eur || 0,
        buyer: body.buyer || null,
      })
      .eq('id', id)
      .eq('organization_id', orgId)
      .select('*, item_certificates(*, provider:certificate_providers(*))')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return errorResponse('Item nicht gefunden', 404);
      return errorResponse(error.message, 500);
    }

    // Update certificate sale prices if provided
    if (body.cert_sale_prices && typeof body.cert_sale_prices === 'object') {
      for (const [certId, price] of Object.entries(body.cert_sale_prices)) {
        await supabase
          .from('item_certificates')
          .update({ sale_price_eur: price as number })
          .eq('id', certId);
      }
    }

    return successResponse(data);
  } catch (err: any) {
    return errorResponse(err.message || 'Interner Serverfehler', 500);
  }
}
