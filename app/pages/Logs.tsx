"use client";

import { useLog } from "../context/LogContext";

export default function Logs() {
    const { logs, clearLogs } = useLog();

    return (
        <div className="h-[100vh] w-[100vw] p-1 bg-gray-100 text-gray-900 font-sans">
            <main className="mx-auto h-full grid grid-cols-1 grid-rows-1 gap-1">
                <div className="col-span-1 row-span-1">
                    <div className="bg-white p-3 rounded shadow h-full flex flex-col">
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-sm">Logs</div>
                            <button className="text-xs text-blue-600" onClick={() => clearLogs()}>Clear</button>
                        </div>
                        <div className="overflow-auto border p-2 bg-gray-50 flex-1">
                            {logs.length === 0 && <div className="text-xs text-gray-500">No logs yet</div>}
                            {logs.map((l, i) => <div key={i} className="text-xs">{l}</div>)}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
