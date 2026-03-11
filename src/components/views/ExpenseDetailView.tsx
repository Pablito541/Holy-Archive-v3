import Image from 'next/image';
import React, { useState } from 'react';
import { ArrowLeft, Edit2, Trash2, X, Receipt, Repeat } from 'lucide-react';
import { Expense } from '../../types';
import { FadeIn } from '../ui/FadeIn';

export const ExpenseDetailView = ({ expense, categoryName, onBack, onEdit, onDelete }: {
    expense: Expense,
    categoryName: string,
    onBack: () => void,
    onEdit: () => void,
    onDelete: () => void
}) => {
    const [isImageOpen, setIsImageOpen] = useState(false);

    // Format date beautifully
    const dateObj = new Date(expense.date);
    const formattedDate = dateObj.toLocaleDateString('de-DE', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });

    const intervalLabels: Record<string, string> = {
        'monthly': 'Monatlich',
        'quarterly': 'Quartalsweise',
        'semi_annually': 'Halbjährlich',
        'yearly': 'Jährlich'
    };

    const isPdf = expense.receipt_image_url?.toLowerCase().endsWith('.pdf');

    const handleReceiptClick = () => {
        if (!expense.receipt_image_url) return;
        if (isPdf) {
            window.open(expense.receipt_image_url, '_blank');
        } else {
            setIsImageOpen(true);
        }
    };

    return (
        <FadeIn className="bg-white dark:bg-zinc-950 min-h-screen pb-safe relative">
            {isImageOpen && expense.receipt_image_url && (
                <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setIsImageOpen(false)}>
                    <button className="absolute top-6 right-6 text-white bg-black/50 p-2 rounded-full backdrop-blur-md">
                        <X className="w-6 h-6" />
                    </button>
                    <div className="relative w-full h-full max-w-5xl max-h-[85vh]">
                        <Image src={expense.receipt_image_url} alt="Beleg Vollbild" fill sizes="100vw" className="object-contain rounded-lg shadow-2xl" />
                    </div>
                </div>
            )}

            <div className={`relative h-[30vh] bg-stone-100 dark:bg-zinc-900 group ${expense.receipt_image_url ? (isPdf ? 'cursor-pointer' : 'cursor-zoom-in') : ''}`} onClick={handleReceiptClick}>
                {expense.receipt_image_url ? (
                    isPdf ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-400 dark:text-zinc-500 bg-stone-200 dark:bg-zinc-800/80">
                            <Receipt className="w-16 h-16 opacity-40 mb-3" />
                            <span className="font-bold text-sm">PDF Beleg ansehen</span>
                        </div>
                    ) : (
                        <Image src={expense.receipt_image_url} alt="Beleg Vorschau" fill sizes="100vw" className="object-cover" />
                    )
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-300 dark:text-zinc-700">
                        <Receipt className="w-20 h-20 opacity-30 mb-4" />
                        <span className="font-serif text-lg">Kein Beleg vorhanden</span>
                    </div>
                )}

                <header className="absolute inset-x-0 top-0 px-6 py-6 flex items-center justify-between z-20 pointer-events-none">
                    <button onClick={onBack} className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md shadow-sm border border-stone-200 dark:border-zinc-700 text-stone-900 dark:text-white active:scale-90 transition-transform pointer-events-auto">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex gap-2 pointer-events-auto">
                        <button onClick={onEdit} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md shadow-sm border border-stone-200 dark:border-zinc-700 text-stone-900 dark:text-white active:scale-90 transition-transform">
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={onDelete} className="w-10 h-10 flex items-center justify-center rounded-full bg-red-50/90 dark:bg-red-900/30 backdrop-blur-md shadow-sm border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 active:scale-90 transition-transform">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </header>
            </div>

            <div className="px-8 py-10 -mt-10 bg-white dark:bg-zinc-950 rounded-t-[2.5rem] relative z-0 space-y-8 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-none min-h-[70vh]">
                <div className="space-y-1">
                    <h1 className="font-serif font-black text-4xl text-stone-900 dark:text-zinc-50">
                        {expense.amount_eur.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </h1>
                    <p className="text-stone-500 dark:text-zinc-400 font-medium">{categoryName}</p>
                </div>

                <div className="grid grid-cols-2 gap-6 pb-6 border-b border-stone-100 dark:border-zinc-800/80">
                    <div>
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-zinc-500 mb-1">Datum</span>
                        <span className="font-medium text-stone-900 dark:text-zinc-100">{formattedDate}</span>
                    </div>
                    {expense.is_recurring && (
                        <div>
                            <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-zinc-500 mb-1">Intervall</span>
                            <span className="font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                <Repeat className="w-3 h-3" />
                                {intervalLabels[expense.recurring_interval || 'monthly']}
                            </span>
                        </div>
                    )}
                </div>

                {expense.description && (
                    <div className="pb-6 border-b border-stone-100 dark:border-zinc-800/80">
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-zinc-500 mb-2">Beschreibung / Notiz</span>
                        <p className="text-stone-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                            {expense.description}
                        </p>
                    </div>
                )}
            </div>
        </FadeIn>
    );
};
