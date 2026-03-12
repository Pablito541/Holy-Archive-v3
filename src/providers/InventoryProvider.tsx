'use client';

import React, { createContext, useState, useEffect } from 'react';
import { Item, ItemStatus, CertificateProvider } from '../types';
import { api, mapDbItemToItem } from '../lib/api/client';
import { useAuth } from '../hooks/useAuth';
import { PAGE_SIZE } from '../constants';

interface InventoryContextType {
    items: Item[];
    isLoading: boolean;
    page: number;
    hasMore: boolean;
    totalCount: number;
    inventoryFilter: ItemStatus;
    inventorySearchQuery: string;
    selectedItemId: string | null;
    selectedItemIds: Set<string>;
    selectedItem: Item | undefined;
    selectedItems: Item[];
    setSelectedItemId: (id: string | null) => void;
    setSelectedItemIds: (ids: Set<string>) => void;
    setInventoryFilter: (filter: ItemStatus) => void;
    setInventorySearchQuery: (query: string) => void;
    setItems: React.Dispatch<React.SetStateAction<Item[]>>;
    loadData: (pageToLoad?: number, reset?: boolean, filterStatus?: ItemStatus) => Promise<void>;
    loadMore: () => void;
    createItem: (data: Partial<Item>, newCertificate?: { providerId: string; costEur: number }) => Promise<boolean>;
    updateItem: (id: string, data: Partial<Item>) => Promise<boolean>;
    sellItem: (id: string, saleData: any, certSalePrices?: Record<string, number>, standaloneCertificates?: { provider: string; quantity: number; costEur: number; salePriceEur: number }[], certProviders?: CertificateProvider[]) => Promise<boolean>;
    bulkSell: (data: { salePriceEur: number; saleDate: string; saleChannel: string; platformFeesEur: number; shippingCostEur: number; buyer: string; certificates?: { provider: string; quantity: number; costEur: number; salePriceEur: number }[] }, certProviders?: CertificateProvider[]) => Promise<boolean>;
    deleteItem: (id: string) => Promise<boolean>;
    cancelSale: (id: string) => Promise<boolean>;
    toggleItemSelection: (id: string) => void;
}

export const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

interface InventoryProviderProps {
    initialItems: Item[];
    children: React.ReactNode;
}

export const InventoryProvider = ({ initialItems, children }: InventoryProviderProps) => {
    const { user, orgId } = useAuth();

    const [items, setItems] = useState<Item[]>(initialItems);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(initialItems.length === PAGE_SIZE);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(false);
    const [inventoryFilter, setInventoryFilter] = useState<ItemStatus>('in_stock');
    const [inventorySearchQuery, setInventorySearchQuery] = useState('');
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

    // Derived values
    const selectedItem = items.find(i => i.id === selectedItemId);
    const selectedItems = items.filter(i => selectedItemIds.has(i.id));

    const loadData = async (pageToLoad: number = 0, reset: boolean = false, filterStatus?: ItemStatus) => {
        if (!user || !orgId) return;

        const currentFilter = filterStatus || inventoryFilter;
        setIsLoading(true);

        try {
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

    // Fetch items on mount if we don't have them yet
    useEffect(() => {
        if (user && orgId && items.length === 0) {
            loadData(0, true);
        }
    }, [user, orgId]);

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        loadData(nextPage, false);
    };

    const createItem = async (data: Partial<Item>, newCertificate?: { providerId: string; costEur: number }): Promise<boolean> => {
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
                console.error(`Error creating item: ${error}`);
                return false;
            }

            setItems(prev => [mapDbItemToItem(inserted), ...prev]);
            return true;
        } catch (e: any) {
            console.error('Unexpected error creating item:', e);
            return false;
        }
    };

    const updateItem = async (id: string, data: Partial<Item>): Promise<boolean> => {
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
            return true;
        } catch (e: any) {
            console.error('Error updating item:', e);
            return false;
        }
    };

    const sellItem = async (
        id: string,
        saleData: any,
        certSalePrices?: Record<string, number>,
        standaloneCertificates?: { provider: string; quantity: number; costEur: number; salePriceEur: number }[],
        certProviders?: CertificateProvider[]
    ): Promise<boolean> => {
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

            // Create standalone certificate items if any
            const newCertItems: Item[] = [];
            if (standaloneCertificates && standaloneCertificates.length > 0) {
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
                                const prov = certProviders?.find(p => p.name === cert.provider);
                                return prov?.image_url ? [prov.image_url] : [];
                            })(),
                        });

                        if (inserted) {
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

            return true;
        } catch (e: any) {
            console.error('Error selling item:', e);
            return false;
        }
    };

    const bulkSell = async (
        data: { salePriceEur: number; saleDate: string; saleChannel: string; platformFeesEur: number; shippingCostEur: number; buyer: string; certificates?: { provider: string; quantity: number; costEur: number; salePriceEur: number }[] },
        certProviders?: CertificateProvider[]
    ): Promise<boolean> => {
        try {
            const bulkItems = items.filter(i => selectedItemIds.has(i.id));
            const count = bulkItems.length;
            if (count === 0) return false;

            // Distribute price
            const pricePerItem = Math.floor((data.salePriceEur * 100) / count) / 100;
            const priceRemainder = Math.round((data.salePriceEur - pricePerItem * count) * 100) / 100;

            const feesPerItem = Math.floor((data.platformFeesEur * 100) / count) / 100;
            const feesRemainder = Math.round((data.platformFeesEur - feesPerItem * count) * 100) / 100;

            const shippingPerItem = Math.floor((data.shippingCostEur * 100) / count) / 100;
            const shippingRemainder = Math.round((data.shippingCostEur - shippingPerItem * count) * 100) / 100;

            // Sell each item via API
            for (let i = 0; i < bulkItems.length; i++) {
                const item = bulkItems[i];
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
                                const prov = certProviders?.find(p => p.name === cert.provider);
                                return prov?.image_url ? [prov.image_url] : [];
                            })(),
                        });

                        if (createErr || !inserted) {
                            console.error('Error creating certificate item:', createErr);
                            throw new Error(createErr || 'Failed to create certificate item');
                        }

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
                    const idx = bulkItems.findIndex(s => s.id === item.id);
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

            return true;
        } catch (e: any) {
            console.error('Error in bulk sell:', e);
            return false;
        }
    };

    const deleteItem = async (id: string): Promise<boolean> => {
        try {
            const { error } = await api.deleteItem(id);
            if (error) throw new Error(error);
            setItems(prev => prev.filter(i => i.id !== id));
            return true;
        } catch (e) {
            console.error('Error deleting item:', e);
            return false;
        }
    };

    const cancelSale = async (id: string): Promise<boolean> => {
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
            return true;
        } catch (e) {
            console.error('Error canceling sale:', e);
            return false;
        }
    };

    const toggleItemSelection = (id: string) => {
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

    const value: InventoryContextType = {
        items,
        isLoading,
        page,
        hasMore,
        totalCount,
        inventoryFilter,
        inventorySearchQuery,
        selectedItemId,
        selectedItemIds,
        selectedItem,
        selectedItems,
        setSelectedItemId,
        setSelectedItemIds,
        setInventoryFilter,
        setInventorySearchQuery,
        setItems,
        loadData,
        loadMore,
        createItem,
        updateItem,
        sellItem,
        bulkSell,
        deleteItem,
        cancelSale,
        toggleItemSelection,
    };

    return (
        <InventoryContext.Provider value={value}>
            {children}
        </InventoryContext.Provider>
    );
};
