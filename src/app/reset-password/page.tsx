'use client';

import React, { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import { FadeIn } from '../../components/ui/FadeIn';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
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
        <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#fafaf9] dark:bg-zinc-950 text-stone-900 dark:text-zinc-100">
            <FadeIn className="w-full max-w-sm text-center">
                <div className="w-20 h-20 bg-stone-100 dark:bg-zinc-800 rounded-3xl mx-auto flex items-center justify-center mb-8">
                    <Mail className="text-stone-600 dark:text-zinc-300 w-9 h-9" />
                </div>

                {sent ? (
                    <>
                        <h1 className="text-3xl font-serif font-bold mb-3">Email gesendet</h1>
                        <p className="text-stone-500 dark:text-zinc-400 mb-10 text-base font-light">
                            Falls ein Account mit dieser Email existiert, haben wir dir einen Link zum Zurücksetzen geschickt.
                        </p>
                        <Link href="/dashboard">
                            <Button variant="secondary" fullWidth icon={<ArrowLeft className="w-4 h-4" />}>
                                Zurück zum Login
                            </Button>
                        </Link>
                    </>
                ) : (
                    <>
                        <h1 className="text-3xl font-serif font-bold mb-3">Passwort vergessen?</h1>
                        <p className="text-stone-500 dark:text-zinc-400 mb-10 text-base font-light">
                            Gib deine Email-Adresse ein und wir senden dir einen Link zum Zurücksetzen.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4 text-left">
                            <Input
                                type="email"
                                label="Email"
                                placeholder="deine@email.com"
                                icon={<Mail className="w-4 h-4" />}
                                value={email}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                required
                            />
                            <Button type="submit" className="w-full mt-8" loading={loading} fullWidth>
                                Passwort zurücksetzen
                            </Button>
                        </form>

                        <p className="mt-8 text-sm text-stone-500 dark:text-zinc-400">
                            <Link href="/dashboard" className="text-stone-900 dark:text-zinc-100 font-medium hover:underline">
                                Zurück zum Login
                            </Link>
                        </p>
                    </>
                )}
            </FadeIn>
        </div>
    );
}
