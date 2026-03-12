'use client';

import { useRouter } from 'next/navigation';
import { useInventory } from '../../../hooks/useInventory';
import { useAuth } from '../../../hooks/useAuth';
import { useFinance } from '../../../hooks/useFinance';
import { useToast } from '../../../components/ui/Toast';
import { AddItemView } from '../../../components/views/AddItemView';

export default function AddItemPage() {
    const router = useRouter();
    const { createItem } = useInventory();
    const { orgId } = useAuth();
    const { refreshStats } = useFinance();
    const { showToast } = useToast();

    const handleSave = async (data: Parameters<typeof createItem>[0], cert?: Parameters<typeof createItem>[1]) => {
        const ok = await createItem(data, cert);
        if (ok) {
            refreshStats();
            showToast('Artikel erfolgreich erstellt', 'success');
            router.push('/dashboard/inventory');
        } else {
            showToast('Fehler beim Erstellen', 'error');
        }
    };

    return (
        <AddItemView
            onSave={handleSave}
            onCancel={() => router.back()}
            currentOrgId={orgId}
        />
    );
}
