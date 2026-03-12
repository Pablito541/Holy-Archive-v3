import React, { useState } from 'react';
import { ShoppingBag, Loader2, Mail, Lock } from 'lucide-react';
import { FadeIn } from '../ui/FadeIn';
import { Input } from '../ui/Input';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/Toast';
import Link from 'next/link';

export const LoginView = ({ onLogin }: { onLogin: (user: any) => void }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!supabase) {
                setTimeout(() => {
                    onLogin({ email: 'demo@example.com' });
                    setLoading(false);
                }, 1000);
                return;
            }

            const { data, error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                showToast(error.message, 'error');
                setLoading(false);
            } else if (data.user) {
                onLogin(data.user);
            }
        } catch (err: any) {
            console.error('LoginView: Unhandled login error:', err);
            showToast('Ein unerwarteter Fehler ist aufgetreten.', 'error');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#fafaf9] dark:bg-[#131316]">

            <FadeIn className="w-full max-w-sm relative z-10">

                {/* Logo */}
                <div className="flex justify-center mb-10">
                    <div className="w-16 h-16 bg-stone-900 dark:bg-zinc-50 rounded-2xl flex items-center justify-center shadow-2xl shadow-stone-900/25 dark:shadow-black/60 rotate-3">
                        <ShoppingBag className="w-8 h-8 text-white dark:text-zinc-900" />
                    </div>
                </div>

                {/* Heading */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-serif font-bold tracking-tight text-stone-900 dark:text-zinc-50 mb-2">
                        Holy Archive
                    </h1>
                    <p className="text-[10px] uppercase tracking-[0.25em] font-semibold text-stone-400 dark:text-zinc-600">
                        Inventory & Profit Tracking
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        type="email"
                        label="Email"
                        placeholder="deine@email.com"
                        icon={<Mail className="w-4 h-4" />}
                        value={email}
                        onChange={(e: any) => setEmail(e.target.value)}
                        required
                    />
                    <Input
                        type="password"
                        label="Passwort"
                        placeholder="••••••••"
                        icon={<Lock className="w-4 h-4" />}
                        value={password}
                        onChange={(e: any) => setPassword(e.target.value)}
                        required
                    />

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-2xl font-semibold text-sm tracking-wide flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none bg-stone-900 dark:bg-zinc-50 text-white dark:text-zinc-900 shadow-xl shadow-stone-900/20 dark:shadow-black/30 hover:bg-black dark:hover:bg-white"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Anmelden'}
                        </button>
                    </div>

                    <div className="text-center pt-1">
                        <Link
                            href="/reset-password"
                            className="text-xs text-stone-400 dark:text-zinc-600 hover:text-stone-700 dark:hover:text-zinc-400 transition-colors tracking-wide"
                        >
                            Passwort vergessen?
                        </Link>
                    </div>
                </form>

                {/* Divider + Sign up */}
                <div className="mt-8 pt-8 border-t border-stone-200 dark:border-zinc-800/60 text-center">
                    <p className="text-sm text-stone-400 dark:text-zinc-600">
                        Noch keinen Account?{' '}
                        <Link
                            href="/signup"
                            className="text-stone-900 dark:text-zinc-200 font-semibold hover:underline underline-offset-2"
                        >
                            Registrieren
                        </Link>
                    </p>
                </div>

            </FadeIn>
        </div>
    );
};
