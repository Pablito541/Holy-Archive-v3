import { createClient } from '../../../lib/supabase-server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Check if user already belongs to an organization
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data: membership } = await supabase
                    .from('organization_members')
                    .select('organization_id')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (membership?.organization_id) {
                    return NextResponse.redirect(`${origin}/dashboard`);
                } else {
                    return NextResponse.redirect(`${origin}/onboarding`);
                }
            }
        }
    }

    // If code exchange fails or no code, redirect to login
    return NextResponse.redirect(`${origin}/dashboard`);
}
