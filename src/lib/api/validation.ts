export function validateRequired(body: Record<string, unknown>, fields: string[]): string | null {
  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      return `Feld '${field}' ist erforderlich`;
    }
  }
  return null;
}

export function validateEnum(value: string, allowed: string[], fieldName: string): string | null {
  if (!allowed.includes(value)) {
    return `'${fieldName}' muss einer der folgenden Werte sein: ${allowed.join(', ')}`;
  }
  return null;
}

export function validatePositiveNumber(value: unknown, fieldName: string): string | null {
  if (typeof value !== 'number' || isNaN(value) || value < 0) {
    return `'${fieldName}' muss eine positive Zahl sein`;
  }
  return null;
}
