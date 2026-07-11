"use client";

import { useEffect, useRef } from "react";
import { useWebSocket } from "../context/WebSocketContext";

const topic = "Kitchen monitor";

export default function MovementMonitor() {
    const enabled = (process.env.NEXT_PUBLIC_ENABLE_MOVEMENT_MONITOR === "1" || process.env.NEXT_PUBLIC_ENABLE_MOVEMENT_MONITOR === "true");
    if (!enabled) return null;

    const { subscribeToWebSocket, unsubscribeFromWebSocket } = useWebSocket();
    const lastStateRef = useRef<boolean | null>(null);
    const lastSentAtRef = useRef<number>(0);

    useEffect(() => {
        const id = subscribeToWebSocket((t, payload) => {
            if (t !== topic) return;

            const mv = payload?.occupancy;

            if (mv === null) return;

            const now = Date.now();
            // avoid spamming: only send if state changed and at least 1s since last send
            if (lastStateRef.current === mv && now - lastSentAtRef.current < 1000) return;
            if (lastStateRef.current === mv) return;

            lastStateRef.current = mv;
            lastSentAtRef.current = now;

            const action = mv ? "on" : "off";
            void fetch("/api/monitor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            }).catch((e) => console.error("MovementMonitor: api error", e));
        });

        return () => unsubscribeFromWebSocket(id);
    }, [subscribeToWebSocket, unsubscribeFromWebSocket]);

    return null;
}
