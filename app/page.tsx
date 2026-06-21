"use client";

import { useEffect, useRef, useState } from "react";
import Sensors from './components/Sensors';
import WeatherToday from './components/WeatherToday';
import WeatherForecast from './components/WeatherForecast';
import { LogProvider, useLog } from './context/LogContext';
import { WeatherProvider } from "./context/WeatherContext";
import { GoogleProvider } from './context/GoogleAuthContext';
import Calendar from "./components/Calendar";
import Tasks from "./components/Tasks";
import Photos from "./components/Photos";
import Verbs from "./components/Verbs";

const address = process.env.NEXT_PUBLIC_WS_ADDRESS || "ws://192.168.0.139:8080/api";
const weatherCity = process.env.NEXT_PUBLIC_WEATHER_CITY || "Budapest";

function HomeContent() {
    const { addLog, logs } = useLog();
    const [connected, setConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);

    // Google auth moved to its own context provider

    const [sensors, setSensors] = useState(() => [
        { id: 1, name: 'Outside', topic: 'Outside temp', temperature: null as number | null, humidity: null as number | null, last_seen: '', icon: '🌳' },
        { id: 2, name: 'Living room', topic: 'Living room temp', temperature: null as number | null, humidity: null as number | null, last_seen: '', icon: '🛋️' },
        { id: 3, name: 'Bedroom', topic: 'Bedroom temp', temperature: null as number | null, humidity: null as number | null, last_seen: '', icon: '🛏️' },
        // { id: 4, name: 'Hall', topic: 'Hall temp', temperature: null as number | null, humidity: null as number | null, last_seen: '', icon: '🚪' },
        // { id: 5, name: 'Garage', topic: 'Garage temp', temperature: null as number | null, humidity: null as number | null, last_seen: '', icon: '🚗' },
    ]);

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
                    // addLog(`WS message: ${data}`);
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed && typeof parsed === 'object') {
                            if (parsed.topic && parsed.payload) {
                                processIncoming(parsed.topic, parsed.payload);
                            } else {
                                if (parsed.payload && parsed.payload.topic) {
                                    processIncoming(parsed.payload.topic, parsed.payload);
                                }
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

    const processIncoming = (topic: string, payload: any) => {
        const temp = payload.temperature ?? payload.temp ?? payload.payload?.temperature ?? payload.payload?.temp ?? null;
        const hum = payload.humidity ?? payload.hum ?? payload.payload?.humidity ?? null;
        const last_seen = payload.last_seen ?? payload.lastSeen ?? payload.time ?? '';

        setSensors((sarr) => sarr.map((s) => {
            if (s.topic === topic || topic.includes(s.name) || topic.toLowerCase().includes(s.name.toLowerCase())) {
                return { ...s, temperature: temp != null ? Number(temp) : s.temperature, humidity: hum != null ? Number(hum) : s.humidity, last_seen: last_seen || s.last_seen };
            }
            return s;
        }));
    };

    // Google fetch functions are now provided by `useGoogleAuth()`


    useEffect(() => {
        connect();
        return () => {
            try { if (wsRef.current) wsRef.current.close(); } catch (e) { }
        };
    }, []);

    return (
        <div className="h-[100vh] w-[100vw] p-1 bg-gray-100 text-gray-900 font-sans">
            <main className="mx-auto h-full grid grid-cols-5 grid-rows-3 gap-1">
                <div className="row-start-1 col-span-2">
                    <WeatherToday city={weatherCity} />
                </div>
                <div className="row-start-2 col-span-2">
                    <WeatherForecast city={weatherCity} />
                </div>
                <div className="row-start-3 col-start-1 col-span-2">
                    <Sensors sensors={sensors} />
                </div>

                <Calendar />
                <Tasks />
                <Verbs />

                <div className="row-start-2 col-span-3 row-span-2">
                    <Photos />
                </div>


                {/* 
                <div className="col-span-5 mt-2">
                    <div className="bg-white p-3 rounded shadow">
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-sm">Connection: {connected ? 'Connected' : 'Disconnected'}</div>
                            <div className="text-xs text-gray-600">WebSocket: {address}</div>
                        </div>
                        <div className="max-h-40 overflow-auto border p-2 bg-gray-50">
                            {logs.map((l, i) => <div key={i} className="text-xs">{l}</div>)}
                        </div>
                    </div>
                </div> */}
            </main>
        </div>
    );
}

export default function Home() {
    return (
        <LogProvider>
            <WeatherProvider>
                <GoogleProvider>
                    <HomeContent />
                </GoogleProvider>
            </WeatherProvider>
        </LogProvider>
    );
}
