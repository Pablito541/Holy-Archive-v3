import React from 'react';
import { Package, TrendingUp, ShieldCheck, Receipt } from 'lucide-react';

export const ActionMenu = ({ onClose, onAddItem, onSellItem, onSellCertificate, onAddExpense }: { onClose: () => void, onAddItem: () => void, onSellItem: () => void, onSellCertificate: () => void, onAddExpense: () => void }) => {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose}></div>

            <div className="relative z-10 w-full max-w-sm grid grid-cols-2 gap-6">
                <button
                    onClick={onAddItem}
                    className="aspect-square bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl flex flex-col items-center justify-center space-y-4 hover:scale-105 transition-transform active:scale-95"
                >
                    <div className="w-16 h-16 bg-stone-900 dark:bg-zinc-800 text-white rounded-full flex items-center justify-center shadow-lg">
                        <Package className="w-8 h-8" />
                    </div>
                    <span className="font-serif font-bold text-lg text-stone-900 dark:text-zinc-50">Einkauf<br />erfassen</span>
                </button>

                <button
                    onClick={onSellItem}
                    className="aspect-square bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl flex flex-col items-center justify-center space-y-4 hover:scale-105 transition-transform active:scale-95"
                >
                    <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-400 rounded-full flex items-center justify-center shadow-lg">
                        <TrendingUp className="w-8 h-8" />
                    </div>
                    <span className="font-serif font-bold text-lg text-stone-900 dark:text-zinc-50">Verkauf<br />erfassen</span>
                </button>

                <button
                    onClick={onAddExpense}
                    className="aspect-square bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl flex flex-col items-center justify-center space-y-4 hover:scale-105 transition-transform active:scale-95"
                >
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-400 rounded-full flex items-center justify-center shadow-lg">
                        <Receipt className="w-8 h-8" />
                    </div>
                    <span className="font-serif font-bold text-lg text-stone-900 dark:text-zinc-50">Ausgabe<br />erfassen</span>
                </button>

                <button
                    onClick={onSellCertificate}
                    className="aspect-square bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl flex flex-col items-center justify-center space-y-4 hover:scale-105 transition-transform active:scale-95"
                >
                    <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-400 rounded-full flex items-center justify-center shadow-lg">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <span className="font-serif font-bold text-lg text-stone-900 dark:text-zinc-50">Zertifikat<br />verkaufen</span>
                </button>

                <button onClick={onClose} className="col-span-2 bg-white/10 text-white backdrop-blur-md py-4 rounded-2xl font-medium mt-4">
                    Abbrechen
                </button>
            </div>
        </div>
    );
};
