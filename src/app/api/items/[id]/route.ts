import { NextRequest } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabase-api';
import { getAuthenticatedUser, getUserOrgId, unauthorizedResponse, forbiddenResponse } from '@/lib/api/auth';
import { successResponse, errorResponse } from '@/lib/api/response';
import { validateEnum, validatePositiveNumber } from '@/lib/api/validation';

const VALID_CATEGORIES = ['bag', 'wallet', 'accessory', 'lock', 'other'];
const VALID_CONDITIONS = ['mint', 'very_good', 'good', 'fair', 'poor'];

// GET /api/items/:id — Get single item with certificates
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const orgId = await getUserOrgId(user.id);
  if (!orgId) return forbiddenResponse();

  const { id } = await params;

  try {
    const supabase = await createAuthenticatedClient();
    const { data, error } = await supabase
      .from('items')
      .select('*, item_certificates(*, provider:certificate_providers(*))')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return errorResponse('Item nicht gefunden', 404);
      return errorResponse(error.message, 500);
    }

    return successResponse(data);
  } catch (err: any) {
    return errorResponse(err.message || 'Interner Serverfehler', 500);
  }
}

// PATCH /api/items/:id — Update an item
export async function PATCH(
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

    if (body.category) {
      const catErr = validateEnum(body.category, VALID_CATEGORIES, 'category');
      if (catErr) return errorResponse(catErr);
    }

    if (body.condition) {
      const condErr = validateEnum(body.condition, VALID_CONDITIONS, 'condition');
      if (condErr) return errorResponse(condErr);
    }

    if (body.purchase_price_eur !== undefined) {
      const priceErr = validatePositiveNumber(body.purchase_price_eur, 'purchase_price_eur');
      if (priceErr) return errorResponse(priceErr);
    }

    // Build update object — only include provided fields
    const allowedFields = [
      'brand', 'model', 'category', 'condition', 'status',
      'purchase_price_eur', 'purchase_date', 'purchase_source',
      'sale_price_eur', 'sale_date', 'sale_channel',
      'platform_fees_eur', 'shipping_cost_eur',
      'reserved_for', 'reserved_until', 'buyer',
      'image_urls', 'notes',
    ];

    const dbUpdate: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        dbUpdate[field] = body[field];
      }
    }

    if (Object.keys(dbUpdate).length === 0) {
      return errorResponse('Keine Felder zum Aktualisieren angegeben');
    }

    const supabase = await createAuthenticatedClient();
    const { data, error } = await supabase
      .from('items')
      .update(dbUpdate)
      .eq('id', id)
      .eq('organization_id', orgId)
      .select('*, item_certificates(*, provider:certificate_providers(*))')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return errorResponse('Item nicht gefunden', 404);
      return errorResponse(error.message, 500);
    }

    return successResponse(data);
  } catch (err: any) {
    return errorResponse(err.message || 'Interner Serverfehler', 500);
  }
}

// DELETE /api/items/:id — Delete an item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const orgId = await getUserOrgId(user.id);
  if (!orgId) return forbiddenResponse();

  const { id } = await params;

  try {
    const supabase = await createAuthenticatedClient();
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', id)
      .eq('organization_id', orgId);

    if (error) return errorResponse(error.message, 500);

    return successResponse({ deleted: true });
  } catch (err: any) {
    return errorResponse(err.message || 'Interner Serverfehler', 500);
  }
}
