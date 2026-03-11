'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Item, ItemStatus, Expense, CertificateProvider } from '../../types';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

// Providers
import { AuthProvider, useAuth } from '../../providers/AuthProvider';
import { StatsProvider } from '../../providers/StatsProvider';
import { InventoryProvider, useInventory } from '../../providers/InventoryProvider';

// Views
import dynamic from 'next/dynamic';

// Heavy Views loaded statically only when needed (Lazy Loading)
const DashboardView = dynamic(() => import('../../components/views/DashboardView').then(m => m.DashboardView));
const InventoryView = dynamic(() => import('../../components/views/InventoryView').then(m => m.InventoryView));
const AddItemView = dynamic(() => import('../../components/views/AddItemView').then(m => m.AddItemView));
const SellItemView = dynamic(() => import('../../components/views/SellItemView').then(m => m.SellItemView));
const BulkSellView = dynamic(() => import('../../components/views/BulkSellView').then(m => m.BulkSellView));
const ItemDetailView = dynamic(() => import('../../components/views/ItemDetailView').then(m => m.ItemDetailView));
const ExportView = dynamic(() => import('../../components/views/ExportView').then(m => m.ExportView));
const SettingsView = dynamic(() => import('../../components/views/SettingsView').then(m => m.SettingsView));
const FinanzenView = dynamic(() => import('../../components/views/FinanzenView').then(m => m.FinanzenView));
const AddExpenseView = dynamic(() => import('../../components/views/AddExpenseView').then(m => m.AddExpenseView));
const ExpenseDetailView = dynamic(() => import('../../components/views/ExpenseDetailView').then(m => m.ExpenseDetailView));
const SellCertificateView = dynamic(() => import('../../components/views/SellCertificateView').then(m => m.SellCertificateView));

// Fast, frequently used components can remain static
import { LoginView } from '../../components/views/LoginView';
import { OnboardingView } from '../../components/views/OnboardingView';
import { ActionMenu } from '../../components/views/ActionMenu';
import { Navigation } from '../../components/views/Navigation';
import { useToast } from '../../components/ui/Toast';
import { useConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ErrorBoundary } from '../../components/error/ErrorBoundary';
import { ViewErrorBoundary } from '../../components/error/ViewErrorBoundary';

interface DashboardClientProps {
    initialUser: User | null;
    initialOrgId: string | null;
    initialItems: Item[];
}

