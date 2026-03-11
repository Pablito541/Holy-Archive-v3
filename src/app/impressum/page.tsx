import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { FadeIn } from '../../components/ui/FadeIn';

export const metadata = {
    title: 'Impressum | Holy-Archive',
    description: 'Impressum für Holy-Archive.',
};

export default function ImpressumPage() {
    return (
        <FadeIn className="min-h-screen bg-[#fafaf9] dark:bg-black font-sans text-stone-900 dark:text-zinc-50 pb-20">
            <header className="sticky top-0 z-50 bg-[#fafaf9]/80 dark:bg-black/80 backdrop-blur-xl border-b border-stone-200 dark:border-zinc-800">
                <div className="flex items-center p-4 max-w-4xl mx-auto">
                    <Link href="/" className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="flex-1 text-center font-serif font-bold text-lg mr-10">Impressum</h1>
                </div>
            </header>

            <main className="max-w-3xl mx-auto p-6 mt-8">
                <div className="prose prose-stone dark:prose-invert max-w-none">
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-500 p-4 rounded-xl mb-8 font-bold text-sm">
                        [TODO: Rechtsanwalt konsultieren — Dies ist ein Platzhalter und rechtlich nicht bindend.]
                    </div>
                    
                    <h1>Impressum</h1>

                    <h2>Angaben gemäß § 5 TMG</h2>
                    <p>
                        Max Mustermann<br />
                        Holy Archive SaaS<br />
                        Musterstraße 1<br />
                        12345 Musterstadt
                    </p>

                    <h2>Kontakt</h2>
                    <p>
                        Telefon: +49 (0) 123 44 55 66<br />
                        E-Mail: info@holy-archive.com
                    </p>

                    <h2>Umsatzsteuer-ID</h2>
                    <p>
                        Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:<br />
                        DE999999999
                    </p>

                    <h2>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
                    <p>
                        Max Mustermann<br />
                        Musterstraße 1<br />
                        12345 Musterstadt
                    </p>
                </div>
            </main>
        </FadeIn>
    );
}
