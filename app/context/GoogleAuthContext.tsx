"use client";

import React, { createContext, useContext, useState } from "react";

type GoogleAuthContextType = {
    googleToken: string;
    setGoogleToken: (t: string) => void;
    fetchWithAuth: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
};

const GoogleAuthContext = createContext<GoogleAuthContextType | null>(null);

export function GoogleProvider({ children }: { children: React.ReactNode }) {
    const getInitialToken = () => {
        if (typeof window !== 'undefined') {
            const fromStorage = localStorage.getItem('google_token');
            if (fromStorage) return fromStorage;
            const m = document.cookie.match(/(?:^|; )google_token=([^;]+)/);
            if (m) return decodeURIComponent(m[1]);
        }
        return process.env.NEXT_PUBLIC_GOOGLE_TOKEN || '';
    };

    const [googleToken, setGoogleTokenRaw] = useState<string>(getInitialToken);

    const setGoogleToken = (t: string) => {
        try {
            if (typeof window !== 'undefined') {
                localStorage.setItem('google_token', t);
                document.cookie = `google_token=${encodeURIComponent(t)}; path=/`;
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
