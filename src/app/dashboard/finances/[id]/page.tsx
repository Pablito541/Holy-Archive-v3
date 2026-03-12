'use client';

import { useRouter, useParams } from 'next/navigation';
import { useFinance } from '../../../../hooks/useFinance';
import { useToast } from '../../../../components/ui/Toast';
import { ExpenseDetailView } from '../../../../components/views/ExpenseDetailView';

export default function ExpenseDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const { selectedExpense, selectedExpenseCategoryName, deleteExpense, setSelectedExpense } = useFinance();
    const { showToast } = useToast();

    if (!selectedExpense || selectedExpense.id !== id) {
        // Expense not in state — redirect back to finances
        router.replace('/dashboard/finances');
        return null;
    }

    const handleDelete = async () => {
        if (!confirm('Ausgabe wirklich löschen?')) return;
        const ok = await deleteExpense(id);
        if (ok) {
            showToast('Ausgabe erfolgreich gelöscht', 'success');
            setSelectedExpense(null);
            router.push('/dashboard/finances');
        } else {
            showToast('Fehler beim Löschen der Ausgabe', 'error');
        }
    };

    return (
        <ExpenseDetailView
            expense={selectedExpense}
            categoryName={selectedExpenseCategoryName}
            onBack={() => router.push('/dashboard/finances')}
            onEdit={() => router.push(`/dashboard/finances/${id}/edit`)}
            onDelete={handleDelete}
        />
    );
}
