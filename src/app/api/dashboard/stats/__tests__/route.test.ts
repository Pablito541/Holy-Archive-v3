import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest } from '@/test/api-helpers';

vi.mock('@/lib/api/auth', () => ({
  getAuthenticatedUser: vi.fn(),
  getUserOrgId: vi.fn(),
  unauthorizedResponse: vi.fn(() =>
    new Response(JSON.stringify({ error: 'Nicht authentifiziert' }), { status: 401 })
  ),
  forbiddenResponse: vi.fn(() =>
    new Response(JSON.stringify({ error: 'Keine Berechtigung' }), { status: 403 })
  ),
}));

const mockRpc = vi.fn();

vi.mock('@/lib/supabase-api', () => ({
  createAuthenticatedClient: vi.fn(() =>
    Promise.resolve({ rpc: mockRpc })
  ),
}));

import { getAuthenticatedUser, getUserOrgId } from '@/lib/api/auth';

describe('GET /api/dashboard/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(null);

    const { GET } = await import('../route');
    const req = createMockRequest('/api/dashboard/stats');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it('returns 403 when user has no organisation', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ id: 'user-1' } as any);
    vi.mocked(getUserOrgId).mockResolvedValue(null);

    const { GET } = await import('../route');
    const req = createMockRequest('/api/dashboard/stats');
    const res = await GET(req);

    expect(res.status).toBe(403);
  });

  it('returns 200 with stats when authenticated', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ id: 'user-1' } as any);
    vi.mocked(getUserOrgId).mockResolvedValue('org-1');

    const mockStats = { totalProfit: 1000, totalRevenue: 5000, channels: [] };
    mockRpc.mockResolvedValue({ data: mockStats, error: null });

    const { GET } = await import('../route');
    const req = createMockRequest('/api/dashboard/stats');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveProperty('data');
  });

  it('returns 200 with timeframe=month filter applied', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ id: 'user-1' } as any);
    vi.mocked(getUserOrgId).mockResolvedValue('org-1');

    mockRpc.mockResolvedValue({ data: {}, error: null });

    const { GET } = await import('../route');
    const req = createMockRequest('/api/dashboard/stats', {
      searchParams: { timeframe: 'month' },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(mockRpc).toHaveBeenCalledWith(
      'get_detailed_dashboard_stats',
      expect.objectContaining({ filter_timeframe: 'month' })
    );
  });

  it('returns 400 for an invalid timeframe', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ id: 'user-1' } as any);
    vi.mocked(getUserOrgId).mockResolvedValue('org-1');

    const { GET } = await import('../route');
    const req = createMockRequest('/api/dashboard/stats', {
      searchParams: { timeframe: 'invalid' },
    });
    const res = await GET(req);

    expect(res.status).toBe(400);
  });
});
