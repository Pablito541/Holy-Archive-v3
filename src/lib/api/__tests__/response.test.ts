import { describe, it, expect } from 'vitest';
import { successResponse, errorResponse, createdResponse } from '../response';

describe('successResponse', () => {
  it('returns 200 by default', async () => {
    const res = successResponse({ items: [] });
    expect(res.status).toBe(200);
  });

  it('wraps data in a data key', async () => {
    const res = successResponse({ id: '1' });
    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(body.data).toEqual({ id: '1' });
  });

  it('accepts a custom status code', async () => {
    const res = successResponse({}, 202);
    expect(res.status).toBe(202);
  });
});

describe('errorResponse', () => {
  it('returns 400 by default', async () => {
    const res = errorResponse('Bad input');
    expect(res.status).toBe(400);
  });

  it('wraps message in an error key', async () => {
    const res = errorResponse('Something went wrong');
    const body = await res.json();
    expect(body).toHaveProperty('error', 'Something went wrong');
  });

  it('accepts a custom status code', async () => {
    const res = errorResponse('Unauthorized', 401);
    expect(res.status).toBe(401);
  });

  it('returns 500 for server errors', async () => {
    const res = errorResponse('Internal error', 500);
    expect(res.status).toBe(500);
  });
});

describe('createdResponse', () => {
  it('returns 201', async () => {
    const res = createdResponse({ id: 'new-1' });
    expect(res.status).toBe(201);
  });

  it('wraps data in a data key', async () => {
    const res = createdResponse({ id: 'new-1', brand: 'LV' });
    const body = await res.json();
    expect(body.data).toEqual({ id: 'new-1', brand: 'LV' });
  });
});
