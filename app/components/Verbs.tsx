"use client";

import { useEffect, useState } from 'react';

type VerseDetails = {
    text?: string;
    reference?: string;
    version?: string;
    book?: string;
};

const refreshInterval = 6 * 60 * 60 * 1000;

export default function Verbs() {
    const [verse, setVerse] = useState<VerseDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadVerse = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('https://beta.ourmanna.com/api/v1/get/?format=json&order=daily');
            if (!res.ok) throw new Error(await res.text());
            const json = await res.json();
            setVerse(json?.verse?.details ?? null);
        } catch (e) {
            setError(String(e));
            setVerse(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadVerse();
        const interval = setInterval(loadVerse, refreshInterval);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="col-span-1 bg-white p-1 rounded shadow">
            <h2 className="mb-2">Napi ige</h2>
            <div className="flex-1 rounded overflow-hidden">
                {error && <div className="text-xs text-red-600">Error: {error}</div>}
                {!error && !verse && !loading && <div className="text-xs text-gray-500">No verse available</div>}
                {!error && verse && (
                    <div className="text-sm text-gray-800">
                        <div className="mb-2">"{verse.text}"</div>
                        <div className="text-xs text-gray-600">{verse.reference}{verse.version ? ` — ${verse.version}` : ''}</div>
                    </div>
                )}
            </div>
        </section>
    );
}