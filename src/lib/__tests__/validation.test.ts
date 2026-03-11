import { describe, it, expect } from 'vitest';
import { validatePrice, validateTextLength, validateDateNotFuture, ValidationError } from '../validation';

describe('Validation Functions', () => {
    it('validatePrice should throw error for negative prices', () => {
        expect(() => validatePrice(-10, 'TestPreis')).toThrow(ValidationError);
    });

    it('validatePrice should throw error for more than 2 decimal places', () => {
        expect(() => validatePrice(10.123, 'TestPreis')).toThrow(ValidationError);
        expect(() => validatePrice(10.12, 'TestPreis')).not.toThrow();
    });

    it('validateTextLength should throw error for text exceeding maxLength', () => {
        expect(() => validateTextLength('123456', 5, 'Text')).toThrow(ValidationError);
        expect(() => validateTextLength('12345', 5, 'Text')).not.toThrow();
    });

    it('validateDateNotFuture should throw error for future dates', () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        expect(() => validateDateNotFuture(tomorrow.toISOString(), 'Datum')).toThrow(ValidationError);
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        expect(() => validateDateNotFuture(yesterday.toISOString(), 'Datum')).not.toThrow();
    });
});
