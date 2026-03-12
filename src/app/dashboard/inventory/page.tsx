'use client';

import { useRouter } from 'next/navigation';
import { useInventory } from '../../../hooks/useInventory';
import { useUI } from '../../../hooks/useUI';
import { useToast } from '../../../components/ui/Toast';
import { InventoryView } from '../../../components/views/InventoryView';

export default function InventoryPage() {
    const router = useRouter();
    const { items, loadData, loadMore, hasMore, inventoryFilter, setInventoryFilter, inventorySearchQuery, setInventorySearchQuery, selectedItemIds, toggleItemSelection, setSelectedItemIds } = useInventory();
    const { selectionMode, setSelectionMode, scrollPositionRef } = useUI();
    const { showToast } = useToast();

    return (
        <InventoryView
            items={items}
            onSelectItem={(id) => {
                scrollPositionRef.current = window.scrollY;
                window.scrollTo(0, 0);
                router.push(`/dashboard/inventory/${id}`);
            }}
            selectionMode={selectionMode}
            onLoadMore={loadMore}
            hasMore={hasMore}
            onRefresh={() => loadData(0, true)}
            filter={inventoryFilter}
            onFilterChange={(f) => {
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
                router.push('/dashboard/bulk-sell');
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
}
