"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef } from "react";
import { useWebSocket } from "./WebSocketContext";

export type RotaryAction = "rotate_left" | "rotate_right";

/** Return true to stop further subscribers from receiving the event. */
type RotaryEventCallback = (action: RotaryAction) => boolean;

type Subscriber = {
    id: number;
    priority: number;
    callback: RotaryEventCallback;
};

type RotaryEventContextType = {
    subscribe: (priority: number, callback: RotaryEventCallback) => number;
    unsubscribe: (id: number) => void;
};

const RotaryEventContext = createContext<RotaryEventContextType | null>(null);

let nextId = 1;

export function RotaryEventProvider({ children }: { children: React.ReactNode }) {
    const subscribersRef = useRef<Subscriber[]>([]);
    const { subscribeToWebSocket, unsubscribeFromWebSocket } = useWebSocket();

    const subscribe = useCallback((priority: number, callback: RotaryEventCallback): number => {
        const id = nextId++;
        subscribersRef.current = [...subscribersRef.current, { id, priority, callback }]
            .sort((a, b) => a.priority - b.priority);
        return id;
    }, []);

    const unsubscribe = useCallback((id: number) => {
        subscribersRef.current = subscribersRef.current.filter(s => s.id !== id);
    }, []);

    useEffect(() => {
        const id = subscribeToWebSocket((topic, payload) => {
            try {
                const t = String(topic || "");
                if (t !== "Office cube") return;

                let action: string | null = payload?.action ?? payload?.payload?.action ?? null;
                if (!action && typeof payload === "string") {
                    try {
                        const p = JSON.parse(payload);
                        if (p?.action) action = p.action;
                    } catch { }
                }

                if (action !== "rotate_left" && action !== "rotate_right") return;

                for (const subscriber of subscribersRef.current) {
                    const stop = subscriber.callback(action as RotaryAction);
                    if (stop) break;
                }
            } catch { }
        });

        return () => unsubscribeFromWebSocket(id);
    }, [subscribeToWebSocket, unsubscribeFromWebSocket]);

    return (
        <RotaryEventContext.Provider value={{ subscribe, unsubscribe }}>
            {children}
        </RotaryEventContext.Provider>
    );
}

export function useRotaryEvent(): RotaryEventContextType {
    const ctx = useContext(RotaryEventContext);
    if (!ctx) throw new Error("useRotaryEvent must be used within RotaryEventProvider");
    return ctx;
}
