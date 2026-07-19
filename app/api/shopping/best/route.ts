import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import excelMonitor from "../../../services/excelMonitor.server";
import { ProductDataExcelRow } from "@/app/services/productData";
import { PriceItem } from "@/app/types/priceItem";
import { fetchShops } from "@/app/services/shopData";
import { shoppingChainsMap } from "@/app/consts/shoppingChains";

const DATA_DIR = path.join(process.cwd(), "data");
const CATEGORIES_FILE = path.join(DATA_DIR, "categories.txt");
const STORES_FILE = path.join(DATA_DIR, "stores.txt");
const LAST_DOWNLOADED_FILE = path.join(DATA_DIR, "excel_last_downloaded.txt");

async function ensureCategoriesFile() {
    await fs.promises.mkdir(DATA_DIR, { recursive: true });
    try {
        await fs.promises.access(CATEGORIES_FILE);
    } catch (e) {
        await fs.promises.writeFile(CATEGORIES_FILE, "", "utf8");
    }
}

function parseNumber(v: any) {
    if (v == null) return NaN;
    if (typeof v === "number") return v;
    const s = String(v).replace(/\s+/g, "").replace(",", ".");
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
}

async function readStores(): Promise<Array<{ id: string; chainName: string; address: string }>> {
    try {
        const text = await fs.promises.readFile(STORES_FILE, "utf8").catch(() => "");
        if (!text) return [];
        return text
            .split(/\r?\n/)
            .map((s) => s.trim())
            .filter(Boolean)
            .map((line) => {
                const parts = line.split("|").map((p) => p.trim());
                const id = String(parts[0] ?? "");
                const chain = parts[1] ?? "";
                const addr = parts[2] ?? "";
                return { id, chainName: chain, address: addr };
            });
    } catch (e) {
        console.error("readStores error", e);
        return [];
    }
}

// Simple in-memory cache: invalidated when excelMonitor notifies changes or when category/store files change
let cachedResults: {
    results: any[];
    dataRef: ProductDataExcelRow[] | null;
    categoriesMtime: number;
    storesMtime: number;
} | null = null;

excelMonitor.onChange(() => {
    cachedResults = null;
});

async function getFileMtime(filePath: string): Promise<number> {
    try {
        const st = await fs.promises.stat(filePath).catch(() => null as fs.Stats | null);
        return st ? st.mtimeMs : 0;
    } catch (e) {
        return 0;
    }
}

async function readCategoriesFile(): Promise<{ categories: Array<{ id: number; preferredUnit: string | null }>; mtime: number }> {
    await ensureCategoriesFile();
    const mtime = await getFileMtime(CATEGORIES_FILE);
    const text = await fs.promises.readFile(CATEGORIES_FILE, "utf8").catch(() => "");
    const rows = text
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);

    const categories = rows.map((s) => {
        const parts = s.split("|").map((p) => p.trim());
        const id = Number(parts[0]);
        return { id, preferredUnit: parts[1] ?? null };
    });

    return { categories, mtime };
}

async function readLastDownloaded(): Promise<string | null> {
    try {
        const s = await fs.promises.readFile(LAST_DOWNLOADED_FILE, "utf8").catch(() => null as string | null);
        return s ? s.trim() : null;
    } catch (e) {
        return null;
    }
}

type ApiPrice = { type: string; amount: number; unitAmount: number };
type StoreAvailability = {
    store: { id: string; chainName: string; address: string };
    apiPrices: ApiPrice[];
    priceMatches: boolean;
};

async function checkStoresAvailability(
    pid: string,
    stores: Array<{ id: string; chainName: string; address: string }>,
    productChain: string | null,
    candidatePrice: number,
): Promise<StoreAvailability | null> {
    if (!pid) return null;
    if (!stores || stores.length === 0) return null;

    // Filter to stores in the same chain (case-insensitive). If no productChain provided, check all.
    const filtered = productChain
        ? stores.filter((s) => (s.chainName || "").toLowerCase() === productChain.toLowerCase())
        : stores;

    let fallback: StoreAvailability | null = null;

    for (const s of filtered) {
        const sid = s.id ?? "";
        if (!sid) continue;
        const url = `https://arfigyelo.gvh.hu/api/product/${encodeURIComponent(pid)}/shop/${encodeURIComponent(sid)}`;
        try {
            const res = await fetch(url);
            if (res.status === 200) {
                const json = await res.json();
                const apiPrices: ApiPrice[] = (json.shops ?? []).flatMap(
                    (shop: any) =>
                        (shop.prices ?? []).map((p: any) => ({
                            type: String(p.type ?? ""),
                            amount: Number(p.amount ?? 0),
                            unitAmount: Number(p.unitAmount ?? 0),
                        }))
                );
                const priceMatches =
                    Number.isFinite(candidatePrice) &&
                    apiPrices.some(
                        (p) => Math.abs(p.amount - candidatePrice) < 1 || Math.abs(p.unitAmount - candidatePrice) < 1
                    );
                if (priceMatches) {
                    // Price confirmed — stop early
                    return { store: s, apiPrices, priceMatches: true };
                }
                if (!fallback) {
                    // Keep first available store as fallback, continue looking for a price match
                    fallback = { store: s, apiPrices, priceMatches: false };
                }
            }
            // continue on 404 or other non-200
        } catch (err) {
            // ignore and continue to next store
        }
    }

    return fallback;
}

