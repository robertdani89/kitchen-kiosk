import fs from "fs";
import path from "path";
import * as xlsx from "xlsx";

const URL =
    "https://cdnarfigyeloprodweu.azureedge.net/excel/arfigyelo_napi_termekadatok.xlsx";

const DATA_DIR = path.join(process.cwd(), "data");
const PREV_FILE = path.join(DATA_DIR, "excel_prev.json");

let currentData: any = null;
const subscribers: Array<(newData: any, oldData: any) => void> = [];
let started = false;

async function ensureDataDir() {
    await fs.promises.mkdir(DATA_DIR, { recursive: true });
    try {
        await fs.promises.access(PREV_FILE);
    } catch (e) {
        await fs.promises.writeFile(PREV_FILE, JSON.stringify(null), "utf8");
    }
}

async function readPrev() {
    try {
        const txt = await fs.promises.readFile(PREV_FILE, "utf8");
        return JSON.parse(txt);
    } catch (e) {
        return null;
    }
}

async function writePrev(data: any) {
    await fs.promises.writeFile(PREV_FILE, JSON.stringify(data), "utf8");
}

function sheetNameLooksLikeDate(name: string) {
    return /(\d{4}[-]?\d{2}[-]?\d{2}|\d{8})$/.test(name);
}

async function fetchAndUpdate() {
    try {
        const res = await fetch(URL);
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const buffer = Buffer.from(await res.arrayBuffer());
        const wb = xlsx.read(buffer, { type: "buffer" });

        let sheetName = wb.SheetNames.find((n) => sheetNameLooksLikeDate(n));
        if (!sheetName) sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const json = xlsx.utils.sheet_to_json(ws, { defval: null });

        const prev = await readPrev();
        const prevStr = JSON.stringify(prev);
        const newStr = JSON.stringify(json);
        if (prevStr !== newStr) {
            const old = prev;
            currentData = json;
            await writePrev(json);
            for (const cb of subscribers) {
                try {
                    cb(json, old);
                } catch (e) {
                    console.error("Subscriber callback failed", e);
                }
            }
            console.log("excelMonitor: workbook changed — subscribers notified");
        } else {
            currentData = json;
            // no change
        }
    } catch (e) {
        console.error("excelMonitor: fetchAndUpdate error", e);
    }
}

export function getCurrentData() {
    return currentData;
}

export function onChange(cb: (newData: any, oldData: any) => void) {
    subscribers.push(cb);
    return () => {
        const idx = subscribers.indexOf(cb);
        if (idx >= 0) subscribers.splice(idx, 1);
    };
}

export async function forceFetch() {
    await ensureDataDir();
    await fetchAndUpdate();
}

function startScheduler() {
    if (started) return;
    started = true;
    // initial run
    (async () => {
        await ensureDataDir();
        const prev = await readPrev();
        if (prev) currentData = prev;
        await fetchAndUpdate();
    })();

    // run every hour
    setInterval(() => {
        fetchAndUpdate();
    }, 1000 * 60 * 60);
}

// Start scheduler immediately on server
startScheduler();

export default {
    getCurrentData,
    onChange,
    forceFetch,
};
