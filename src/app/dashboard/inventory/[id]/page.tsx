'use client';

import { useRouter, useParams } from 'next/navigation';
import { useInventory } from '../../../../hooks/useInventory';
import { useFinance } from '../../../../hooks/useFinance';
import { useToast } from '../../../../components/ui/Toast';
import { ItemDetailView } from '../../../../components/views/ItemDetailView';

export default function ItemDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const { items, deleteItem, cancelSale } = useInventory();
    const { refreshStats } = useFinance();
    const { showToast } = useToast();

    const item = items.find(i => i.id === id);

    if (!item) {
        // Item not found — could be loading or stale navigation; go back
        router.replace('/dashboard/inventory');
        return null;
    }

    const handleDelete = async () => {
        if (!confirm('Wirklich löschen?')) return;
        const ok = await deleteItem(id);
        if (ok) {
            refreshStats();
            showToast('Artikel gelöscht', 'success');
            router.push('/dashboard/inventory');
        } else {
            showToast('Fehler beim Löschen', 'error');
        }
    };

    const handleCancelSale = async () => {
        if (!confirm('Verkauf wirklich stornieren? Der Artikel wird wieder als "Im Lager" markiert.')) return;
        const ok = await cancelSale(id);
        if (ok) {
            refreshStats();
            showToast('Verkauf storniert', 'success');
        } else {
            showToast('Fehler beim Stornieren des Verkaufs', 'error');
        }
    };

    return (
        <ItemDetailView
            item={item}
            onBack={() => router.push('/dashboard/inventory')}
            onSell={() => router.push(`/dashboard/inventory/${id}/sell`)}
            onDelete={handleDelete}
            onCancelSale={handleCancelSale}
            onEdit={() => router.push(`/dashboard/inventory/${id}/edit`)}
        />
    );
}
