'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { useStats } from './StatsProvider';
import { Item, ItemStatus, CertificateProvider } from '../types';
import { useToast } from '../components/ui/Toast';

interface InventoryContextType {
    items: Item[];
    setItems: React.Dispatch<React.SetStateAction<Item[]>>;
    page: number;
    hasMore: boolean;
    totalCount: number;
    inventoryFilter: ItemStatus;
    setInventoryFilter: (filter: ItemStatus) => void;
    selectionMode: 'view' | 'sell' | 'bulk_sell';
    setSelectionMode: (mode: 'view' | 'sell' | 'bulk_sell') => void;
    selectedItemIds: Set<string>;
    setSelectedItemIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    certificateProviders: CertificateProvider[];

    isLoading: boolean;
    loadData: (pageToLoad?: number, reset?: boolean, filterStatus?: ItemStatus) => Promise<void>;
    handleLoadMore: () => void;
    fetchCertificateProviders: () => void;

    // CRUD Operations
    createItem: (data: Partial<Item>, newCertificate?: { providerId: string, costEur: number }) => Promise<void>;
    updateItem: (id: string, data: Partial<Item>) => Promise<void>;
    deleteItem: (id: string) => Promise<void>;
    sellItem: (id: string, saleData: any, certSalePrices?: Record<string, number>, standaloneCertificates?: any[]) => Promise<void>;
    bulkSell: (data: any) => Promise<void>;
    toggleItemSelection: (id: string) => void;
    reserveItem: (id: string, name: string, days: number) => Promise<void>;
    cancelReservation: (id: string) => Promise<void>;
    cancelSale: (id: string) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const PAGE_SIZE = 50;

export function InventoryProvider({ children }: { children: ReactNode }) {
    const { user, orgId } = useAuth();
    const { fetchStats } = useStats();
    const { showToast } = useToast();

    const [items, setItems] = useState<Item[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [inventoryFilter, setInventoryFilter] = useState<ItemStatus>('in_stock');
    const [selectionMode, setSelectionMode] = useState<'view' | 'sell' | 'bulk_sell'>('view');
    const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
    const [certificateProviders, setCertificateProviders] = useState<CertificateProvider[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchCertificateProviders = useCallback(async () => {
        if (!supabase || !orgId) return;
        const { data, error } = await supabase
            .from('certificate_providers')
            .select('*')
            .eq('organization_id', orgId)
            .order('name')
            .limit(100);

        if (!error && data) {
            setCertificateProviders(data as CertificateProvider[]);
        }
    }, [orgId]);

    const loadData = useCallback(async (pageToLoad: number = 0, reset: boolean = false, filterStatus?: ItemStatus) => {
        if (!supabase || !user || !orgId) return;

        const currentFilter = filterStatus || inventoryFilter;
        setIsLoading(true);

        try {
            if (reset) {
                fetchStats();
            }

            const from = pageToLoad * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            let query = supabase
                .from('items')
                .select('*, item_certificates(*, provider:certificate_providers(*))', { count: 'exact' })
                .eq('organization_id', orgId)
                .eq('status', currentFilter);

            if (currentFilter === 'sold') {
                query = query.order('sale_date', { ascending: false, nullsFirst: false });
            } else {
                query = query.order('created_at', { ascending: false });
            }

            const { data, error, count } = await query.range(from, to);

            if (data && !error) {
                const mappedItems: Item[] = data.map((d: any) => ({
                    id: d.id,
                    brand: d.brand,
                    model: d.model,
                    category: d.category,
                    condition: d.condition,
                    status: d.status,
                    purchasePriceEur: d.purchase_price_eur,
                    purchaseDate: d.purchase_date,
                    purchaseSource: d.purchase_source,
                    salePriceEur: d.sale_price_eur,
                    saleDate: d.sale_date,
                    saleChannel: d.sale_channel,
                    platformFeesEur: d.platform_fees_eur,
                    shippingCostEur: d.shipping_cost_eur,
                    reservedFor: d.reserved_for,
                    reservedUntil: d.reserved_until,
                    certificates: d.item_certificates?.map((c: any) => ({
                        id: c.id,
                        organization_id: c.organization_id,
                        item_id: c.item_id,
                        certificate_provider_id: c.certificate_provider_id,
                        cost_eur: c.cost_eur,
                        sale_price_eur: c.sale_price_eur,
                        created_at: c.created_at,
                        provider: c.provider
                    })) || [],
                    imageUrls: d.image_urls || [],
                    notes: d.notes,
                    createdAt: d.created_at
                }));

                if (count !== null) setTotalCount(count);

                if (reset) {
                    setItems(mappedItems);
                    setHasMore(mappedItems.length < (count || 0));
                } else {
                    setItems(prev => {
                        const newItems = [...prev, ...mappedItems];
                        setHasMore(newItems.length < (count || totalCount));
                        return newItems;
                    });
                }

                if (count === null) {
                    setHasMore(data.length === PAGE_SIZE);
                }
            }
        } catch (e) {
            console.error('Error loading data:', e);
        } finally {
            setIsLoading(false);
        }
    }, [user, orgId, inventoryFilter, totalCount, fetchStats]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        loadData(nextPage, false);
    };

    const toggleItemSelection = (id: string) => {
        setSelectedItemIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const createItem = async (data: Partial<Item>, newCertificate?: { providerId: string, costEur: number }) => {
        try {
            const dbItem = {
                user_id: user?.id,
                brand: data.brand || 'Unknown',
                model: data.model || '',
                category: data.category || 'bag',
                condition: data.condition || 'good',
                status: 'in_stock',
                purchase_price_eur: data.purchasePriceEur || 0,
                purchase_date: data.purchaseDate || new Date().toISOString(),
                purchase_source: data.purchaseSource || '',
                image_urls: data.imageUrls || [],
                notes: data.notes || ''
            };

            if (supabase) {
                const { data: inserted, error } = await supabase.from('items').insert(dbItem).select().single();

                if (error) {
                    showToast(`Fehler beim Erstellen: ${error.message}`, 'error');
                    return;
                }

                if (inserted) {
                    let newCertificates: any[] = [];
                    if (newCertificate && orgId) {
                        const { data: certInserted, error: certError } = await supabase.from('item_certificates').insert({
                            organization_id: orgId,
                            item_id: inserted.id,
                            certificate_provider_id: newCertificate.providerId,
                            cost_eur: newCertificate.costEur
                        }).select().single();

                        if (!certError && certInserted) {
                            newCertificates.push({
                                id: certInserted.id,
                                organization_id: certInserted.organization_id,
                                item_id: certInserted.item_id,
                                certificate_provider_id: certInserted.certificate_provider_id,
                                cost_eur: certInserted.cost_eur,
                                sale_price_eur: certInserted.sale_price_eur,
                                created_at: certInserted.created_at
                            });
                        }
                    }

                    const newItem: Item = {
                        id: inserted.id,
                        brand: inserted.brand,
                        model: inserted.model,
                        category: inserted.category,
                        condition: inserted.condition,
                        status: inserted.status,
                        purchasePriceEur: inserted.purchase_price_eur,
                        purchaseDate: inserted.purchase_date,
                        purchaseSource: inserted.purchase_source,
                        salePriceEur: inserted.sale_price_eur,
                        saleDate: inserted.sale_date,
                        saleChannel: inserted.sale_channel,
                        platformFeesEur: inserted.platform_fees_eur,
                        shippingCostEur: inserted.shipping_cost_eur,
                        reservedFor: inserted.reserved_for,
                        reservedUntil: inserted.reserved_until,
                        certificates: newCertificates,
                        imageUrls: inserted.image_urls || [],
                        notes: inserted.notes,
                        createdAt: inserted.created_at
                    };
                    setItems(prev => [newItem, ...prev]);
                    fetchStats();
                    showToast('Artikel erfolgreich erstellt', 'success');
                }
            }
        } catch (e: any) {
            showToast('Ein unerwarteter Fehler ist aufgetreten', 'error');
        }
    };

    const updateItem = async (id: string, data: Partial<Item>) => {
        try {
            if (supabase) {
                const dbUpdate = {
                    brand: data.brand,
                    model: data.model,
                    category: data.category,
                    condition: data.condition,
                    purchase_price_eur: data.purchasePriceEur,
                    purchase_date: data.purchaseDate,
                    purchase_source: data.purchaseSource,
                    image_urls: data.imageUrls,
                    notes: data.notes
                };

                const { error } = await supabase.from('items').update(dbUpdate).eq('id', id);
                if (error) throw error;
            }

            setItems(prev => prev.map(item => item.id === id ? { ...item, ...data } : item));
            fetchStats();
            showToast('Artikel aktualisiert', 'success');
        } catch (e: any) {
            showToast('Fehler beim Aktualisieren', 'error');
        }
    };

    const deleteItem = async (id: string) => {
        if (!confirm('Wirklich löschen?')) return;
        try {
            if (supabase) {
                const { error } = await supabase.from('items').update({ deleted_at: new Date().toISOString() }).eq('id', id);
                if (error) throw error;
            }
            setItems(prev => prev.filter(i => i.id !== id));
            fetchStats();
            showToast('Artikel gelöscht', 'success');
        } catch (e) {
            showToast('Fehler beim Löschen', 'error');
        }
    };

    // Keep all other sell/reserve functions identical, simply adapting their state calls
    const sellItem = async (id: string, saleData: any, certSalePrices?: Record<string, number>, standaloneCertificates?: any[]) => {
        try {
            if (!supabase) throw new Error('Supabase client not initialized');

            const { error } = await supabase.from('items').update({
                status: 'sold',
                sale_price_eur: saleData.salePriceEur,
                sale_date: saleData.saleDate,
                sale_channel: saleData.saleChannel,
                platform_fees_eur: saleData.platformFeesEur,
                shipping_cost_eur: saleData.shippingCostEur
            }).eq('id', id);

            if (error) throw error;

            if (certSalePrices && supabase) {
                for (const [certId, price] of Object.entries(certSalePrices)) {
                    await supabase.from('item_certificates').update({ sale_price_eur: price }).eq('id', certId);
                }
            }

            const newCertItems: Item[] = [];
            if (standaloneCertificates && standaloneCertificates.length > 0) {
                for (const cert of standaloneCertificates) {
                    for (let i = 0; i < cert.quantity; i++) {
                        const certItemData = {
                            user_id: user?.id,
                            organization_id: orgId,
                            status: 'sold',
                            category: 'other',
                            condition: 'mint',
                            brand: cert.provider || 'Zertifikat',
                            model: 'Zertifikat',
                            purchase_price_eur: cert.costEur,
                            sale_price_eur: cert.salePriceEur,
                            purchase_date: saleData.saleDate,
                            sale_date: saleData.saleDate,
                            sale_channel: saleData.saleChannel,
                            buyer: saleData.buyer || null,
                            image_urls: (() => {
                                const prov = certificateProviders.find(p => p.name === cert.provider);
                                return prov?.image_url ? [prov.image_url] : [];
                            })(),
                            created_at: new Date().toISOString(),
                        };

                        const { data: insertedCert, error } = await supabase.from('items').insert([certItemData]).select().single();
                        if (error) throw error;

                        if (insertedCert) {
                            newCertItems.push({
                                id: insertedCert.id,
                                category: insertedCert.category,
                                condition: insertedCert.condition,
                                brand: insertedCert.brand,
                                model: insertedCert.model,
                                status: insertedCert.status,
                                purchasePriceEur: insertedCert.purchase_price_eur,
                                purchaseDate: insertedCert.purchase_date,
                                purchaseSource: '',
                                salePriceEur: insertedCert.sale_price_eur,
                                saleDate: insertedCert.sale_date,
                                saleChannel: insertedCert.sale_channel,
                                buyer: insertedCert.buyer,
                                notes: '',
                                imageUrls: [],
                                createdAt: insertedCert.created_at
                            });
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
                if (newCertItems.length > 0) nextState.push(...newCertItems);
                return nextState;
            });
            fetchStats();
            showToast('Artikel als verkauft markiert', 'success');
        } catch (e: any) {
            showToast(`Fehler beim Verkauf: ${e.message}`, 'error');
        }
    };

    const bulkSell = async (data: any) => {
        try {
            if (!supabase) throw new Error('Supabase client not initialized');

            const selectedItems = items.filter(i => selectedItemIds.has(i.id));
            const count = selectedItems.length;
            if (count === 0) return;

            const pricePerItem = Math.floor((data.salePriceEur * 100) / count) / 100;
            const priceRemainder = Math.round((data.salePriceEur - pricePerItem * count) * 100) / 100;

            const feesPerItem = Math.floor((data.platformFeesEur * 100) / count) / 100;
            const feesRemainder = Math.round((data.platformFeesEur - feesPerItem * count) * 100) / 100;

            const shippingPerItem = Math.floor((data.shippingCostEur * 100) / count) / 100;
            const shippingRemainder = Math.round((data.shippingCostEur - shippingPerItem * count) * 100) / 100;

            for (let i = 0; i < selectedItems.length; i++) {
                const item = selectedItems[i];
                const isFirst = i === 0;

                const { error } = await supabase.from('items').update({
                    status: 'sold',
                    sale_price_eur: isFirst ? pricePerItem + priceRemainder : pricePerItem,
                    sale_date: data.saleDate,
                    sale_channel: data.saleChannel,
                    platform_fees_eur: isFirst ? feesPerItem + feesRemainder : feesPerItem,
                    shipping_cost_eur: isFirst ? shippingPerItem + shippingRemainder : shippingPerItem,
                    buyer: data.buyer || null
                }).eq('id', item.id);

                if (error) throw error;
            }

            const newCertItems: Item[] = [];
            if (data.certificates && data.certificates.length > 0) {
                for (const cert of data.certificates) {
                    for (let i = 0; i < cert.quantity; i++) {
                        const certItemData = {
                            user_id: user?.id,
                            organization_id: orgId,
                            status: 'sold',
                            category: 'other',
                            condition: 'mint',
                            brand: cert.provider || 'Zertifikat',
                            model: 'Zertifikat',
                            purchase_price_eur: cert.costEur,
                            sale_price_eur: cert.salePriceEur,
                            purchase_date: data.saleDate,
                            sale_date: data.saleDate,
                            sale_channel: data.saleChannel,
                            buyer: data.buyer || null,
                            image_urls: (() => {
                                const prov = certificateProviders.find(p => p.name === cert.provider);
                                return prov?.image_url ? [prov.image_url] : [];
                            })(),
                            created_at: new Date().toISOString(),
                        };

                        const { data: insertedCert, error } = await supabase.from('items').insert([certItemData]).select().single();
                        if (error) throw error;

                        if (insertedCert) {
                            newCertItems.push({
                                id: insertedCert.id,
                                category: insertedCert.category,
                                condition: insertedCert.condition,
                                brand: insertedCert.brand,
                                model: insertedCert.model,
                                status: insertedCert.status,
                                purchasePriceEur: insertedCert.purchase_price_eur,
                                purchaseDate: insertedCert.purchase_date,
                                purchaseSource: '',
                                salePriceEur: insertedCert.sale_price_eur,
                                saleDate: insertedCert.sale_date,
                                saleChannel: insertedCert.sale_channel,
                                buyer: insertedCert.buyer,
                                notes: '',
                                imageUrls: [],
                                createdAt: insertedCert.created_at
                            });
                        }
                    }
                }
            }

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
                if (newCertItems.length > 0) nextState.push(...newCertItems);
                return nextState;
            });

            fetchStats();
            showToast(`${count} Artikel als verkauft markiert`, 'success');
            setSelectedItemIds(new Set());
        } catch (e: any) {
            showToast(`Fehler beim Sammelverkauf: ${e.message}`, 'error');
        }
    };

    const reserveItem = async (id: string, name: string, days: number) => {
        try {
            const reservedUntil = new Date();
            reservedUntil.setDate(reservedUntil.getDate() + days);

            if (supabase) {
                const { error } = await supabase.from('items').update({
                    status: 'reserved',
                    reserved_for: name,
                    reserved_until: reservedUntil.toISOString()
                }).eq('id', id);
                if (error) throw error;
            }

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

    const cancelReservation = async (id: string) => {
        try {
            if (supabase) {
                const { error } = await supabase.from('items').update({
                    status: 'in_stock',
                    reserved_for: null,
                    reserved_until: null
                }).eq('id', id);
                if (error) throw error;
            }

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

    const cancelSale = async (id: string) => {
        if (!confirm('Verkauf wirklich stornieren? Der Artikel wird wieder als "Im Lager" markiert.')) return;

        try {
            if (supabase) {
                const { error } = await supabase.from('items').update({
                    status: 'in_stock',
                    sale_price_eur: null,
                    sale_date: null,
                    sale_channel: null,
                    platform_fees_eur: null,
                    shipping_cost_eur: null
                }).eq('id', id);
                if (error) throw error;
            }

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
            showToast('Fehler beim Stornieren des Verkaufs', 'error');
        }
    };

    return (
        <InventoryContext.Provider value={{
            items, setItems,
            page, hasMore, totalCount,
            inventoryFilter, setInventoryFilter,
            selectionMode, setSelectionMode,
            selectedItemIds, setSelectedItemIds,
            certificateProviders, fetchCertificateProviders,
            isLoading, loadData, handleLoadMore,
            createItem, updateItem, deleteItem,
            sellItem, bulkSell, toggleItemSelection,
            reserveItem, cancelReservation, cancelSale
        }}>
            {children}
        </InventoryContext.Provider>
    );
}

export function useInventory() {
    const context = useContext(InventoryContext);
    if (context === undefined) {
        throw new Error('useInventory must be used within an InventoryProvider');
    }
    return context;
}
