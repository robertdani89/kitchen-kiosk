import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import excelMonitor from "../../../services/excelMonitor.server";
import { ProductDataExcelRow } from "@/app/services/productData";
import { PriceItem } from "@/app/types/priceItem";

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

async function checkStoresAvailability(
    pid: string,
    stores: Array<{ id: string; chainName: string; address: string }>,
    productChain: string | null,
): Promise<{ id: string; chainName: string; address: string } | null> {
    if (!pid) return null;
    if (!stores || stores.length === 0) return null;

    // Filter to stores in the same chain (case-insensitive). If no productChain provided, check all.
    const filtered = productChain
        ? stores.filter((s) => (s.chainName || "").toLowerCase() === productChain.toLowerCase())
        : stores;


    for (const s of filtered) {
        const sid = s.id ?? "";
        if (!sid) continue;
        const url = `https://arfigyelo.gvh.hu/api/product/${encodeURIComponent(pid)}/shop/${encodeURIComponent(sid)}`;
        try {
            const res = await fetch(url);
            if (res.status === 200) return s; // return first matching store
            // continue on 404 or other non-200
        } catch (err) {
            // ignore and continue to next store
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

    // return cached results if data and category/store files haven't changed
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
        const candidates = catRows
            .map((r) => ({
                row: r,
                value: ((): number => {
                    const v = parseNumber((r as any).minUnitPrice);
                    const f = Number.isFinite(v) ? v : parseNumber((r as any).minPrice);
                    return Number.isFinite(f) ? f : Infinity;
                })(),
            }))
            .filter((c) => Number.isFinite(c.value))
            .sort((a, b) => a.value - b.value)
            .map((c) => c.row);

        // Collect up to 3 best available candidates (lowest prices), one per chain
        const availableBest: Array<{ row: ProductDataExcelRow; store: { id: string; chainName: string; address: string } }> = [];
        const seenChains = new Set<string>();
        for (const candidate of candidates) {
            if (availableBest.length >= 3) break;
            const candidateChainKey = (candidate.chainName).toLowerCase();
            if (candidateChainKey && seenChains.has(candidateChainKey)) continue; // skip duplicate chains
            const pid = String(candidate.productId ?? "");
            const store = await checkStoresAvailability(pid, stores, candidate.chainName);
            if (store) {
                availableBest.push({ row: candidate, store });
                if (candidateChainKey) seenChains.add(candidateChainKey);
            }
        }

        const primary = availableBest.length > 0 ? availableBest[0].row : null;

        results.push({
            prices: availableBest.length > 0
                ? availableBest.map((b) => ({ price: parseNumber(b.row.minUnitPrice), chainName: b.row.chainName, storeName: b.store.address }))
                : [],
            categoryId: id,
            categoryName: primary?.categoryName ?? null,
            productId: primary?.productId ?? null,
            productName: primary?.productName ?? null,
            unit: primary?.unit ?? null,
            package: primary?.package ?? null,
        });
    }

    // update cache
    cachedResults = {
        results,
        dataRef: data,
        categoriesMtime: categoriesMtime,
        storesMtime: storesMtime,
    };

    const lastChecked = await readLastDownloaded();
    return NextResponse.json({ results, lastChecked });
}
