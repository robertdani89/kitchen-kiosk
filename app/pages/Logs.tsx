"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLog } from "../context/LogContext";

export default function Logs() {
    const { logs, clearLogs } = useLog();
    const [filter, setFilter] = useState("");
    const [scrollToNew, setScrollToNew] = useState(true);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const filtered = useMemo(() => {
        if (!filter) return logs;
        const f = filter.toLowerCase();
        return logs.filter((l) => l.toLowerCase().includes(f));
    }, [logs, filter]);

    useEffect(() => {
        if (!scrollToNew) return;
        const el = containerRef.current;
        if (!el) return;
        try { el.scrollTop = 0; } catch (e) { }
    }, [logs, filtered, scrollToNew]);

    return (
        <div className="h-[100vh] w-[100vw] p-1 bg-gray-100 text-gray-900 font-sans">
            <main className="mx-auto h-full grid grid-cols-1 grid-rows-1 gap-1">
                <div className="col-span-1 row-span-1">
                    <div className="bg-white p-3 rounded shadow h-full flex flex-col">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-3">
                                <div className="text-sm">Logs</div>
                                <input
                                    aria-label="Filter logs"
                                    className="text-xs border rounded px-2 py-1"
                                    placeholder="Filter logs"
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                />
                                <label className="text-xs flex items-center gap-1">
                                    <input type="checkbox" checked={scrollToNew} onChange={(e) => setScrollToNew(e.target.checked)} />
                                    <span>Scroll to new message</span>
                                </label>
                            </div>
                            <button className="text-xs text-blue-600" onClick={() => clearLogs()}>Clear</button>
                        </div>
                        <div ref={containerRef} className="overflow-auto border p-2 bg-gray-50 flex-1">
                            {filtered.length === 0 && <div className="text-xs text-gray-500">No logs yet</div>}
                            {filtered.map((l, i) => <div key={i} className="text-xs">{l}</div>)}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
