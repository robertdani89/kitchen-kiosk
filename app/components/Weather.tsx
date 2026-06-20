"use client";

import { useEffect, useState } from "react";
import { useLog } from '../context/LogContext';
import DailyForecast from './DailyForecast';

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
            let minTemp = Infinity, maxTemp = -Infinity, sumTemp = 0, sumPressure = 0, sumHum = 0, sumWind = 0;
            for (const it of items) {
                const t = Number(it.main.temp);
                minTemp = Math.min(minTemp, Number(it.main.temp_min ?? t));
                maxTemp = Math.max(maxTemp, Number(it.main.temp_max ?? t));
                sumTemp += t;
                sumPressure += Number(it.main.pressure ?? 0);
                sumHum += Number(it.main.humidity ?? 0);
                sumWind += Number(it.wind?.speed ?? 0);
            }
            const avgTemp = sumTemp / items.length;
            const avgPressure = Math.round(sumPressure / items.length);
            const avgHum = Math.round(sumHum / items.length);
            const avgWind = sumWind / items.length;
            const mid = items[Math.floor(items.length / 2)];
            const desc = mid.weather?.[0]?.description ?? '';
            return {
                date,
                minTemp: Number(minTemp.toFixed(1)),
                maxTemp: Number(maxTemp.toFixed(1)),
                avgTemp: Number(avgTemp.toFixed(1)),
                pressure: avgPressure,
                humidity: avgHum,
                wind: Number(avgWind.toFixed(1)),
                desc,
                icon: mid.weather?.[0]?.icon ? `https://openweathermap.org/img/wn/${mid.weather[0].icon}.png` : '',
            };
        });
    };

    return (
        <section className="col-span-1 bg-white p-4 rounded shadow">
            <div>
                {weather ? (
                    <div>
                        <div className="font-medium">{weather.city?.name ?? city}</div>
                        <div className="mt-2 text-sm">
                            <DailyForecast days={groupedForecast(weather)} />
                        </div>
                    </div>
                ) : (
                    <div className="text-xs text-gray-500">Weather not loaded</div>
                )}
            </div>
        </section>
    );
}
