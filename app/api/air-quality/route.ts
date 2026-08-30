import { NextResponse } from "next/server";

const lat = process.env.AIR_QUALITY_LAT || process.env.NEXT_PUBLIC_AIR_QUALITY_LAT || "47.4979";
const lon = process.env.AIR_QUALITY_LON || process.env.NEXT_PUBLIC_AIR_QUALITY_LON || "19.0402";
const apiKey = process.env.OPENWEATHER_KEY || process.env.NEXT_PUBLIC_OPENWEATHER_KEY || "";

export async function GET() {
    if (!apiKey) {
        return NextResponse.json({ error: "OpenWeather API key missing" }, { status: 500 });
    }

    if (!lat || !lon) {
        return NextResponse.json({ error: "Air quality coordinates are missing" }, { status: 500 });
    }

    try {
        const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&appid=${encodeURIComponent(apiKey)}`;
        const res = await fetch(url, { cache: "no-store" });
        const text = await res.text();

        if (!res.ok) {
            return NextResponse.json({ error: text || "Air quality request failed" }, { status: res.status || 500 });
        }

        try {
            return NextResponse.json(JSON.parse(text));
        } catch {
            return NextResponse.json({ raw: text }, { status: 200 });
        }
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
