import React, { useState } from 'react';
import { api, mapDbItemToItem } from '../../lib/api/client';
import { ArrowLeft, Edit2, Camera, MapPin, Banknote } from 'lucide-react';
import { FadeIn } from '../ui/FadeIn';
import { useToast } from '../ui/Toast';

export const SellCertificateView = ({
    onSave,
    onCancel,
    currentOrgId
}: {
    onSave: (item: any) => void;
    onCancel: () => void;
    currentOrgId: string | null;
}) => {
    const { showToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form fields
    const [provider, setProvider] = useState('Entrupy');
    const [costEur, setCostEur] = useState('');
    const [salePriceEur, setSalePriceEur] = useState('');
    const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
    const [buyer, setBuyer] = useState('');
    const [saleChannel, setSaleChannel] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentOrgId) {
            showToast('Zertifikat konnte nicht gespeichert werden (Keine Organisation)', 'error');
            return;
        }

        if (!costEur || !salePriceEur || !saleDate) {
            showToast('Bitte fülle alle Pflichtfelder aus', 'error');
            return;
        }

        setIsSubmitting(true);

        try {
            // Create item via API
            const { data: inserted, error: createErr } = await api.createItem({
                brand: provider,
                model: 'Zertifikat',
                category: 'other',
                condition: 'mint',
                purchase_price_eur: parseFloat(costEur),
                purchase_date: saleDate,
                purchase_source: 'Zertifikat Anbieter',
                notes: 'Unabhängiges Zertifikat',
            });

            if (createErr || !inserted) throw new Error(createErr || 'Failed to create item');

            // Mark as sold immediately via API
            const { error: sellErr } = await api.sellItem(inserted.id, {
                sale_price_eur: parseFloat(salePriceEur),
                sale_date: saleDate,
                sale_channel: saleChannel,
                buyer: buyer,
            });

            if (sellErr) throw new Error(sellErr);

            showToast('Zertifikat erfolgreich in Finanzen erfasst!', 'success');

            // Map back to TypeScript Item type to update local state
            onSave(mapDbItemToItem({
                ...inserted,
                status: 'sold',
                sale_price_eur: parseFloat(salePriceEur),
                sale_date: saleDate,
                sale_channel: saleChannel,
                buyer: buyer,
            }));
        } catch (error: any) {
            console.error('Error saving certificate sale:', error);
            showToast('Fehler beim Speichern', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <FadeIn className="min-h-screen bg-[#fafaf9] dark:bg-black pb-32">
            <header className="sticky top-0 z-50 bg-[#fafaf9]/80 dark:bg-black/80 backdrop-blur-xl border-b border-stone-200 dark:border-zinc-800">
                <div className="flex items-center justify-between p-4 max-w-3xl mx-auto">
                    <button
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="font-serif font-bold text-lg text-stone-900 dark:text-zinc-50">Zertifikat verkaufen</h1>
                    <div className="w-10" />
                </div>
            </header>

            <main className="max-w-3xl mx-auto p-6">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Info */}
                    <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-sm border border-stone-200 dark:border-zinc-800 space-y-6">
                        <h2 className="text-sm font-bold text-stone-900 dark:text-zinc-50 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Edit2 className="w-4 h-4 text-emerald-500" />
                            Details
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-zinc-400 mb-2">Anbieter / Marke</label>
                                <input
                                    type="text"
                                    value={provider}
                                    onChange={(e) => setProvider(e.target.value)}
                                    placeholder="z.B. Entrupy"
                                    className="w-full bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors dark:text-zinc-50"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Financials */}
                    <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-sm border border-stone-200 dark:border-zinc-800 space-y-6">
                        <h2 className="text-sm font-bold text-stone-900 dark:text-zinc-50 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Banknote className="w-4 h-4 text-emerald-500" />
                            Finanzen
                        </h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-zinc-400 mb-2">Kosten (€)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={costEur}
                                    onChange={(e) => setCostEur(e.target.value)}
                                    placeholder="15.00"
                                    className="w-full bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-red-500 transition-colors dark:text-zinc-50"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-zinc-400 mb-2">Verkaufspreis (€)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={salePriceEur}
                                    onChange={(e) => setSalePriceEur(e.target.value)}
                                    placeholder="45.00"
                                    className="w-full bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors dark:text-zinc-50"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-zinc-400 mb-2">Verkaufsdatum</label>
                            <input
                                type="date"
                                required
                                value={saleDate}
                                onChange={(e) => setSaleDate(e.target.value)}
                                className="w-full bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors dark:text-zinc-50"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-zinc-400 mb-2">Verkaufskanal (optional)</label>
                                <input
                                    type="text"
                                    value={saleChannel}
                                    onChange={(e) => setSaleChannel(e.target.value)}
                                    placeholder="z.B. Instagram"
                                    className="w-full bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors dark:text-zinc-50"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-zinc-400 mb-2">Käufer (optional)</label>
                                <input
                                    type="text"
                                    value={buyer}
                                    onChange={(e) => setBuyer(e.target.value)}
                                    placeholder="Name des Käufers"
                                    className="w-full bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors dark:text-zinc-50"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg py-4 rounded-2xl shadow-xl shadow-emerald-900/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {isSubmitting ? 'Speichert...' : 'Verkauf abschließen'}
                    </button>

                    {/* Spacer */}
                    <div className="h-8" />
                </form>
            </main>
        </FadeIn>
    );
};
