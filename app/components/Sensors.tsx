"use client";

import { useEffect, useState } from "react";
import { useWebSocket } from "../context/WebSocketContext";

export type SensorData = {
    id: number;
    name: string;
    topic: string;
    temperature: number | null;
    humidity: number | null;
    last_seen: string;
    icon: string;
};

export default function Sensors({
}: {
    }) {
    const { subscribeToWebSocket, unsubscribeFromWebSocket } = useWebSocket();

    const [sensors, setSensors] = useState<SensorData[]>([
        { id: 1, name: 'Outside', topic: 'Outside temp', temperature: null, humidity: null, last_seen: '', icon: '🌳' },
        { id: 2, name: 'Living room', topic: 'Living room temp', temperature: null, humidity: null, last_seen: '', icon: '🛋️' },
        { id: 3, name: 'Bedroom', topic: 'Bedroom temp', temperature: null, humidity: null, last_seen: '', icon: '🛏️' },
    ]);

    const processIncoming = (topic: string, payload: any) => {
        const temp = payload.temperature ?? payload.temp ?? payload.payload?.temperature ?? payload.payload?.temp ?? null;
        const hum = payload.humidity ?? payload.hum ?? payload.payload?.humidity ?? null;
        const last_seen = payload.last_seen ?? payload.lastSeen ?? payload.time ?? '';

        setSensors((sarr) => sarr.map((s) => {
            if (s.topic === topic || topic.includes(s.name) || topic.toLowerCase().includes(s.name.toLowerCase())) {
                return {
                    ...s,
                    temperature: temp != null ? Number(temp) : s.temperature,
                    humidity: hum != null ? Number(hum) : s.humidity,
                    last_seen: last_seen || s.last_seen,
                };
            }
            return s;
        }));
    };

    useEffect(() => {
        const id = subscribeToWebSocket((topic, payload) => processIncoming(topic, payload));

        return () => {
            unsubscribeFromWebSocket(id);
        };
    }, []);

    const parseTimestamp = (ts: string) => {
        if (!ts) return null;
        const n = Number(ts);
        if (!Number.isNaN(n)) return new Date(n);
        const d = new Date(ts);
        return isNaN(d.getTime()) ? null : d;
    };

    const ms = {
        minute: 60_000,
        hour: 60 * 60_000,
    };

    const timeAgo = (d: Date) => {
        const diff = Date.now() - d.getTime();
        if (diff < ms.minute) return 'épp most';
        const days = Math.floor(diff / (ms.hour * 24));
        if (days > 3) return `${days} napja`;
        const hrs = Math.floor(diff / ms.hour);
        const mins = Math.floor((diff % ms.hour) / ms.minute);
        if (hrs > 3) return `${hrs} órája`;
        return `${mins} perce`;
    };

    const cardClassesFor = (lastSeenStr: string) => {
        const d = parseTimestamp(lastSeenStr);
        const base = 'border rounded p-1 bg-gray-50';
        if (!d) return `${base} border-gray-200`;

        const diff = Date.now() - d.getTime();

        if (diff > 12 * ms.hour) {
            // more than 12 hours: red border, pulse, mild red background
            return `${base} border-red-600 bg-red-50 animate-pulse`;
        }

        if (diff > 3 * ms.hour) {
            // more than 3 hours: yellow border
            return `${base} border-yellow-400`;
        }

        return `${base} border-gray-200`;
    };

    return (
        <section className="h-full w-full bg-white p-1 rounded shadow">
            <h2 className="mb-2">Szenzorok</h2>
            <div className="grid grid-cols-4 grid-rows-2 gap-1">
                {sensors.map((s) => {
                    const d = parseTimestamp(s.last_seen);
                    const showLastSeen = d ? (Date.now() - d.getTime()) > (30 * ms.minute) : false;
                    return (
                        <div key={s.id} className={cardClassesFor(s.last_seen)}>
                            <div>{s.icon} {s.name}</div>
                            <div className="text-sm">🌡️{s.temperature != null ? `${s.temperature.toFixed(1)} °C` : '—'}</div>
                            <div className="text-sm">💦{s.humidity != null ? `${s.humidity.toFixed(1)} %` : '—'}</div>
                            {showLastSeen && d && (
                                <>
                                    <div className="text-xs text-gray-700">{timeAgo(d)}</div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
