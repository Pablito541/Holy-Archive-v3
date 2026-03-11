'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useInventory } from '../../hooks/useInventory';
import { useFinance } from '../../hooks/useFinance';
import { useUI } from '../../hooks/useUI';
import { useToast } from '../../components/ui/Toast';

// Views
import { LoginView } from '../../components/views/LoginView';
import { DashboardView } from '../../components/views/DashboardView';
import { InventoryView } from '../../components/views/InventoryView';
import { AddItemView } from '../../components/views/AddItemView';
import { SellItemView } from '../../components/views/SellItemView';
import { BulkSellView } from '../../components/views/BulkSellView';
import { ItemDetailView } from '../../components/views/ItemDetailView';
import { ExportView } from '../../components/views/ExportView';
import { SettingsView } from '../../components/views/SettingsView';
import { ActionMenu } from '../../components/views/ActionMenu';
import { Navigation } from '../../components/views/Navigation';
import { FinanzenView } from '../../components/views/FinanzenView';
import { AddExpenseView } from '../../components/views/AddExpenseView';
import { ExpenseDetailView } from '../../components/views/ExpenseDetailView';
import { SellCertificateView } from '../../components/views/SellCertificateView';
import { GuidedTour } from '../../components/ui/GuidedTour';

export default function DashboardClient() {
    const { user, orgId, logout, setUser } = useAuth();
    const inventory = useInventory();
    const finance = useFinance();
    const { view, setView, selectionMode, setSelectionMode, showActionMenu, setShowActionMenu, showTour, setShowTour, scrollPositionRef } = useUI();
    const { showToast } = useToast();

    // React to auth changes — redirect to login when user logs out
    useEffect(() => {
        if (!user && view !== 'login') setView('login');
    }, [user]);

    // --- Orchestration callbacks (combine provider calls + toast + navigation) ---

    const handleCreateItem = async (data: Parameters<typeof inventory.createItem>[0], cert?: Parameters<typeof inventory.createItem>[1]) => {
        const ok = await inventory.createItem(data, cert);
        if (ok) {
            finance.refreshStats();
            showToast('Artikel erfolgreich erstellt', 'success');
            setView('inventory');
            setSelectionMode('view');
        } else {
            showToast('Fehler beim Erstellen', 'error');
        }
    };

    const handleUpdateItem = async (id: string, data: Parameters<typeof inventory.updateItem>[1]) => {
        const ok = await inventory.updateItem(id, data);
        if (ok) {
            finance.refreshStats();
            showToast('Artikel aktualisiert', 'success');
            setView('item-detail');
        } else {
            showToast('Fehler beim Aktualisieren', 'error');
        }
    };

    const handleSellItem = async (id: string, saleData: any, certSalePrices?: Record<string, number>, standaloneCerts?: any[]) => {
        const ok = await inventory.sellItem(id, saleData, certSalePrices, standaloneCerts, finance.certificateProviders);
        if (ok) {
            finance.refreshStats();
            showToast('Artikel als verkauft markiert', 'success');
            setView('inventory');
            setSelectionMode('view');
        } else {
            showToast('Fehler beim Verkauf', 'error');
        }
    };

    const handleBulkSell = async (data: Parameters<typeof inventory.bulkSell>[0]) => {
        const count = inventory.selectedItemIds.size;
        const ok = await inventory.bulkSell(data, finance.certificateProviders);
        if (ok) {
            finance.refreshStats();
            showToast(`${count} Artikel als verkauft markiert`, 'success');
            inventory.setSelectedItemIds(new Set());
            setSelectionMode('view');
            setView('inventory');
        } else {
            showToast('Fehler beim Sammelverkauf', 'error');
        }
    };

    const handleDeleteItem = async (id: string) => {
        if (!confirm('Wirklich löschen?')) return;
        const ok = await inventory.deleteItem(id);
        if (ok) {
            finance.refreshStats();
            showToast('Artikel gelöscht', 'success');
            setView('inventory');
        } else {
            showToast('Fehler beim Löschen', 'error');
        }
    };

    const handleCancelSale = async (id: string) => {
        if (!confirm('Verkauf wirklich stornieren? Der Artikel wird wieder als "Im Lager" markiert.')) return;
        const ok = await inventory.cancelSale(id);
        if (ok) {
            finance.refreshStats();
            showToast('Verkauf storniert', 'success');
        } else {
            showToast('Fehler beim Stornieren des Verkaufs', 'error');
        }
    };

    const handleDeleteExpense = async (expenseId: string) => {
        if (!confirm('Ausgabe wirklich löschen?')) return;
        const ok = await finance.deleteExpense(expenseId);
        if (ok) {
            showToast('Ausgabe erfolgreich gelöscht', 'success');
            setView('finances');
            finance.setSelectedExpense(null);
        } else {
            showToast('Fehler beim Löschen der Ausgabe', 'error');
        }
    };

    const handleLogout = async () => {
        await logout();
        setView('login');
    };

    // --- View rendering ---

    const renderContent = () => {
        if (view === 'login') return <LoginView onLogin={(u) => { setUser(u); setView('dashboard'); }} />;

        if (view === 'dashboard') return (
            <DashboardView
                items={inventory.items}
                onViewInventory={() => setView('inventory')}
                onAddItem={() => setView('add-item')}
                userEmail={user?.email}
                onLogout={handleLogout}
                onRefresh={() => inventory.loadData(0, true)}
                serverStats={finance.dashboardStats}
                currentUser={user}
                currentOrgId={orgId}
                onOpenSettings={() => setView('settings')}
            />
        );

        if (view === 'inventory') return (
            <InventoryView
                items={inventory.items}
                onSelectItem={(id) => {
                    scrollPositionRef.current = window.scrollY;
                    inventory.setSelectedItemId(id);
                    setView('item-detail');
                    window.scrollTo(0, 0);
                }}
                selectionMode={selectionMode}
                onLoadMore={inventory.loadMore}
                hasMore={inventory.hasMore}
                onRefresh={() => inventory.loadData(0, true)}
                filter={inventory.inventoryFilter}
                onFilterChange={f => {
                    inventory.setInventoryFilter(f);
                    inventory.loadData(0, true, f);
                }}
                searchQuery={inventory.inventorySearchQuery}
                onSearchChange={inventory.setInventorySearchQuery}
                selectedItemIds={inventory.selectedItemIds}
                onToggleItemSelection={inventory.toggleItemSelection}
                onBulkSellStart={() => {
                    if (inventory.selectedItemIds.size === 0) {
                        showToast('Bitte wähle mindestens einen Artikel aus', 'error');
                        return;
                    }
                    setView('bulk-sell');
                }}
                onSwitchToBulkSelect={() => {
                    setSelectionMode('bulk_sell');
                    inventory.setSelectedItemIds(new Set());
                }}
                onExitBulkSelect={() => {
                    setSelectionMode('view');
                    inventory.setSelectedItemIds(new Set());
                }}
            />
        );

        if (view === 'sell-certificate') return (
            <SellCertificateView
                onSave={(newItem) => {
                    inventory.setItems(prev => [newItem, ...prev]);
                    setView('dashboard');
                    finance.refreshStats();
                    showToast('Zertifikat verkauft', 'success');
                }}
                onCancel={() => setView('dashboard')}
                currentOrgId={orgId}
            />
        );

        if (view === 'add-item') return (
            <AddItemView onSave={handleCreateItem} onCancel={() => setView('dashboard')} currentOrgId={orgId} />
        );

        if (view === 'edit-item' && inventory.selectedItemId) {
            const itemToEdit = inventory.items.find(i => i.id === inventory.selectedItemId);
            if (!itemToEdit) return null;
            return (
                <AddItemView
                    initialData={itemToEdit}
                    onSave={(data) => handleUpdateItem(inventory.selectedItemId!, data)}
                    onCancel={() => setView('item-detail')}
                    currentOrgId={orgId}
                />
            );
        }

        if (view === 'sell-item' && inventory.selectedItemId) {
            const itemToSell = inventory.items.find(i => i.id === inventory.selectedItemId);
            if (!itemToSell) return null;
            return (
                <SellItemView
                    item={itemToSell}
                    certificateProviders={finance.certificateProviders}
                    onConfirm={(data, certSalePrices, standaloneCerts) => handleSellItem(inventory.selectedItemId!, data, certSalePrices, standaloneCerts)}
                    onCancel={() => setView('item-detail')}
                />
            );
        }

        if (view === 'bulk-sell' && inventory.selectedItemIds.size > 0) {
            return (
                <BulkSellView
                    items={inventory.selectedItems}
                    certificateProviders={finance.certificateProviders}
                    onConfirm={handleBulkSell}
                    onCancel={() => setView('inventory')}
                />
            );
        }

        if (view === 'item-detail' && inventory.selectedItemId) {
            const item = inventory.items.find(i => i.id === inventory.selectedItemId);
            if (!item) return null;
            return (
                <ItemDetailView
                    item={item}
                    onBack={() => setView('inventory')}
                    onSell={() => setView('sell-item')}
                    onDelete={() => handleDeleteItem(inventory.selectedItemId!)}
                    onCancelSale={() => handleCancelSale(inventory.selectedItemId!)}
                    onEdit={() => setView('edit-item')}
                />
            );
        }

        if (view === 'settings') return (
            <SettingsView
                onBack={() => { finance.refreshCertificateProviders(); setView('dashboard'); }}
                onExport={() => setView('export')}
                currentOrgId={orgId}
            />
        );

        if (view === 'export') return (
            <div className="min-h-screen bg-[#fafaf9] dark:bg-black">
                <ExportView items={inventory.items} onBack={() => setView('settings')} />
            </div>
        );

        if (view === 'finances') return (
            <FinanzenView
                currentOrgId={orgId}
                onExpenseClick={(expense, catName) => {
                    finance.setSelectedExpense(expense);
                    finance.setSelectedExpenseCategoryName(catName);
                    setView('expense-detail');
                }}
            />
        );

        if (view === 'expense-detail' && finance.selectedExpense) return (
            <ExpenseDetailView
                expense={finance.selectedExpense}
                categoryName={finance.selectedExpenseCategoryName}
                onBack={() => setView('finances')}
                onEdit={() => setView('edit-expense')}
                onDelete={() => handleDeleteExpense(finance.selectedExpense!.id)}
            />
        );

        if (view === 'add-expense' || view === 'edit-expense') return (
            <AddExpenseView
                currentOrgId={orgId}
                initialData={view === 'edit-expense' && finance.selectedExpense ? finance.selectedExpense : undefined}
                onSave={() => { setView('finances'); finance.setSelectedExpense(null); }}
                onCancel={() => setView(view === 'edit-expense' ? 'expense-detail' : 'dashboard')}
            />
        );

        return null;
    };

    return (
        <div className="min-h-screen font-sans text-stone-900 dark:text-zinc-50 pb-20">
            {renderContent()}

            {view !== 'login' && selectionMode !== 'bulk_sell' && view !== 'settings' && (
                <Navigation
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
                                <span className="font-serif font-bold text-lg text-stone-900 dark:text-zinc-50">{inventory.selectedItemIds.size} Artikel</span>
                            </div>
                            <button
                                onClick={() => {
                                    if (inventory.selectedItemIds.size === 0) {
                                        showToast('Bitte wähle mindestens einen Artikel aus', 'error');
                                        return;
                                    }
                                    setView('bulk-sell');
                                }}
                                disabled={inventory.selectedItemIds.size === 0}
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

            <GuidedTour active={showTour} onComplete={() => setShowTour(false)} />
        </div>
    );
}
