"use client";

import { useEffect, useState } from "react";
import { usePage } from "../context/PageContext";

export default function ShoppingSettings() {
    const [value, setValue] = useState<string>("");
    const [ids, setIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchIds();
    }, []);

    async function fetchIds() {
        setLoading(true);
        try {
            const res = await fetch("/api/shopping/categories");
            if (res.ok) {
                const data = await res.json();
                setIds(Array.isArray(data.ids) ? data.ids : []);
            }
        } finally {
            setLoading(false);
        }
    }

    async function addId() {
        const n = Number(value);
        if (!Number.isFinite(n) || String(n).trim() === "") return;
        setLoading(true);
        try {
            const res = await fetch("/api/shopping/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: n }),
            });
            if (res.ok) {
                setValue("");
                await fetchIds();
            }
        } finally {
            setLoading(false);
        }
    }

    async function deleteId(id: number) {
        setLoading(true);
        try {
            const res = await fetch("/api/shopping/categories", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            if (res.ok) await fetchIds();
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-[100vh] w-full flex flex-col items-center justify-start bg-gray-100 text-gray-900 p-6">
            <div className="w-full max-w-xl">
                <h1 className="text-3xl font-bold mb-4">Shopping Settings</h1>

                <div className="flex gap-2 mb-4">
                    <input
                        type="number"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className="border rounded px-3 py-2 flex-1"
                        placeholder="Enter category id (number)"
                    />
                    <button
                        onClick={addId}
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                    >
                        Add
                    </button>
                </div>

                <div className="bg-white rounded shadow p-4">
                    <h2 className="font-semibold mb-2">Category IDs</h2>
                    {loading && ids.length === 0 ? (
                        <div className="text-sm text-gray-500">Loading…</div>
                    ) : ids.length === 0 ? (
                        <div className="text-sm text-gray-500">No IDs added yet.</div>
                    ) : (
                        <ul>
                            {ids.map((id) => (
                                <li key={id} className="flex justify-between items-center py-1">
                                    <span>{id}</span>
                                    <button
                                        onClick={() => deleteId(id)}
                                        className="text-red-600 hover:underline"
                                    >
                                        Delete
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
