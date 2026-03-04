import React, { useState, useMemo } from 'react';
import { ArrowLeft, ShoppingBag, Plus, Trash2 } from 'lucide-react';
import { Item } from '../../types';
import { SALES_CHANNELS } from '../../constants';
import { formatCurrency } from '../../lib/utils';
import { FadeIn } from '../ui/FadeIn';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { CertificateProvider } from '../../types';

interface BulkSellViewProps {
    items: Item[];
    certificateProviders?: CertificateProvider[];
    onConfirm: (data: {
        salePriceEur: number;
        saleDate: string;
        saleChannel: string;
        platformFeesEur: number;
        shippingCostEur: number;
        buyer: string;
        certificates: { provider: string; quantity: number; costEur: number; salePriceEur: number; }[];
    }) => void;
    onCancel: () => void;
}

export const BulkSellView = ({ items, certificateProviders = [], onConfirm, onCancel }: BulkSellViewProps) => {
    const [formData, setFormData] = useState({
        totalPrice: 0,
        saleDate: new Date().toISOString().split('T')[0],
        saleChannel: 'whatnot',
        totalFees: 0,
        totalShipping: 0,
        buyer: ''
    });

    const [certificates, setCertificates] = useState<{ id: string; providerId: string; quantity: number; salePriceEur: number; }[]>([]);

    const addCertificateLine = () => {
        const defaultProvider = certificateProviders.length > 0 ? certificateProviders[0].id : '';
        setCertificates([...certificates, { id: Math.random().toString(), providerId: defaultProvider, quantity: 1, salePriceEur: 0 }]);
    };

    const removeCertificateLine = (id: string) => {
        setCertificates(certificates.filter(c => c.id !== id));
    };

    const updateCertificate = (id: string, field: string, value: any) => {
        setCertificates(certificates.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const count = items.length;

    const distribution = useMemo(() => {
        const pricePerItem = Math.floor((formData.totalPrice * 100) / count) / 100;
        const priceRemainder = Math.round((formData.totalPrice - pricePerItem * count) * 100) / 100;

        const feesPerItem = Math.floor((formData.totalFees * 100) / count) / 100;
        const feesRemainder = Math.round((formData.totalFees - feesPerItem * count) * 100) / 100;

        const shippingPerItem = Math.floor((formData.totalShipping * 100) / count) / 100;
        const shippingRemainder = Math.round((formData.totalShipping - shippingPerItem * count) * 100) / 100;

        return items.map((item, i) => ({
            item,
            price: i === 0 ? pricePerItem + priceRemainder : pricePerItem,
            fees: i === 0 ? feesPerItem + feesRemainder : feesPerItem,
            shipping: i === 0 ? shippingPerItem + shippingRemainder : shippingPerItem,
        }));
    }, [items, formData.totalPrice, formData.totalFees, formData.totalShipping, count]);

    // Calculate total certificates impact on profit
    const totalCertCost = certificates.reduce((sum, cert) => {
        const prov = certificateProviders.find(p => p.id === cert.providerId);
        return sum + ((prov ? prov.unit_cost_eur : 0) * cert.quantity);
    }, 0);
    const totalCertRevenue = certificates.reduce((sum, cert) => sum + (cert.salePriceEur * cert.quantity), 0);

    const totalPurchasePrice = items.reduce((sum, item) => sum + item.purchasePriceEur, 0);
    // Profit = Total Revenue + Cert Revenue - Total Purchase Price - Cert Costs - Fees - Shipping
    const totalProfit = formData.totalPrice + totalCertRevenue - totalPurchasePrice - totalCertCost - formData.totalFees - formData.totalShipping;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm({
            salePriceEur: formData.totalPrice,
            saleDate: formData.saleDate,
            saleChannel: formData.saleChannel,
            platformFeesEur: formData.totalFees,
            shippingCostEur: formData.totalShipping,
            buyer: formData.buyer,
            certificates: certificates.map(c => {
                const prov = certificateProviders.find(p => p.id === c.providerId);
                return {
                    provider: prov ? prov.name : 'Unbekannt',
                    quantity: c.quantity,
                    costEur: prov ? prov.unit_cost_eur : 0,
                    salePriceEur: c.salePriceEur
                };
            })
        });
    };

    return (
        <FadeIn className="bg-[#fafaf9] dark:bg-zinc-950 min-h-screen pb-32 overflow-x-hidden">
            <header className="px-6 py-6 flex items-center justify-between sticky top-0 bg-[#fafaf9]/90 dark:bg-zinc-950/90 backdrop-blur-xl z-20">
                <button onClick={onCancel} className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full bg-white dark:bg-zinc-900 shadow-sm border border-stone-100 dark:border-zinc-800 text-stone-600 dark:text-zinc-400">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="font-serif font-bold text-xl dark:text-zinc-50">Sammelverkauf</h2>
                <div className="w-8"></div>
            </header>

            <form onSubmit={handleSubmit} className="px-6 space-y-10 max-w-lg mx-auto">
                {/* Selected items preview */}
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl shadow-sm border border-stone-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-zinc-500">
                            Ausgewählte Artikel
                        </span>
                        <span className="text-xs font-bold bg-stone-900 dark:bg-zinc-800 text-white px-2.5 py-1 rounded-full">
                            {count} Stk.
                        </span>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {items.map(item => (
                            <div key={item.id} className="flex items-center gap-3 py-1.5">
                                <div className="w-10 h-10 bg-stone-100 dark:bg-zinc-800 rounded-xl flex-shrink-0 relative overflow-hidden">
                                    {item.imageUrls && item.imageUrls[0] ? (
                                        <img src={item.imageUrls[0]} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-stone-300 dark:text-zinc-600">
                                            <ShoppingBag className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-serif font-bold text-sm text-stone-900 dark:text-zinc-50 truncate">{item.brand}</p>
                                    <p className="text-xs text-stone-400 dark:text-zinc-500 truncate">{item.model || item.category}</p>
                                </div>
                                <span className="text-xs font-medium text-stone-500 dark:text-zinc-400">
                                    EK {formatCurrency(item.purchasePriceEur)}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-stone-100 dark:border-zinc-800 flex justify-between items-center">
                        <span className="text-xs font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-widest">
                            Gesamt-EK
                        </span>
                        <span className="font-serif font-bold text-stone-900 dark:text-zinc-50">
                            {formatCurrency(totalPurchasePrice)}
                        </span>
                    </div>
                </div>

                {/* Sale form */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] shadow-sm border border-stone-100 dark:border-zinc-800 space-y-4 overflow-hidden">
                    <Input
                        label="Gesamtpreis (€)"
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        value={formData.totalPrice === 0 ? '' : formData.totalPrice}
                        onChange={(e: any) => setFormData(p => ({ ...p, totalPrice: e.target.value === '' ? 0 : parseFloat(e.target.value) }))}
                        required
                        autoFocus
                    />

                    <Input
                        label="Käufer"
                        type="text"
                        value={formData.buyer}
                        onChange={(e: any) => setFormData(p => ({ ...p, buyer: e.target.value }))}
                        placeholder="Name des Käufers"
                    />

                    <Select
                        label="Verkaufskanal"
                        options={SALES_CHANNELS.map(channel => ({ value: channel, label: channel }))}
                        value={formData.saleChannel}
                        onChange={(e: any) => setFormData(p => ({ ...p, saleChannel: e.target.value }))}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Gebühren (€)"
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            value={formData.totalFees === 0 ? '' : formData.totalFees}
                            onChange={(e: any) => setFormData(p => ({ ...p, totalFees: e.target.value === '' ? 0 : parseFloat(e.target.value) }))}
                        />
                        <Input
                            label="Versand (€)"
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            value={formData.totalShipping === 0 ? '' : formData.totalShipping}
                            onChange={(e: any) => setFormData(p => ({ ...p, totalShipping: e.target.value === '' ? 0 : parseFloat(e.target.value) }))}
                        />
                    </div>

                    <Input
                        label="Verkaufsdatum"
                        type="date"
                        value={formData.saleDate}
                        onChange={(e: any) => setFormData(p => ({ ...p, saleDate: e.target.value }))}
                    />
                </div>

                {/* Price per item breakdown */}
                {formData.totalPrice > 0 && (
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl shadow-sm border border-stone-100 dark:border-zinc-800">
                        <span className="text-xs font-bold uppercase tracking-widest text-stone-400 dark:text-zinc-500 block mb-3">
                            Preisverteilung
                        </span>
                        <div className="space-y-2">
                            {distribution.map(({ item, price }) => (
                                <div key={item.id} className="flex justify-between items-center text-sm">
                                    <span className="text-stone-600 dark:text-zinc-400 truncate pr-2">
                                        {item.brand} {item.model ? `– ${item.model}` : ''}
                                    </span>
                                    <span className="font-bold text-stone-900 dark:text-zinc-50 whitespace-nowrap">
                                        {formatCurrency(price)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

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

                                <div className="grid grid-cols-[1fr,80px] gap-2">
                                    <Select
                                        label="Anbieter"
                                        options={[
                                            { value: '', label: 'Bitte wählen...' },
                                            ...certificateProviders.map(p => ({ value: p.id, label: p.name }))
                                        ]}
                                        value={cert.providerId}
                                        onChange={(e: any) => updateCertificate(cert.id, 'providerId', e.target.value)}
                                    />
                                    <Input
                                        label="Anzahl"
                                        type="number"
                                        value={cert.quantity}
                                        onChange={(e: any) => updateCertificate(cert.id, 'quantity', parseInt(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    <Input
                                        label="Verkaufspreis/Stk (€)"
                                        type="number"
                                        step="0.01"
                                        placeholder="z.B. 25 €"
                                        value={cert.salePriceEur === 0 ? '' : cert.salePriceEur}
                                        onChange={(e: any) => updateCertificate(cert.id, 'salePriceEur', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Profit summary */}
                <div className={`p-6 rounded-[2rem] border transition-colors ${totalProfit >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-500/10 text-red-900 dark:text-red-400 border-red-200 dark:border-red-500/20'}`}>
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-widest opacity-80">Geschätzter Gewinn</span>
                        <span className="text-3xl font-serif font-medium">
                            {formatCurrency(totalProfit)}
                        </span>
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full mt-4"
                    variant="primary"
                >
                    {count} Artikel als verkauft bestätigen
                </Button>
            </form>
        </FadeIn>
    );
};
