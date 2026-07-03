"use client";

import React, { createContext, useContext, useState } from "react";

export type PageId = 'home' | 'hello';

type PageContextType = {
    currentPage: PageId;
    navigateTo: (page: PageId) => void;
};

const PageContext = createContext<PageContextType | null>(null);

export function PageProvider({ children }: { children: React.ReactNode }) {
    const [currentPage, setCurrentPage] = useState<PageId>('home');

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
