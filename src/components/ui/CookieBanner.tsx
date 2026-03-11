'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Shield, X } from 'lucide-react';
import Link from 'next/link';

export const CookieBanner = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [preferences, setPreferences] = useState({
        essential: true, // Always true
        analytics: false,
    });

    useEffect(() => {
        // Check if user has already made a choice
        const consent = localStorage.getItem('holy-archive-cookie-consent');
        if (!consent) {
            setIsVisible(true);
        } else {
            try {
                setPreferences(JSON.parse(consent));
            } catch (e) {
                // Invalid JSON
                setIsVisible(true);
            }
        }
    }, []);

    const handleAcceptAll = () => {
        const prefs = { essential: true, analytics: true };
        localStorage.setItem('holy-archive-cookie-consent', JSON.stringify(prefs));
        setPreferences(prefs);
        setIsVisible(false);
        // Here you would initialize analytics (e.g. Posthog, Vercel Analytics)
        window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: prefs }));
    };

    const handleAcceptEssential = () => {
        const prefs = { essential: true, analytics: false };
        localStorage.setItem('holy-archive-cookie-consent', JSON.stringify(prefs));
        setPreferences(prefs);
        setIsVisible(false);
        window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: prefs }));
    };

    const handleSavePreferences = () => {
        localStorage.setItem('holy-archive-cookie-consent', JSON.stringify(preferences));
        setIsVisible(false);
        window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: preferences }));
    };

    if (!isVisible) return null;

    if (showOptions) {
        return (
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-stone-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2rem] shadow-2xl border border-stone-200 dark:border-zinc-800 overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
                    <div className="p-6 border-b border-stone-100 dark:border-zinc-800 flex justify-between items-center">
                        <div>
                            <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-zinc-50 flex items-center gap-2">
                                <Settings className="w-5 h-5" /> Cookie-Einstellungen
                            </h2>
                            <p className="text-sm text-stone-500 dark:text-zinc-400 mt-1">Passen Sie Ihre Präferenzen an.</p>
                        </div>
                        <button onClick={() => setShowOptions(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 dark:bg-zinc-800 text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Essential */}
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="font-bold text-stone-900 dark:text-zinc-50">Notwendig</h3>
                                <p className="text-sm text-stone-500 dark:text-zinc-400 mt-1 leading-relaxed">
                                    Diese Cookies sind für das Funktionieren der Anwendung zwingend erforderlich (z.B. Session, RLS-Auth, Sicherheit).
                                </p>
                            </div>
                            <div className="shrink-0 mt-1">
                                <div className="w-11 h-6 bg-emerald-500 rounded-full relative opacity-50 cursor-not-allowed">
                                    <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1" />
                                </div>
                            </div>
                        </div>

                        {/* Analytics */}
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="font-bold text-stone-900 dark:text-zinc-50">Analyse & Performance</h3>
                                <p className="text-sm text-stone-500 dark:text-zinc-400 mt-1 leading-relaxed">
                                    Helfen uns zu verstehen, wie die App genutzt wird, um das Erlebnis zu verbessern.
                                </p>
                            </div>
                            <button
                                onClick={() => setPreferences(prev => ({ ...prev, analytics: !prev.analytics }))}
                                className="shrink-0 mt-1 group focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-full"
                            >
                                <div className={`w-11 h-6 rounded-full relative transition-colors ${preferences.analytics ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-zinc-700'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${preferences.analytics ? 'translate-x-6' : 'translate-x-1'}`} />
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="p-6 bg-stone-50 dark:bg-zinc-950 border-t border-stone-100 dark:border-zinc-800">
                        <button
                            onClick={handleSavePreferences}
                            className="w-full bg-stone-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-bold py-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all"
                        >
                            Einstellungen speichern
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6 pointer-events-none">
            <div className="max-w-4xl mx-auto pointer-events-auto">
                <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-stone-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl shadow-stone-900/10 dark:shadow-black/50 animate-in slide-in-from-bottom-8 duration-500">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="flex-1">
                            <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-zinc-50 flex items-center gap-2 mb-2">
                                <Shield className="w-5 h-5 text-emerald-500" /> Wir schätzen Ihre Privatsphäre
                            </h2>
                            <p className="text-sm text-stone-600 dark:text-zinc-400 leading-relaxed">
                                Wir verwenden Cookies, um die grundlegende Funktionalität der App sicherzustellen und das Nutzererlebnis zu verbessern. Sie können wählen, welche Cookies Sie zulassen möchten. Weitere Informationen finden Sie in unserer <Link href="/datenschutz" className="underline hover:text-stone-900 dark:hover:text-zinc-50 transition-colors">Datenschutzerklärung</Link>.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto shrink-0">
                            <button
                                onClick={() => setShowOptions(true)}
                                className="px-5 py-3 text-sm font-bold text-stone-700 dark:text-zinc-300 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 rounded-xl transition-colors w-full sm:w-auto text-center"
                            >
                                Anpassen
                            </button>
                            <button
                                onClick={handleAcceptEssential}
                                className="px-5 py-3 text-sm font-bold border border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800 rounded-xl transition-colors w-full sm:w-auto text-center"
                            >
                                Nur Notwendige
                            </button>
                            <button
                                onClick={handleAcceptAll}
                                className="px-6 py-3 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-600/20 active:scale-95 transition-all w-full sm:w-auto text-center"
                            >
                                Alle Akzeptieren
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
