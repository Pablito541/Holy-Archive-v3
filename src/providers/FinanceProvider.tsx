'use client';

import React, { createContext, useState, useEffect, useRef } from 'react';
import { Expense, CertificateProvider } from '../types';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api/client';
import { useAuth } from '../hooks/useAuth';

interface FinanceContextType {
    dashboardStats: any;
    certificateProviders: CertificateProvider[];
    selectedExpense: Expense | null;
    selectedExpenseCategoryName: string;
    setSelectedExpense: (expense: Expense | null) => void;
    setSelectedExpenseCategoryName: (name: string) => void;
    refreshStats: (timeframe?: string, chartGrouping?: string) => Promise<void>;
    refreshCertificateProviders: () => void;
    deleteExpense: (expenseId: string) => Promise<boolean>;
}

export const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

interface FinanceProviderProps {
    children: React.ReactNode;
}

export const FinanceProvider = ({ children }: FinanceProviderProps) => {
    const { user, orgId } = useAuth();

    const [dashboardStats, setDashboardStats] = useState<any>(null);
    const [certificateProviders, setCertificateProviders] = useState<CertificateProvider[]>([]);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [selectedExpenseCategoryName, setSelectedExpenseCategoryName] = useState('');
    const providersFetchedRef = useRef<boolean>(false);

    const refreshStats = async (_timeframe?: string, _chartGrouping?: string) => {
        if (!supabase || !orgId) return;
        // Currently a stub — DashboardView fetches its own stats
    };

    const refreshCertificateProviders = () => {
        if (!supabase || !orgId) return;
        supabase
            .from('certificate_providers')
            .select('*')
            .eq('organization_id', orgId)
            .order('name')
            .limit(100)
            .then(({ data, error }) => {
                if (!error && data) {
                    setCertificateProviders(data as CertificateProvider[]);
                    providersFetchedRef.current = true;
                }
            });
    };

    // Fetch stats and certificate providers on mount/login
    useEffect(() => {
        if (user && orgId) {
            refreshStats();
            if (!providersFetchedRef.current) {
                refreshCertificateProviders();
            }
        }
    }, [user, orgId]);

    const deleteExpense = async (expenseId: string): Promise<boolean> => {
        try {
            const { error } = await api.deleteExpense(expenseId);
            if (error) throw new Error(error);
            return true;
        } catch (e: any) {
            console.error('Error deleting expense:', e);
            return false;
        }
    };

    const value: FinanceContextType = {
        dashboardStats,
        certificateProviders,
        selectedExpense,
        selectedExpenseCategoryName,
        setSelectedExpense,
        setSelectedExpenseCategoryName,
        refreshStats,
        refreshCertificateProviders,
        deleteExpense,
    };

    return (
        <FinanceContext.Provider value={value}>
            {children}
        </FinanceContext.Provider>
    );
};
