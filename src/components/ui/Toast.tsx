'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
    id: string;
    message: string;
    type: ToastType;
    duration: number;
}

const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
};

const TOAST_STYLES: Record<ToastType, string> = {
    success: 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200',
    error: 'bg-red-50 dark:bg-red-950/80 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
    warning: 'bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
    info: 'bg-blue-50 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
};

function ToastComponent({ item, onClose }: { item: ToastItem; onClose: (id: string) => void }) {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => onClose(item.id), 300);
        }, item.duration);
        return () => clearTimeout(timer);
    }, [item.id, item.duration, onClose]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => onClose(item.id), 300);
    };

    return (
        <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg backdrop-blur-sm transition-all duration-300 ${TOAST_STYLES[item.type]} ${isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}
            style={{ animation: isExiting ? undefined : 'slideInRight 0.3s ease-out' }}
        >
            <span className="shrink-0">{TOAST_ICONS[item.type]}</span>
            <p className="font-medium text-sm flex-1">{item.message}</p>
            <button
                onClick={handleClose}
                className="shrink-0 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
    showSuccess: (message: string) => void;
    showError: (message: string) => void;
    showWarning: (message: string) => void;
    showInfo: (message: string) => void;
}

export const ToastContext = React.createContext<ToastContextType | null>(null);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const counterRef = useRef(0);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 5000) => {
        counterRef.current += 1;
        const id = `toast-${counterRef.current}-${Date.now()}`;
        setToasts(prev => [...prev.slice(-4), { id, message, type, duration }]);
    }, []);

    const showSuccess = useCallback((message: string) => showToast(message, 'success'), [showToast]);
    const showError = useCallback((message: string) => showToast(message, 'error'), [showToast]);
    const showWarning = useCallback((message: string) => showToast(message, 'warning'), [showToast]);
    const showInfo = useCallback((message: string) => showToast(message, 'info'), [showToast]);

    return (
        <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
            {children}
            {/* Toast Container - bottom right */}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
                {toasts.map(toast => (
                    <div key={toast.id} className="pointer-events-auto">
                        <ToastComponent item={toast} onClose={removeToast} />
                    </div>
                ))}
            </div>
            <style jsx global>{`
                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(1rem);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
            `}</style>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = React.useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};
