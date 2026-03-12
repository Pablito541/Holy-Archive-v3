'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useInventory } from '../../hooks/useInventory';
import { useFinance } from '../../hooks/useFinance';
import { useUI } from '../../hooks/useUI';
import { useToast } from '../../components/ui/Toast';
import { DashboardView } from '../../components/views/DashboardView';

export default function DashboardPage() {
    const router = useRouter();
    const { user, orgId, logout } = useAuth();
    const { items, loadData } = useInventory();
    const { dashboardStats, refreshCertificateProviders } = useFinance();
    const { setShowActionMenu } = useUI();
    const { showToast } = useToast();

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    return (
        <DashboardView
            items={items}
            onViewInventory={() => router.push('/dashboard/inventory')}
            onAddItem={() => setShowActionMenu(true)}
            userEmail={user?.email}
            onLogout={handleLogout}
            onRefresh={() => loadData(0, true)}
            serverStats={dashboardStats}
            currentUser={user}
            currentOrgId={orgId}
            onOpenSettings={() => router.push('/dashboard/settings')}
        />
    );
}
