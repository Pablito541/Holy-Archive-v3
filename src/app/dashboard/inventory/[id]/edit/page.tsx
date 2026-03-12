'use client';

import { useRouter, useParams } from 'next/navigation';
import { useInventory } from '../../../../../hooks/useInventory';
import { useAuth } from '../../../../../hooks/useAuth';
import { useFinance } from '../../../../../hooks/useFinance';
import { useToast } from '../../../../../components/ui/Toast';
import { AddItemView } from '../../../../../components/views/AddItemView';

export default function EditItemPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const { items, updateItem } = useInventory();
    const { orgId } = useAuth();
    const { refreshStats } = useFinance();
    const { showToast } = useToast();

    const item = items.find(i => i.id === id);

    if (!item) {
        router.replace('/dashboard/inventory');
        return null;
    }

    const handleSave = async (data: Parameters<typeof updateItem>[1]) => {
        const ok = await updateItem(id, data);
        if (ok) {
            refreshStats();
            showToast('Artikel aktualisiert', 'success');
            router.push(`/dashboard/inventory/${id}`);
        } else {
            showToast('Fehler beim Aktualisieren', 'error');
        }
    };

    return (
        <AddItemView
            initialData={item}
            onSave={handleSave}
            onCancel={() => router.back()}
            currentOrgId={orgId}
        />
    );
}
