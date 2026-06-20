"use client";

import { useEffect, useRef, useState } from "react";

const address = process.env.NEXT_PUBLIC_WS_ADDRESS || "ws://192.168.0.139:8080/api";
const weatherCity = process.env.NEXT_PUBLIC_WEATHER_CITY || "Budapest";
const openWeatherKey = process.env.NEXT_PUBLIC_OPENWEATHER_KEY || "";

const pollingInterval = 10 * 60 * 1000; // 10 minutes

export default function Home() {
    const [connected, setConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

    const [googleToken, setGoogleToken] = useState(process.env.NEXT_PUBLIC_GOOGLE_TOKEN || "");

    const [sensors, setSensors] = useState(() => [
        { id: 1, name: 'Living room', topic: 'Living room temp', temperature: null as number | null, humidity: null as number | null, last_seen: '' },
        // { id: 2, name: 'Kitchen', topic: 'Kitchen temp', temperature: null as number | null, humidity: null as number | null, last_seen: '' },
        { id: 3, name: 'Bedroom', topic: 'Bedroom temp', temperature: null as number | null, humidity: null as number | null, last_seen: '' },
        // { id: 4, name: 'Hall', topic: 'Hall temp', temperature: null as number | null, humidity: null as number | null, last_seen: '' },
        // { id: 5, name: 'Garage', topic: 'Garage temp', temperature: null as number | null, humidity: null as number | null, last_seen: '' },
    ]);

    const [weather, setWeather] = useState<any>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);

    const addLog = (msg: string) => {
        console.log(msg);
        setLogs((s) => [new Date().toLocaleTimeString() + " — " + msg, ...s]);
    }


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

    const fetchWeather = async () => {
        if (!openWeatherKey) return addLog('OpenWeather key missing');
        try {
            const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(weatherCity)}&appid=${openWeatherKey}&units=metric`);
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setWeather(data);
            addLog('Weather loaded');
        } catch (e) {
            addLog('Weather error: ' + String(e));
        }
    };

    const fetchGoogleTasksAndEvents = async () => {
        if (!googleToken) return addLog('Google token missing');
        try {
            const tRes = await fetch('https://www.googleapis.com/tasks/v1/lists/@default/tasks', { headers: { Authorization: `Bearer ${googleToken}` } });
            if (tRes.ok) {
                const tJson = await tRes.json();
                setTasks(tJson.items ?? []);
                addLog('Google Tasks loaded');
            } else {
                addLog('Tasks error: ' + (await tRes.text()));
            }

            const nowIso = new Date().toISOString();
            const cRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=10&orderBy=startTime&singleEvents=true&timeMin=${encodeURIComponent(nowIso)}`, { headers: { Authorization: `Bearer ${googleToken}` } });
            if (cRes.ok) {
                const cJson = await cRes.json();
                setEvents(cJson.items ?? []);
                addLog('Calendar events loaded');
            } else {
                addLog('Calendar error: ' + (await cRes.text()));
            }
        } catch (e) {
            addLog('Google fetch error: ' + String(e));
        }
    };

    const groupedForecast = (forecast: any) => {
        if (!forecast || !forecast.list) return [];
        const byDay: Record<string, any[]> = {};
        for (const item of forecast.list) {
            const d = item.dt_txt.split(' ')[0];
            (byDay[d] ||= []).push(item);
        }
        return Object.keys(byDay).slice(0, 5).map((date) => {
            const items = byDay[date];
            const mid = items[Math.floor(items.length / 2)];
            return { date, temp: mid.main.temp.toFixed(1), desc: mid.weather[0].description };
        });
    };

    useEffect(() => {
        connect();
        return () => {
            try { if (wsRef.current) wsRef.current.close(); } catch (e) { }
        };
    }, []);

    useEffect(() => {
        fetchWeather();
        const id = setInterval(() => {
            fetchWeather();
        }, pollingInterval);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="min-h-screen p-6 bg-gray-100 text-gray-900 font-sans">
            <main className="max-w-6xl mx-auto grid grid-cols-3 gap-6">
                <section className="col-span-1 bg-white p-4 rounded shadow">
                    <h2 className="font-semibold mb-2">Sensors</h2>
                    <div className="space-y-3">
                        {sensors.map((s) => (
                            <div key={s.id} className="border rounded p-3">
                                <div className="flex justify-between">
                                    <div className="font-medium">{s.name}</div>
                                    <div className="text-xs text-gray-500">{s.topic}</div>
                                </div>
                                <div className="mt-2 text-2xl">{s.temperature != null ? `${s.temperature.toFixed(1)} °C` : '—'}</div>
                                <div className="text-sm">Humidity: {s.humidity != null ? `${s.humidity.toFixed(1)} %` : '—'}</div>
                                <div className="text-xs text-gray-500 mt-1">{s.last_seen ? new Date(s.last_seen).toLocaleString() : ''}</div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="col-span-1 bg-white p-4 rounded shadow">
                    <div>
                        {weather ? (
                            <div>
                                <h2 className="font-medium">{weather.city?.name} weather forecast</h2>
                                <div className="mt-2 text-sm space-y-1">
                                    {groupedForecast(weather).map((d: any) => (
                                        <div key={d.date} className="flex justify-between">
                                            <div>{d.date}</div>
                                            <div className="text-right">{d.temp} °C — {d.desc}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-xs text-gray-500">Weather not loaded</div>
                        )}
                    </div>
                </section>

                <section className="col-span-1 bg-white p-4 rounded shadow">
                    <h2 className="font-semibold mb-2">Google</h2>
                    <div className="text-xs text-gray-600 mb-2">Paste an OAuth access token with Tasks & Calendar scopes.</div>
                    <input className="border p-2 w-full mb-2" value={googleToken} onChange={(e) => setGoogleToken(e.target.value)} placeholder="Google access token" />
                    <div className="flex gap-2 mb-3">
                        <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={fetchGoogleTasksAndEvents}>Refresh Google</button>
                    </div>

                    <div className="mb-3">
                        <div className="font-medium">Upcoming events</div>
                        <div className="text-sm mt-1 space-y-1">
                            {events.length ? events.map((ev, i) => (
                                <div key={i} className="border p-2 rounded">
                                    <div className="font-medium">{ev.summary}</div>
                                    <div className="text-xs text-gray-600">{ev.start?.dateTime ?? ev.start?.date}</div>
                                </div>
                            )) : <div className="text-xs text-gray-500">No events</div>}
                        </div>
                    </div>

                    <div>
                        <div className="font-medium">Tasks</div>
                        <div className="text-sm mt-1 space-y-1">
                            {tasks.length ? tasks.map((t, i) => (
                                <div key={i} className="border p-2 rounded">
                                    <div>{t.title}</div>
                                    <div className="text-xs text-gray-600">{t.notes}</div>
                                </div>
                            )) : <div className="text-xs text-gray-500">No tasks</div>}
                        </div>
                    </div>
                </section>
            </main>

            {/* <footer className="max-w-6xl mx-auto mt-6">
                <div className="bg-white p-3 rounded shadow">
                    <div className="flex justify-between items-center mb-2">
                        <div className="text-sm">Connection: {connected ? 'Connected' : 'Disconnected'}</div>
                        <div className="text-xs text-gray-600">WebSocket: {address}</div>
                    </div>
                    <div className="max-h-40 overflow-auto border p-2 bg-gray-50">
                        {logs.map((l, i) => <div key={i} className="text-xs">{l}</div>)}
                    </div>
                </div>
            </footer> */}
        </div>
    );
}
