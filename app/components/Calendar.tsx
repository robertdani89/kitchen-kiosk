"use client";

import { useEffect, useState } from 'react';

export default function Calendar() {
    const [token, setToken] = useState<string>(() => typeof window !== 'undefined' ? (localStorage.getItem('google_token') || '') : '');
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (token) {
            localStorage.setItem('google_token', token);
            fetchEvents(token);
        }
    }, [token]);

    useEffect(() => {
        if (!token) {
            const fromStorage = typeof window !== 'undefined' ? localStorage.getItem('google_token') : '';
            if (fromStorage) {
                setToken(fromStorage);
                return;
            }
            if (typeof document !== 'undefined') {
                const m = document.cookie.match(/(?:^|; )google_token=([^;]+)/);
                if (m) {
                    setToken(decodeURIComponent(m[1]));
                    return;
                }
            }
        }
        if (token) fetchEvents(token);
    }, []);

    const handleAuthorize = () => {
        window.open('/api/auth/google/start', '_blank');
    };

    const fetchEvents = async (accessToken: string) => {
        setLoading(true);
        try {
            const now = new Date().toISOString();
            const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=4&orderBy=startTime&singleEvents=true&timeMin=${encodeURIComponent(now)}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || res.statusText);
            }
            const data = await res.json();
            setEvents(data.items || []);
        } catch (e) {
            console.error('Calendar fetch error', e);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const saveTokenFromInput = (val: string) => {
        setToken(val.trim());
    };

    const pad = (n: number) => n.toString().padStart(2, '0');
    const formatDate = (iso?: string) => {
        if (!iso) return '';
        let dt = new Date(iso);
        if (isNaN(dt.getTime())) {
            dt = new Date(iso + 'T00:00:00');
        }
        if (isNaN(dt.getTime())) return iso;
        return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
    };

    return (
        <section className="col-span-1 bg-white p-1 rounded shadow">
            <h2 className="mb-2">Következő események</h2>
            {!token ? (
                <div>
                    <div className="text-xs text-gray-600 mb-2">To display your upcoming events, authorize this app to access your Google Calendar.</div>
                    <div className="flex gap-2 mb-3">
                        <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={handleAuthorize}>Authorize Google</button>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">If you completed OAuth and received an access token, paste it here:</div>
                    <div className="flex gap-2">
                        <input className="border p-2 flex-1" placeholder="Paste access token" onChange={(e) => setToken(e.target.value)} />
                        <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={() => saveTokenFromInput((document.querySelector('input[placeholder="Paste access token"]') as HTMLInputElement).value)}>Save</button>
                    </div>
                </div>
            ) : (
                <div>
                    <div className="space-y-1">
                        {loading && <div className="text-xs text-gray-500">Loading...</div>}
                        {!loading && events.length === 0 && <div className="text-xs text-gray-500">No upcoming events</div>}
                        {events.map((ev: any, i: number) => (
                            <div key={i} className="bg-gray-100 border border-gray-200 rounded p-1">
                                <div className="font-medium">{ev.summary || '(no title)'}</div>
                                <div className="text-xs text-gray-600">{formatDate(ev.start?.dateTime ?? ev.start?.date)}</div>
                                {ev.location && <div className="text-xs text-gray-600">📍 {ev.location}</div>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
