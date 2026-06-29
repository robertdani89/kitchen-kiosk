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

    return (
        <section className="h-full w-full bg-white p-1 rounded shadow">
            <h2 className="mb-2">Szenzorok</h2>
            <div className="grid grid-cols-4 grid-rows-2 gap-1">
                {sensors.map((s) => (
                    <div key={s.id} className="border rounded p-1 border-gray-200 bg-gray-50">
                        <div>{s.icon} {s.name} </div>
                        <div className="text-sm">🌡️{s.temperature != null ? `${s.temperature.toFixed(1)} °C` : '—'}</div>
                        <div className="text-sm">💦{s.humidity != null ? `${s.humidity.toFixed(1)} %` : '—'}</div>
                    </div>
                ))}
            </div>
        </section>
    );
}
