"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

type LogContextType = {
    logs: string[];
    addLog: (msg: string) => void;
    clearLogs: () => void;
};

const LogContext = createContext<LogContextType | null>(null);

export function LogProvider({ children }: { children: React.ReactNode }) {
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = useCallback((msg: string) => {
        console.log(msg);
        setLogs((s) => [new Date().toLocaleTimeString() + " — " + msg, ...s]);
    }, []);

    const clearLogs = useCallback(() => setLogs([]), []);

    const value = useMemo(() => ({ logs, addLog, clearLogs }), [logs, addLog, clearLogs]);

    return (
        <LogContext.Provider value={value}>{children}</LogContext.Provider>
    );
}

export function useLog() {
    const ctx = useContext(LogContext);
    if (!ctx) throw new Error("useLog must be used within LogProvider");
    return ctx;
}
