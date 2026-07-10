"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useWebSocket } from "./WebSocketContext";

export const pages = ['home', 'shopping', 'shoppingSettings'] as const;

export type PageId = typeof pages[number];

type PageContextType = {
    currentPage: PageId;
    navigateTo: (page: PageId) => void;
};

const PageContext = createContext<PageContextType | null>(null);

export function PageProvider({ children }: { children: React.ReactNode }) {
    const [currentPage, setCurrentPage] = useState<PageId>('home');

    const changePageBy = useCallback((delta: number) => {
        setCurrentPage((prev) => {
            const currentIndex = pages.indexOf(prev);
            const nextIndex = (currentIndex + delta + pages.length) % pages.length;
            return pages[nextIndex];
        });
    }, []);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'ArrowRight') changePageBy(1);
            if (event.key === 'ArrowLeft') changePageBy(-1);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        }
    }, [changePageBy]);

    // subscribe to websocket messages for page navigation (zigbee rotary cube)
    const { subscribeToWebSocket, unsubscribeFromWebSocket } = useWebSocket();

    useEffect(() => {
        const id = subscribeToWebSocket((topic, payload) => {
            try {
                const t = String(topic || '');
                console.log('PageContext: received websocket message', t, payload);
                if (t !== 'Office cube') return;

                let action: any = payload?.action ?? payload?.payload?.action ?? null;
                if (!action && typeof payload === 'string') {
                    try {
                        const p = JSON.parse(payload);
                        if (p) {
                            if (p.action) action = p.action;
                        }
                    } catch (e) { }
                }

                if (action === 'rotate_right') changePageBy(1);
                if (action === 'rotate_left') changePageBy(-1);
            } catch (e) {
                // ignore
            }
        });

        return () => {
            unsubscribeFromWebSocket(id);
        };
    }, [subscribeToWebSocket, unsubscribeFromWebSocket, changePageBy]);

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
