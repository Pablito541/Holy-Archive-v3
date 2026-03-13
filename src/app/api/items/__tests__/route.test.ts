import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest } from '@/test/api-helpers';

// --- Auth mock ---
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

// --- Supabase mock ---
const mockSingle = vi.fn();
const mockRange = vi.fn();
const mockOrder = vi.fn().mockReturnThis();
const mockOr = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockSelect = vi.fn().mockReturnThis();
const mockInsert = vi.fn().mockReturnThis();

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  eq: mockEq,
  or: mockOr,
  order: mockOrder,
  range: mockRange,
  single: mockSingle,
}));

mockSelect.mockReturnValue({
  eq: mockEq,
  or: mockOr,
  order: mockOrder,
  range: mockRange,
  single: mockSingle,
  maybeSingle: vi.fn().mockResolvedValue({ data: { organization_id: 'org-1' } }),
});

vi.mock('@/lib/supabase-api', () => ({
  createAuthenticatedClient: vi.fn(() => Promise.resolve({ from: mockFrom, auth: { getUser: vi.fn() } })),
}));

import { getAuthenticatedUser, getUserOrgId } from '@/lib/api/auth';

describe('GET /api/items', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('returns 401 when user is not authenticated', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(null);

    const { GET } = await import('../route');
    const req = createMockRequest('/api/items');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it('returns 403 when user has no organisation', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ id: 'user-1' } as any);
    vi.mocked(getUserOrgId).mockResolvedValue(null);

    const { GET } = await import('../route');
    const req = createMockRequest('/api/items');
    const res = await GET(req);

    expect(res.status).toBe(403);
  });

  it('returns 200 with items array when authenticated', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ id: 'user-1' } as any);
    vi.mocked(getUserOrgId).mockResolvedValue('org-1');

    mockRange.mockResolvedValue({ data: [{ id: 'item-1', brand: 'LV' }], count: 1, error: null });

    const { GET } = await import('../route');
    const req = createMockRequest('/api/items');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveProperty('items');
    expect(Array.isArray(body.data.items)).toBe(true);
  });
});

describe('POST /api/items', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(null);

    const { POST } = await import('../route');
    const req = createMockRequest('/api/items', {
      method: 'POST',
      body: { brand: 'LV', model: 'Speedy' },
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('returns 400 when brand is missing', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ id: 'user-1' } as any);
    vi.mocked(getUserOrgId).mockResolvedValue('org-1');

    const { POST } = await import('../route');
    const req = createMockRequest('/api/items', {
      method: 'POST',
      body: { model: 'Speedy' },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('brand');
  });

  it('returns 201 when valid data is provided', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ id: 'user-1' } as any);
    vi.mocked(getUserOrgId).mockResolvedValue('org-1');

    mockSingle.mockResolvedValue({
      data: { id: 'item-new', brand: 'LV', model: 'Speedy', item_certificates: [] },
      error: null,
    });

    const { POST } = await import('../route');
    const req = createMockRequest('/api/items', {
      method: 'POST',
      body: { brand: 'LV', model: 'Speedy', purchase_price_eur: 500 },
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
  });
});
