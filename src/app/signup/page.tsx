'use client';

import React, { useState } from 'react';
import { ShoppingBag, Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { FadeIn } from '../../components/ui/FadeIn';
import { Input } from '../../components/ui/Input';
import { PasswordStrength } from '../../components/ui/PasswordStrength';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function validatePassword(pw: string): string | null {
    if (pw.length < 8) return 'Mindestens 8 Zeichen erforderlich';
    if (!/[A-Z]/.test(pw)) return 'Mindestens ein Grossbuchstabe erforderlich';
    if (!/[0-9]/.test(pw)) return 'Mindestens eine Zahl erforderlich';
    return null;
}

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string }>({});
    const { showToast } = useToast();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        const pwError = validatePassword(password);
        if (pwError) {
            setErrors({ password: pwError });
            return;
        }
        if (password !== confirmPassword) {
            setErrors({ confirm: 'Passwörter stimmen nicht überein' });
            return;
        }

        setLoading(true);
        try {
            if (!supabase) {
                showToast('Supabase nicht konfiguriert', 'error');
                setLoading(false);
                return;
            }

            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) {
                if (error.message.includes('already registered')) {
                    setErrors({ email: 'Diese Email ist bereits registriert' });
                } else {
                    showToast(error.message, 'error');
                }
                setLoading(false);
                return;
            }

            // Store email for verify-email page
            sessionStorage.setItem('signup_email', email);
            router.push('/verify-email');
        } catch (err) {
            console.error('Signup error:', err);
            showToast('Ein unerwarteter Fehler ist aufgetreten.', 'error');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#fafaf9] dark:bg-[#131316]">

            <FadeIn className="w-full max-w-sm">

                {/* Logo */}
                <div className="flex justify-center mb-10">
                    <div className="w-16 h-16 bg-stone-900 dark:bg-zinc-50 rounded-2xl flex items-center justify-center shadow-2xl shadow-stone-900/25 dark:shadow-black/60 rotate-3">
                        <ShoppingBag className="w-8 h-8 text-white dark:text-zinc-900" />
                    </div>
                </div>

                {/* Heading */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-serif font-bold tracking-tight text-stone-900 dark:text-zinc-50 mb-2">
                        Account erstellen
                    </h1>
                    <p className="text-[10px] uppercase tracking-[0.25em] font-semibold text-stone-400 dark:text-zinc-600">
                        Starte mit Holy Archive
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
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                        error={errors.email}
                        required
                    />

                    <div>
                        <div className="relative">
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                label="Passwort"
                                placeholder="Min. 8 Zeichen"
                                icon={<Lock className="w-4 h-4" />}
                                value={password}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                error={errors.password}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-[38px] text-stone-400 hover:text-stone-600 dark:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        <PasswordStrength password={password} />
                    </div>

                    <Input
                        type={showPassword ? 'text' : 'password'}
                        label="Passwort wiederholen"
                        placeholder="Passwort bestätigen"
                        icon={<Lock className="w-4 h-4" />}
                        value={confirmPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                        error={errors.confirm}
                        required
                    />

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-2xl font-semibold text-sm tracking-wide flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none bg-stone-900 dark:bg-zinc-50 text-white dark:text-zinc-900 shadow-xl shadow-stone-900/20 dark:shadow-black/30 hover:bg-black dark:hover:bg-white"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Account erstellen'}
                        </button>
                    </div>
                </form>

                {/* Divider + Sign in */}
                <div className="mt-8 pt-8 border-t border-stone-200 dark:border-zinc-800/60 text-center">
                    <p className="text-sm text-stone-400 dark:text-zinc-600">
                        Bereits einen Account?{' '}
                        <Link
                            href="/signin"
                            className="text-stone-900 dark:text-zinc-200 font-semibold hover:underline underline-offset-2"
                        >
                            Anmelden
                        </Link>
                    </p>
                </div>

            </FadeIn>
        </div>
    );
}
