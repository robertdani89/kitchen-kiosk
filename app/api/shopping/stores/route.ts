import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "stores.txt");

async function ensureFile() {
    await fs.promises.mkdir(DATA_DIR, { recursive: true });
    try {
        await fs.promises.access(FILE_PATH);
    } catch (e) {
        await fs.promises.writeFile(FILE_PATH, "", "utf8");
    }
}

export async function GET() {
    await ensureFile();
    const text = await fs.promises.readFile(FILE_PATH, "utf8");
    const rows = text
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);

    const stores = rows.map((line) => {
        const parts = line.split("|").map((p) => p.trim());
        const id = parts[0] ?? "";
        const chainName = parts[1] ?? null;
        const address = parts[2] ?? null;
        return { id: id || null, chainName: chainName || null, address: address || null };
    });

    return NextResponse.json({ stores });
}

export async function POST(request: Request) {
    const body = await request.json();
    const idRaw = body?.id;
    const chainName = body?.chainName ?? "";
    const address = body?.address ?? "";

    const id = String(idRaw ?? "").trim();
    if (!id) {
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    await ensureFile();
    const safeChain = String(chainName).replace(/\|/g, "-");
    const safeAddress = String(address).replace(/\|/g, "-");
    await fs.promises.appendFile(FILE_PATH, `${id}|${safeChain}|${safeAddress}\n`, "utf8");
    return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
    const body = await request.json();
    const idRaw = body?.id;
    const id = String(idRaw ?? "").trim();
    if (!id) {
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    await ensureFile();
    const text = await fs.promises.readFile(FILE_PATH, "utf8");
    const lines = text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    const filtered = lines.filter((line) => {
        const parts = line.split("|").map((p) => p.trim());
        const lineId = parts[0] ?? "";
        return String(lineId) !== String(id);
    });
    const out = filtered.length ? filtered.join("\n") + "\n" : "";
    await fs.promises.writeFile(FILE_PATH, out, "utf8");
    return NextResponse.json({ ok: true });
}
