"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useLog } from "./LogContext";

const address = process.env.NEXT_PUBLIC_WS_ADDRESS || "ws://192.168.0.139:8080/api";

type WebSocketContextType = {
    connected: boolean;
    connect: () => void;
    subscribeToWebSocket: (cb: (topic: string, payload: any) => void) => string;
    unsubscribeFromWebSocket: (id: string) => void;
    disconnect: () => void;
};

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
    const { addLog } = useLog();
    const [connected, setConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);

    type Subscriber = { cb: (topic: string, payload: any) => void };
    const subscribersRef = useRef<Map<string, Subscriber>>(new Map());
    let subIdCounter = useRef(0);

    const subscribeToWebSocket = useCallback((cb: (topic: string, payload: any) => void): string => {
        const id = String(++subIdCounter.current);
        subscribersRef.current.set(id, { cb });
        return id;
    }, []);

    const unsubscribeFromWebSocket = useCallback((id: string) => {
        subscribersRef.current.delete(id);
    }, []);

    const processIncoming = (topic: string, payload: any) => {
        subscribersRef.current.forEach(({ cb }) => {
            cb(topic, payload);
        });
    };

    const connect = () => {
        addLog(`Connecting to ${address} (raw WebSocket)`);
        try {
            if (wsRef.current) {
                try { wsRef.current.close(); } catch (e) { }
                wsRef.current = null;
            }
        } catch (e) { }

        try {
            const ws = new WebSocket(address);
            wsRef.current = ws;

            ws.addEventListener('open', () => {
                setConnected(true);
                addLog('WebSocket open');
            });

            ws.addEventListener('message', (ev) => {
                const data = typeof ev.data === 'string' ? ev.data : null;
                if (data) {
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed && typeof parsed === 'object') {
                            if (parsed.topic && parsed.payload) {
                                processIncoming(parsed.topic, parsed.payload);
                            } else if (parsed.payload?.topic) {
                                processIncoming(parsed.payload.topic, parsed.payload);
                            }
                        }
                    } catch (e) {
                        addLog('Error parsing message: ' + String(e));
                    }
                } else {
                    addLog('[binary message]');
                }
            });

            ws.addEventListener('close', () => {
                setConnected(false);
                addLog('WebSocket closed');
            });

            ws.addEventListener('error', (err) => {
                console.error('WebSocket error:', err);
                addLog('WebSocket error');
            });
        } catch (e) {
            addLog('WebSocket connect error: ' + String(e));
        }
    };

    const disconnect = () => {
        try { if (wsRef.current) wsRef.current.close(); } catch (e) { }
        wsRef.current = null;
        setConnected(false);
        addLog('Disconnected');
    };

    useEffect(() => {
        connect();
        return () => {
            try { if (wsRef.current) wsRef.current.close(); } catch (e) { }
        };
    }, []);

    return (
        <WebSocketContext.Provider value={{ connected, connect, subscribeToWebSocket, unsubscribeFromWebSocket, disconnect }}>
            {children}
        </WebSocketContext.Provider>
    );
}

export function useWebSocket(): WebSocketContextType {
    const ctx = useContext(WebSocketContext);
    if (!ctx) throw new Error('useWebSocket must be used within a WebSocketProvider');
    return ctx;
}
