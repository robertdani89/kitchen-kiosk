"use client";

import { useEffect, useState } from "react";

type BestProduct = {
    categoryId: number;
    categoryName: string | null;
    productId: string | null;
    productName: string | null;
    chainName: string | null;
    unit: string | null;
    package: string | null;
    minPrice: number | null;
    minUnitPrice: number | null;
    availableStore?: { id: string; chainName: string | null; address: string | null } | null;
};

export default function ShoppingPage() {
    const [items, setItems] = useState<BestProduct[]>([]);
    const [loading, setLoading] = useState(false);

    async function fetchBest() {
        setLoading(true);
        try {
            const res = await fetch("/api/shopping/best");
            if (res.ok) {
                const data = await res.json();
                setItems(Array.isArray(data.results) ? data.results : []);
            } else {
                setItems([]);
            }
        } catch (e) {
            console.error(e);
            setItems([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchBest();
        const id = setInterval(fetchBest, 1000 * 60); // poll every minute
        return () => clearInterval(id);
    }, []);

    return (
        <div className="min-h-screen w-full flex flex-col bg-gray-100 text-gray-900 p-4">
            <div className="w-full max-w-5xl mx-auto flex flex-col h-full">
                <div className="flex items-center justify-between mb-3">
                    <h1 className="text-2xl font-semibold">Shopping</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={fetchBest}
                            disabled={loading}
                            className="bg-blue-600 text-white px-2 py-1 rounded text-sm disabled:opacity-50"
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded shadow p-3 flex-1 overflow-auto">
                    {loading && items.length === 0 ? (
                        <div className="text-sm text-gray-500">Loading…</div>
                    ) : items.length === 0 ? (
                        <div className="text-sm text-gray-500">No items found. Add category IDs in Shopping Settings.</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {items.map((it) => (
                                <div key={String(it.categoryId)} className="p-3 bg-gray-50 rounded flex items-center justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate">{it.categoryName ?? `Category ${it.categoryId}`}</div>
                                        <div className="text-sm text-gray-600 truncate">{it.productName ?? "—"}</div>
                                        <div className="text-xs text-gray-500 truncate">{it.chainName ?? ""} {it.unit ? `· ${it.unit}` : ""}</div>
                                        {it.availableStore ? (
                                            <div className="text-xs text-green-600 truncate">Available at {it.availableStore.chainName ?? it.availableStore.id}{it.availableStore.address ? ` — ${it.availableStore.address}` : ""}</div>
                                        ) : (
                                            <div className="text-xs text-red-500">Not available in preferred stores</div>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end ml-3">
                                        <div className="font-semibold text-sm">{it.minUnitPrice != null && !Number.isNaN(it.minUnitPrice) ? `${it.minUnitPrice.toFixed(2)}` : "—"}</div>
                                        <div className="text-xs text-gray-500">unit</div>
                                        <div className="text-xs text-gray-500">best: {it.minPrice != null && !Number.isNaN(it.minPrice) ? `${it.minPrice.toFixed(2)}` : "—"}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
