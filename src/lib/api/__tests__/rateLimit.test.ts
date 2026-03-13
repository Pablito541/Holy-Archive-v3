import { describe, it, expect, beforeEach, vi } from 'vitest';

// Reset the module between tests to clear the in-memory map
beforeEach(() => {
  vi.resetModules();
});

describe('checkRateLimit', () => {
  it('allows the first request', async () => {
    const { checkRateLimit } = await import('../rateLimit');
    const result = checkRateLimit('user-1', 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('allows requests up to the limit', async () => {
    const { checkRateLimit } = await import('../rateLimit');
    const id = 'user-limit-test';
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(id, 5, 60_000);
      expect(result.allowed).toBe(true);
    }
  });

  it('blocks requests over the limit', async () => {
    const { checkRateLimit } = await import('../rateLimit');
    const id = 'user-over-limit';
    for (let i = 0; i < 5; i++) {
      checkRateLimit(id, 5, 60_000);
    }
    const result = checkRateLimit(id, 5, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('resets after the time window expires', async () => {
    vi.useFakeTimers();
    const { checkRateLimit } = await import('../rateLimit');
    const id = 'user-reset-test';

    for (let i = 0; i < 5; i++) {
      checkRateLimit(id, 5, 1_000);
    }
    expect(checkRateLimit(id, 5, 1_000).allowed).toBe(false);

    // Advance past the window
    vi.advanceTimersByTime(1_001);

    const result = checkRateLimit(id, 5, 1_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);

    vi.useRealTimers();
  });

  it('tracks different identifiers independently', async () => {
    const { checkRateLimit } = await import('../rateLimit');
    for (let i = 0; i < 3; i++) {
      checkRateLimit('user-A', 3, 60_000);
    }
    expect(checkRateLimit('user-A', 3, 60_000).allowed).toBe(false);
    expect(checkRateLimit('user-B', 3, 60_000).allowed).toBe(true);
  });
});
