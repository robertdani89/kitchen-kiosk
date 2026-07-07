import * as xlsx from "xlsx";
import fs from "fs";
import path from "path";
import { ProductDataExcelRow, ProductDataHeadersToEntityMap, ProductDataExcelHeaders } from "./productData";

const URL =
    "https://cdnarfigyeloprodweu.azureedge.net/excel/arfigyelo_napi_termekadatok.xlsx";

let currentData: ProductDataExcelRow[] | null = null;
const subscribers: Array<(newData: ProductDataExcelRow[]) => void> = [];
let started = false;
let ongoingFetch: Promise<void> | null = null;

const DATA_DIR = path.join(process.cwd(), "data");
const CACHE_FILE = path.join(DATA_DIR, "excel_cache.xlsx");
const LAST_DOWNLOADED_FILE = path.join(DATA_DIR, "excel_last_downloaded.txt");
const MAX_AGE_MS = 1000 * 60 * 30; // 30 minutes

function sheetNameLooksLikeDate(name: string) {
    return /(\d{4}[-]?\d{2}[-]?\d{2}|\d{8})$/.test(name);
}

async function ensureDataDir() {
    await fs.promises.mkdir(DATA_DIR, { recursive: true });
}

async function fetchAndUpdate() {
    if (ongoingFetch) return ongoingFetch;

    ongoingFetch = (async () => {
        await ensureDataDir();

        let buffer: Buffer | null = null;

        // If cache exists and is recent, use it
        try {
            const st = await fs.promises.stat(CACHE_FILE).catch(() => null as fs.Stats | null);
            if (st && Date.now() - st.mtimeMs <= MAX_AGE_MS) {
                try {
                    const data = await fs.promises.readFile(CACHE_FILE);
                    buffer = Buffer.from(data);
                    console.log("excelMonitor: using cached excel file");
                } catch (e) {
                    console.error("excelMonitor: failed reading cache file", e);
                    buffer = null;
                }
            }
        } catch (e) {
            console.error("excelMonitor: cache stat error", e);
        }

        try {
            if (!buffer) {
                const res = await fetch(URL);
                if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
                const buf = Buffer.from(await res.arrayBuffer());
                buffer = buf;
                // write cache and last-downloaded timestamp
                try {
                    await fs.promises.writeFile(CACHE_FILE, buf);
                    await fs.promises.writeFile(LAST_DOWNLOADED_FILE, new Date().toISOString(), "utf8");
                } catch (e) {
                    console.error("excelMonitor: failed to write cache files", e);
                }
            }

            if (!buffer) throw new Error("No excel buffer available");

            const wb = xlsx.read(buffer, { type: "buffer" });

            let sheetName = wb.SheetNames.find((n) => sheetNameLooksLikeDate(n));
            if (!sheetName) sheetName = wb.SheetNames[0];
            const ws = wb.Sheets[sheetName];
            const json = xlsx.utils.sheet_to_json(ws, { defval: null });

            currentData = parseData(json);
            for (const cb of subscribers) {
                try {
                    cb(currentData);
                } catch (e) {
                    console.error("Subscriber callback failed", e);
                }
            }
            console.log("excelMonitor: workbook loaded — subscribers notified");
        } catch (e) {
            console.error("excelMonitor: fetchAndUpdate error", e);
        } finally {
            ongoingFetch = null;
        }
    })();

    return ongoingFetch;
}

function parseData(data: any): ProductDataExcelRow[] {
    if (!Array.isArray(data)) return [];
    return data.map((row) => ProductDataHeadersToEntityMap.reduce((acc, key, idx) => {
        const header = ProductDataExcelHeaders[idx];
        acc[key] = row[header] ?? null;
        return acc;
    }, {} as any));

}

export function getCurrentData() {
    return currentData;
}

export function onChange(cb: (newData: ProductDataExcelRow[]) => void) {
    subscribers.push(cb);
    return () => {
        const idx = subscribers.indexOf(cb);
        if (idx >= 0) subscribers.splice(idx, 1);
    };
}

export async function forceFetch() {
    await fetchAndUpdate();
}

function startScheduler() {
    if (started) return;
    started = true;
    (async () => {
        await fetchAndUpdate();
    })();

    setInterval(() => {
        fetchAndUpdate();
    }, 1000 * 60 * 60);
}

startScheduler();

export default {
    getCurrentData,
    onChange,
    forceFetch,
};
