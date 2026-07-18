"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useKeyEvent } from "./KeyEventContext";
import { useRotaryEvent } from "./RotaryEventContext";

export const pages = ['home', 'shopping', 'custom', 'shoppingSettings', 'logs'] as const;

const pageNavigationMap: Record<typeof pages[number], { next: typeof pages[number], prev: typeof pages[number] }> = {
    'home': { next: 'shopping', prev: 'logs' },
    'shopping': { next: 'custom', prev: 'home' },
    'custom': { next: 'home', prev: 'shopping' },
    'shoppingSettings': { next: 'home', prev: 'home' },
    'logs': { next: 'home', prev: 'home' },
};

export type PageId = typeof pages[number];

type PageContextType = {
    currentPage: PageId;
    navigateTo: (page: PageId) => void;
    navigateNext: () => void;
    navigatePrev: () => void;
};

const PageContext = createContext<PageContextType | null>(null);

export function PageProvider({ children }: { children: React.ReactNode }) {
    const [currentPage, setCurrentPage] = useState<PageId>('home');

    const { subscribe: subscribeKey, unsubscribe: unsubscribeKey } = useKeyEvent();
    const { subscribe: subscribeRotary, unsubscribe: unsubscribeRotary } = useRotaryEvent();

    useEffect(() => {
        const id = subscribeKey(100, (e) => {
            if (e.key === 'ArrowRight') {
                setCurrentPage(prev => pageNavigationMap[prev].next);
                return true;
            }
            if (e.key === 'ArrowLeft') {
                setCurrentPage(prev => pageNavigationMap[prev].prev);
                return true;
            }
            return false;
        });
        return () => unsubscribeKey(id);
    }, [subscribeKey, unsubscribeKey]);

    useEffect(() => {
        const id = subscribeRotary(100, (action) => {
            if (action === 'rotate_right') {
                setCurrentPage(prev => pageNavigationMap[prev].next);
                return true;
            }
            if (action === 'rotate_left') {
                setCurrentPage(prev => pageNavigationMap[prev].prev);
                return true;
            }
            return false;
        });
        return () => unsubscribeRotary(id);
    }, [subscribeRotary, unsubscribeRotary]);

    const navigateTo = (page: PageId) => setCurrentPage(page);
    const navigateNext = () => setCurrentPage((prev) => pageNavigationMap[prev].next);
    const navigatePrev = () => setCurrentPage((prev) => pageNavigationMap[prev].prev);

    return (
        <PageContext.Provider value={{ currentPage, navigateTo, navigateNext, navigatePrev }}>
            {children}
        </PageContext.Provider>
    );
}

export function usePage(): PageContextType {
    const ctx = useContext(PageContext);
    if (!ctx) throw new Error('usePage must be used within a PageProvider');
    return ctx;
}