async function findNearestApiShopWithPrice(
    pid: string,
    chainName: string,
    candidatePrice: number,
): Promise<{ address: string; price: number } | null> {
    let shops: Awaited<ReturnType<typeof fetchShops>>;
    try {
        console.log(`findNearestApiShopWithPrice: fetching shops for pid=${pid}, chainName=${chainName}, candidatePrice=${candidatePrice}`);
        shops = await fetchShops();
    } catch (e) {
        console.error("findNearestApiShopWithPrice: fetchShops failed", e);
        return null;
    }

    const chain = shoppingChainsMap[chainName];
    if (!chain) return null;

    const chainShops = shops.filter((s) => s.chainStoreUuid === chain.uuid);

    for (const shop of chainShops) {
        const url = `https://arfigyelo.gvh.hu/api/product/${encodeURIComponent(pid)}/shop/${encodeURIComponent(shop.uuid)}`;
        try {
            const res = await fetch(url);
            if (res.status === 200) {
                const json = await res.json();
                const apiPrices: ApiPrice[] = (json.shops ?? []).flatMap(
                    (sh: any) =>
                        (sh.prices ?? []).map((p: any) => ({
                            type: String(p.type ?? ""),
                            amount: Number(p.amount ?? 0),
                            unitAmount: Number(p.unitAmount ?? 0),
                        }))
                );
                const priceMatches =
                    Number.isFinite(candidatePrice) &&
                    apiPrices.some(
                        (p) => Math.abs(p.amount - candidatePrice) < 1 || Math.abs(p.unitAmount - candidatePrice) < 1
                    );
                if (priceMatches) {
                    const bestPrice = apiPrices.reduce((min, p) => Math.min(min, p.unitAmount), Infinity);
                    return {
                        address: `${shop.city}, ${shop.address}`,
                        price: Number.isFinite(bestPrice) ? bestPrice : candidatePrice,
                    };
                }
            }
        } catch (err) {
            // ignore and try next shop
        }
    }
    return null;
}

