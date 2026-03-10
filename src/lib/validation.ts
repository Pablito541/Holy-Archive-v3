export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export const validatePrice = (price: number | undefined | null, fieldName: string): void => {
    if (price === undefined || price === null) return;
    if (price < 0) {
        throw new ValidationError(`${fieldName} darf nicht negativ sein.`);
    }
    // Check if more than 2 decimal places
    if (Math.round(price * 100) / 100 !== price) {
        throw new ValidationError(`${fieldName} darf maximal 2 Nachkommastellen haben.`);
    }
};

export const validateTextLength = (text: string | undefined | null, maxLength: number, fieldName: string): void => {
    if (!text) return;
    if (text.length > maxLength) {
        throw new ValidationError(`${fieldName} darf maximal ${maxLength} Zeichen lang sein.`);
    }
};

export const validateDateNotFuture = (dateString: string | undefined | null, fieldName: string): void => {
    if (!dateString) return;
    const date = new Date(dateString);
    const now = new Date();
    // Reset time to start of day for accurate day-only comparison
    now.setHours(23, 59, 59, 999);

    if (date > now) {
        throw new ValidationError(`${fieldName} darf nicht in der Zukunft liegen.`);
    }
};
