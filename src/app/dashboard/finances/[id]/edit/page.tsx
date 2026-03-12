'use client';

import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../../hooks/useAuth';
import { useFinance } from '../../../../../hooks/useFinance';
import { AddExpenseView } from '../../../../../components/views/AddExpenseView';

export default function EditExpensePage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const { orgId } = useAuth();
    const { selectedExpense, setSelectedExpense } = useFinance();

    if (!selectedExpense || selectedExpense.id !== id) {
        router.replace('/dashboard/finances');
        return null;
    }

    return (
        <AddExpenseView
            currentOrgId={orgId}
            initialData={selectedExpense}
            onSave={() => {
                setSelectedExpense(null);
                router.push('/dashboard/finances');
            }}
            onCancel={() => router.back()}
        />
    );
}
