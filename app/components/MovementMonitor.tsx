"use client";

import { useEffect, useMemo, useRef } from "react";
import { useWebSocket } from "../context/WebSocketContext";
import { useLog } from "../context/LogContext";

const topic = "Kitchen monitor";

export default function MovementMonitor() {
    const enabled = useMemo(() => process.env.NEXT_PUBLIC_ENABLE_MOVEMENT_MONITOR === "1" || process.env.NEXT_PUBLIC_ENABLE_MOVEMENT_MONITOR === "true", []);

    const { subscribeToWebSocket, unsubscribeFromWebSocket } = useWebSocket();
    const { addLog } = useLog();

    const lastStateRef = useRef<boolean | null>(null);
    const lastSentAtRef = useRef<number>(0);

    useEffect(() => {
        if (!enabled) {
            addLog("MovementMonitor: disabled by NEXT_PUBLIC_ENABLE_MOVEMENT_MONITOR");
            return;
        }

        addLog("MovementMonitor: enabled, subscribing to topic: " + topic);

        const id = subscribeToWebSocket(async (t, payload) => {
            addLog(`MovementMonitor: incoming message t=${String(t)} payload=${JSON.stringify(payload)}`);

            if (t !== topic) return;

            const mv = payload?.occupancy;

            addLog(`MovementMonitor: parsed occupancy => ${String(mv)}`);

            if (mv === null || mv === undefined) return;

            const now = Date.now();
            // avoid spamming: only send if state changed and at least 1s since last send
            if (lastStateRef.current === mv && now - lastSentAtRef.current < 1000) return;
            if (lastStateRef.current === mv) return;

            lastStateRef.current = mv;
            lastSentAtRef.current = now;

            const action = mv ? "on" : "off";
            addLog(`MovementMonitor: calling /api/monitor action=${action}`);

            try {
                const res = await fetch("/api/monitor", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action }),
                });
                const text = await res.text().catch(() => "");
                addLog(`MovementMonitor: /api/monitor responded ${res.status} ${res.statusText} - ${text}`);
            } catch (e: any) {
                addLog(`MovementMonitor: fetch error ${String(e)}`);
            }
        });

        return () => {
            addLog("MovementMonitor: unsubscribing");
            unsubscribeFromWebSocket(id);
        };
    }, [subscribeToWebSocket, unsubscribeFromWebSocket, enabled, addLog]);

    return null;
}
