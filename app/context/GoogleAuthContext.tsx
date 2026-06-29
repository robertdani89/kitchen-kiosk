"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type GoogleAuthContextType = {
    googleToken: string;
    setGoogleToken: (t: string, expiresInSec?: number) => void;
    fetchWithAuth: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
};

const GoogleAuthContext = createContext<GoogleAuthContextType | null>(null);

export function GoogleProvider({ children }: { children: React.ReactNode }) {
    const [googleToken, setGoogleTokenRaw] = useState<string>('');

    useEffect(() => {
        try {
            const fromStorage = localStorage.getItem('google_token');
            if (fromStorage) {
                setGoogleTokenRaw(fromStorage);
                return;
            }
            const m = document.cookie.match(/(?:^|; )google_token=([^;]+)/);
            if (m) {
                setGoogleTokenRaw(decodeURIComponent(m[1]));
                return;
            }
            if (process.env.NEXT_PUBLIC_GOOGLE_TOKEN) {
                setGoogleTokenRaw(process.env.NEXT_PUBLIC_GOOGLE_TOKEN);
            }
        } catch (e) { }
    }, []);

    useEffect(() => {
        let cancelled = false;
        let timeoutId: number | undefined;

        const scheduleRefresh = (expiresInSec: number) => {
            const bufferMs = 60 * 1000;
            const delay = Math.max(expiresInSec * 1000 - bufferMs, 0);
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = window.setTimeout(() => { if (!cancelled) doRefresh(); }, delay);
        };

        const doRefresh = async () => {
            try {
                const res = await fetch('/api/auth/google/refresh');
                if (!res.ok) return;
                const json = await res.json();
                if (json && json.access_token && !cancelled) {
                    setGoogleToken(json.access_token, json.expires_in);
                    if (json.expires_in) scheduleRefresh(Number(json.expires_in));
                }
            } catch (e) { }
        };

        try {
            const expiresAt = Number(localStorage.getItem('google_token_expires') || '0');
            const now = Date.now();
            if (!expiresAt || expiresAt <= now) {
                doRefresh();
            } else {
                const remainingMs = expiresAt - now;
                const bufferMs = 60 * 1000;
                if (remainingMs <= bufferMs) {
                    doRefresh();
                } else {
                    // schedule refresh
                    timeoutId = window.setTimeout(() => { if (!cancelled) doRefresh(); }, Math.max(remainingMs - bufferMs, 0));
                }
            }
        } catch (e) {
            doRefresh();
        }

        return () => { cancelled = true; if (timeoutId) clearTimeout(timeoutId); };
    }, []);

    const setGoogleToken = (t: string, expiresInSec?: number) => {
        try {
            if (typeof window !== 'undefined') {
                localStorage.setItem('google_token', t);
                document.cookie = `google_token=${encodeURIComponent(t)}; path=/`;
                if (expiresInSec) {
                    const at = Date.now() + Number(expiresInSec) * 1000;
                    localStorage.setItem('google_token_expires', String(at));
                }
            }
        } catch (e) { }
        setGoogleTokenRaw(t);
    };

    const fetchWithAuth = async (input: RequestInfo, init: RequestInit = {}) => {
        if (!googleToken) throw new Error('Google token missing');
        const headers = new Headers(init.headers ?? {});
        headers.set('Authorization', `Bearer ${googleToken}`);
        return fetch(input, { ...init, headers });
    };

    return (
        <GoogleAuthContext.Provider value={{ googleToken, setGoogleToken, fetchWithAuth }}>
            {children}
        </GoogleAuthContext.Provider>
    );
}

export function useGoogleAuth() {
    const ctx = useContext(GoogleAuthContext);
    if (!ctx) throw new Error('useGoogleAuth must be used within GoogleProvider');
    return ctx;
}
