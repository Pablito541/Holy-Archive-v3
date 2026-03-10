'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';
import { DashboardStats } from '../types';

interface StatsContextType {
    dashboardStats: DashboardStats | null;
    timeframe: string;
    setTimeframe: (tf: string) => void;
    chartGrouping: string;
    setChartGrouping: (cg: string) => void;
    fetchStats: () => Promise<void>;
    isLoading: boolean;
}

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export function StatsProvider({ children }: { children: ReactNode }) {
    const { orgId } = useAuth();
    const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
    const [timeframe, setTimeframe] = useState<string>('30d');
    const [chartGrouping, setChartGrouping] = useState<string>('day');
    const [isLoading, setIsLoading] = useState(false);

    const fetchStats = useCallback(async () => {
        if (!supabase || !orgId) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_dashboard_stats', {
                org_id: orgId,
                timeframe_val: timeframe
            });

            if (error) {
                console.error("Error fetching stats in provider:", error);
            } else if (data) {
                setDashboardStats(data as unknown as DashboardStats);
            }
        } catch (err) {
            console.error("Exception fetching stats:", err);
        } finally {
            setIsLoading(false);
        }
    }, [orgId, timeframe]);

    useEffect(() => {
        if (orgId) {
            fetchStats();
        }
    }, [orgId, timeframe, fetchStats]);

    return (
        <StatsContext.Provider value={{ dashboardStats, timeframe, setTimeframe, chartGrouping, setChartGrouping, fetchStats, isLoading }}>
            {children}
        </StatsContext.Provider>
    );
}

export function useStats() {
    const context = useContext(StatsContext);
    if (context === undefined) {
        throw new Error('useStats must be used within a StatsProvider');
    }
    return context;
}
