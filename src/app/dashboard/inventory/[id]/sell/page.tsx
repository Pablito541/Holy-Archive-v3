'use client';

import { useRouter, useParams } from 'next/navigation';
import { useInventory } from '../../../../../hooks/useInventory';
import { useFinance } from '../../../../../hooks/useFinance';
import { useUI } from '../../../../../hooks/useUI';
import { useToast } from '../../../../../components/ui/Toast';
import { SellItemView } from '../../../../../components/views/SellItemView';

export default function SellItemPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const { items, sellItem } = useInventory();
    const { certificateProviders, refreshStats } = useFinance();
    const { setSelectionMode } = useUI();
    const { showToast } = useToast();

    const item = items.find(i => i.id === id);

    if (!item) {
        router.replace('/dashboard/inventory');
        return null;
    }

    const handleConfirm = async (saleData: any, certSalePrices?: Record<string, number>, standaloneCerts?: any[]) => {
        const ok = await sellItem(id, saleData, certSalePrices, standaloneCerts, certificateProviders);
        if (ok) {
            refreshStats();
            showToast('Artikel als verkauft markiert', 'success');
            setSelectionMode('view');
            router.push('/dashboard/inventory');
        } else {
            showToast('Fehler beim Verkauf', 'error');
        }
    };

    return (
        <SellItemView
            item={item}
            certificateProviders={certificateProviders}
            onConfirm={handleConfirm}
            onCancel={() => router.back()}
        />
    );
}
