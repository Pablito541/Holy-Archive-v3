import Image from 'next/image';
import React, { useState } from 'react';
import { X, ArrowLeft, ZoomIn, Trash2, ShoppingBag, Edit2, RotateCcw, ShieldCheck } from 'lucide-react';
import { Item, Condition } from '../../types';
import { calculateProfit, formatCurrency, formatDate, conditionLabels } from '../../lib/utils';
import { OrgRole, canDelete, canSellItems, canEditItems } from '../../lib/roles';
import { FadeIn } from '../ui/FadeIn';
import { Button } from '../ui/Button';
import { QrCodeSection } from '../ui/QrCodeSection';

export const ItemDetailView = ({ userRole, item, onBack, onSell, onDelete, onCancelSale, onEdit }: {
    userRole?: OrgRole | null,
    item: Item,
    onBack: () => void,
    onSell: () => void,
    onDelete: () => void,
    onCancelSale?: () => void,
    onEdit?: () => void
}) => {
    const profit = calculateProfit(item);
    const roi = item.purchasePriceEur ? ((profit || 0) / item.purchasePriceEur) * 100 : 0;
    const [isImageOpen, setIsImageOpen] = useState(false);

    return (
        <FadeIn className="bg-white dark:bg-zinc-950 min-h-screen pb-safe relative">
            {isImageOpen && (
                <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setIsImageOpen(false)}>
                    <button className="absolute top-6 right-6 text-white bg-black/50 p-2 rounded-full backdrop-blur-md">
                        <X className="w-6 h-6" />
                    </button>
                    {item.imageUrls && item.imageUrls[0] && (
                        <div className="relative w-full h-full max-w-5xl max-h-[85vh]">
                            <Image src={item.imageUrls[0]} alt={item.model || 'Item'} fill sizes="100vw" className="object-contain rounded-lg shadow-2xl" />
                        </div>
                    )}
                </div>
            )}

            <div className={`relative h-[40vh] bg-stone-100 dark:bg-zinc-900 group ${(item.imageUrls && item.imageUrls.length > 0) ? 'cursor-zoom-in' : ''}`} onClick={() => (item.imageUrls && item.imageUrls.length > 0) ? setIsImageOpen(true) : undefined}>
                {item.imageUrls && item.imageUrls.length > 0 ? (
                    <Image src={item.imageUrls[0]} alt={item.model || 'Item'} fill priority sizes="100vw" className="object-cover" />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-300 dark:text-zinc-700">
                        <ShoppingBag className="w-20 h-20 opacity-30 mb-4" />
                        <span className="font-serif text-lg">Kein Bild vorhanden</span>
                    </div>
                )}

                <header className="absolute inset-x-0 top-0 px-6 py-6 flex items-center justify-between z-20 pointer-events-none">
                    <button onClick={onBack} className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md shadow-sm border border-stone-200 dark:border-zinc-700 text-stone-900 dark:text-white active:scale-90 transition-transform pointer-events-auto">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex gap-2 pointer-events-auto">
                        {onEdit && canEditItems(userRole) && (
                            <button onClick={onEdit} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md shadow-sm border border-stone-200 dark:border-zinc-700 text-stone-900 dark:text-white active:scale-90 transition-transform">
                                <Edit2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </header>
                {item.imageUrls && item.imageUrls.length > 0 && (
                    <div className="absolute bottom-12 right-6 bg-black/40 text-white px-2 py-1 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <ZoomIn className="w-4 h-4" />
                    </div>
                )}
            </div>

            <div className="px-8 py-10 -mt-10 bg-white dark:bg-zinc-950 rounded-t-[2.5rem] relative z-0 space-y-8 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-none">

                <div className="text-center">
                    <h2 className="text-4xl font-serif font-bold text-stone-900 dark:text-white mb-1">{item.brand}</h2>
                    <p className="text-lg text-stone-500 dark:text-zinc-400 font-light mb-1">{item.model || item.category}</p>
                    <span className="inline-block font-mono text-xs text-stone-400 dark:text-zinc-500 tracking-wider">#{item.id.substring(0, 8).toUpperCase()}</span>
                </div>

                {item.status === 'sold' && (
                    <div className="p-6 bg-stone-900 dark:bg-zinc-800 text-stone-50 dark:text-white rounded-3xl relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-4 opacity-80 text-sm">
                                <span>Verkauf am {formatDate(item.saleDate || '')}</span>
                                <div>
                                    <span className="mr-3">{item.saleChannel}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-end border-t border-white/20 pt-4">
                                <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Reingewinn</span>
                                <div className="text-right">
                                    <span className="block text-3xl font-serif">{formatCurrency(profit || 0)}</span>
                                    <span className="text-sm font-bold text-emerald-400">{roi.toFixed(0)}% ROI</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-stone-50 dark:bg-zinc-900 rounded-2xl border border-stone-200 dark:border-zinc-800">
                        <p className="text-[10px] font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Einkaufspreis</p>
                        <p className="font-mono text-lg font-semibold text-stone-900 dark:text-white">{formatCurrency(item.purchasePriceEur)}</p>
                    </div>
                    <div className="p-5 bg-stone-50 dark:bg-zinc-900 rounded-2xl border border-stone-200 dark:border-zinc-800">
                        <p className="text-[10px] font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Quelle</p>
                        <p className="font-medium text-stone-900 dark:text-white truncate">{item.purchaseSource}</p>
                    </div>
                    <div className="p-5 bg-stone-50 dark:bg-zinc-900 rounded-2xl border border-stone-200 dark:border-zinc-800">
                        {item.status === 'sold' ? (
                            <>
                                <p className="text-[10px] font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Verkaufspreis</p>
                                <p className="font-mono text-lg font-semibold text-stone-900 dark:text-white">{formatCurrency(item.salePriceEur || 0)}</p>
                            </>
                        ) : (
                            <>
                                <p className="text-[10px] font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Zustand</p>
                                <p className="font-medium capitalize text-stone-900 dark:text-white">{conditionLabels[item.condition as Condition] || item.condition}</p>
                            </>
                        )}
                    </div>
                    <div className="p-5 bg-stone-50 dark:bg-zinc-900 rounded-2xl border border-stone-200 dark:border-zinc-800">
                        <p className="text-[10px] font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Kaufdatum</p>
                        <p className="font-medium text-stone-900 dark:text-white">{formatDate(item.purchaseDate)}</p>
                    </div>
                </div>

                {item.certificates && item.certificates.length > 0 && (
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/20">
                        <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4" />
                            Zertifikate & Services
                        </h3>
                        <div className="space-y-3">
                            {item.certificates.map(cert => (
                                <div key={cert.id} className="flex justify-between items-center text-sm">
                                    <span className="font-medium text-emerald-900 dark:text-emerald-100">
                                        {cert.provider?.name || 'Unbekanntes Zertifikat'}
                                    </span>
                                    <span className="font-mono text-emerald-700 dark:text-emerald-400">
                                        {formatCurrency(cert.cost_eur)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {item.notes && (
                    <div>
                        <h3 className="text-xs font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-3 ml-1">Notizen</h3>
                        <p className="text-stone-600 dark:text-zinc-400 text-sm leading-relaxed bg-stone-50 dark:bg-zinc-900 p-5 rounded-2xl border border-stone-200 dark:border-zinc-800">
                            {item.notes}
                        </p>
                    </div>
                )}

                <QrCodeSection itemId={item.id} brand={item.brand} model={item.model} />

                <div className="pt-4 space-y-4 pb-12">
                    {item.status !== 'sold' && canSellItems(userRole) && (
                        <button onClick={onSell} className="w-full px-6 py-3.5 rounded-2xl font-medium flex items-center justify-center gap-2 text-sm tracking-wide bg-emerald-600 text-white shadow-xl shadow-emerald-900/20 hover:bg-emerald-500 hover:shadow-2xl transition-all duration-300 active:scale-[0.98]">
                            Verkauf erfassen
                        </button>
                    )}

                    {item.status === 'sold' && onCancelSale && canEditItems(userRole) && (
                        <button onClick={onCancelSale} className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-medium text-amber-500 hover:text-amber-300 transition-colors active:scale-[0.98]">
                            <RotateCcw className="w-4 h-4" />
                            Verkauf stornieren
                        </button>
                    )}

                    {canDelete(userRole) && (
                        <button onClick={onDelete} className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-medium text-red-400 hover:text-red-300 transition-colors active:scale-[0.98]">
                            <Trash2 className="w-4 h-4" />
                            Artikel aus Datenbank löschen
                        </button>
                    )}
                </div>
            </div>
        </FadeIn>
    );
};
