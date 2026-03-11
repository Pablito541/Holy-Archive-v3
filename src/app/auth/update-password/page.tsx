'use client';

import React, { useState } from 'react';
import { ShoppingBag, Lock, Eye, EyeOff } from 'lucide-react';
import { FadeIn } from '../../../components/ui/FadeIn';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { PasswordStrength } from '../../../components/ui/PasswordStrength';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../components/ui/Toast';
import { useRouter } from 'next/navigation';

function validatePassword(pw: string): string | null {
    if (pw.length < 8) return 'Mindestens 8 Zeichen erforderlich';
    if (!/[A-Z]/.test(pw)) return 'Mindestens ein Grossbuchstabe erforderlich';
    if (!/[0-9]/.test(pw)) return 'Mindestens eine Zahl erforderlich';
    return null;
}

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
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

            const { error } = await supabase.auth.updateUser({ password });

            if (error) {
                showToast(error.message, 'error');
                setLoading(false);
                return;
            }

            showToast('Passwort erfolgreich geändert', 'success');
            router.push('/dashboard');
        } catch {
            showToast('Ein unerwarteter Fehler ist aufgetreten.', 'error');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#fafaf9] dark:bg-zinc-950 text-stone-900 dark:text-zinc-100">
            <FadeIn className="w-full max-w-sm text-center">
                <div className="w-20 h-20 bg-stone-900 dark:bg-zinc-50 rounded-3xl mx-auto flex items-center justify-center mb-8 shadow-2xl shadow-stone-900/20 rotate-3">
                    <ShoppingBag className="text-white dark:text-zinc-900 w-9 h-9" />
                </div>
                <h1 className="text-3xl font-serif font-bold mb-3">Neues Passwort</h1>
                <p className="text-stone-500 dark:text-zinc-400 mb-10 text-base font-light">Wähle ein neues Passwort für deinen Account</p>

                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                    <div>
                        <div className="relative">
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                label="Neues Passwort"
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
                                className="absolute right-4 top-[38px] text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300"
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
                    <Button type="submit" className="w-full mt-8" loading={loading} fullWidth>
                        Passwort ändern
                    </Button>
                </form>
            </FadeIn>
        </div>
    );
}
