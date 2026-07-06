"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export const pages = ['home', 'shopping', 'shoppingSettings'] as const;

export type PageId = typeof pages[number];

type PageContextType = {
    currentPage: PageId;
    navigateTo: (page: PageId) => void;
};

const PageContext = createContext<PageContextType | null>(null);

export function PageProvider({ children }: { children: React.ReactNode }) {
    const [currentPage, setCurrentPage] = useState<PageId>('home');

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'ArrowRight') {
                const currentIndex = pages.indexOf(currentPage);
                const nextIndex = (currentIndex + 1) % pages.length;
                setCurrentPage(pages[nextIndex]);
            }

            if (event.key === 'ArrowLeft') {
                const currentIndex = pages.indexOf(currentPage);
                const prevIndex = (currentIndex - 1 + pages.length) % pages.length;
                setCurrentPage(pages[prevIndex]);
            }

        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        }
    }, [currentPage]);

    const navigateTo = (page: PageId) => setCurrentPage(page);

    return (
        <PageContext.Provider value={{ currentPage, navigateTo }}>
            {children}
        </PageContext.Provider>
    );
}

export function usePage(): PageContextType {
    const ctx = useContext(PageContext);
    if (!ctx) throw new Error('usePage must be used within a PageProvider');
    return ctx;
}
