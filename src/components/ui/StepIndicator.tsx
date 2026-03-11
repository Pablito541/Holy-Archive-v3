'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
    currentStep: number;
    totalSteps: number;
    labels?: string[];
}

export const StepIndicator = ({ currentStep, totalSteps, labels }: StepIndicatorProps) => {
    return (
        <div className="flex items-center justify-center gap-2 w-full">
            {Array.from({ length: totalSteps }, (_, i) => {
                const step = i + 1;
                const isActive = step === currentStep;
                const isCompleted = step < currentStep;

                return (
                    <React.Fragment key={step}>
                        <div className="flex flex-col items-center gap-1">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                                    isCompleted
                                        ? 'bg-stone-900 dark:bg-zinc-50 text-white dark:text-zinc-900'
                                        : isActive
                                          ? 'bg-stone-900 dark:bg-zinc-50 text-white dark:text-zinc-900 ring-4 ring-stone-200 dark:ring-zinc-700'
                                          : 'bg-stone-100 dark:bg-zinc-800 text-stone-400 dark:text-zinc-500'
                                }`}
                            >
                                {isCompleted ? <Check className="w-4 h-4" /> : step}
                            </div>
                            {labels && labels[i] && (
                                <span className={`text-[10px] font-medium tracking-wide ${
                                    isActive || isCompleted
                                        ? 'text-stone-700 dark:text-zinc-300'
                                        : 'text-stone-400 dark:text-zinc-600'
                                }`}>
                                    {labels[i]}
                                </span>
                            )}
                        </div>
                        {step < totalSteps && (
                            <div
                                className={`h-px flex-1 max-w-[40px] transition-all duration-300 ${
                                    isCompleted ? 'bg-stone-900 dark:bg-zinc-50' : 'bg-stone-200 dark:bg-zinc-700'
                                }`}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};
