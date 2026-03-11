import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { InventoryProvider, useInventory } from '../InventoryProvider';

vi.mock('../../components/ui/Toast', () => ({
    useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('../AuthProvider', () => ({
    useAuth: () => ({ user: { id: 'test-user' }, orgId: 'org-1' }),
}));

vi.mock('../StatsProvider', () => ({
    useStats: () => ({ fetchStats: vi.fn() }),
}));

vi.mock('../../lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    order: vi.fn(() => ({
                        limit: vi.fn(() => Promise.resolve({ data: [] }))
                    }))
                }))
            }))
        }))
    }
}));

describe('InventoryProvider', () => {
    it('initializes with default values', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <InventoryProvider>
                {children}
            </InventoryProvider>
        );

        const { result } = renderHook(() => useInventory(), { wrapper });

        expect(result.current.items).toEqual([]);
        expect(result.current.inventoryFilter).toBe('in_stock');
        expect(result.current.selectionMode).toBe('view');
    });
});
