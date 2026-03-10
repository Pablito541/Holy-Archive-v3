'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Item, ItemStatus, Expense, CertificateProvider } from '../../types';
import { generateId } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { api, mapDbItemToItem } from '../../lib/api/client';

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
import { useToast } from '../../components/ui/Toast';

const PAGE_SIZE = 50;

interface DashboardClientProps {
    initialUser: any;
    initialOrgId: string | null;
    initialItems: Item[];
}

export default function DashboardClient({ initialUser, initialOrgId, initialItems }: DashboardClientProps) {
    const [user, setUser] = useState<any>(initialUser);
    const [view, setView] = useState(initialUser ? 'dashboard' : 'login');
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [selectedExpenseCategoryName, setSelectedExpenseCategoryName] = useState('');
    const [showActionMenu, setShowActionMenu] = useState(false);
    const [selectionMode, setSelectionMode] = useState<'view' | 'sell' | 'bulk_sell'>('view');
    const [inventoryFilter, setInventoryFilter] = useState<ItemStatus>('in_stock');
    const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
    const [inventorySearchQuery, setInventorySearchQuery] = useState('');

    const [items, setItems] = useState<Item[]>(initialItems);
    const [dashboardStats, setDashboardStats] = useState<any>(null);
    const [certificateProviders, setCertificateProviders] = useState<CertificateProvider[]>([]);
    const [orgId, setOrgId] = useState<string | null>(initialOrgId);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(initialItems.length === PAGE_SIZE);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(false);

    // Scroll position preservation for inventory navigation
    const scrollPositionRef = useRef<number>(0);

    const { showToast } = useToast();

    // 1. Auth & Data Loading
    useEffect(() => {
        if (!supabase) return;

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const currentUser = session?.user ?? null;
            console.log('DashboardClient: Auth state change:', _event, currentUser?.email);
            setUser(currentUser);

            if (currentUser) {
                // Determine the view immediately
                setView(prev => prev === 'login' ? 'dashboard' : prev);

                // Fetch org membership in parallel
                if (supabase) {
                    supabase
                        .from('organization_members')
                        .select('organization_id')
                        .eq('user_id', currentUser.id)
                        .maybeSingle()
                        .then(({ data: member, error }) => {
                            if (error) {
                                console.error("DashboardClient: Error fetching organization membership:", error);
                            }
                            if (member) {
                                setOrgId(member.organization_id);
                            } else {
                                console.log("DashboardClient: No organization membership found for user.");
                            }
                        });
                }
            } else {
                setOrgId(null);
                setView('login');
            }
        });

        return () => subscription.unsubscribe();
    }, []); // Run only once

    const fetchStats = async () => {
        // Redundant if DashboardView fetches its own stats, but useful for other views if needed
        // For now preventing errors
        if (!supabase || !orgId) return;
    };

    const loadData = async (pageToLoad: number = 0, reset: boolean = false, filterStatus?: ItemStatus) => {
        if (!user || !orgId) return;

        const currentFilter = filterStatus || inventoryFilter;

        setIsLoading(true);
        try {
            if (reset) {
                fetchStats();
            }

            const { data: result, error: apiError } = await api.getItems({
                status: currentFilter,
                page: pageToLoad,
                limit: PAGE_SIZE,
            });

            if (apiError || !result) {
                console.error('Error loading items:', apiError);
                return;
            }

            const mappedItems = result.items.map(mapDbItemToItem);
            setTotalCount(result.total);

            if (reset) {
                setItems(mappedItems);
                setHasMore(result.hasMore);
            } else {
                setItems(prev => {
                    const newItems = [...prev, ...mappedItems];
                    setHasMore(newItems.length < result.total);
                    return newItems;
                });
            }
        } catch (e) {
            console.error('Error loading data:', e);
        } finally {
            setIsLoading(false);
        }
    };
    // Reusable: fetch certificate providers
    const fetchCertificateProviders = () => {
        if (!supabase || !orgId) return;
        supabase
            .from('certificate_providers')
            .select('*')
            .eq('organization_id', orgId)
            .then(({ data, error }) => {
                if (!error && data) {
                    setCertificateProviders(data as CertificateProvider[]);
                }
            });
    };

    // Fetch stats and items on mount/login
    useEffect(() => {
        if (user && orgId) {
            fetchStats(); // Always fetch fresh global stats
            fetchCertificateProviders();

            // Only fetch items if we don't have them yet (initial load fallback)
            if (items.length === 0) {
                loadData(0, true);
            }
        }
    }, [user, orgId]);

    // Refetch providers when returning from settings (image may have changed)
    useEffect(() => {
        if (view !== 'settings' && user && orgId) {
            fetchCertificateProviders();
        }
    }, [view]);

    // Restore scroll position when returning to inventory view
    useEffect(() => {
        if (view === 'inventory' && scrollPositionRef.current > 0) {
            // Small timeout to ensure the DOM has rendered
            setTimeout(() => {
                window.scrollTo(0, scrollPositionRef.current);
            }, 10);
        }
    }, [view]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        loadData(nextPage, false);
    };

    const handleCreateItem = async (data: Partial<Item>, newCertificate?: { providerId: string, costEur: number }) => {
        try {
            const { data: inserted, error } = await api.createItem({
                brand: data.brand || 'Unknown',
                model: data.model || '',
                category: data.category || 'bag',
                condition: data.condition || 'good',
                purchase_price_eur: data.purchasePriceEur || 0,
                purchase_date: data.purchaseDate || new Date().toISOString(),
                purchase_source: data.purchaseSource || '',
                image_urls: data.imageUrls || [],
                notes: data.notes || '',
                certificate: newCertificate ? {
                    provider_id: newCertificate.providerId,
                    cost_eur: newCertificate.costEur,
                } : undefined,
            });

            if (error || !inserted) {
                showToast(`Fehler beim Erstellen: ${error}`, 'error');
                return;
            }

            setItems(prev => [mapDbItemToItem(inserted), ...prev]);
            fetchStats();
            showToast('Artikel erfolgreich erstellt', 'success');
            setView('inventory');
            setSelectionMode('view');
        } catch (e: any) {
            showToast('Ein unerwarteter Fehler ist aufgetreten', 'error');
        }
    };

    const handleUpdateItem = async (id: string, data: Partial<Item>) => {
        try {
            const { error } = await api.updateItem(id, {
                brand: data.brand,
                model: data.model,
                category: data.category,
                condition: data.condition,
                purchase_price_eur: data.purchasePriceEur,
                purchase_date: data.purchaseDate,
                purchase_source: data.purchaseSource,
                image_urls: data.imageUrls,
                notes: data.notes,
            });

            if (error) throw new Error(error);

            setItems(prev => prev.map(item => item.id === id ? { ...item, ...data } : item));
            fetchStats();
            showToast('Artikel aktualisiert', 'success');
            setView('item-detail');
        } catch (e: any) {
            showToast('Fehler beim Aktualisieren', 'error');
        }
    };

    const handleSellItem = async (id: string, saleData: any, certSalePrices?: Record<string, number>, standaloneCertificates?: { provider: string; quantity: number; costEur: number; salePriceEur: number; }[]) => {
        try {
            const { error: sellError } = await api.sellItem(id, {
                sale_price_eur: saleData.salePriceEur,
                sale_date: saleData.saleDate,
                sale_channel: saleData.saleChannel,
                platform_fees_eur: saleData.platformFeesEur,
                shipping_cost_eur: saleData.shippingCostEur,
                buyer: saleData.buyer,
                cert_sale_prices: certSalePrices,
            });

            if (sellError) throw new Error(sellError);

            // Create standalone certificate items if any (still via direct Supabase for now — complex logic)
            const newCertItems: Item[] = [];
            if (standaloneCertificates && standaloneCertificates.length > 0 && supabase) {
                for (const cert of standaloneCertificates) {
                    for (let i = 0; i < cert.quantity; i++) {
                        const { data: inserted, error: certItemErr } = await api.createItem({
                            brand: cert.provider || 'Zertifikat',
                            model: 'Zertifikat',
                            category: 'other',
                            condition: 'mint',
                            purchase_price_eur: cert.costEur,
                            purchase_date: saleData.saleDate,
                            image_urls: (() => {
                                const prov = certificateProviders.find(p => p.name === cert.provider);
                                return prov?.image_url ? [prov.image_url] : [];
                            })(),
                        });

                        if (inserted) {
                            // Mark as sold immediately
                            await api.sellItem(inserted.id, {
                                sale_price_eur: cert.salePriceEur,
                                sale_date: saleData.saleDate,
                                sale_channel: saleData.saleChannel,
                                buyer: saleData.buyer,
                            });
                            newCertItems.push(mapDbItemToItem({
                                ...inserted,
                                status: 'sold',
                                sale_price_eur: cert.salePriceEur,
                                sale_date: saleData.saleDate,
                                sale_channel: saleData.saleChannel,
                            }));
                        }
                    }
                }
            }

            setItems(prev => {
                const nextState = prev.map(item => {
                    if (item.id === id) {
                        const updatedCerts = item.certificates?.map(c => ({
                            ...c,
                            sale_price_eur: certSalePrices?.[c.id] !== undefined ? certSalePrices[c.id] : c.sale_price_eur
                        }));
                        return { ...item, status: 'sold' as const, ...saleData, certificates: updatedCerts };
                    }
                    return item;
                });

                if (newCertItems.length > 0) {
                    nextState.push(...newCertItems);
                }
                return nextState;
            });
            fetchStats();
            showToast('Artikel als verkauft markiert', 'success');
            setView('inventory');
            setSelectionMode('view');
        } catch (e: any) {
            console.error('Error selling item:', e);
            showToast(`Fehler beim Verkauf: ${e.message || 'Unbekannter Fehler'}`, 'error');
        }
    };

    const handleToggleItemSelection = (id: string) => {
        setSelectedItemIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleBulkSell = async (data: { salePriceEur: number; saleDate: string; saleChannel: string; platformFeesEur: number; shippingCostEur: number; buyer: string; certificates?: { provider: string; quantity: number; costEur: number; salePriceEur: number; }[] }) => {
        try {
            const selectedItems = items.filter(i => selectedItemIds.has(i.id));
            const count = selectedItems.length;
            if (count === 0) return;

            // Distribute price
            const pricePerItem = Math.floor((data.salePriceEur * 100) / count) / 100;
            const priceRemainder = Math.round((data.salePriceEur - pricePerItem * count) * 100) / 100;

            const feesPerItem = Math.floor((data.platformFeesEur * 100) / count) / 100;
            const feesRemainder = Math.round((data.platformFeesEur - feesPerItem * count) * 100) / 100;

            const shippingPerItem = Math.floor((data.shippingCostEur * 100) / count) / 100;
            const shippingRemainder = Math.round((data.shippingCostEur - shippingPerItem * count) * 100) / 100;

            // Sell each item via API
            for (let i = 0; i < selectedItems.length; i++) {
                const item = selectedItems[i];
                const isFirst = i === 0;

                const { error } = await api.sellItem(item.id, {
                    sale_price_eur: isFirst ? pricePerItem + priceRemainder : pricePerItem,
                    sale_date: data.saleDate,
                    sale_channel: data.saleChannel,
                    platform_fees_eur: isFirst ? feesPerItem + feesRemainder : feesPerItem,
                    shipping_cost_eur: isFirst ? shippingPerItem + shippingRemainder : shippingPerItem,
                    buyer: data.buyer || undefined,
                });

                if (error) {
                    console.error(`Error selling item ${item.id}:`, error);
                    throw new Error(error);
                }
            }

            // Create standalone certificate items if any
            const newCertItems: Item[] = [];
            if (data.certificates && data.certificates.length > 0) {
                for (const cert of data.certificates) {
                    for (let i = 0; i < cert.quantity; i++) {
                        const { data: inserted, error: createErr } = await api.createItem({
                            brand: cert.provider || 'Zertifikat',
                            model: 'Zertifikat',
                            category: 'other',
                            condition: 'mint',
                            purchase_price_eur: cert.costEur,
                            purchase_date: data.saleDate,
                            image_urls: (() => {
                                const prov = certificateProviders.find(p => p.name === cert.provider);
                                return prov?.image_url ? [prov.image_url] : [];
                            })(),
                        });

                        if (createErr || !inserted) {
                            console.error('Error creating certificate item:', createErr);
                            throw new Error(createErr || 'Failed to create certificate item');
                        }

                        // Mark as sold immediately
                        await api.sellItem(inserted.id, {
                            sale_price_eur: cert.salePriceEur,
                            sale_date: data.saleDate,
                            sale_channel: data.saleChannel,
                            buyer: data.buyer || undefined,
                        });

                        newCertItems.push(mapDbItemToItem({
                            ...inserted,
                            status: 'sold',
                            sale_price_eur: cert.salePriceEur,
                            sale_date: data.saleDate,
                            sale_channel: data.saleChannel,
                        }));
                    }
                }
            }

            // Update local state
            setItems(prev => {
                const nextState = prev.map(item => {
                    if (!selectedItemIds.has(item.id)) return item;
                    const idx = selectedItems.findIndex(s => s.id === item.id);
                    const isFirst = idx === 0;
                    return {
                        ...item,
                        status: 'sold' as const,
                        salePriceEur: isFirst ? pricePerItem + priceRemainder : pricePerItem,
                        saleDate: data.saleDate,
                        saleChannel: data.saleChannel,
                        platformFeesEur: isFirst ? feesPerItem + feesRemainder : feesPerItem,
                        shippingCostEur: isFirst ? shippingPerItem + shippingRemainder : shippingPerItem,
                        buyer: data.buyer || undefined
                    };
                });

                if (newCertItems.length > 0) {
                    nextState.push(...newCertItems);
                }
                return nextState;
            });

            fetchStats();
            showToast(`${count} Artikel als verkauft markiert`, 'success');
            setSelectedItemIds(new Set());
            setSelectionMode('view');
            setView('inventory');
        } catch (e: any) {
            console.error('Error in bulk sell:', e);
            showToast(`Fehler beim Sammelverkauf: ${e.message || 'Unbekannter Fehler'}`, 'error');
        }
    };

    const handleDeleteItem = async (id: string) => {
        if (!confirm('Wirklich löschen?')) return;
        try {
            const { error } = await api.deleteItem(id);
            if (error) throw new Error(error);
            setItems(prev => prev.filter(i => i.id !== id));
            fetchStats();
            showToast('Artikel gelöscht', 'success');
            setView('inventory');
        } catch (e) {
            showToast('Fehler beim Löschen', 'error');
        }
    };

    const handleReserveItem = async (id: string, name: string, days: number) => {
        try {
            const reservedUntil = new Date();
            reservedUntil.setDate(reservedUntil.getDate() + days);

            const { error } = await api.updateItem(id, {
                status: 'reserved',
                reserved_for: name,
                reserved_until: reservedUntil.toISOString(),
            });
            if (error) throw new Error(error);

            setItems(prev => prev.map(item => item.id === id ? {
                ...item,
                status: 'reserved',
                reservedFor: name,
                reservedUntil: reservedUntil.toISOString()
            } : item));
            showToast('Artikel reserviert', 'success');
        } catch (e) {
            showToast('Fehler beim Reservieren', 'error');
        }
    };

    const handleCancelReservation = async (id: string) => {
        try {
            const { error } = await api.updateItem(id, {
                status: 'in_stock',
                reserved_for: null,
                reserved_until: null,
            });
            if (error) throw new Error(error);

            setItems(prev => prev.map(item => item.id === id ? {
                ...item,
                status: 'in_stock',
                reservedFor: undefined,
                reservedUntil: undefined
            } : item));
            showToast('Reservierung aufgehoben', 'success');
        } catch (e) {
            showToast('Fehler beim Aufheben der Reservierung', 'error');
        }
    };

    const handleCancelSale = async (id: string) => {
        if (!confirm('Verkauf wirklich stornieren? Der Artikel wird wieder als "Im Lager" markiert.')) return;

        try {
            const { error } = await api.updateItem(id, {
                status: 'in_stock',
                sale_price_eur: null,
                sale_date: null,
                sale_channel: null,
                platform_fees_eur: null,
                shipping_cost_eur: null,
            });
            if (error) throw new Error(error);

            setItems(prev => prev.map(item => item.id === id ? {
                ...item,
                status: 'in_stock',
                salePriceEur: undefined,
                saleDate: undefined,
                saleChannel: undefined,
                platformFeesEur: undefined,
                shippingCostEur: undefined
            } : item));
            fetchStats();
            showToast('Verkauf storniert', 'success');
        } catch (e) {
            console.error('Error canceling sale:', e);
            showToast('Fehler beim Stornieren des Verkaufs', 'error');
        }
    };

    const handleDeleteExpense = async (expenseId: string) => {
        if (!confirm('Ausgabe wirklich löschen?')) return;
        try {
            const { error } = await api.deleteExpense(expenseId);
            if (error) throw new Error(error);
            showToast('Ausgabe erfolgreich gelöscht', 'success');
            setView('finances');
            setSelectedExpense(null);
        } catch (e: any) {
            console.error('Error deleting expense:', e);
            showToast('Fehler beim Löschen der Ausgabe', 'error');
        }
    };

    const handleLogout = async () => {
        if (supabase) await supabase.auth.signOut();
        setUser(null);
        setView('login');
    };

    const renderContent = () => {
        if (view === 'login') return <LoginView onLogin={(u) => { setUser(u); setView('dashboard'); }} />;

        if (view === 'dashboard') return (
            <DashboardView
                items={items}
                onViewInventory={() => setView('inventory')}
                onAddItem={() => setView('add-item')}
                userEmail={user?.email}
                onLogout={handleLogout}
                onRefresh={() => loadData(0, true)}
                serverStats={dashboardStats}
                currentUser={user}
                currentOrgId={orgId}
                onOpenSettings={() => setView('settings')}
            />
        );

        if (view === 'inventory') return (
            <InventoryView
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
                onToggleItemSelection={handleToggleItemSelection}
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
                    fetchStats();
                    showToast('Zertifikat verkauft', 'success');
                }}
                onCancel={() => setView('dashboard')}
                currentOrgId={orgId}
            />
        );

        if (view === 'add-item') return (
            <AddItemView
                onSave={handleCreateItem}
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
                    onSave={(data) => handleUpdateItem(selectedItemId, data)}
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
                    onConfirm={(data, certSalePrices, standaloneCerts) => handleSellItem(selectedItemId, data, certSalePrices, standaloneCerts)}
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
                    onConfirm={handleBulkSell}
                    onCancel={() => {
                        setView('inventory');
                    }}
                />
            );
        }

        if (view === 'item-detail' && selectedItemId) {
            const item = items.find(i => i.id === selectedItemId);
            if (!item) return null;
            return (
                <ItemDetailView
                    item={item}
                    onBack={() => setView('inventory')}
                    onSell={() => setView('sell-item')}
                    onDelete={() => handleDeleteItem(selectedItemId)}
                    onReserve={handleReserveItem}
                    onCancelReservation={() => handleCancelReservation(selectedItemId)}
                    onCancelSale={() => handleCancelSale(selectedItemId)}
                    onEdit={() => setView('edit-item')}
                />
            );
        }

        if (view === 'settings') return (
            <SettingsView
                onBack={() => setView('dashboard')}
                onExport={() => setView('export')}
                currentOrgId={orgId}
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
