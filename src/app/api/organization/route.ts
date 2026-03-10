import { NextRequest } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabase-api';
import { getAuthenticatedUser, getUserOrgId, unauthorizedResponse, forbiddenResponse } from '@/lib/api/auth';
import { successResponse, errorResponse } from '@/lib/api/response';

// GET /api/organization — Get current user's organization
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const orgId = await getUserOrgId(user.id);
  if (!orgId) return forbiddenResponse();

  try {
    const supabase = await createAuthenticatedClient();
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();

    if (error) return errorResponse(error.message, 500);

    return successResponse(data);
  } catch (err: any) {
    return errorResponse(err.message || 'Interner Serverfehler', 500);
  }
}

// PATCH /api/organization — Update organization (owner only)
export async function PATCH(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const orgId = await getUserOrgId(user.id);
  if (!orgId) return forbiddenResponse();

  // Check if user is owner
  const supabase = await createAuthenticatedClient();
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('organization_id', orgId)
    .single();

  if (membership?.role !== 'owner') {
    return forbiddenResponse();
  }

  try {
    const body = await request.json();

    const allowedFields = ['name', 'logo_url'];
    const dbUpdate: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        dbUpdate[field] = body[field];
      }
    }

    if (Object.keys(dbUpdate).length === 0) {
      return errorResponse('Keine Felder zum Aktualisieren angegeben');
    }

    const { data, error } = await supabase
      .from('organizations')
      .update(dbUpdate)
      .eq('id', orgId)
      .select()
      .single();

    if (error) return errorResponse(error.message, 500);

    return successResponse(data);
  } catch (err: any) {
    return errorResponse(err.message || 'Interner Serverfehler', 500);
  }
}
