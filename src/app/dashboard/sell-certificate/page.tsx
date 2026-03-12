'use client';

import { useRouter } from 'next/navigation';
import { useInventory } from '../../../hooks/useInventory';
import { useAuth } from '../../../hooks/useAuth';
import { useFinance } from '../../../hooks/useFinance';
import { useToast } from '../../../components/ui/Toast';
import { SellCertificateView } from '../../../components/views/SellCertificateView';

export default function SellCertificatePage() {
    const router = useRouter();
    const { setItems } = useInventory();
    const { orgId } = useAuth();
    const { refreshStats } = useFinance();
    const { showToast } = useToast();

    return (
        <SellCertificateView
            onSave={(newItem) => {
                setItems(prev => [newItem, ...prev]);
                refreshStats();
                showToast('Zertifikat verkauft', 'success');
                router.push('/dashboard');
            }}
            onCancel={() => router.push('/dashboard')}
            currentOrgId={orgId}
        />
    );
}
