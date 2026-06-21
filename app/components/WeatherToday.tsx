"use client";

import { useWeather } from "../context/WeatherContext";


export default function WeatherToday({
    city,
}: {
    city: string;
}) {
    const { weatherToday, weatherCity } = useWeather();

    return (
        <section className="bg-white p-1 rounded shadow">
            <div>
                {weatherToday ? (
                    <div>
                        <h2 className="mb-2">{weatherCity ?? city} mai időjárás</h2>
                        <div className="text-sm">
                            <picture>
                                <svg className="w-full h-full" viewBox="-10 -10 400 185" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Today's temperature chart">
                                    {(() => {
                                        const data = weatherToday || [];
                                        const w = 380;
                                        const h = 150;
                                        const pad = 8;
                                        if (data.length === 0) return null;
                                        const temps = data.map(d => d.avgTemp);
                                        let min = Math.min(...temps);
                                        let max = Math.max(...temps);
                                        if (min === max) { min -= 1; max += 1; }
                                        const len = temps.length;
                                        const stepX = len > 1 ? (w - pad * 2) / (len - 1) : 0;
                                        const points = temps.map((t, i) => {
                                            const x = pad + i * stepX;
                                            const y = pad + (1 - (t - min) / (max - min)) * (h - pad * 2);
                                            return [x, y];
                                        });
                                        const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ');
                                        const areaPath = path + ` L ${w - pad} ${h - pad} L ${pad} ${h - pad} Z`;
                                        return (
                                            <g>
                                                <path d={areaPath} fill="rgba(59,130,246,0.12)" stroke="none" />
                                                <path d={path} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                {points.map((p, i) => (
                                                    <circle key={i} cx={p[0]} cy={p[1]} r={2.5} fill="#1e40af" />
                                                ))}
                                                {points.map((p, i) => (
                                                    <text key={`v-${i}`} x={p[0]} y={Math.max(10, p[1] - 8)} fontSize="14" fill="#1f2937" textAnchor="middle">{`${Math.round(data[i].avgTemp)}°C`}</text>
                                                ))}
                                                {points.map((p, i) => (
                                                    <g key={`lbl-${i}`}>
                                                        {data[i].icon ? (
                                                            <image x={p[0] - 8} y={h - 6} width="16" height="16" href={data[i].icon} preserveAspectRatio="xMidYMid slice" />
                                                        ) : null}
                                                        <text x={p[0] - 12} y={h + 16} fontSize="9" fill="#374151" textAnchor="start">{data[i].date.replace(':00', '')}</text>
                                                    </g>
                                                ))}
                                            </g>
                                        );
                                    })()}
                                </svg>
                            </picture>
                        </div>
                    </div>
                ) : (
                    <div className="text-xs text-gray-500">Mai időjárás nem elérhető</div>
                )}
            </div>
        </section>
    );
}
