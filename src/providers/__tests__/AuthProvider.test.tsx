import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthProvider';

vi.mock('../../lib/supabase', () => ({
    supabase: {
        auth: {
            onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
        }
    }
}));

describe('AuthProvider', () => {
    it('provides user state correctly', () => {
        const mockUser = { id: 'test-user', email: 'test@example.com' } as any;
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <AuthProvider initialUser={mockUser} initialOrgId="org-123">
                {children}
            </AuthProvider>
        );

        const { result } = renderHook(() => useAuth(), { wrapper });

        expect(result.current.user).toEqual(mockUser);
        expect(result.current.orgId).toBe('org-123');
    });

    it('throws error when useAuth is used outside provider', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within an AuthProvider');
        spy.mockRestore();
    });
});
