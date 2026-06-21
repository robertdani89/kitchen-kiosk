"use client";

import { useEffect, useState } from 'react';
import { useGoogleAuth } from '../context/GoogleAuthContext';
import { useLog } from '../context/LogContext';

export default function Tasks() {
    const { googleToken, fetchWithAuth } = useGoogleAuth();
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const { addLog } = useLog();

    useEffect(() => {
        if (googleToken) {
            loadTasks();
        }
    }, [googleToken]);

    const handleAuthorize = () => {
        window.open('/api/auth/google/start', '_blank');
    };

    const loadTasks = async () => {
        setLoading(true);
        try {
            const data = await fetchTasks();
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

    const fetchTasks = async () => {
        try {
            const res = await fetchWithAuth('https://www.googleapis.com/tasks/v1/lists/@default/tasks');
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        } catch (e) {
            addLog('Google tasks fetch error: ' + String(e));
            throw e;
        }
    };

    return (
        <section className="col-span-1 bg-white p-1 rounded shadow">
            <h2 className="mb-2">Teendők</h2>
            {!googleToken ? (
                <div>
                    <div className="text-xs text-gray-600 mb-2">Authorize to view your unfinished tasks.</div>
                    <div className="flex gap-2 mb-3">
                        <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={handleAuthorize}>Authorize Google</button>
                    </div>
                </div>
            ) : (
                <div>
                    <div className="space-y-2">
                        {loading && <div className="text-xs text-gray-500">Loading...</div>}
                        {!loading && tasks.length === 0 && <div className="text-xs text-gray-500">No unfinished tasks</div>}
                        {tasks.map((t: any, i: number) => (
                            <div key={i} className="p-0 border-b border-gray-200 last:border-b-0">
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
