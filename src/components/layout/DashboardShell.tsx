'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Navigation } from '../views/Navigation';
import { ActionMenu } from '../views/ActionMenu';
import { GuidedTour } from '../ui/GuidedTour';
import { useUI } from '../../hooks/useUI';
import { useInventory } from '../../hooks/useInventory';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../ui/Toast';

export const DashboardShell = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const pathname = usePathname();
    const { selectionMode, setSelectionMode, showActionMenu, setShowActionMenu, showTour, setShowTour } = useUI();
    const { selectedItemIds, setSelectedItemIds } = useInventory();
    const { logout } = useAuth();
    const { showToast } = useToast();

    // Hide nav on settings pages and during bulk sell
    const isSettingsPage = pathname.startsWith('/dashboard/settings');
    const showNav = !isSettingsPage && selectionMode !== 'bulk_sell';

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    return (
        <div className="min-h-screen font-sans text-stone-900 dark:text-zinc-50 pb-20">
            {children}

            {showNav && <Navigation />}

            {selectionMode === 'bulk_sell' && (
                <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
                    <div className="max-w-md mx-auto px-6 pb-6">
                        <div className="bg-white/80 dark:bg-zinc-900/90 backdrop-blur-xl border border-stone-200 dark:border-zinc-800/50 rounded-[2rem] shadow-2xl shadow-stone-900/5 dark:shadow-black/40 px-5 py-3 flex items-center justify-between transition-all duration-300">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-widest">Ausgewählt</span>
                                <span className="font-serif font-bold text-lg text-stone-900 dark:text-zinc-50">{selectedItemIds.size} Artikel</span>
                            </div>
                            <button
                                onClick={() => {
                                    if (selectedItemIds.size === 0) {
                                        showToast('Bitte wähle mindestens einen Artikel aus', 'error');
                                        return;
                                    }
                                    router.push('/dashboard/bulk-sell');
                                }}
                                disabled={selectedItemIds.size === 0}
                                className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all text-white font-bold text-sm px-6 py-2.5 rounded-2xl shadow-lg"
                            >
                                Verkauf starten
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showActionMenu && (
                <ActionMenu
                    onClose={() => setShowActionMenu(false)}
                    onAddItem={() => { setShowActionMenu(false); router.push('/dashboard/add-item'); }}
                    onSellItem={() => {
                        setShowActionMenu(false);
                        setSelectionMode('sell');
                        router.push('/dashboard/inventory');
                    }}
                    onSellCertificate={() => { setShowActionMenu(false); router.push('/dashboard/sell-certificate'); }}
                    onAddExpense={() => { setShowActionMenu(false); router.push('/dashboard/finances/add'); }}
                />
            )}

            <GuidedTour active={showTour} onComplete={() => setShowTour(false)} />
        </div>
    );
};
