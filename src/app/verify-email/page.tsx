'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingBag, Mail, RefreshCw, Loader2 } from 'lucide-react';
import { FadeIn } from '../../components/ui/FadeIn';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';
import Link from 'next/link';

export default function VerifyEmailPage() {
    const [email, setEmail] = useState<string | null>(null);
    const [cooldown, setCooldown] = useState(0);
    const [sending, setSending] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        const stored = sessionStorage.getItem('signup_email');
        if (stored) setEmail(stored);
    }, []);

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    const handleResend = async () => {
        if (!supabase || !email || cooldown > 0) return;
        setSending(true);
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });
            if (error) {
                showToast(error.message, 'error');
            } else {
                showToast('Email erneut gesendet', 'success');
                setCooldown(60);
            }
        } catch {
            showToast('Fehler beim Senden', 'error');
        }
        setSending(false);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#fafaf9] dark:bg-[#131316]">

            <FadeIn className="w-full max-w-sm text-center">

                {/* Logo */}
                <div className="flex justify-center mb-10">
                    <div className="w-16 h-16 bg-stone-900 dark:bg-zinc-50 rounded-2xl flex items-center justify-center shadow-2xl shadow-stone-900/25 dark:shadow-black/60 rotate-3">
                        <ShoppingBag className="w-8 h-8 text-white dark:text-zinc-900" />
                    </div>
                </div>

                {/* Email icon indicator */}
                <div className="flex justify-center mb-6">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/25 rounded-2xl flex items-center justify-center">
                        <Mail className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                </div>

                {/* Heading */}
                <h1 className="text-4xl font-serif font-bold tracking-tight text-stone-900 dark:text-zinc-50 mb-3">
                    Email bestätigen
                </h1>
                <p className="text-sm text-stone-500 dark:text-zinc-500 mb-1 leading-relaxed">
                    Wir haben dir eine Email geschickt
                </p>
                {email && (
                    <p className="font-semibold text-stone-700 dark:text-zinc-300 text-sm mb-6">{email}</p>
                )}
                <p className="text-xs text-stone-400 dark:text-zinc-600 mb-10 leading-relaxed">
                    Bitte klicke auf den Link in der Email, um deinen Account zu bestätigen.
                </p>

                {/* Resend button */}
                <button
                    onClick={handleResend}
                    disabled={cooldown > 0 || sending}
                    className="w-full py-4 rounded-2xl font-semibold text-sm tracking-wide flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none bg-stone-900 dark:bg-zinc-50 text-white dark:text-zinc-900 shadow-xl shadow-stone-900/20 dark:shadow-black/30 hover:bg-black dark:hover:bg-white"
                >
                    {sending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <RefreshCw className="w-4 h-4" />
                    )}
                    {cooldown > 0 ? `Erneut senden (${cooldown}s)` : 'Email erneut senden'}
                </button>

                <div className="mt-8 pt-8 border-t border-stone-200 dark:border-zinc-800/60 text-center">
                    <p className="text-sm text-stone-400 dark:text-zinc-600">
                        Falscher Account?{' '}
                        <Link
                            href="/signin"
                            className="text-stone-900 dark:text-zinc-200 font-semibold hover:underline underline-offset-2"
                        >
                            Zurück zum Login
                        </Link>
                    </p>
                </div>

            </FadeIn>
        </div>
    );
}
