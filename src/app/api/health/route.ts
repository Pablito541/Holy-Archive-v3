import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json(
            {
                status: 'error',
                timestamp: new Date().toISOString(),
                database: 'not_configured',
                error: 'Missing Supabase environment variables',
            },
            { status: 503 }
        );
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { error } = await supabase.from('organizations').select('id').limit(1);

        if (error) {
            return NextResponse.json(
                {
                    status: 'degraded',
                    timestamp: new Date().toISOString(),
                    database: 'error',
                    error: error.message,
                },
                { status: 503 }
            );
        }

        return NextResponse.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: 'connected',
        });
    } catch (err) {
        return NextResponse.json(
            {
                status: 'error',
                timestamp: new Date().toISOString(),
                database: 'unreachable',
                error: err instanceof Error ? err.message : 'Unknown error',
            },
            { status: 503 }
        );
    }
}
