import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { FadeIn } from '../../components/ui/FadeIn';

export const metadata = {
    title: 'Datenschutzerklärung | Holy-Archive',
    description: 'Datenschutzerklärung für Holy-Archive.',
};

export default function DatenschutzPage() {
    return (
        <FadeIn className="min-h-screen bg-[#fafaf9] dark:bg-black font-sans text-stone-900 dark:text-zinc-50 pb-20">
            <header className="sticky top-0 z-50 bg-[#fafaf9]/80 dark:bg-black/80 backdrop-blur-xl border-b border-stone-200 dark:border-zinc-800">
                <div className="flex items-center p-4 max-w-4xl mx-auto">
                    <Link href="/" className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="flex-1 text-center font-serif font-bold text-lg mr-10">Datenschutz</h1>
                </div>
            </header>

            <main className="max-w-3xl mx-auto p-6 mt-8">
                <div className="prose prose-stone dark:prose-invert max-w-none">
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-500 p-4 rounded-xl mb-8 font-bold text-sm">
                        [TODO: Rechtsanwalt konsultieren — Dies ist ein Platzhalter und rechtlich nicht bindend.]
                    </div>
                    
                    <h1>Datenschutzerklärung</h1>
                    <p>Stand: {new Date().toLocaleDateString('de-DE')}</p>

                    <h2>1. Datenschutz auf einen Blick</h2>
                    <h3>Allgemeine Hinweise</h3>
                    <p>Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen...</p>

                    <h2>2. Hosting und Content Delivery Networks (CDN)</h2>
                    <p>Wir hosten unsere App und Datenbank auf Vercel und Supabase...</p>

                    <h2>3. Datenerfassung auf dieser Website</h2>
                    <h3>Cookies</h3>
                    <p>Unsere Internetseiten verwenden teilweise sogenannte „Cookies“...</p>

                    <h2>4. Analyse-Tools und Werbung</h2>
                    <p>Derzeit verwenden wir Vercel Analytics und Posthog für grundlegende App-Statistiken...</p>

                    <h2>5. Plugins und Tools</h2>
                    <p>Zahlungsabwicklung via Stripe...</p>
                </div>
            </main>
        </FadeIn>
    );
}
