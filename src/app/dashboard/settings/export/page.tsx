'use client';

import { useRouter } from 'next/navigation';
import { useInventory } from '../../../../hooks/useInventory';
import { ExportView } from '../../../../components/views/ExportView';

export default function ExportPage() {
    const router = useRouter();
    const { items } = useInventory();

    return (
        <div className="min-h-screen bg-[#fafaf9] dark:bg-black">
            <ExportView
                items={items}
                onBack={() => router.push('/dashboard/settings')}
            />
        </div>
    );
}
