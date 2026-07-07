import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import excelMonitor from "../../../services/excelMonitor.server";
import { ProductDataExcelRow } from "@/app/services/productData";

const DATA_DIR = path.join(process.cwd(), "data");
const CATEGORIES_FILE = path.join(DATA_DIR, "categories.txt");
const STORES_FILE = path.join(DATA_DIR, "stores.txt");

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

async function readStores(): Promise<Array<{ id: string; chainName: string | null; address: string | null }>> {
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
                const chain = parts[1] ?? null;
                const addr = parts[2] ?? null;
                return { id, chainName: chain || null, address: addr || null };
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

async function checkStoresAvailability(
    pid: string,
    stores: Array<{ id: string; chainName: string | null; address: string | null }>,
    productChain: string,
): Promise<{ id: string; chainName: string | null; address: string | null } | null> {
    if (!pid) return null;
    if (!stores || stores.length === 0) return null;

    // Filter to stores in the same chain (case-insensitive). If no productChain provided, check all.
    const filtered = stores.filter((s) => (s.chainName || "").toLowerCase() === productChain.toLowerCase());


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
        return NextResponse.json({ results: [] });
    }

    const stores = await readStores();
    const storesMtime = await getFileMtime(STORES_FILE);

    // return cached results if data and category/store files haven't changed
    if (cachedResults && cachedResults.dataRef === data && cachedResults.categoriesMtime === categoriesMtime && cachedResults.storesMtime === storesMtime) {
        return NextResponse.json({ results: cachedResults.results });
    }

    const results: any[] = [];

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

        let chosen: ProductDataExcelRow | null = null;
        let chosenStore: { id: string; chainName: string | null; address: string | null } | null = null;

        const bestOverall: ProductDataExcelRow | null = candidates.length > 0 ? candidates[0] : null;

        for (const candidate of candidates) {
            const pid = String(candidate.productId ?? "");
            const store = await checkStoresAvailability(pid, stores, candidate.chainName);
            if (store) {
                chosen = candidate;
                chosenStore = store;
                break;
            }
        }

        // If there's no overall best, skip
        if (!bestOverall) {
            console.warn(`No best product found for category ${id}`);
            continue;
        }

        // Use chosen product for top-level fields when available, otherwise fall back to overall best.
        const primary = chosen ?? bestOverall;

        results.push({
            categoryId: id,
            categoryName: primary.categoryName ?? null,
            productId: primary.productId ?? null,
            productName: primary.productName ?? null,
            chainName: primary.chainName ?? null,
            unit: primary.unit ?? null,
            package: primary.package ?? null,
            // Always store the best overall prices even if the chosen store doesn't have the product
            minPrice: parseNumber(bestOverall.minPrice),
            minUnitPrice: parseNumber(bestOverall.minUnitPrice),
            availableStore: chosenStore,
        });
    }

    // update cache
    cachedResults = {
        results,
        dataRef: data,
        categoriesMtime: categoriesMtime,
        storesMtime: storesMtime,
    };

    return NextResponse.json({ results });
}
