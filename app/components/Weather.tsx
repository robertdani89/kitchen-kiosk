"use client";

import { useEffect, useState } from "react";
import { useLog } from '../context/LogContext';

const openWeatherKey = process.env.NEXT_PUBLIC_OPENWEATHER_KEY || "";
const pollingInterval = 10 * 60 * 1000; // 10 minutes


export default function Weather({
    city,
}: {
    city: string;
}) {
    const [weather, setWeather] = useState<any>(null);

    const { addLog } = useLog();

    const fetchWeather = async () => {
        if (!openWeatherKey) return addLog('OpenWeather key missing');
        try {
            const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${openWeatherKey}&units=metric`);
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setWeather(data);
            addLog('Weather loaded');
        } catch (e) {
            addLog('Weather error: ' + String(e));
        }
    };


    useEffect(() => {
        fetchWeather();
        const id = setInterval(() => {
            fetchWeather();
        }, pollingInterval);
        return () => clearInterval(id);
    }, []);


    const groupedForecast = (forecast: any) => {
        if (!forecast || !forecast.list) return [];
        const byDay: Record<string, any[]> = {};
        for (const item of forecast.list) {
            const d = item.dt_txt.split(' ')[0];
            (byDay[d] ||= []).push(item);
        }
        return Object.keys(byDay).slice(0, 5).map((date) => {
            const items = byDay[date];
            const mid = items[Math.floor(items.length / 2)];
            return { date, temp: mid.main.temp.toFixed(1), desc: mid.weather[0].description };
        });
    };

    return (
        <section className="col-span-1 bg-white p-4 rounded shadow">
            <div>
                {weather ? (
                    <div>
                        <div className="font-medium">{weather.city?.name ?? city}</div>
                        <div className="mt-2 text-sm space-y-1">
                            {groupedForecast(weather).map((d: any) => (
                                <div key={d.date} className="flex justify-between">
                                    <div>{d.date}</div>
                                    <div className="text-right">{d.temp} °C — {d.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-xs text-gray-500">Weather not loaded</div>
                )}
            </div>
        </section>
    );
}
