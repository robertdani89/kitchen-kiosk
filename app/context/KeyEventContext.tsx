"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef } from "react";

/** Return true to stop further subscribers from receiving the event. */
type KeyEventCallback = (e: KeyboardEvent) => boolean;

type Subscriber = {
    id: number;
    priority: number;
    callback: KeyEventCallback;
};

type KeyEventContextType = {
    subscribe: (priority: number, callback: KeyEventCallback) => number;
    unsubscribe: (id: number) => void;
};

const KeyEventContext = createContext<KeyEventContextType | null>(null);

let nextId = 1;

export function KeyEventProvider({ children }: { children: React.ReactNode }) {
    const subscribersRef = useRef<Subscriber[]>([]);

    const subscribe = useCallback((priority: number, callback: KeyEventCallback): number => {
        const id = nextId++;
        subscribersRef.current = [...subscribersRef.current, { id, priority, callback }]
            .sort((a, b) => a.priority - b.priority);
        return id;
    }, []);

    const unsubscribe = useCallback((id: number) => {
        subscribersRef.current = subscribersRef.current.filter(s => s.id !== id);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            for (const subscriber of subscribersRef.current) {
                const stop = subscriber.callback(e);
                if (stop) break;
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <KeyEventContext.Provider value={{ subscribe, unsubscribe }}>
            {children}
        </KeyEventContext.Provider>
    );
}

export function useKeyEvent(): KeyEventContextType {
    const ctx = useContext(KeyEventContext);
    if (!ctx) throw new Error("useKeyEvent must be used within KeyEventProvider");
    return ctx;
}
