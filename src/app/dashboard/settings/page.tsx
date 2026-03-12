'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { useFinance } from '../../../hooks/useFinance';
import { SettingsView } from '../../../components/views/SettingsView';

export default function SettingsPage() {
    const router = useRouter();
    const { orgId } = useAuth();
    const { refreshCertificateProviders } = useFinance();

    return (
        <SettingsView
            onBack={() => {
                refreshCertificateProviders();
                router.push('/dashboard');
            }}
            onExport={() => router.push('/dashboard/settings/export')}
            currentOrgId={orgId}
        />
    );
}
