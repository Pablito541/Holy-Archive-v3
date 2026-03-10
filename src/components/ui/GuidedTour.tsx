'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { Button } from './Button';

interface TourStep {
    title: string;
    description: string;
    targetSelector: string;
    position?: 'top' | 'bottom';
}

const TOUR_STEPS: TourStep[] = [
    {
        title: 'Deine Übersicht',
        description: 'Hier siehst du alle wichtigen Kennzahlen auf einen Blick – Umsatz, Gewinn und Lagerbestand.',
        targetSelector: '[data-tour="dashboard"]',
        position: 'bottom',
    },
    {
        title: 'Neues Item hinzufügen',
        description: 'Über diesen Button erfasst du neue Einkäufe, Verkäufe und Ausgaben.',
        targetSelector: '[data-tour="action"]',
        position: 'top',
    },
    {
        title: 'Dein Inventar',
        description: 'Verwalte alle deine Items – filtere, suche und behalte den Überblick.',
        targetSelector: '[data-tour="inventory"]',
        position: 'top',
    },
    {
        title: 'Finanzen im Blick',
        description: 'Tracke deine Ausgaben und behalte deine Finanzen im Griff.',
        targetSelector: '[data-tour="finances"]',
        position: 'top',
    },
];

const STORAGE_KEY = 'holy_archive_tour_completed';

interface GuidedTourProps {
    active: boolean;
    onComplete: () => void;
}

export const GuidedTour = ({ active, onComplete }: GuidedTourProps) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [visible, setVisible] = useState(false);

    const updateTargetRect = useCallback(() => {
        if (!active) return;
        const step = TOUR_STEPS[currentStep];
        if (!step) return;
        const el = document.querySelector(step.targetSelector);
        if (el) {
            setTargetRect(el.getBoundingClientRect());
            setVisible(true);
        } else {
            setVisible(false);
        }
    }, [currentStep, active]);

    useEffect(() => {
        if (!active) return;

        // Check if already completed
        if (localStorage.getItem(STORAGE_KEY) === 'true') {
            onComplete();
            return;
        }

        // Small delay to let dashboard render
        const timer = setTimeout(updateTargetRect, 600);
        window.addEventListener('resize', updateTargetRect);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateTargetRect);
        };
    }, [active, updateTargetRect, onComplete]);

    const handleNext = () => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleFinish();
        }
    };

    const handleFinish = () => {
        localStorage.setItem(STORAGE_KEY, 'true');
        setVisible(false);
        onComplete();
    };

    if (!active || !visible || !targetRect) return null;

    const step = TOUR_STEPS[currentStep];
    const isTop = step.position === 'top';

    // Position tooltip relative to target
    const tooltipStyle: React.CSSProperties = {
        position: 'fixed',
        left: Math.max(16, Math.min(targetRect.left + targetRect.width / 2 - 150, window.innerWidth - 316)),
        ...(isTop
            ? { bottom: window.innerHeight - targetRect.top + 12 }
            : { top: targetRect.bottom + 12 }),
        width: 300,
        zIndex: 100,
    };

    return (
        <>
            {/* Backdrop overlay */}
            <div className="fixed inset-0 bg-black/40 z-[90]" onClick={handleFinish} />

            {/* Spotlight cutout */}
            <div
                className="fixed z-[95] rounded-2xl ring-4 ring-white/80 pointer-events-none"
                style={{
                    left: targetRect.left - 6,
                    top: targetRect.top - 6,
                    width: targetRect.width + 12,
                    height: targetRect.height + 12,
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)',
                }}
            />

            {/* Tooltip */}
            <div style={tooltipStyle} className="z-[100]">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-5 border border-stone-100 dark:border-zinc-800">
                    <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-stone-900 dark:text-zinc-100">{step.title}</h3>
                        <button onClick={handleFinish} className="text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300 -mt-1 -mr-1 p-1">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-sm text-stone-500 dark:text-zinc-400 mb-4">{step.description}</p>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-stone-400 dark:text-zinc-500">
                            {currentStep + 1} / {TOUR_STEPS.length}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={handleFinish}
                                className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300 px-2 py-1"
                            >
                                Tour beenden
                            </button>
                            <Button
                                onClick={handleNext}
                                className="!py-2 !px-4 !text-xs"
                                icon={currentStep < TOUR_STEPS.length - 1 ? <ArrowRight className="w-3 h-3" /> : undefined}
                                iconPosition="right"
                            >
                                {currentStep < TOUR_STEPS.length - 1 ? 'Weiter' : 'Fertig'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
