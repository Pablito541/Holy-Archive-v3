'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center p-6 bg-[#fafaf9] dark:bg-black">
                    <div className="max-w-md w-full text-center space-y-4">
                        <h1 className="text-2xl font-serif font-bold text-stone-900 dark:text-zinc-50">
                            Etwas ist schiefgelaufen
                        </h1>
                        <p className="text-stone-600 dark:text-zinc-400">
                            Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.
                        </p>
                        {this.state.error && (
                            <div className="text-xs text-stone-400 bg-stone-100 dark:bg-zinc-900 p-3 rounded-lg overflow-auto max-h-32 text-left font-mono">
                                {this.state.error.message}
                            </div>
                        )}
                        <button
                            onClick={this.handleReset}
                            className="px-6 py-2 bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-medium hover:bg-stone-800 dark:hover:bg-zinc-200 transition-colors"
                        >
                            Erneut versuchen
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
