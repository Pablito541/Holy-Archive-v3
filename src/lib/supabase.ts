import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http'));

// Cookie-aware browser client — session is stored in cookies so the
// server-side createClient (supabase-server.ts) can read it on the next request.
export const supabase = isConfigured
    ? createBrowserClient(supabaseUrl!, supabaseAnonKey!)
    : null;

// Export createClient function for hooks that need a fresh client instance
export function createClient() {
    if (!isConfigured) {
        throw new Error('Supabase URL or Anon Key not configured');
    }
    return createBrowserClient(supabaseUrl!, supabaseAnonKey!);
}
