import Image from 'next/image';
import React, { useState } from 'react';
import { ArrowLeft, ShoppingBag, Plus, Trash2 } from 'lucide-react';
import { Item } from '../../types';
import { SALES_CHANNELS } from '../../constants';
import { formatCurrency } from '../../lib/utils';
import { FadeIn } from '../ui/FadeIn';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { CertificateProvider } from '../../types';
import { validatePrice, validateDateNotFuture, ValidationError } from '../../lib/validation';
import { useToast } from '../ui/Toast';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';

export const SellItemView = ({ item, certificateProviders = [], onConfirm, onCancel }: { item: Item, certificateProviders?: CertificateProvider[], onConfirm: (data: Partial<Item>, certSalePrices?: Record<string, number>, standaloneCertificates?: { provider: string; quantity: number; costEur: number; salePriceEur: number; }[]) => void, onCancel: () => void }) => {
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        salePriceEur: 0,
        saleDate: new Date().toISOString().split('T')[0],
        saleChannel: 'whatnot',
        platformFeesEur: 0,
        shippingCostEur: 0
    });
    const [certSalePrices, setCertSalePrices] = useState<Record<string, number>>(() => {
        const initial: Record<string, number> = {};
        if (item.certificates) {
            item.certificates.forEach(c => {
                initial[c.id] = c.provider?.name?.toLowerCase().includes('entrupy') ? 20 : (c.cost_eur || 0);
            });
        }
        return initial;
    });

    const [certificates, setCertificates] = useState<{ id: string; providerId: string; salePriceEur: number; }[]>([]);

    const addCertificateLine = () => {
        const defaultProvider = certificateProviders.length > 0 ? certificateProviders[0].id : '';
        setCertificates([...certificates, { id: Math.random().toString(), providerId: defaultProvider, salePriceEur: 0 }]);
    };

    const removeCertificateLine = (id: string) => {
        setCertificates(certificates.filter(c => c.id !== id));
    };

    const updateCertificate = (id: string, field: string, value: string | number) => {
        setCertificates(certificates.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    // Total certificate sale price to deduct from the main item's revenue to calculate main profit
    const totalCertRevenue = Object.values(certSalePrices).reduce((sum, val) => sum + (val || 0), 0);
    const standaloneCertCost = certificates.reduce((sum, cert) => {
        const prov = certificateProviders.find(p => p.id === cert.providerId);
        return sum + (prov ? prov.unit_cost_eur : 0);
    }, 0);
    const standaloneCertRevenue = certificates.reduce((sum, cert) => sum + (cert.salePriceEur), 0);

    // Profit of the main item = Total Revenue - Cert Revenue - Item Purchase Cost - Fees - Shipping
    // Plus standalone cert revenue, minus standalone cert costs
    const profit = formData.salePriceEur - totalCertRevenue - item.purchasePriceEur - formData.platformFeesEur - formData.shippingCostEur + standaloneCertRevenue - standaloneCertCost;

    const isDirty = formData.salePriceEur > 0 || formData.platformFeesEur > 0 || formData.shippingCostEur > 0;
    useUnsavedChanges(isDirty);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        try {
            validatePrice(formData.salePriceEur, 'Verkaufspreis');
            validatePrice(formData.platformFeesEur, 'Plattformgebühren');
            validatePrice(formData.shippingCostEur, 'Versandkosten');
            validateDateNotFuture(formData.saleDate, 'Verkaufsdatum');

            Object.values(certSalePrices).forEach(price => validatePrice(price, 'Zertifikat Verkaufspreis'));
            certificates.forEach(cert => validatePrice(cert.salePriceEur, 'Zertifikat Verkaufspreis'));
        } catch (error) {
            if (error instanceof ValidationError) {
                showToast(error.message, 'error');
                return;
            }
        }

        const formattedCerts = certificates.map(c => {
            const prov = certificateProviders.find(p => p.id === c.providerId);
            return {
                provider: prov ? prov.name : 'Unbekannt',
                quantity: 1, // Always 1 for single sell
                costEur: prov ? prov.unit_cost_eur : 0,
                salePriceEur: c.salePriceEur
            };
        });
        onConfirm(formData, certSalePrices, formattedCerts);
    };

    return (
        <FadeIn className="bg-[#fafaf9] dark:bg-black min-h-screen pb-safe">
            <header className="px-6 py-6 flex items-center justify-between sticky top-0 bg-[#fafaf9]/90 dark:bg-black/90 backdrop-blur-xl z-20">
                <button onClick={onCancel} className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full bg-white dark:bg-zinc-900 shadow-sm border border-stone-100 dark:border-zinc-800 text-stone-600 dark:text-zinc-400">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="font-serif font-bold text-xl dark:text-zinc-50">Verkauf erfassen</h2>
                <div className="w-8"></div>
            </header>

            <form onSubmit={handleSubmit} className="px-6 space-y-6 max-w-lg mx-auto">
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl flex items-center shadow-sm border border-stone-100 dark:border-zinc-800">
                    <div className="w-16 h-16 bg-stone-100 dark:bg-zinc-800 rounded-2xl mr-4 flex items-center justify-center relative overflow-hidden">
                        {item.imageUrls && item.imageUrls[0] ? <Image src={item.imageUrls[0]} alt={item.model || ''} fill sizes="64px" className="object-cover" /> : <ShoppingBag className="w-6 h-6 text-stone-300 dark:text-zinc-600" />}
                    </div>
                    <div>
                        <div className="font-serif font-bold text-lg dark:text-zinc-50">{item.brand}</div>
                        <div className="text-sm text-stone-500 dark:text-zinc-400">{item.model}</div>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] shadow-sm border border-stone-100 dark:border-zinc-800">
                    <Input
                        label="Verkaufspreis (€)"
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        value={formData.salePriceEur === 0 ? '' : formData.salePriceEur}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormData(p => ({ ...p, salePriceEur: e.target.value === '' ? 0 : parseFloat(e.target.value) }))}
                        required
                        autoFocus
                    />

                    <Select
                        label="Verkaufskanal"
                        options={SALES_CHANNELS.map(channel => ({ value: channel, label: channel }))}
                        value={formData.saleChannel}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormData(p => ({ ...p, saleChannel: e.target.value }))}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Gebühren (€)"
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            value={formData.platformFeesEur === 0 ? '' : formData.platformFeesEur}
                            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormData(p => ({ ...p, platformFeesEur: e.target.value === '' ? 0 : parseFloat(e.target.value) }))}
                        />
                        <Input
                            label="Versand (€)"
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            value={formData.shippingCostEur === 0 ? '' : formData.shippingCostEur}
                            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormData(p => ({ ...p, shippingCostEur: e.target.value === '' ? 0 : parseFloat(e.target.value) }))}
                        />
                    </div>

                    <Input
                        label="Verkaufsdatum"
                        type="date"
                        value={formData.saleDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormData(p => ({ ...p, saleDate: e.target.value }))}
                    />

                    {/* Certificate Sale Prices */}
                    {item.certificates && item.certificates.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-stone-100">
                            <h4 className="text-sm font-bold text-stone-900 mb-3">Davon für Zertifikate</h4>
                            <div className="space-y-4">
                                {item.certificates.map(cert => (
                                    <Input
                                        key={cert.id}
                                        label={`${cert.provider?.name || 'Zertifikat'} Verkaufspreis (€)`}
                                        type="number"
                                        inputMode="decimal"
                                        step="0.01"
                                        value={certSalePrices[cert.id] === 0 ? '' : certSalePrices[cert.id]}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setCertSalePrices(p => ({ ...p, [cert.id]: e.target.value === '' ? 0 : parseFloat(e.target.value) }))}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Certificates */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] shadow-sm border border-stone-100 dark:border-zinc-800 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-zinc-500">
                            Zusätzliche Zertifikate
                        </span>
                        <button
                            type="button"
                            onClick={addCertificateLine}
                            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:text-emerald-700 transition-colors"
                        >
                            <Plus className="w-3 h-3" /> Hinzufügen
                        </button>
                    </div>

                    {certificates.length === 0 && (
                        <p className="text-sm text-stone-400 dark:text-zinc-500 italic text-center py-2">Keine Zertifikate ausgewählt.</p>
                    )}

                    <div className="space-y-4">
                        {certificates.map((cert) => (
                            <div key={cert.id} className="relative p-4 rounded-2xl bg-stone-50 dark:bg-zinc-950 border border-stone-100 dark:border-zinc-800 space-y-3">
                                <button
                                    type="button"
                                    onClick={() => removeCertificateLine(cert.id)}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-full flex items-center justify-center text-red-500 hover:scale-110 transition-transform shadow-sm"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>

                                <div className="grid grid-cols-1 sm:grid-cols-[1fr,120px] gap-2">
                                    <Select
                                        label="Anbieter"
                                        options={[
                                            { value: '', label: 'Bitte wählen...' },
                                            ...certificateProviders.map(p => ({ value: p.id, label: p.name }))
                                        ]}
                                        value={cert.providerId}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => updateCertificate(cert.id, 'providerId', e.target.value)}
                                    />
                                    <Input
                                        label="Verkaufspreis (€)"
                                        type="number"
                                        step="0.01"
                                        placeholder="z.B. 25 €"
                                        value={cert.salePriceEur === 0 ? '' : cert.salePriceEur}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => updateCertificate(cert.id, 'salePriceEur', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={`p-6 rounded-[2rem] border transition-colors ${profit >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-500/10 text-red-900 dark:text-red-400 border-red-200 dark:border-red-500/20'}`}>
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-widest opacity-80">Geschätzter Gewinn</span>
                        <span className="text-3xl font-serif font-medium">
                            {formatCurrency(profit)}
                        </span>
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full mt-4"
                    variant="primary"
                >
                    Als Verkauft bestätigen
                </Button>
            </form>
        </FadeIn>
    );
};
