import React from 'react';

export function SkeletonCard() {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-5 shadow-sm border border-stone-200/50 dark:border-zinc-800/50 animate-pulse">
            <div className="flex gap-4">
                {/* Image Placeholder */}
                <div className="w-24 h-24 rounded-2xl bg-stone-200 dark:bg-zinc-800 shrink-0" />
                
                {/* Content Placeholder */}
                <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
                    <div>
                        <div className="h-4 bg-stone-200 dark:bg-zinc-800 rounded w-1/3 mb-2" />
                        <div className="h-5 bg-stone-200 dark:bg-zinc-800 rounded w-2/3 mb-3" />
                        <div className="h-3 bg-stone-200 dark:bg-zinc-800 rounded w-1/4" />
                    </div>
                    
                    <div className="flex justify-between items-end mt-2">
                        <div className="h-6 bg-stone-200 dark:bg-zinc-800 rounded w-20" />
                        <div className="h-6 bg-stone-200 dark:bg-zinc-800 rounded-full w-16" />
                    </div>
                </div>
            </div>
        </div>
    );
}
