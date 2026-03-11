/**
 * Error Tracking Module
 * 
 * Structured error logging with a clear interface for future integration
 * with Sentry, LogRocket, or similar services.
 */

export function captureException(error: Error, context?: Record<string, unknown>): void {
    // Currently: structured console logging
    // Future: Sentry.captureException(error, { extra: context })
    console.error('[ERROR]', {
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : 'server',
    });
}

export function captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
    context?: Record<string, unknown>
): void {
    const logFn = level === 'error' ? console.error : level === 'warning' ? console.warn : console.info;
    logFn(`[${level.toUpperCase()}]`, {
        message,
        level,
        context,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : 'server',
    });
}
