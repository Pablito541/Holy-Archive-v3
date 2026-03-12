'use client';

import React, { useState } from 'react';
import { ShoppingBag, Mail, Loader2, ArrowLeft } from 'lucide-react';
import { FadeIn } from '../../components/ui/FadeIn';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';
import Link from 'next/link';

export default function ResetPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!supabase) {
                showToast('Supabase nicht konfiguriert', 'error');
                setLoading(false);
                return;
            }

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/update-password`,
            });

            if (error) {
                showToast(error.message, 'error');
                setLoading(false);
                return;
            }

            setSent(true);
        } catch {
            showToast('Ein unerwarteter Fehler ist aufgetreten.', 'error');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#fafaf9] dark:bg-[#131316] relative overflow-hidden">

            {/* Ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-stone-300/25 dark:bg-zinc-700/10 rounded-full blur-3xl pointer-events-none" />

            <FadeIn className="w-full max-w-sm relative z-10">

                {/* Logo */}
                <div className="flex justify-center mb-10">
                    <div className="w-16 h-16 bg-stone-900 dark:bg-zinc-50 rounded-2xl flex items-center justify-center shadow-2xl shadow-stone-900/25 dark:shadow-black/60 rotate-3">
                        <ShoppingBag className="w-8 h-8 text-white dark:text-zinc-900" />
                    </div>
                </div>

                {sent ? (
                    <div className="text-center">
                        {/* Success icon */}
                        <div className="flex justify-center mb-6">
                            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center">
                                <Mail className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-serif font-bold tracking-tight text-stone-900 dark:text-zinc-50 mb-3">
                            Email gesendet
                        </h1>
                        <p className="text-sm text-stone-500 dark:text-zinc-500 mb-10 leading-relaxed">
                            Falls ein Account mit dieser Email existiert, haben wir dir einen Link zum Zurücksetzen geschickt.
                        </p>
                        <Link
                            href="/signin"
                            className="w-full py-4 rounded-2xl font-semibold text-sm tracking-wide flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] bg-stone-900 dark:bg-zinc-50 text-white dark:text-zinc-900 shadow-xl shadow-stone-900/20 dark:shadow-black/30 hover:bg-black dark:hover:bg-white"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Zurück zum Login
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Heading */}
                        <div className="text-center mb-10">
                            <h1 className="text-4xl font-serif font-bold tracking-tight text-stone-900 dark:text-zinc-50 mb-2">
                                Passwort vergessen?
                            </h1>
                            <p className="text-[10px] uppercase tracking-[0.25em] font-semibold text-stone-400 dark:text-zinc-600">
                                Wir senden dir einen Link
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                type="email"
                                label="Email"
                                placeholder="deine@email.com"
                                icon={<Mail className="w-4 h-4" />}
                                value={email}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                required
                            />

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 rounded-2xl font-semibold text-sm tracking-wide flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none bg-stone-900 dark:bg-zinc-50 text-white dark:text-zinc-900 shadow-xl shadow-stone-900/20 dark:shadow-black/30 hover:bg-black dark:hover:bg-white"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Passwort zurücksetzen'}
                                </button>
                            </div>
                        </form>

                        <div className="mt-8 pt-8 border-t border-stone-200 dark:border-zinc-800/60 text-center">
                            <Link
                                href="/signin"
                                className="text-sm text-stone-400 dark:text-zinc-600 hover:text-stone-700 dark:hover:text-zinc-400 transition-colors tracking-wide flex items-center justify-center gap-1.5"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                Zurück zum Login
                            </Link>
                        </div>
                    </>
                )}

            </FadeIn>
        </div>
    );
}
