'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../hooks/useAuth';
import { useFinance } from '../../../../hooks/useFinance';
import { AddExpenseView } from '../../../../components/views/AddExpenseView';

export default function AddExpensePage() {
    const router = useRouter();
    const { orgId } = useAuth();
    const { setSelectedExpense } = useFinance();

    return (
        <AddExpenseView
            currentOrgId={orgId}
            onSave={() => {
                setSelectedExpense(null);
                router.push('/dashboard/finances');
            }}
            onCancel={() => router.back()}
        />
    );
}
