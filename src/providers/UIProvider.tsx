'use client';

import React, { createContext, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

interface UIContextType {
    view: string;
    selectionMode: 'view' | 'sell' | 'bulk_sell';
    showActionMenu: boolean;
    showTour: boolean;
    setView: (view: string) => void;
    setSelectionMode: (mode: 'view' | 'sell' | 'bulk_sell') => void;
    setShowActionMenu: (show: boolean) => void;
    setShowTour: (show: boolean) => void;
    scrollPositionRef: React.MutableRefObject<number>;
}

export const UIContext = createContext<UIContextType | undefined>(undefined);

interface UIProviderProps {
    initialView?: string;
    children: React.ReactNode;
}

export const UIProvider = ({ initialView = 'dashboard', children }: UIProviderProps) => {
    const [view, setView] = useState(initialView);
    const [selectionMode, setSelectionMode] = useState<'view' | 'sell' | 'bulk_sell'>('view');
    const [showActionMenu, setShowActionMenu] = useState(false);
    const [showTour, setShowTour] = useState(false);
    const scrollPositionRef = useRef<number>(0);
    const searchParams = useSearchParams();

    // Guided Tour activation
    useEffect(() => {
        if (searchParams.get('tour') === 'true' && view === 'dashboard') {
            setShowTour(true);
        }
    }, [searchParams, view]);

    // Restore scroll position when returning to inventory view
    useEffect(() => {
        if (view === 'inventory' && scrollPositionRef.current > 0) {
            setTimeout(() => {
                window.scrollTo(0, scrollPositionRef.current);
            }, 10);
        }
    }, [view]);

    const value: UIContextType = {
        view,
        selectionMode,
        showActionMenu,
        showTour,
        setView,
        setSelectionMode,
        setShowActionMenu,
        setShowTour,
        scrollPositionRef,
    };

    return (
        <UIContext.Provider value={value}>
            {children}
        </UIContext.Provider>
    );
};
