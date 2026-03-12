'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { useFinance } from '../../../hooks/useFinance';
import { FinanzenView } from '../../../components/views/FinanzenView';
import { Expense } from '../../../types';

export default function FinancesPage() {
    const router = useRouter();
    const { orgId } = useAuth();
    const { setSelectedExpense, setSelectedExpenseCategoryName } = useFinance();

    return (
        <FinanzenView
            currentOrgId={orgId}
            onExpenseClick={(expense: Expense, catName: string) => {
                setSelectedExpense(expense);
                setSelectedExpenseCategoryName(catName);
                router.push(`/dashboard/finances/${expense.id}`);
            }}
        />
    );
}
