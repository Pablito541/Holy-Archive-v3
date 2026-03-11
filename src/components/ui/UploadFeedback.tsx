import React from 'react';
import { XCircle, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';

interface UploadFeedbackProps {
    isUploading: boolean;
    progress: number;
    error: string | null;
    success?: boolean;
    onRetry?: () => void;
    onClearError?: () => void;
}

export function UploadFeedback({
    isUploading,
    progress,
    error,
    success,
    onRetry,
    onClearError
}: UploadFeedbackProps) {
    if (!isUploading && !error && !success) return null;

    return (
        <div className="mt-4 p-4 rounded-lg border bg-surface flex flex-col gap-3">
            {isUploading && (
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-text">Bilder werden hochgeladen...</span>
                        <span className="text-sm text-text-muted">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {error && !isUploading && (
                <div className="flex items-start gap-3 text-red-500 bg-red-500/10 p-3 rounded-md">
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {onRetry && (
                            <button
                                type="button"
                                onClick={onRetry}
                                className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
                                title="Erneut versuchen"
                            >
                                <RefreshCw size={16} />
                            </button>
                        )}
                        {onClearError && (
                            <button
                                type="button"
                                onClick={onClearError}
                                className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
                                title="Fehler ausblenden"
                            >
                                <XCircle size={16} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {success && !isUploading && !error && (
                <div className="flex items-center gap-2 text-green-500">
                    <CheckCircle size={18} />
                    <span className="text-sm font-medium">Upload erfolgreich abgeschlossen</span>
                </div>
            )}
        </div>
    );
}
