'use client';

import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmOptions {
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'destructive' | 'default';
}

interface ConfirmDialogContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | null>(null);

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const resolveRef = useRef<((value: boolean) => void) | null>(null);
    const dialogRef = useRef<HTMLDivElement>(null);
    const confirmBtnRef = useRef<HTMLButtonElement>(null);

    const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
        setOptions(opts);
        setIsOpen(true);
        return new Promise<boolean>(resolve => {
            resolveRef.current = resolve;
        });
    }, []);

    const handleClose = useCallback((value: boolean) => {
        setIsOpen(false);
        resolveRef.current?.(value);
        resolveRef.current = null;
    }, []);

    // Keyboard handling
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                handleClose(false);
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isOpen, handleClose]);

    // Focus trap
    useEffect(() => {
        if (isOpen && confirmBtnRef.current) {
            confirmBtnRef.current.focus();
        }
    }, [isOpen]);

    if (!isOpen || !options) {
        return (
            <ConfirmDialogContext.Provider value={{ confirm }}>
                {children}
            </ConfirmDialogContext.Provider>
        );
    }

    const isDestructive = options.variant === 'destructive';

    return (
        <ConfirmDialogContext.Provider value={{ confirm }}>
            {children}
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm animate-fadeIn"
                onClick={() => handleClose(false)}
            />
            {/* Dialog */}
            <div
                ref={dialogRef}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-title"
                aria-describedby={options.description ? 'confirm-desc' : undefined}
                className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
                onClick={(e) => { if (e.target === e.currentTarget) handleClose(false); }}
            >
                <div
                    className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-zinc-800 w-full max-w-sm p-6 animate-scaleIn"
                    onClick={e => e.stopPropagation()}
                >
                    {isDestructive && (
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 mx-auto">
                            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                    )}

                    <h3 id="confirm-title" className="font-bold text-lg text-stone-900 dark:text-zinc-50 text-center mb-2">
                        {options.title}
                    </h3>

                    {options.description && (
                        <p id="confirm-desc" className="text-sm text-stone-500 dark:text-zinc-400 text-center mb-6">
                            {options.description}
                        </p>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={() => handleClose(false)}
                            className="flex-1 py-3 rounded-2xl border border-stone-200 dark:border-zinc-700 text-sm font-bold text-stone-600 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800 transition-colors active:scale-95"
                        >
                            {options.cancelLabel || 'Abbrechen'}
                        </button>
                        <button
                            ref={confirmBtnRef}
                            onClick={() => handleClose(true)}
                            className={`flex-1 py-3 rounded-2xl text-sm font-bold text-white transition-colors active:scale-95 ${
                                isDestructive
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : 'bg-stone-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-stone-800 dark:hover:bg-zinc-200'
                            }`}
                        >
                            {options.confirmLabel || 'Bestätigen'}
                        </button>
                    </div>
                </div>
            </div>
            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
                .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
            `}</style>
        </ConfirmDialogContext.Provider>
    );
}

export function useConfirmDialog() {
    const context = useContext(ConfirmDialogContext);
    if (!context) {
        throw new Error('useConfirmDialog must be used within ConfirmDialogProvider');
    }
    return context;
}
