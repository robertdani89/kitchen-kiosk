"use client";

import { useEffect, useMemo, useState } from "react";

type AirQualityData = {
    list?: Array<{
        main?: { aqi?: number };
        components?: {
            co?: number;
            no?: number;
            no2?: number;
            o3?: number;
            so2?: number;
            pm2_5?: number;
            pm10?: number;
            nh3?: number;
        };
    }>;
};

const aqiLabels = ["Jó", "Mérsékelt", "Közepes", "Gyenge", "Nagyon gyenge"];
const aqiColors = ["#22c55e", "#84cc16", "#f59e0b", "#f97316", "#ef4444"];

const pollutantThresholds: Record<string, Array<{ upper: number; level: number }>> = {
    so2: [
        { upper: 20, level: 1 },
        { upper: 80, level: 2 },
        { upper: 250, level: 3 },
        { upper: 350, level: 4 },
    ],
    no2: [
        { upper: 40, level: 1 },
        { upper: 70, level: 2 },
        { upper: 150, level: 3 },
        { upper: 200, level: 4 },
    ],
    pm10: [
        { upper: 20, level: 1 },
        { upper: 50, level: 2 },
        { upper: 100, level: 3 },
        { upper: 200, level: 4 },
    ],
    pm2_5: [
        { upper: 10, level: 1 },
        { upper: 25, level: 2 },
        { upper: 50, level: 3 },
        { upper: 75, level: 4 },
    ],
    o3: [
        { upper: 60, level: 1 },
        { upper: 100, level: 2 },
        { upper: 140, level: 3 },
        { upper: 180, level: 4 },
    ],
    co: [
        { upper: 4400, level: 1 },
        { upper: 9400, level: 2 },
        { upper: 12400, level: 3 },
        { upper: 15400, level: 4 },
    ],
};

function getAqiLabel(aqi: number) {
    if (Number.isFinite(aqi)) {
        const index = Math.min(Math.max(Math.round(aqi) - 1, 0), aqiLabels.length - 1);
        return aqiLabels[index];
    }
    return "Ismeretlen";
}

function getAqiColor(aqi: number) {
    if (Number.isFinite(aqi)) {
        const index = Math.min(Math.max(Math.round(aqi) - 1, 0), aqiColors.length - 1);
        return aqiColors[index];
    }
    return "#94a3b8";
}

function getPollutantLevel(value: number | undefined, pollutant: keyof typeof pollutantThresholds) {
    if (value === undefined || !Number.isFinite(value)) {
        return 0;
    }

    const ranges = pollutantThresholds[pollutant] ?? [];
    for (const range of ranges) {
        if (value < range.upper) {
            return range.level;
        }
    }

    return 5;
}

export default function AirQuality() {
    const [data, setData] = useState<AirQualityData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setLoading(true);
                setError(null);
                const res = await fetch("/api/air-quality", { cache: "no-store" });
                if (!res.ok) {
                    const payload = await res.json().catch(() => ({}));
                    throw new Error(payload?.error || "Air quality request failed");
                }
                const json = await res.json();
                if (!cancelled) setData(json);
            } catch (e) {
                if (!cancelled) setError(String(e));
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void load();
        return () => {
            cancelled = true;
        };
    }, []);

    const aqi = useMemo(() => {
        const values = data?.list?.[0]?.components ?? {};
        const pollutantLevels = [
            getPollutantLevel(values.so2, "so2"),
            getPollutantLevel(values.no2, "no2"),
            getPollutantLevel(values.pm10, "pm10"),
            getPollutantLevel(values.pm2_5, "pm2_5"),
            getPollutantLevel(values.o3, "o3"),
            getPollutantLevel(values.co, "co"),
        ];

        const computedAqi = pollutantLevels.length > 0 ? Math.max(...pollutantLevels) : 0;
        if (computedAqi > 0) {
            return computedAqi;
        }

        const current = data?.list?.[0]?.main?.aqi ?? null;
        return typeof current === "number" ? current : null;
    }, [data]);

    const components = useMemo(() => {
        const values = data?.list?.[0]?.components ?? {};
        return [
            { key: "PM2.5", value: values.pm2_5, level: getPollutantLevel(values.pm2_5, "pm2_5") },
            { key: "PM10", value: values.pm10, level: getPollutantLevel(values.pm10, "pm10") },
            { key: "NO2", value: values.no2, level: getPollutantLevel(values.no2, "no2") },
            { key: "O3", value: values.o3, level: getPollutantLevel(values.o3, "o3") },
            { key: "SO2", value: values.so2, level: getPollutantLevel(values.so2, "so2") },
            { key: "CO", value: values.co, level: getPollutantLevel(values.co, "co") },
        ];
    }, [data]);

    return (
        <section className="col-span-1 bg-white p-1 rounded shadow">
            <h2 className="mb-2">Levegőminőség</h2>
            {loading ? (
                <div className="text-xs text-gray-500">Levegőminőség betöltése…</div>
            ) : error ? (
                <div className="text-xs text-red-600">{error}</div>
            ) : aqi === null ? (
                <div className="text-xs text-gray-500">A levegőminőség adatai nem érhetők el</div>
            ) : (
                <>
                    <div className="mb-3 flex items-center gap-3">
                        <div
                            className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
                            style={{ backgroundColor: getAqiColor(aqi) }}
                        >
                            {Math.round(aqi)}
                        </div>
                        <div>
                            <div className="text-lg font-semibold">{getAqiLabel(aqi)}</div>
                            <div className="text-xs text-gray-500">Aktuális helyi mérés</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[11px] text-gray-700">
                        {components.map(({ key, value, level }) => (
                            <div key={key} className="rounded border border-gray-200 bg-gray-50 px-2 py-1">
                                <div className="flex items-center gap-1.5 text-gray-500">
                                    <span
                                        className="inline-block h-2 w-2 rounded-full"
                                        style={{ backgroundColor: aqiColors[Math.min(Math.max(level - 1, 0), aqiColors.length - 1)] }}
                                    />
                                    <span>{key}</span>
                                </div>
                                <div className="font-semibold">{value !== undefined ? `${Number(value).toFixed(1)} μg/m³` : "—"}</div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}
