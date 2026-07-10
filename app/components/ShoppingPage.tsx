"use client";

import { useEffect, useState } from "react";
import { shoppingChainsMap } from "../consts/shoppingChains";
import type { PriceItem } from "../types/priceItem";

export default function ShoppingPage() {
    const [items, setItems] = useState<PriceItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [lastChecked, setLastChecked] = useState<Date | null>(null);

    async function fetchBest() {
        setLoading(true);
        try {
            const res = await fetch("/api/shopping/best");
            if (res.ok) {
                const data = await res.json();
                setItems(Array.isArray(data.results) ? data.results : []);
                setLastChecked(data && data.lastChecked ? new Date(data.lastChecked) : null);
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
            <div className="w-full flex flex-col h-full">
                <div className="flex items-center justify-between mb-3">
                    <h1 className="text-2xl font-semibold">Shopping</h1>
                    <div className="text-sm text-gray-500">Last checked: {lastChecked ? lastChecked.toLocaleString() : "—"}</div>
                </div>

                <div className="bg-white rounded shadow p-3 flex-1 overflow-auto">
                    {loading && items.length === 0 ? (
                        <div className="text-sm text-gray-500">Loading…</div>
                    ) : items.length === 0 ? (
                        <div className="text-sm text-gray-500">No items found. Add category IDs in Shopping Settings.</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {items.map((it) => (
                                <div key={String(it.categoryId)} className="p-3 bg-gray-50 rounded flex items-center justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate">{it.categoryName ?? `Category ${it.categoryId}`}</div>
                                        <div
                                            className="text-sm text-gray-600"
                                            style={{
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {it.productName ?? "—"}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end ml-3">
                                        {it.prices.map((p, idx) => (
                                            <div key={idx} className="text-sm text-gray-700">
                                                <span style={{ fontWeight: "bold" }}>{p.price.toFixed(2)}Ft</span>{" "}
                                                <img src={shoppingChainsMap[p.chainName].icon} alt={p.chainName} className="inline-block w-4 h-4 mr-1" />{p.storeName}
                                            </div>
                                        ))}
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
