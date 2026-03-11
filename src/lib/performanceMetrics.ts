/**
 * Performance Metrics Module
 * 
 * Tracks page load times, API call durations, and Web Vitals.
 * Currently logs to console; designed for easy integration with
 * analytics services later.
 */

interface PerformanceEntry {
    name: string;
    value: number;
    unit: string;
    timestamp: string;
}

const metricsBuffer: PerformanceEntry[] = [];
const MAX_BUFFER = 100;

function logMetric(entry: PerformanceEntry): void {
    metricsBuffer.push(entry);
    if (metricsBuffer.length > MAX_BUFFER) {
        metricsBuffer.shift();
    }

    if (process.env.NODE_ENV === 'development') {
        console.info('[PERF]', `${entry.name}: ${entry.value.toFixed(2)}${entry.unit}`);
    }
}

/**
 * Track page load performance using Navigation Timing API
 */
export function trackPageLoad(): void {
    if (typeof window === 'undefined' || !window.performance) return;

    // Wait for the load event to complete
    const onLoad = () => {
        const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
        if (!timing) return;

        const metrics = {
            dns: timing.domainLookupEnd - timing.domainLookupStart,
            tcp: timing.connectEnd - timing.connectStart,
            ttfb: timing.responseStart - timing.requestStart,
            domContentLoaded: timing.domContentLoadedEventEnd - timing.startTime,
            load: timing.loadEventEnd - timing.startTime,
        };

        Object.entries(metrics).forEach(([name, value]) => {
            logMetric({
                name: `page.${name}`,
                value,
                unit: 'ms',
                timestamp: new Date().toISOString(),
            });
        });
    };

    if (document.readyState === 'complete') {
        setTimeout(onLoad, 0);
    } else {
        window.addEventListener('load', onLoad, { once: true });
    }
}

/**
 * Track API call duration
 */
export function trackApiCall(name: string, durationMs: number): void {
    logMetric({
        name: `api.${name}`,
        value: durationMs,
        unit: 'ms',
        timestamp: new Date().toISOString(),
    });
}

/**
 * Web Vitals reporter — compatible with next/web-vitals
 */
export function reportWebVitals(metric: { name: string; value: number; id: string }): void {
    logMetric({
        name: `vitals.${metric.name}`,
        value: metric.value,
        unit: metric.name === 'CLS' ? '' : 'ms',
        timestamp: new Date().toISOString(),
    });
}

/**
 * Get buffered metrics (for future batch sending)
 */
export function getMetricsBuffer(): PerformanceEntry[] {
    return [...metricsBuffer];
}
