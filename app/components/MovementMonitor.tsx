"use client";

import { useEffect, useRef } from "react";
import { useWebSocket } from "../context/WebSocketContext";
import { useLog } from "../context/LogContext";

const topic = "Kitchen monitor";

export default function MovementMonitor() {
    const enabled = (process.env.NEXT_PUBLIC_ENABLE_MOVEMENT_MONITOR === "1" || process.env.NEXT_PUBLIC_ENABLE_MOVEMENT_MONITOR === "true");

    const { subscribeToWebSocket, unsubscribeFromWebSocket } = useWebSocket();
    const { addLog } = useLog();

    const lastStateRef = useRef<boolean | null>(null);
    const lastSentAtRef = useRef<number>(0);

    useEffect(() => {
        if (!enabled) {
            try { addLog("MovementMonitor: disabled by NEXT_PUBLIC_ENABLE_MOVEMENT_MONITOR"); } catch (e) { }
            return;
        }

        try { addLog("MovementMonitor: enabled, subscribing to topic: " + topic); } catch (e) { }

        const id = subscribeToWebSocket(async (t, payload) => {
            try { addLog(`MovementMonitor: incoming message t=${String(t)} payload=${JSON.stringify(payload)}`); } catch (e) { }

            if (t !== topic) return;

            const mv = payload?.occupancy;

            try { addLog(`MovementMonitor: parsed occupancy => ${String(mv)}`); } catch (e) { }

            if (mv === null || mv === undefined) return;

            const now = Date.now();
            // avoid spamming: only send if state changed and at least 1s since last send
            if (lastStateRef.current === mv && now - lastSentAtRef.current < 1000) return;
            if (lastStateRef.current === mv) return;

            lastStateRef.current = mv;
            lastSentAtRef.current = now;

            const action = mv ? "on" : "off";
            try { addLog(`MovementMonitor: calling /api/monitor action=${action}`); } catch (e) { }

            try {
                const res = await fetch("/api/monitor", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action }),
                });
                const text = await res.text().catch(() => "");
                try { addLog(`MovementMonitor: /api/monitor responded ${res.status} ${res.statusText} - ${text}`); } catch (e) { }
            } catch (e: any) {
                try { addLog(`MovementMonitor: fetch error ${String(e)}`); } catch (err) { }
            }
        });

        return () => {
            try { addLog("MovementMonitor: unsubscribing"); } catch (e) { }
            unsubscribeFromWebSocket(id);
        };
    }, [subscribeToWebSocket, unsubscribeFromWebSocket, enabled, addLog]);

    return null;
}
