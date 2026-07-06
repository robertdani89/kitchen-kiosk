import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "categories.txt");

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
    const ids = text
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map(Number);
    return NextResponse.json({ ids });
}

export async function POST(request: Request) {
    const body = await request.json();
    const id = body?.id;
    if (typeof id !== "number" || !Number.isFinite(id)) {
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    await ensureFile();
    await fs.promises.appendFile(FILE_PATH, `${id}\n`, "utf8");
    return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
    const body = await request.json();
    const id = body?.id;
    if (typeof id !== "number" || !Number.isFinite(id)) {
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    await ensureFile();
    const text = await fs.promises.readFile(FILE_PATH, "utf8");
    const lines = text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    const filtered = lines.filter((line) => line !== String(id));
    const out = filtered.length ? filtered.join("\n") + "\n" : "";
    await fs.promises.writeFile(FILE_PATH, out, "utf8");
    return NextResponse.json({ ok: true });
}
