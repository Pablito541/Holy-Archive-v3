'use client';

import { useEffect } from 'react';

/**
 * Warns the user before navigating away from a page with unsaved changes.
 * Uses the `beforeunload` browser event to intercept browser navigation,
 * tab close, and page refresh.
 *
 * @param isDirty - Whether the form has unsaved changes
 */
export function useUnsavedChanges(isDirty: boolean) {
    useEffect(() => {
        if (!isDirty) return;

        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            // Modern browsers ignore custom messages, but setting returnValue is required
            e.returnValue = 'Du hast ungespeicherte Änderungen. Möchtest du die Seite wirklich verlassen?';
            return e.returnValue;
        };

        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [isDirty]);
}
