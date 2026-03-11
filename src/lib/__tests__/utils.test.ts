import { describe, it, expect } from 'vitest';
import { formatCurrency, calculateProfit, calculateMarginPercentage } from '../utils';
import { Item } from '../../types';

describe('Utility Functions', () => {
    it('formatCurrency should format numbers to EUR', () => {
        expect(formatCurrency(100)).toContain('100');
        expect(formatCurrency(100.50)).toContain('100,50');
    });

    it('calculateProfit should calculate correct profit', () => {
        const item = {
            status: 'sold',
            purchasePriceEur: 100,
            salePriceEur: 200,
            platformFeesEur: 10,
            shippingCostEur: 5
        } as unknown as Item;

        expect(calculateProfit(item)).toBe(85);
    });

    it('calculateMarginPercentage should calculate correct margin', () => {
        expect(calculateMarginPercentage(50, 200)).toBe(25);
        expect(calculateMarginPercentage(0, 200)).toBe(0);
        expect(calculateMarginPercentage(100, 0)).toBe(0);
    });
});
