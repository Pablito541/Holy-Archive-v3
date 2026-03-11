import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px] border border-dashed border-stone-200 dark:border-zinc-800 rounded-3xl bg-white/50 dark:bg-zinc-900/50">
            <div className="w-16 h-16 bg-stone-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-stone-400 dark:text-zinc-500 mb-6">
                {icon}
            </div>
            <h3 className="font-bold text-lg text-stone-900 dark:text-zinc-100 mb-2">
                {title}
            </h3>
            <p className="text-sm text-stone-500 dark:text-zinc-400 max-w-sm mb-6">
                {description}
            </p>
            {actionLabel && onAction && (
                <Button onClick={onAction}>
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
