'use client';

import React, { createContext, useState, useEffect, useRef } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';

interface UIContextType {
    selectionMode: 'view' | 'sell' | 'bulk_sell';
    showActionMenu: boolean;
    showTour: boolean;
    setSelectionMode: (mode: 'view' | 'sell' | 'bulk_sell') => void;
    setShowActionMenu: (show: boolean) => void;
    setShowTour: (show: boolean) => void;
    scrollPositionRef: React.MutableRefObject<number>;
}

export const UIContext = createContext<UIContextType | undefined>(undefined);

interface UIProviderProps {
    children: React.ReactNode;
}

export const UIProvider = ({ children }: UIProviderProps) => {
    const [selectionMode, setSelectionMode] = useState<'view' | 'sell' | 'bulk_sell'>('view');
    const [showActionMenu, setShowActionMenu] = useState(false);
    const [showTour, setShowTour] = useState(false);
    const scrollPositionRef = useRef<number>(0);
    const searchParams = useSearchParams();
    const pathname = usePathname();

    // Guided Tour activation
    useEffect(() => {
        if (searchParams.get('tour') === 'true' && pathname === '/dashboard') {
            setShowTour(true);
        }
    }, [searchParams, pathname]);

    // Restore scroll position when returning to inventory view
    useEffect(() => {
        if (pathname === '/dashboard/inventory' && scrollPositionRef.current > 0) {
            setTimeout(() => {
                window.scrollTo(0, scrollPositionRef.current);
            }, 10);
        }
    }, [pathname]);

    // Reset bulk_sell selection mode when leaving inventory
    useEffect(() => {
        if (!pathname.startsWith('/dashboard/inventory') && selectionMode === 'bulk_sell') {
            setSelectionMode('view');
        }
    }, [pathname]);

    const value: UIContextType = {
        selectionMode,
        showActionMenu,
        showTour,
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
