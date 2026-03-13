import { describe, it, expect } from 'vitest';
import { validateRequired, validateEnum, validatePositiveNumber } from '../validation';

describe('validateRequired', () => {
  it('returns null when all required fields are present', () => {
    expect(validateRequired({ brand: 'LV', model: 'Speedy' }, ['brand', 'model'])).toBeNull();
  });

  it('returns an error message when a field is missing', () => {
    const result = validateRequired({ brand: 'LV' }, ['brand', 'model']);
    expect(result).toContain('model');
    expect(result).toContain('erforderlich');
  });

  it('returns an error when a field is null', () => {
    const result = validateRequired({ brand: null }, ['brand']);
    expect(result).toContain('brand');
  });

  it('returns an error when a field is empty string', () => {
    const result = validateRequired({ brand: '' }, ['brand']);
    expect(result).toContain('brand');
  });

  it('returns null for an empty fields array', () => {
    expect(validateRequired({}, [])).toBeNull();
  });

  it('reports the first missing field', () => {
    const result = validateRequired({}, ['a', 'b', 'c']);
    expect(result).toContain('a');
  });
});

describe('validateEnum', () => {
  const allowed = ['bag', 'wallet', 'accessory'];

  it('returns null for a valid value', () => {
    expect(validateEnum('bag', allowed, 'category')).toBeNull();
  });

  it('returns an error for an invalid value', () => {
    const result = validateEnum('shoes', allowed, 'category');
    expect(result).not.toBeNull();
    expect(result).toContain('category');
    expect(result).toContain('bag');
  });

  it('is case-sensitive', () => {
    expect(validateEnum('Bag', allowed, 'category')).not.toBeNull();
  });

  it('returns an error for an empty string', () => {
    expect(validateEnum('', allowed, 'category')).not.toBeNull();
  });
});

describe('validatePositiveNumber', () => {
  it('returns null for zero', () => {
    expect(validatePositiveNumber(0, 'price')).toBeNull();
  });

  it('returns null for a positive number', () => {
    expect(validatePositiveNumber(99.99, 'price')).toBeNull();
  });

  it('returns an error for a negative number', () => {
    const result = validatePositiveNumber(-1, 'price');
    expect(result).not.toBeNull();
    expect(result).toContain('price');
  });

  it('returns an error for a string', () => {
    expect(validatePositiveNumber('100', 'price')).not.toBeNull();
  });

  it('returns an error for null', () => {
    expect(validatePositiveNumber(null, 'price')).not.toBeNull();
  });

  it('returns an error for undefined', () => {
    expect(validatePositiveNumber(undefined, 'price')).not.toBeNull();
  });

  it('returns an error for NaN', () => {
    expect(validatePositiveNumber(NaN, 'price')).not.toBeNull();
  });
});