export async function GET() {
    const { categories, mtime: categoriesMtime } = await readCategoriesFile();

    let data = excelMonitor.getCurrentData();
    if (!data) {
        try {
            await excelMonitor.forceFetch();
            data = excelMonitor.getCurrentData();
        } catch (e) {
            console.error("excel fetch failed", e);
        }
    }

    if (!data || data.length === 0) {
        const lastChecked = await readLastDownloaded();
        return NextResponse.json({ results: [], lastChecked });
    }

    const stores = await readStores();
    const storesMtime = await getFileMtime(STORES_FILE);

    if (cachedResults && cachedResults.dataRef === data && cachedResults.categoriesMtime === categoriesMtime && cachedResults.storesMtime === storesMtime) {
        const lastChecked = await readLastDownloaded();
        return NextResponse.json({ results: cachedResults.results, lastChecked });
    }

    const results: PriceItem[] = [];

    for (const { id, preferredUnit } of categories) {
        const cidStr = String(id);
        const catRows = data.filter((r: ProductDataExcelRow) => String(r.categoryId) === cidStr && (!preferredUnit || r.unit === preferredUnit));
        if (catRows.length === 0) continue;

        // Sort candidates by unit price (fallback to price) ascending
        const sortedCandidates = catRows
            .map((r) => ({
                row: r,
                value: ((): number => {
                    const v = parseNumber((r as any).minUnitPrice);
                    const f = Number.isFinite(v) ? v : parseNumber((r as any).minPrice);
                    return Number.isFinite(f) ? f : Infinity;
                })(),
            }))
            .filter((c) => Number.isFinite(c.value))
            .sort((a, b) => a.value - b.value);
        const bestPossiblePrice = sortedCandidates.length > 0 ? sortedCandidates[0].value : null;
        const bestPossibleChainName = sortedCandidates.length > 0 ? (sortedCandidates[0].row.chainName ?? null) : null;
        const candidates = sortedCandidates.map((c) => c.row);

        // Collect available candidates, one per chain.
        // Only skip a chain once we have a price-confirmed candidate for it.
        // Unconfirmed (price mismatch) candidates are kept and may be replaced by a better result.
        type AvailableCandidate = StoreAvailability & { row: ProductDataExcelRow; effectivePrice: number };
        const allAvailable: AvailableCandidate[] = [];
        const confirmedChains = new Set<string>();

        const bestCandidate = candidates[0];

        for (const candidate of candidates) {
            // Stop once we have 3 confirmed (price-matching) chains
            if (confirmedChains.size >= 3) break;
            const candidateChainKey = (candidate.chainName ?? "").toLowerCase();
            // Skip chain if already price-confirmed
            if (candidateChainKey && confirmedChains.has(candidateChainKey)) continue;

            const candidatePrice = ((): number => {
                const v = parseNumber((candidate as any).minUnitPrice);
                const f = Number.isFinite(v) ? v : parseNumber((candidate as any).minPrice);
                return Number.isFinite(f) ? f : Infinity;
            })();

            const pid = String(candidate.productId ?? "");
            const availability = await checkStoresAvailability(pid, stores, candidate.chainName, candidatePrice);

            if (availability) {
                const effectivePrice =
                    availability.apiPrices.length > 0
                        ? availability.apiPrices.reduce((min, p) => Math.min(min, p.unitAmount), Infinity)
                        : candidatePrice;

                const existingIdx = candidateChainKey
                    ? allAvailable.findIndex((a) => (a.row.chainName ?? "").toLowerCase() === candidateChainKey)
                    : -1;

                if (existingIdx >= 0) {
                    const existing = allAvailable[existingIdx];
                    // Prefer confirmed over unconfirmed; otherwise prefer lower effective price
                    if (
                        (availability.priceMatches && !existing.priceMatches) ||
                        (!availability.priceMatches && !existing.priceMatches && effectivePrice < existing.effectivePrice)
                    ) {
                        allAvailable[existingIdx] = { ...availability, row: candidate, effectivePrice };
                        if (availability.priceMatches && candidateChainKey) confirmedChains.add(candidateChainKey);
                    }
                } else {
                    allAvailable.push({ ...availability, row: candidate, effectivePrice });
                    if (availability.priceMatches && candidateChainKey) confirmedChains.add(candidateChainKey);
                }
            }
        }

        // Sort all available candidates by effective price and pick top 3, one per chain
        allAvailable.sort((a, b) => a.effectivePrice - b.effectivePrice);
        const availableBest: AvailableCandidate[] = [];
        const seenChains = new Set<string>();
        for (const c of allAvailable) {
            if (availableBest.length >= 3) break;
            const chainKey = (c.row.chainName ?? "").toLowerCase();
            if (chainKey && seenChains.has(chainKey)) continue;
            availableBest.push(c);
            if (chainKey) seenChains.add(chainKey);
        }

        const primary = availableBest.length > 0 ? availableBest[0].row : null;
        let nearestNotFavoriteShopData: null | string = null;
        let prices: PriceItem["prices"] = [];
        if (primary && availableBest.length > 0) {
            prices = availableBest.map((b) => ({
                price: b.apiPrices.length > 0
                    ? b.apiPrices.reduce((min, p) => Math.min(min, p.unitAmount), Infinity)
                    : parseNumber(b.row.minUnitPrice),
                chainName: b.row.chainName,
                storeName: b.store.address,
            }));
        }

        if (!prices.length || prices.length && prices[0].price !== bestPossiblePrice) {
            const bestPossibleChainName = bestCandidate.chainName ?? null;
            const nearestShop = await findNearestApiShopWithPrice(bestCandidate.productId, bestPossibleChainName, bestPossiblePrice!);
            nearestNotFavoriteShopData = `${bestPossiblePrice}Ft @ ${bestPossibleChainName} ${nearestShop?.address ?? "unknown"}`;
        }

        results.push({
            prices,
            categoryId: id,
            categoryName: primary?.categoryName ?? null,
            productId: primary?.productId ?? null,
            productName: primary?.productName ?? null,
            unit: primary?.unit ?? null,
            package: primary?.package ?? null,
            bestPossiblePrice,
            bestPossibleChainName,
            nearestNotFavoriteShopData,
        });
    }

    cachedResults = {
        results,
        dataRef: data,
        categoriesMtime: categoriesMtime,
        storesMtime: storesMtime,
    };

    const lastChecked = await readLastDownloaded();
    return NextResponse.json({ results, lastChecked });
}
