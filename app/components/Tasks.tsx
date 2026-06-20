"use client";

import { useEffect, useState } from 'react';

export default function Tasks() {
    const [token, setToken] = useState<string>(() => typeof window !== 'undefined' ? (localStorage.getItem('google_token') || '') : '');
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (token) {
            localStorage.setItem('google_token', token);
            fetchTasks(token);
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
        if (token) fetchTasks(token);
    }, []);

    const handleAuthorize = () => {
        window.open('/api/auth/google/start', '_blank');
    };

    const fetchTasks = async (accessToken: string) => {
        setLoading(true);
        try {
            const res = await fetch('https://www.googleapis.com/tasks/v1/lists/@default/tasks?showCompleted=false&maxResults=20', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || res.statusText);
            }
            const data = await res.json();
            const items = data.items?.filter((t: any) => !t.completed) ?? [];
            items.sort((a: any, b: any) => (a.position || '').localeCompare(b.position || ''));
            setTasks(items);
        } catch (e) {
            console.error('Tasks fetch error', e);
            setTasks([]);
        } finally {
            setLoading(false);
        }
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
            <h2 className="mb-2">Teendők</h2>
            {!token ? (
                <div>
                    <div className="text-xs text-gray-600 mb-2">Authorize to view your unfinished tasks.</div>
                    <div className="flex gap-2 mb-3">
                        <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={handleAuthorize}>Authorize Google</button>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">Or paste an access token:</div>
                    <div className="flex gap-2">
                        <input className="border p-2 flex-1" placeholder="Paste access token" onChange={(e) => setToken(e.target.value)} />
                    </div>
                </div>
            ) : (
                <div>
                    <div className="space-y-2">
                        {loading && <div className="text-xs text-gray-500">Loading...</div>}
                        {!loading && tasks.length === 0 && <div className="text-xs text-gray-500">No unfinished tasks</div>}
                        {tasks.map((t: any, i: number) => (
                            <div key={i} className="p-2">
                                <div className="font-medium">{t.title}</div>
                                {t.due && <div className="text-xs text-gray-600">Due: {formatDate(t.due)}</div>}
                                {t.notes && <div className="text-xs text-gray-600">{t.notes}</div>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
