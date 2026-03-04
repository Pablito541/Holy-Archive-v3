import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Repeat, Filter, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Expense, ExpenseCategory } from '../../types';

interface FinanzenViewProps {
    currentOrgId: string | null;
    onExpenseClick?: (expense: Expense, categoryName: string) => void;
}

export const FinanzenView = ({ currentOrgId, onExpenseClick }: FinanzenViewProps) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [prevExpenses, setPrevExpenses] = useState<Expense[]>([]);
    const [categories, setCategories] = useState<Record<string, ExpenseCategory>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const fetchExpensesForMonth = async (year: number, month: number) => {
        if (!supabase || !currentOrgId) return [];

        const startOfMonth = new Date(year, month, 1).toISOString();
        const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

        // Query 1: Normal expenses logic in this month
        const { data: normalData, error: normalErr } = await supabase
            .from('expenses')
            .select('*')
            .eq('organization_id', currentOrgId)
            .eq('is_recurring', false)
            .gte('date', startOfMonth)
            .lte('date', endOfMonth);

        // Query 2: All recurring expenses that started before or during this month
        const { data: recurringData, error: recurringErr } = await supabase
            .from('expenses')
            .select('*')
            .eq('organization_id', currentOrgId)
            .eq('is_recurring', true)
            .lte('date', endOfMonth);

        if (normalErr || recurringErr) {
            console.error('Error fetching expenses:', normalErr, recurringErr);
            return [];
        }

        const allData = [...(normalData || [])];

        // Process recurring to "project" them into this month
        if (recurringData) {
            recurringData.forEach(exp => {
                const expDate = new Date(exp.date);
                const monthDiff = (year - expDate.getFullYear()) * 12 + (month - expDate.getMonth());

                // If it's yearly and the month doesn't match, skip
                if (exp.recurring_interval === 'yearly' && monthDiff % 12 !== 0) return;
                // If it's semi_annually and the month diff isn't a multiple of 6, skip
                if (exp.recurring_interval === 'semi_annually' && monthDiff % 6 !== 0) return;
                // If it's quarterly and the month diff isn't a multiple of 3, skip
                if (exp.recurring_interval === 'quarterly' && monthDiff % 3 !== 0) return;

                // Adjust date to project into the currently viewed month
                const projectedDate = new Date(year, month, expDate.getDate());

                // Only include if projected date is actually in the month or if we cap it at end of month
                // (e.g. 31st projecting into Feb becomes March 3rd. Better to clamp to last day of month)
                const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
                const actualDay = Math.min(expDate.getDate(), lastDayOfMonth);
                const clampedProjectedDate = new Date(Date.UTC(year, month, actualDay));

                allData.push({
                    ...exp,
                    // Format as YYYY-MM-DD
                    date: clampedProjectedDate.toISOString().split('T')[0]
                });
            });
        }

        return allData;
    };

    useEffect(() => {
        const loadCategories = async () => {
            if (!supabase || !currentOrgId) return;
            const { data } = await supabase.from('expense_categories').select('*').eq('organization_id', currentOrgId);
            if (data) {
                const map: Record<string, ExpenseCategory> = {};
                data.forEach(c => map[c.id] = c);
                setCategories(map);
            }
        };
        loadCategories();
    }, [currentOrgId]);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            const data = await fetchExpensesForMonth(currentYear, currentMonth);

            // Previous month for comparison
            let prevMonth = currentMonth - 1;
            let prevYear = currentYear;
            if (prevMonth < 0) {
                prevMonth = 11;
                prevYear--;
            }
            const prevData = await fetchExpensesForMonth(prevYear, prevMonth);

            setExpenses(data);
            setPrevExpenses(prevData);
            setIsLoading(false);
        };
        loadData();
    }, [currentYear, currentMonth, currentOrgId]);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
        setSelectedCategoryId(null);
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
        setSelectedCategoryId(null);
    };

    // Calculate totals
    const currentTotal = useMemo(() => expenses.reduce((acc, curr) => acc + curr.amount_eur, 0), [expenses]);
    const prevTotal = useMemo(() => prevExpenses.reduce((acc, curr) => acc + curr.amount_eur, 0), [prevExpenses]);

    const diffPercent = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : (currentTotal > 0 ? 100 : 0);

    // Group logic
    const filteredExpenses = selectedCategoryId
        ? expenses.filter(e => e.category_id === selectedCategoryId)
        : expenses;

    // Sort descending by date
    filteredExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const groupedExpenses = useMemo(() => {
        const groups: Record<string, Expense[]> = {};
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        filteredExpenses.forEach(exp => {
            let key = exp.date;
            if (exp.date === today) key = 'Heute';
            else if (exp.date === yesterday) key = 'Gestern';
            else {
                const [y, m, d] = exp.date.split('-');
                key = `${d}.${m}.${y}`;
            }

            if (!groups[key]) groups[key] = [];
            groups[key].push(exp);
        });
        return groups;
    }, [filteredExpenses]);

    // Categories aggregation
    const categoryTotals = useMemo(() => {
        const totals: Record<string, number> = {};
        expenses.forEach(e => {
            if (!totals[e.category_id]) totals[e.category_id] = 0;
            totals[e.category_id] += e.amount_eur;
        });
        return Object.entries(totals).sort((a, b) => b[1] - a[1]); // sort desc by amount
    }, [expenses]);

    const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

    return (
        <div className="min-h-screen bg-[#fafaf9] dark:bg-black font-sans pb-32">
            {/* Header */}
            <div className="bg-white dark:bg-zinc-900 border-b border-stone-100 dark:border-zinc-800 sticky top-0 z-40">
                <div className="max-w-md mx-auto px-6 py-4 flex items-center justify-between">
                    <button onClick={handlePrevMonth} className="p-2 -ml-2 rounded-full hover:bg-stone-50 dark:hover:bg-zinc-800 transition-colors">
                        <ChevronLeft className="w-5 h-5 text-stone-500" />
                    </button>
                    <span className="font-serif font-bold text-lg text-stone-900 dark:text-zinc-50">
                        {monthNames[currentMonth]} {currentYear}
                    </span>
                    <button onClick={handleNextMonth} className="p-2 -mr-2 rounded-full hover:bg-stone-50 dark:hover:bg-zinc-800 transition-colors">
                        <ChevronRight className="w-5 h-5 text-stone-500" />
                    </button>
                </div>

                {/* Totals Display */}
                <div className="max-w-md mx-auto px-6 pb-6 pt-2">
                    <div className="flex flex-col items-center">
                        <span className="text-sm font-medium text-stone-400 dark:text-zinc-500 mb-1">Ausgaben diesen Monat</span>
                        <div className="text-4xl font-serif font-black text-stone-900 dark:text-zinc-50">
                            {currentTotal.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                        </div>

                        <div className={`mt-2 flex items-center space-x-1 text-sm font-medium px-2.5 py-1 rounded-full ${diffPercent > 0 ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                            : diffPercent < 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                                : 'bg-stone-100 text-stone-500 dark:bg-zinc-800 dark:text-zinc-400'
                            }`}>
                            {diffPercent > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : diffPercent < 0 ? <ArrowDownRight className="w-3.5 h-3.5" /> : null}
                            <span>{Math.abs(diffPercent).toFixed(1)}% zum Vormonat</span>
                        </div>
                    </div>
                </div>

                {/* Category Chips */}
                {!isLoading && categoryTotals.length > 0 && (
                    <div className="overflow-x-auto pb-4 pt-2 hide-scrollbar">
                        <div className="flex space-x-2 px-6 min-w-max">
                            <button
                                onClick={() => setSelectedCategoryId(null)}
                                className={`px-4 py-2 rounded-[20px] text-sm font-bold transition-all border ${selectedCategoryId === null
                                    ? 'bg-stone-900 text-white border-stone-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
                                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800 dark:hover:bg-zinc-800'
                                    }`}
                            >
                                Alle Ausgaben
                            </button>
                            {categoryTotals.map(([catId, amount]) => (
                                <button
                                    key={catId}
                                    onClick={() => setSelectedCategoryId(selectedCategoryId === catId ? null : catId)}
                                    className={`px-4 py-2 rounded-[20px] text-sm flex items-center space-x-2 transition-all border ${selectedCategoryId === catId
                                        ? 'bg-stone-900 text-white border-stone-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
                                        : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800 dark:hover:bg-zinc-800'
                                        }`}
                                >
                                    <span className="font-bold">{categories[catId]?.name || 'Unbekannt'}</span>
                                    <span className={selectedCategoryId === catId ? 'opacity-80' : 'text-stone-400 dark:text-zinc-500'}>
                                        {amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <main className="max-w-md mx-auto px-6 py-6">
                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
                    </div>
                ) : filteredExpenses.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-stone-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Filter className="w-8 h-8 text-stone-300 dark:text-zinc-600" />
                        </div>
                        <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-zinc-50 mb-1">Keine Ausgaben</h3>
                        <p className="text-stone-500 dark:text-zinc-400">In diesem Monat wurden keine Ausgaben erfasst.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {Object.entries(groupedExpenses).map(([dateLabel, exps]) => (
                            <div key={dateLabel}>
                                <h3 className="text-xs font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-widest mb-3 pl-2">
                                    {dateLabel}
                                </h3>
                                <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-stone-100 dark:border-zinc-800/80 overflow-hidden divide-y divide-stone-50 dark:divide-zinc-800">
                                    {exps.map((e, idx) => (
                                        <div
                                            key={e.id + '-' + idx}
                                            onClick={() => onExpenseClick && onExpenseClick(e, categories[e.category_id]?.name || 'Unbekannt')}
                                            className={`p-4 flex justify-between items-center transition-colors hover:bg-stone-50 dark:hover:bg-zinc-800/50 ${onExpenseClick ? 'cursor-pointer active:scale-[0.98]' : ''}`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-zinc-800 flex items-center justify-center">
                                                    <span className="font-bold text-stone-500 dark:text-zinc-400 text-sm">
                                                        {categories[e.category_id]?.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-stone-900 dark:text-zinc-50">
                                                        {e.description || categories[e.category_id]?.name}
                                                    </span>
                                                    {e.description && (
                                                        <div className="flex items-center space-x-1.5 text-xs text-stone-500 dark:text-zinc-400">
                                                            <span>{categories[e.category_id]?.name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <div className="font-serif font-bold text-stone-900 dark:text-zinc-50 text-right">
                                                    -{e.amount_eur.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                                </div>
                                                {e.is_recurring && (
                                                    <div className="mt-1 text-blue-500 dark:text-blue-400">
                                                        <Repeat className="w-3.5 h-3.5" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};
