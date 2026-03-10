import { NextRequest } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabase-api';
import { getAuthenticatedUser, getUserOrgId, unauthorizedResponse, forbiddenResponse } from '@/lib/api/auth';
import { successResponse, errorResponse } from '@/lib/api/response';
import { validatePositiveNumber } from '@/lib/api/validation';

// GET /api/expenses/:id
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
      .from('expenses')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return errorResponse('Ausgabe nicht gefunden', 404);
      return errorResponse(error.message, 500);
    }

    return successResponse(data);
  } catch (err: any) {
    return errorResponse(err.message || 'Interner Serverfehler', 500);
  }
}

// PATCH /api/expenses/:id
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

    if (body.amount_eur !== undefined) {
      const amtErr = validatePositiveNumber(body.amount_eur, 'amount_eur');
      if (amtErr) return errorResponse(amtErr);
      if (body.amount_eur <= 0) return errorResponse("'amount_eur' muss grösser als 0 sein");
    }

    const allowedFields = [
      'category_id', 'amount_eur', 'date', 'description',
      'is_recurring', 'recurring_interval', 'receipt_image_url',
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
      .from('expenses')
      .update(dbUpdate)
      .eq('id', id)
      .eq('organization_id', orgId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return errorResponse('Ausgabe nicht gefunden', 404);
      return errorResponse(error.message, 500);
    }

    return successResponse(data);
  } catch (err: any) {
    return errorResponse(err.message || 'Interner Serverfehler', 500);
  }
}

// DELETE /api/expenses/:id
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
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('organization_id', orgId);

    if (error) return errorResponse(error.message, 500);

    return successResponse({ deleted: true });
  } catch (err: any) {
    return errorResponse(err.message || 'Interner Serverfehler', 500);
  }
}
