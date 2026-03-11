import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabase-api';

export async function GET() {
  try {
    const supabase = await createAuthenticatedClient();
    const { error } = await supabase.from('plans').select('id').limit(1);

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      supabase: error ? 'error' : 'connected',
    });
  } catch {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      supabase: 'disconnected',
    }, { status: 503 });
  }
}
