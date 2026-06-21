"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useLog } from "./LogContext";
import { Forecast } from "../types/forecast";

const city = process.env.NEXT_PUBLIC_WEATHER_CITY || "Budapest";

type WeatherContextType = {
    refreshWeather: () => void;
    weatherCity: string;
    weatherToday: Forecast[] | null;
    weatherForecast: Forecast[] | null;
};

const openWeatherKey = process.env.NEXT_PUBLIC_OPENWEATHER_KEY || "";
const pollingInterval = 10 * 60 * 1000; // 10 minutes

const WeatherContext = createContext<WeatherContextType | null>(null);

export function WeatherProvider({ children }: { children: React.ReactNode }) {
    const { addLog } = useLog();

    const [weatherCity, setWeatherCity] = useState<string>(city);
    const [weatherToday, setWeatherToday] = useState<Forecast[] | null>(null);
    const [weatherForecast, setWeatherForecast] = useState<Forecast[] | null>(null);

    const fetchWeather = async () => {
        if (!openWeatherKey) return addLog('OpenWeather key missing');
        try {
            const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${openWeatherKey}&units=metric`);
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setWeatherToday(mapUpcomingWeather(data));
            setWeatherForecast(groupedForecast(data));
            addLog('Weather loaded');
        } catch (e) {
            addLog('Weather error: ' + String(e));
        }
    };

    const mapUpcomingWeather = (forecast: any, items = 8) => {
        if (!forecast || !forecast.list) return [];

        const list = forecast.list.slice(0, items).map((item: any) => {
            const t = Number(item.main.temp);
            const minTemp = Number(item.main.temp_min ?? t);
            const maxTemp = Number(item.main.temp_max ?? t);
            const pressure = Number(item.main.pressure ?? 0);
            const humidity = Number(item.main.humidity ?? 0);
            const wind = Number(item.wind?.speed ?? 0);
            const desc = item.weather?.[0]?.description ?? '';
            const icon = item.weather?.[0]?.icon ? `https://openweathermap.org/img/wn/${item.weather[0].icon}.png` : '';
            return {
                date: item.dt_txt.split(' ')[1],
                minTemp,
                maxTemp,
                avgTemp: t,
                pressure,
                humidity,
                wind,
                desc,
                icon,
            };
        });

        return list;
    };

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

    useEffect(() => {
        fetchWeather();
        const id = setInterval(() => {
            fetchWeather();
        }, pollingInterval);
        return () => clearInterval(id);
    }, []);

    return (
        <WeatherContext.Provider value={{ refreshWeather: fetchWeather, weatherCity, weatherToday, weatherForecast }}>
            {children}
        </WeatherContext.Provider>
    );
}

export function useWeather() {
    const ctx = useContext(WeatherContext);
    if (!ctx) throw new Error("useWeather must be used within WeatherProvider");
    return ctx;
}
