import { createAuthenticatedClient } from '@/lib/supabase-api';
import { getAuthenticatedUser, getUserOrgId, unauthorizedResponse, forbiddenResponse } from '@/lib/api/auth';
import { successResponse, errorResponse } from '@/lib/api/response';

// GET /api/organization/members — List organization members
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const orgId = await getUserOrgId(user.id);
  if (!orgId) return forbiddenResponse();

  try {
    const supabase = await createAuthenticatedClient();
    const { data, error } = await supabase
      .from('organization_members')
      .select('user_id, role, created_at, profiles(username, avatar)')
      .eq('organization_id', orgId);

    if (error) return errorResponse(error.message, 500);

    return successResponse(data);
  } catch (err: any) {
    return errorResponse(err.message || 'Interner Serverfehler', 500);
  }
}
