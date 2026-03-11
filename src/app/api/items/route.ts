import { NextRequest } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabase-api';
import { getAuthenticatedUser, getUserOrgId, unauthorizedResponse, forbiddenResponse } from '@/lib/api/auth';
import { successResponse, errorResponse, createdResponse } from '@/lib/api/response';
import { validateRequired, validateEnum, validatePositiveNumber } from '@/lib/api/validation';
import { checkRateLimit } from '@/lib/api/rateLimit';

const VALID_CATEGORIES = ['bag', 'wallet', 'accessory', 'lock', 'other'];
const VALID_CONDITIONS = ['mint', 'very_good', 'good', 'fair', 'poor'];
const VALID_STATUSES = ['in_stock', 'sold'];

// GET /api/items — List items with pagination and filters
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const orgId = await getUserOrgId(user.id);
  if (!orgId) return forbiddenResponse();

  const { allowed } = checkRateLimit(`items:get:${user.id}`, 60, 60_000);
  if (!allowed) return errorResponse('Rate limit überschritten', 429);

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'in_stock';
  const page = parseInt(searchParams.get('page') || '0', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
  const search = searchParams.get('search') || '';

  if (!VALID_STATUSES.includes(status)) {
    return errorResponse(`status muss einer der folgenden Werte sein: ${VALID_STATUSES.join(', ')}`);
  }

  try {
    const supabase = await createAuthenticatedClient();
    const from = page * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('items')
      .select('*, item_certificates(*, provider:certificate_providers(*))', { count: 'exact' })
      .eq('organization_id', orgId)
      .eq('status', status);

    if (search) {
      query = query.or(`brand.ilike.%${search}%,model.ilike.%${search}%,notes.ilike.%${search}%`);
    }

    if (status === 'sold') {
      query = query.order('sale_date', { ascending: false, nullsFirst: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error, count } = await query.range(from, to);

    if (error) return errorResponse(error.message, 500);

    return successResponse({
      items: data,
      total: count ?? 0,
      page,
      limit,
      hasMore: (data?.length ?? 0) === limit && (count ?? 0) > from + (data?.length ?? 0),
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Interner Serverfehler', 500);
  }
}

// POST /api/items — Create a new item
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const orgId = await getUserOrgId(user.id);
  if (!orgId) return forbiddenResponse();

  const { allowed } = checkRateLimit(`items:post:${user.id}`, 30, 60_000);
  if (!allowed) return errorResponse('Rate limit überschritten', 429);

  try {
    const body = await request.json();

    // Validation
    const reqErr = validateRequired(body, ['brand', 'model']);
    if (reqErr) return errorResponse(reqErr);

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

    const supabase = await createAuthenticatedClient();

    const dbItem = {
      organization_id: orgId,
      user_id: user.id,
      brand: body.brand,
      model: body.model,
      category: body.category || 'bag',
      condition: body.condition || 'good',
      status: 'in_stock',
      purchase_price_eur: body.purchase_price_eur || 0,
      purchase_date: body.purchase_date || new Date().toISOString(),
      purchase_source: body.purchase_source || '',
      image_urls: body.image_urls || [],
      notes: body.notes || '',
    };

    const { data: inserted, error } = await supabase
      .from('items')
      .insert(dbItem)
      .select('*, item_certificates(*, provider:certificate_providers(*))')
      .single();

    if (error) return errorResponse(error.message, 500);

    // Optionally create a certificate alongside
    if (body.certificate && inserted) {
      const { data: cert, error: certErr } = await supabase
        .from('item_certificates')
        .insert({
          organization_id: orgId,
          item_id: inserted.id,
          certificate_provider_id: body.certificate.provider_id,
          cost_eur: body.certificate.cost_eur,
        })
        .select('*, provider:certificate_providers(*)')
        .single();

      if (!certErr && cert) {
        inserted.item_certificates = [cert];
      }
    }

    return createdResponse(inserted);
  } catch (err: any) {
    return errorResponse(err.message || 'Interner Serverfehler', 500);
  }
}
