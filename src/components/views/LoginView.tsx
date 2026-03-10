import React, { useState } from 'react';
import { ShoppingBag, Loader2 } from 'lucide-react';
import { FadeIn } from '../ui/FadeIn';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/Toast';


export const LoginView = ({ onLogin }: { onLogin: (user: any) => void }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [loginAttempts, setLoginAttempts] = useState(0);
    const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (lockoutUntil && Date.now() < lockoutUntil) {
            const remainingSeconds = Math.ceil((lockoutUntil - Date.now()) / 1000);
            showToast(`Zu viele Versuche. Bitte warte ${remainingSeconds} Sekunden.`, 'error');
            return;
        }

        setLoading(true);

        try {
            if (!supabase) {
                // Fallback for demo/no-supabase mode
                setTimeout(() => {
                    onLogin({ email: 'demo@example.com' });
                    setLoading(false);
                }, 1000);
                return;
            }

            if (isRegistering) {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password
                });

                if (error) {
                    setLoginAttempts(prev => {
                        const newAttempts = prev + 1;
                        if (newAttempts >= 5) {
                            setLockoutUntil(Date.now() + 60 * 1000); // 1 minute lockout
                            return 0;
                        }
                        return newAttempts;
                    });
                    showToast(error.message, 'error');
                } else if (data.session) {
                    setLoginAttempts(0);
                    setLockoutUntil(null);
                    onLogin(data.user);
                } else {
                    setLoginAttempts(0);
                    showToast('Fast geschafft! Bitte überprüfe deine E-Mails, um die Registrierung abzuschließen.', 'success');
                }
                setLoading(false);
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (error) {
                    setLoginAttempts(prev => {
                        const newAttempts = prev + 1;
                        if (newAttempts >= 5) {
                            setLockoutUntil(Date.now() + 60 * 1000);
                            return 0;
                        }
                        return newAttempts;
                    });
                    showToast(error.message, 'error');
                    setLoading(false);
                } else {
                    if (data.user) {
                        setLoginAttempts(0);
                        setLockoutUntil(null);
                        onLogin(data.user);
                    }
                }
            }
        } catch (err: unknown) {
            console.error("LoginView: Unhandled login error:", err);
            showToast("Ein unerwarteter Fehler ist aufgetreten.", "error");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#fafaf9] text-stone-900">
            <FadeIn className="w-full max-w-sm text-center">
                <div className="w-20 h-20 bg-stone-900 rounded-3xl mx-auto flex items-center justify-center mb-8 shadow-2xl shadow-stone-900/20 rotate-3">
                    <ShoppingBag className="text-white w-9 h-9" />
                </div>
                <h1 className="text-4xl font-serif font-bold mb-3">Holy Archive</h1>
                <p className="text-stone-500 mb-10 text-lg font-light">Inventory & Profit Tracking</p>

                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                    <Input
                        type="email"
                        label="Email"
                        placeholder="admin@holyarchive.com"
                        value={email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                        required
                    />
                    <Input
                        type="password"
                        label="Passwort"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        required
                    />
                    <Button type="submit" className="w-full mt-8" disabled={loading}>
                        {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : isRegistering ? 'Account erstellen' : 'Anmelden'}
                    </Button>
                </form>

                <div className="mt-6 text-sm text-stone-500">
                    {isRegistering ? 'Bereits einen Account?' : 'Noch keinen Account?'}
                    <button
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="ml-2 font-bold text-stone-900 hover:text-stone-700 underline"
                        type="button"
                    >
                        {isRegistering ? 'Hier anmelden' : 'Jetzt registrieren'}
                    </button>
                </div>
            </FadeIn>
        </div>
    );
};