export default function DashboardClient({ initialUser, initialOrgId, initialItems }: DashboardClientProps) {
    return (
        <ErrorBoundary>
            <AuthProvider initialUser={initialUser} initialOrgId={initialOrgId}>
                <StatsProvider>
                    <InventoryProvider>
                        <DashboardShell initialItems={initialItems} />
                    </InventoryProvider>
                </StatsProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
}

/** The thin layout shell — only view routing & UI chrome state lives here */
function DashboardShell({ initialItems }: { initialItems: Item[] }) {
    const { user, orgId, userRole, isLoading, signIn, signOut, setOrgId, setUserRole } = useAuth();
    const {
        items, setItems,
        selectionMode, setSelectionMode,
        selectedItemIds, setSelectedItemIds,
        inventoryFilter, setInventoryFilter,
        certificateProviders, fetchCertificateProviders,
        hasMore, loadData, handleLoadMore,
        createItem, updateItem, deleteItem,
        sellItem, bulkSell, toggleItemSelection,
        cancelSale
    } = useInventory();

    // --- View-level state (only kept here) ---
    const [view, setView] = useState(user ? 'dashboard' : 'login');
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [selectedExpenseCategoryName, setSelectedExpenseCategoryName] = useState('');
    const [showActionMenu, setShowActionMenu] = useState(false);
    const [inventorySearchQuery, setInventorySearchQuery] = useState('');

    // Scroll position preservation for inventory navigation
    const scrollPositionRef = useRef<number>(0);
    const providersFetchedRef = useRef<boolean>(false);
    const prevViewRef = useRef<string>(view);

    const { showToast } = useToast();
    const { confirm } = useConfirmDialog();

    // Seed initial items into the inventory provider on mount
    useEffect(() => {
        if (initialItems.length > 0) {
            setItems(initialItems);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Watch auth state to switch views (wait for auth to finish loading before deciding)
    useEffect(() => {
        if (isLoading) return;
        if (!user) {
            setView('login');
        } else if (user && !orgId) {
            setView('onboarding');
        } else if (user && orgId) {
            // Transition from login to dashboard once auth is confirmed
            setView(prev => prev === 'login' ? 'dashboard' : prev);
        }
    }, [user, orgId, isLoading]);

    // Fetch items & providers on login
    useEffect(() => {
        if (user && orgId) {
            fetchCertificateProviders();
            if (items.length === 0) {
                loadData(0, true);
            }
        }
    }, [user, orgId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Refetch providers when returning from settings
    useEffect(() => {
        if (user && orgId) {
            if (!providersFetchedRef.current || (prevViewRef.current === 'settings' && view !== 'settings')) {
                fetchCertificateProviders();
                providersFetchedRef.current = true;
            }
        }
        prevViewRef.current = view;
    }, [view, user, orgId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Restore scroll position when returning to inventory view
    useEffect(() => {
        if (view === 'inventory' && scrollPositionRef.current > 0) {
            setTimeout(() => window.scrollTo(0, scrollPositionRef.current), 10);
        }
    }, [view]);

    const handleLogout = async () => {
        await signOut();
        setView('login');
    };

    const handleDeleteExpense = async (expenseId: string) => {
        const confirmed = await confirm({
            title: 'Ausgabe löschen?',
            description: 'Diese Aktion kann nicht rückgängig gemacht werden.',
            confirmLabel: 'Löschen',
            variant: 'destructive'
        });
        if (!confirmed) return;
        if (!supabase || !orgId) return;
        try {
            const { error } = await supabase.from('expenses').update({ deleted_at: new Date().toISOString() }).eq('id', expenseId);
            if (error) throw error;
            showToast('Ausgabe erfolgreich gelöscht', 'success');
            setView('finances');
            setSelectedExpense(null);
        } catch (e: unknown) {
            console.error('Error deleting expense:', e);
            showToast('Fehler beim Löschen der Ausgabe', 'error');
        }
    };

    const renderContent = () => {
        if (view === 'login') return <LoginView onLogin={(u) => { signIn(u); }} />;
        if (view === 'onboarding') return <OnboardingView user={user} onComplete={(newOrgId) => {
            setOrgId(newOrgId);
            setUserRole('owner');
            setView('dashboard');
        }} />;

        if (view === 'dashboard') return (
            <DashboardView
                userRole={userRole}
                items={items}
                onViewInventory={() => setView('inventory')}
                onAddItem={() => setView('add-item')}
                userEmail={user?.email}
                onLogout={handleLogout}
                onRefresh={() => loadData(0, true)}
                currentUser={user}
                currentOrgId={orgId}
                onOpenSettings={() => setView('settings')}
            />
        );

        if (view === 'inventory') return (
            <InventoryView
                userRole={userRole}
                items={items}
                onSelectItem={(id) => {
                    scrollPositionRef.current = window.scrollY;
                    setSelectedItemId(id);
                    setView('item-detail');
                    window.scrollTo(0, 0);
                }}
                selectionMode={selectionMode}
                onLoadMore={handleLoadMore}
                hasMore={hasMore}
                onRefresh={() => loadData(0, true)}
                filter={inventoryFilter}
                onFilterChange={f => {
                    setInventoryFilter(f);
                    loadData(0, true, f);
                }}
                searchQuery={inventorySearchQuery}
                onSearchChange={setInventorySearchQuery}
                selectedItemIds={selectedItemIds}
                onToggleItemSelection={toggleItemSelection}
                onBulkSellStart={() => {
                    if (selectedItemIds.size === 0) {
                        showToast('Bitte wähle mindestens einen Artikel aus', 'error');
                        return;
                    }
                    setView('bulk-sell');
                }}
                onSwitchToBulkSelect={() => {
                    setSelectionMode('bulk_sell');
                    setSelectedItemIds(new Set());
                }}
                onExitBulkSelect={() => {
                    setSelectionMode('view');
                    setSelectedItemIds(new Set());
                }}
            />
        );

        if (view === 'sell-certificate') return (
            <SellCertificateView
                onSave={(newItem) => {
                    setItems(prev => [newItem, ...prev]);
                    setView('dashboard');
                    showToast('Zertifikat verkauft', 'success');
                }}
                onCancel={() => setView('dashboard')}
                currentOrgId={orgId}
            />
        );

        if (view === 'add-item') return (
            <AddItemView
                onSave={(data, cert) => {
                    createItem(data, cert);
                    setView('inventory');
                    setSelectionMode('view');
                }}
                onCancel={() => setView('dashboard')}
                currentOrgId={orgId}
            />
        );

        if (view === 'edit-item' && selectedItemId) {
            const itemToEdit = items.find(i => i.id === selectedItemId);
            if (!itemToEdit) return null;
            return (
                <AddItemView
                    initialData={itemToEdit}
                    onSave={(data) => {
                        updateItem(selectedItemId, data);
                        setView('item-detail');
                    }}
                    onCancel={() => setView('item-detail')}
                    currentOrgId={orgId}
                />
            );
        }

        if (view === 'sell-item' && selectedItemId) {
            const itemToSell = items.find(i => i.id === selectedItemId);
            if (!itemToSell) return null;
            return (
                <SellItemView
                    item={itemToSell}
                    certificateProviders={certificateProviders}
                    onConfirm={(data, certSalePrices, standaloneCerts) => {
                        sellItem(selectedItemId, data, certSalePrices, standaloneCerts);
                        setView('inventory');
                        setSelectionMode('view');
                    }}
                    onCancel={() => setView('item-detail')}
                />
            );
        }

        if (view === 'bulk-sell' && selectedItemIds.size > 0) {
            const bulkItems = items.filter(i => selectedItemIds.has(i.id));
            return (
                <BulkSellView
                    items={bulkItems}
                    certificateProviders={certificateProviders}
                    onConfirm={(data) => {
                        bulkSell(data);
                        setSelectionMode('view');
                        setView('inventory');
                    }}
                    onCancel={() => setView('inventory')}
                />
            );
        }

        if (view === 'item-detail' && selectedItemId) {
            const item = items.find(i => i.id === selectedItemId);
            if (!item) return null;
            return (
                <ItemDetailView
                    userRole={userRole}
                    item={item}
                    onBack={() => setView('inventory')}
                    onSell={() => setView('sell-item')}
                    onDelete={() => {
                        deleteItem(selectedItemId);
                        setView('inventory');
                    }}
                    onCancelSale={() => cancelSale(selectedItemId)}
                    onEdit={() => setView('edit-item')}
                />
            );
        }

        if (view === 'settings') return (
            <SettingsView
                userRole={userRole}
                currentOrgId={orgId}
                onBack={() => setView('dashboard')}
                onExport={() => setView('export')}
            />
        );

        if (view === 'export') return (
            <div className="min-h-screen bg-[#fafaf9] dark:bg-black">
                <ExportView items={items} onBack={() => setView('settings')} />
            </div>
        );

        if (view === 'finances') return (
            <FinanzenView
                currentOrgId={orgId}
                onExpenseClick={(expense, catName) => {
                    setSelectedExpense(expense);
                    setSelectedExpenseCategoryName(catName);
                    setView('expense-detail');
                }}
            />
        );

        if (view === 'expense-detail' && selectedExpense) return (
            <ExpenseDetailView
                expense={selectedExpense}
                categoryName={selectedExpenseCategoryName}
                onBack={() => setView('finances')}
                onEdit={() => setView('edit-expense')}
                onDelete={() => handleDeleteExpense(selectedExpense.id)}
            />
        );

        if (view === 'add-expense' || view === 'edit-expense') return (
            <AddExpenseView
                currentOrgId={orgId}
                initialData={view === 'edit-expense' && selectedExpense ? selectedExpense : undefined}
                onSave={() => {
                    setView('finances');
                    setSelectedExpense(null);
                }}
                onCancel={() => {
                    setView(view === 'edit-expense' ? 'expense-detail' : 'dashboard');
                }}
            />
        );

        return null;
    };

    return (
        <div className="min-h-screen font-sans text-stone-900 dark:text-zinc-50 pb-20">
            <ViewErrorBoundary key={view} viewName={view}>
                {renderContent()}
            </ViewErrorBoundary>

            {view !== 'login' && view !== 'onboarding' && selectionMode !== 'bulk_sell' && view !== 'settings' && (
                <Navigation
                    userRole={userRole}
                    currentView={view}
                    onNavigate={(v) => {
                        if (v === 'add-item') {
                            setShowActionMenu(true);
                        } else {
                            setView(v);
                            setSelectionMode('view');
                        }
                    }}
                />
            )}

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
                                    setView('bulk-sell');
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
                    onAddItem={() => { setShowActionMenu(false); setView('add-item'); }}
                    onSellItem={() => { setShowActionMenu(false); setView('inventory'); setSelectionMode('sell'); }}
                    onSellCertificate={() => { setShowActionMenu(false); setView('sell-certificate'); }}
                    onAddExpense={() => { setShowActionMenu(false); setView('add-expense'); }}
                />
            )}
        </div>
    );
}
