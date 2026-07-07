"use client";

import { useEffect, useState } from "react";
import { usePage } from "../context/PageContext";

export default function ShoppingSettings() {
    const [value, setValue] = useState<string>("");
    const [products, setProducts] = useState<{ id: number; preferredUnit: string | null }[]>([]);
    const [preferredUnit, setPreferredUnit] = useState<string>("kg");
    const [loading, setLoading] = useState(false);
    const [storeValue, setStoreValue] = useState<string>("");
    const [storeChain, setStoreChain] = useState<string>("Tesco");
    const [storeAddress, setStoreAddress] = useState<string>("");
    const [stores, setStores] = useState<{ id: string | null; chainName: string | null; address: string | null }[]>([]);
    const [storeLoading, setStoreLoading] = useState(false);

    useEffect(() => {
        fetchIds();
        fetchStores();
    }, []);

    useEffect(() => {
        try {
            const saved = localStorage.getItem("shopping.preferredUnit");
            if (saved && ["kg", "db", "l", "m"].includes(saved)) {
                setPreferredUnit(saved);
            }
        } catch (e) {
            // ignore
        }
    }, []);

    async function fetchIds() {
        setLoading(true);
        try {
            const res = await fetch("/api/shopping/categories");
            if (res.ok) {
                const data = await res.json();
                setProducts(Array.isArray(data) ? data : []);
            }
        } finally {
            setLoading(false);
        }
    }

    async function fetchStores() {
        setStoreLoading(true);
        try {
            const res = await fetch("/api/shopping/stores");
            if (res.ok) {
                const data = await res.json();
                setStores(Array.isArray(data.stores) ? data.stores : []);
            }
        } finally {
            setStoreLoading(false);
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
                body: JSON.stringify({ id: n, preferredUnit }),
            });
            if (res.ok) {
                setValue("");
                await fetchIds();
            }
        } finally {
            setLoading(false);
        }
    }

    async function addStore() {
        const id = String(storeValue ?? "").trim();
        if (!id) return;
        setStoreLoading(true);
        try {
            const res = await fetch("/api/shopping/stores", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, chainName: storeChain, address: storeAddress }),
            });
            if (res.ok) {
                setStoreValue("");
                setStoreAddress("");
                setStoreChain("Tesco");
                await fetchStores();
            }
        } finally {
            setStoreLoading(false);
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

    async function deleteStore(id: string) {
        setStoreLoading(true);
        try {
            const res = await fetch("/api/shopping/stores", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            if (res.ok) await fetchStores();
        } finally {
            setStoreLoading(false);
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
                    <select
                        value={preferredUnit}
                        onChange={(e) => {
                            const v = e.target.value;
                            setPreferredUnit(v);
                            try {
                                localStorage.setItem("shopping.preferredUnit", v);
                            } catch (err) {
                                // ignore
                            }
                        }}
                        className="border rounded px-3 py-2"
                    >
                        <option value="kg">kg</option>
                        <option value="db">db</option>
                        <option value="l">l</option>
                        <option value="m">m</option>
                    </select>

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
                    {loading && products.length === 0 ? (
                        <div className="text-sm text-gray-500">Loading…</div>
                    ) : products.length === 0 ? (
                        <div className="text-sm text-gray-500">No IDs added yet.</div>
                    ) : (
                        <ul>
                            {products.map((product) => (
                                <li key={product.id} className="flex justify-between items-center py-1">
                                    <span>{product.id}</span>
                                    <span>{product.preferredUnit}</span>
                                    <button
                                        onClick={() => deleteId(product.id)}
                                        className="text-red-600 hover:underline"
                                    >
                                        Delete
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="flex gap-2 mb-4">
                    <input
                        value={storeValue}
                        onChange={(e) => setStoreValue(e.target.value)}
                        className="border rounded px-3 py-2 w-24"
                        placeholder="ID"
                    />
                    <select
                        value={storeChain}
                        onChange={(e) => setStoreChain(e.target.value)}
                        className="border rounded px-3 py-2"
                    >
                        <option value="Tesco">Tesco</option>
                        <option value="Rossmann">Rossmann</option>
                        <option value="Spar">Spar</option>
                        <option value="Müller">Müller</option>
                        <option value="Lidl">Lidl</option>
                        <option value="dm">dm</option>
                        <option value="Auchan">Auchan</option>
                        <option value="Penny">Penny</option>
                        <option value="Aldi">Aldi</option>
                    </select>
                    <input
                        type="text"
                        value={storeAddress}
                        onChange={(e) => setStoreAddress(e.target.value)}
                        className="border rounded px-3 py-2 flex-1"
                        placeholder="Address"
                    />
                    <button
                        onClick={addStore}
                        disabled={storeLoading}
                        className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
                    >
                        Add Store
                    </button>
                </div>

                <div className="bg-white rounded shadow p-4 mt-4">
                    <h2 className="font-semibold mb-2">Store IDs</h2>
                    {storeLoading && stores.length === 0 ? (
                        <div className="text-sm text-gray-500">Loading…</div>
                    ) : stores.length === 0 ? (
                        <div className="text-sm text-gray-500">No store IDs added yet.</div>
                    ) : (
                        <ul>
                            {stores.map((s) => (
                                <li key={String(s.id)} className="flex justify-between items-center py-1">
                                    <div>
                                        <div className="font-semibold">{s.chainName ?? ""} — {s.address ?? ""}</div>
                                        <div className="text-sm text-gray-600">ID: {s.id}</div>
                                    </div>
                                    <button
                                        onClick={() => deleteStore(String(s.id || ""))}
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
