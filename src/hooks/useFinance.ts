'use client';

import { useContext } from 'react';
import { FinanceContext } from '../providers/FinanceProvider';

export function useFinance() {
    const context = useContext(FinanceContext);
    if (!context) {
        throw new Error('useFinance must be used within FinanceProvider');
    }
    return context;
}
