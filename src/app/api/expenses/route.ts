import { NextRequest } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabase-api';
import { getAuthenticatedUser, getUserOrgId, unauthorizedResponse, forbiddenResponse } from '@/lib/api/auth';
import { successResponse, errorResponse, createdResponse } from '@/lib/api/response';
import { validateRequired, validatePositiveNumber } from '@/lib/api/validation';
import { checkRateLimit } from '@/lib/api/rateLimit';

// GET /api/expenses — List expenses with filters
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const orgId = await getUserOrgId(user.id);
  if (!orgId) return forbiddenResponse();

  const { allowed } = checkRateLimit(`expenses:get:${user.id}`, 60, 60_000);
  if (!allowed) return errorResponse('Rate limit überschritten', 429);

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '0', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
  const categoryId = searchParams.get('category_id');
  const isRecurring = searchParams.get('is_recurring');
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');

  try {
    const supabase = await createAuthenticatedClient();
    const from = page * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('expenses')
      .select('*', { count: 'exact' })
      .eq('organization_id', orgId);

    if (categoryId) query = query.eq('category_id', categoryId);
    if (isRecurring !== null && isRecurring !== undefined) {
      query = query.eq('is_recurring', isRecurring === 'true');
    }
    if (dateFrom) query = query.gte('date', dateFrom);
    if (dateTo) query = query.lte('date', dateTo);

    query = query.order('date', { ascending: false });

    const { data, error, count } = await query.range(from, to);

    if (error) return errorResponse(error.message, 500);

    return successResponse({
      expenses: data,
      total: count ?? 0,
      page,
      limit,
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Interner Serverfehler', 500);
  }
}

// POST /api/expenses — Create a new expense
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const orgId = await getUserOrgId(user.id);
  if (!orgId) return forbiddenResponse();

  const { allowed } = checkRateLimit(`expenses:post:${user.id}`, 30, 60_000);
  if (!allowed) return errorResponse('Rate limit überschritten', 429);

  try {
    const body = await request.json();

    const reqErr = validateRequired(body, ['category_id', 'amount_eur', 'date']);
    if (reqErr) return errorResponse(reqErr);

    const amtErr = validatePositiveNumber(body.amount_eur, 'amount_eur');
    if (amtErr) return errorResponse(amtErr);

    if (body.amount_eur <= 0) return errorResponse("'amount_eur' muss grösser als 0 sein");

    const supabase = await createAuthenticatedClient();

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        organization_id: orgId,
        category_id: body.category_id,
        amount_eur: body.amount_eur,
        date: body.date,
        description: body.description || null,
        is_recurring: body.is_recurring || false,
        recurring_interval: body.is_recurring ? (body.recurring_interval || 'monthly') : null,
        receipt_image_url: body.receipt_image_url || null,
      })
      .select()
      .single();

    if (error) return errorResponse(error.message, 500);

    return createdResponse(data);
  } catch (err: any) {
    return errorResponse(err.message || 'Interner Serverfehler', 500);
  }
}
