import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { FadeIn } from '../../components/ui/FadeIn';

export const metadata = {
    title: 'AGB | Holy-Archive',
    description: 'Allgemeine Geschäftsbedingungen für Holy-Archive.',
};

export default function AGBPage() {
    return (
        <FadeIn className="min-h-screen bg-[#fafaf9] dark:bg-black font-sans text-stone-900 dark:text-zinc-50 pb-20">
            <header className="sticky top-0 z-50 bg-[#fafaf9]/80 dark:bg-black/80 backdrop-blur-xl border-b border-stone-200 dark:border-zinc-800">
                <div className="flex items-center p-4 max-w-4xl mx-auto">
                    <Link href="/" className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="flex-1 text-center font-serif font-bold text-lg mr-10">AGB</h1>
                </div>
            </header>

            <main className="max-w-3xl mx-auto p-6 mt-8">
                <div className="prose prose-stone dark:prose-invert max-w-none">
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-500 p-4 rounded-xl mb-8 font-bold text-sm">
                        [TODO: Rechtsanwalt konsultieren — Dies ist ein Platzhalter und rechtlich nicht bindend.]
                    </div>
                    
                    <h1>Allgemeine Geschäftsbedingungen (AGB)</h1>
                    <p>Stand: {new Date().toLocaleDateString('de-DE')}</p>

                    <h2>1. Geltungsbereich</h2>
                    <p>Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge über die Nutzung der Holy-Archive SaaS App...</p>

                    <h2>2. Vertragsschluss</h2>
                    <p>Der Vertrag kommt mit der Registrierung und der Auswahl eines entsprechenden Plans zustande...</p>

                    <h2>3. Leistungen und Preise</h2>
                    <p>Die aktuellen Funktionen und Preise der Pläne ("Free", "Starter", "Professional") sind der Website zu entnehmen...</p>

                    <h2>4. Pflichten des Nutzers</h2>
                    <p>Der Nutzer verpflichtet sich, seine Zugangsdaten geheim zu halten und das System nicht missbräuchlich zu nutzen...</p>

                    <h2>5. Laufzeit und Kündigung</h2>
                    <p>Abonnements haben in der Regel eine Mindestlaufzeit von einem Monat und können jederzeit zum Periodenende gekündigt werden...</p>
                    
                    <h2>6. Haftung</h2>
                    <p>Die Haftung für leicht fahrlässige Pflichtverletzungen ist ausgeschlossen...</p>
                </div>
            </main>
        </FadeIn>
    );
}
