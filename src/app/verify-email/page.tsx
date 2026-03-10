'use client';

import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw } from 'lucide-react';
import { FadeIn } from '../../components/ui/FadeIn';
import { Button } from '../../components/ui/Button';
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
        <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#fafaf9] dark:bg-zinc-950 text-stone-900 dark:text-zinc-100">
            <FadeIn className="w-full max-w-sm text-center">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-3xl mx-auto flex items-center justify-center mb-8">
                    <Mail className="text-emerald-600 dark:text-emerald-400 w-9 h-9" />
                </div>
                <h1 className="text-3xl font-serif font-bold mb-3">Email bestätigen</h1>
                <p className="text-stone-500 dark:text-zinc-400 mb-2 text-base font-light">
                    Wir haben dir eine Email geschickt
                    {email && (
                        <span className="block mt-1 font-medium text-stone-700 dark:text-zinc-300">{email}</span>
                    )}
                </p>
                <p className="text-stone-400 dark:text-zinc-500 text-sm mb-10">
                    Bitte klicke auf den Link in der Email, um deinen Account zu bestätigen.
                </p>

                <Button
                    onClick={handleResend}
                    variant="secondary"
                    disabled={cooldown > 0 || sending}
                    loading={sending}
                    fullWidth
                    icon={<RefreshCw className="w-4 h-4" />}
                >
                    {cooldown > 0 ? `Erneut senden (${cooldown}s)` : 'Email erneut senden'}
                </Button>

                <p className="mt-8 text-sm text-stone-500 dark:text-zinc-400">
                    <Link href="/dashboard" className="text-stone-900 dark:text-zinc-100 font-medium hover:underline">
                        Zurück zum Login
                    </Link>
                </p>
            </FadeIn>
        </div>
    );
}
