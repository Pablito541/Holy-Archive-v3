import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSelect = vi.fn().mockReturnThis();
const mockLimit = vi.fn().mockResolvedValue({ error: null });
const mockFrom = vi.fn(() => ({ select: mockSelect }));
mockSelect.mockReturnValue({ limit: mockLimit });

vi.mock('@/lib/supabase-api', () => ({
  createAuthenticatedClient: vi.fn(() =>
    Promise.resolve({ from: mockFrom })
  ),
}));

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLimit.mockResolvedValue({ error: null });
  });

  it('returns 200 with status ok when Supabase is connected', async () => {
    const { GET } = await import('../route');
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body).toHaveProperty('timestamp');
    expect(body.supabase).toBe('connected');
  });

  it('returns 200 with supabase: error when DB query fails', async () => {
    mockLimit.mockResolvedValue({ error: new Error('Connection refused') });
    const { GET } = await import('../route');
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.supabase).toBe('error');
  });

  it('returns 503 when createAuthenticatedClient throws', async () => {
    const { createAuthenticatedClient } = await import('@/lib/supabase-api');
    vi.mocked(createAuthenticatedClient).mockRejectedValueOnce(new Error('No session'));

    const { GET } = await import('../route');
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.status).toBe('error');
    expect(body.supabase).toBe('disconnected');
  });
});
