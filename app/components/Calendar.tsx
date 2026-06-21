"use client";

import { useEffect, useState, useCallback } from 'react';
import { useGoogleAuth } from '../context/GoogleAuthContext';
import { useLog } from '../context/LogContext';

const fetchingInterval = 10 * 60 * 1000;
const twoWeeksInMs = 14 * 24 * 60 * 60 * 1000;

export default function Calendar() {
    const { googleToken, fetchWithAuth } = useGoogleAuth();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const { addLog } = useLog();

    const handleAuthorize = () => {
        window.open('/api/auth/google/start', '_blank');
    };

    const fetchEvents = useCallback(async () => {
        try {
            const now = new Date();
            const nowIso = now.toISOString();
            const maxDate = new Date(now.getTime() + twoWeeksInMs);
            const timeMaxIso = maxDate.toISOString();
            const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=4&orderBy=startTime&singleEvents=true&timeMin=${encodeURIComponent(nowIso)}&timeMax=${encodeURIComponent(timeMaxIso)}`;
            const res = await fetchWithAuth(url);
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        } catch (e) {
            addLog('Google events fetch error: ' + String(e));
            throw e;
        }
    }, [fetchWithAuth, addLog]);

    const loadEvents = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchEvents();
            setEvents(data.items || []);
        } catch (e) {
            addLog('Google calendar fetch error: ' + String(e));
            setEvents([]);
        } finally {
            setLoading(false);
        }
    }, [fetchEvents, addLog]);

    useEffect(() => {
        if (!googleToken) return;
        loadEvents();
        const id = setInterval(() => {
            loadEvents();
        }, fetchingInterval);
        return () => clearInterval(id);
    }, [googleToken, loadEvents]);

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
        <section className="col-span-1 bg-white p-1 rounded shadow overflow-y-hidden">
            <h2 className="mb-2">Következő események</h2>
            {!googleToken ? (
                <div>
                    <div className="text-xs text-gray-600 mb-2">To display your upcoming events, authorize this app to access your Google Calendar.</div>
                    <div className="flex gap-2 mb-3">
                        <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={handleAuthorize}>Authorize Google</button>
                    </div>
                </div>
            ) : (
                <div>
                    <div className="space-y-1">
                        {loading && <div className="text-xs text-gray-500">Loading...</div>}
                        {!loading && events.length === 0 && <div className="text-xs text-gray-500">No upcoming events</div>}
                        {events.map((ev: any, i: number) => (
                            <div key={i} className="bg-gray-50 border border-gray-200 rounded p-1">
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
