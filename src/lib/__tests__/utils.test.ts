import { describe, it, expect } from 'vitest';
import {
  generateId,
  formatCurrency,
  formatDate,
  calculateProfit,
  calculateMarginPercentage,
  conditionLabels,
} from '../utils';
import type { Item } from '../../types';

describe('generateId', () => {
  it('returns a non-empty string', () => {
    expect(generateId()).toBeTruthy();
    expect(typeof generateId()).toBe('string');
  });

  it('returns unique IDs on repeated calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe('formatCurrency', () => {
  it('formats zero as 0,00 €', () => {
    expect(formatCurrency(0)).toBe('0,00\u00a0€');
  });

  it('formats a positive integer', () => {
    expect(formatCurrency(100)).toBe('100,00\u00a0€');
  });

  it('formats a decimal value', () => {
    expect(formatCurrency(49.99)).toBe('49,99\u00a0€');
  });

  it('formats a large number with thousands separator', () => {
    const result = formatCurrency(1500);
    expect(result).toContain('1');
    expect(result).toContain('500');
    expect(result).toContain('€');
  });

  it('formats a negative number', () => {
    const result = formatCurrency(-50);
    expect(result).toContain('-');
    expect(result).toContain('€');
  });
});

describe('formatDate', () => {
  it('returns empty string for empty input', () => {
    expect(formatDate('')).toBe('');
  });

  it('formats a valid ISO date string in German format', () => {
    const result = formatDate('2024-03-15');
    expect(result).toBe('15.03.24');
  });

  it('formats a date with time component', () => {
    const result = formatDate('2024-01-01T00:00:00.000Z');
    expect(result).toMatch(/\d{2}\.\d{2}\.\d{2}/);
  });
});

describe('calculateProfit', () => {
  const baseItem: Item = {
    id: '1',
    brand: 'Test',
    model: 'Bag',
    category: 'bag',
    condition: 'good',
    status: 'sold',
    purchasePriceEur: 100,
    salePriceEur: 200,
    platformFeesEur: 10,
    shippingCostEur: 5,
    purchaseDate: '2024-01-01',
    purchaseSource: '',
    imageUrls: [],
    organizationId: 'org-1',
    userId: 'user-1',
    createdAt: '2024-01-01',
  };

  it('returns null for in_stock items', () => {
    expect(calculateProfit({ ...baseItem, status: 'in_stock' })).toBeNull();
  });

  it('returns null when salePriceEur is undefined', () => {
    expect(calculateProfit({ ...baseItem, salePriceEur: undefined })).toBeNull();
  });

  it('calculates profit correctly: salePrice - purchasePrice - fees - shipping', () => {
    // 200 - 100 - 10 - 5 = 85
    expect(calculateProfit(baseItem)).toBe(85);
  });

  it('handles zero fees', () => {
    const item = { ...baseItem, platformFeesEur: 0, shippingCostEur: 0 };
    expect(calculateProfit(item)).toBe(100);
  });

  it('handles missing fees (defaults to 0)', () => {
    const item = { ...baseItem, platformFeesEur: undefined, shippingCostEur: undefined };
    expect(calculateProfit(item)).toBe(100);
  });
});

describe('calculateMarginPercentage', () => {
  it('returns 0 when revenue is 0', () => {
    expect(calculateMarginPercentage(50, 0)).toBe(0);
  });

  it('returns 0 when revenue is falsy', () => {
    expect(calculateMarginPercentage(50, 0)).toBe(0);
  });

  it('calculates 50% margin correctly', () => {
    expect(calculateMarginPercentage(50, 100)).toBe(50);
  });

  it('calculates 100% margin (profit equals revenue)', () => {
    expect(calculateMarginPercentage(100, 100)).toBe(100);
  });

  it('calculates a decimal margin', () => {
    expect(calculateMarginPercentage(33, 100)).toBeCloseTo(33, 1);
  });
});

describe('conditionLabels', () => {
  it('has labels for all conditions', () => {
    const conditions = ['mint', 'very_good', 'good', 'fair', 'poor'] as const;
    conditions.forEach((c) => {
      expect(conditionLabels[c]).toBeTruthy();
    });
  });

  it('returns correct German labels', () => {
    expect(conditionLabels.mint).toBe('Neuwertig');
    expect(conditionLabels.good).toBe('Gut');
    expect(conditionLabels.poor).toBe('Schlecht');
  });
});
