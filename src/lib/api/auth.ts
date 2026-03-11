import { createAuthenticatedClient } from '@/lib/supabase-api';
import { NextResponse } from 'next/server';

export async function getAuthenticatedUser() {
  const supabase = await createAuthenticatedClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function getUserOrgId(userId: string): Promise<string | null> {
  const supabase = await createAuthenticatedClient();
  const { data } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)
    .maybeSingle();
  return data?.organization_id ?? null;
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
}

export function forbiddenResponse() {
  return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
}
