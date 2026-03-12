'use client';

import { useRouter } from 'next/navigation';
import { useInventory } from '../../../hooks/useInventory';
import { useFinance } from '../../../hooks/useFinance';
import { useUI } from '../../../hooks/useUI';
import { useToast } from '../../../components/ui/Toast';
import { BulkSellView } from '../../../components/views/BulkSellView';

export default function BulkSellPage() {
    const router = useRouter();
    const { selectedItems, selectedItemIds, bulkSell, setSelectedItemIds } = useInventory();
    const { certificateProviders, refreshStats } = useFinance();
    const { setSelectionMode } = useUI();
    const { showToast } = useToast();

    if (selectedItemIds.size === 0) {
        router.replace('/dashboard/inventory');
        return null;
    }

    const handleConfirm = async (data: Parameters<typeof bulkSell>[0]) => {
        const count = selectedItemIds.size;
        const ok = await bulkSell(data, certificateProviders);
        if (ok) {
            refreshStats();
            showToast(`${count} Artikel als verkauft markiert`, 'success');
            setSelectedItemIds(new Set());
            setSelectionMode('view');
            router.push('/dashboard/inventory');
        } else {
            showToast('Fehler beim Sammelverkauf', 'error');
        }
    };

    return (
        <BulkSellView
            items={selectedItems}
            certificateProviders={certificateProviders}
            onConfirm={handleConfirm}
            onCancel={() => router.push('/dashboard/inventory')}
        />
    );
}
