import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

        // Create admin client with service role
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        })

        // Create user client to verify caller
        const authHeader = req.headers.get('Authorization')!
        const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
            global: { headers: { Authorization: authHeader } },
            auth: { autoRefreshToken: false, persistSession: false }
        })

        // Get calling user
        const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const { email, role, org_id } = await req.json()

        if (!email || !role || !org_id) {
            return new Response(JSON.stringify({ error: 'Missing required fields: email, role, org_id' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // Verify caller is owner or admin of this org
        const { data: callerMembership } = await supabaseAdmin
            .from('organization_members')
            .select('role')
            .eq('organization_id', org_id)
            .eq('user_id', user.id)
            .single()

        if (!callerMembership || !['owner', 'admin'].includes(callerMembership.role)) {
            return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // 1. Create invitation record
        const { error: inviteError } = await supabaseAdmin
            .from('invitations')
            .insert({
                organization_id: org_id,
                email: email.toLowerCase(),
                role,
                invited_by: user.id,
                status: 'pending'
            })

        if (inviteError) {
            return new Response(JSON.stringify({ error: inviteError.message }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // 2. Send invitation email via Supabase Auth
        const { data: inviteData, error: authInviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            redirectTo: `${supabaseUrl.replace('.supabase.co', '.vercel.app')}/dashboard`,
        })

        if (authInviteError) {
            // If user already exists, that's fine — the DB trigger won't fire,
            // but we can still add them directly
            if (authInviteError.message?.includes('already been registered')) {
                // User exists — check if they already belong to this org 
                const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
                const targetUser = existingUser?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

                if (targetUser) {
                    // Add directly to org
                    const { error: memberError } = await supabaseAdmin
                        .from('organization_members')
                        .insert({
                            organization_id: org_id,
                            user_id: targetUser.id,
                            role
                        })

                    if (memberError && !memberError.message?.includes('duplicate')) {
                        return new Response(JSON.stringify({ error: memberError.message }), {
                            status: 500,
                            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                        })
                    }

                    // Mark invitation as accepted
                    await supabaseAdmin
                        .from('invitations')
                        .update({ status: 'accepted' })
                        .eq('email', email.toLowerCase())
                        .eq('organization_id', org_id)
                        .eq('status', 'pending')
                }
            } else {
                console.error('Auth invite error:', authInviteError)
                // Don't fail — the invitation record is already created
                // When the user signs up manually, the DB trigger will handle it
            }
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error('Edge function error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
