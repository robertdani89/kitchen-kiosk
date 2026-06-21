"use client";

import { useWeather } from "../context/WeatherContext";


export default function WeatherForecast({
    city,
}: {
    city: string;
}) {
    const { weatherForecast, weatherCity } = useWeather();

    return (
        <section className="h-full grid bg-white p-1 rounded shadow">
            {weatherForecast ? (
                <div className="h-full">
                    <h2 className=" mt-2 mb-2">{weatherCity ?? city} előrejelzés</h2>
                    <div className="mt-2 text-sm flex flex-row justify-between gap-1 overflow-x-auto">
                        {weatherForecast.map((d) => {
                            const dayLetter = (() => {
                                try {
                                    const dt = new Date(d.date);
                                    const dayName = dt.toLocaleDateString(undefined, { weekday: 'long' });
                                    return dayName.charAt(0).toUpperCase() + dayName.slice(1);
                                } catch (e) { return d.date; }
                            })();
                            return (
                                <div key={d.date} className="w-full p-1 bg-gray-50 border border-gray-200 rounded flex flex-col items-center justify-between min-w-[60px]">
                                    <div className="">
                                        <div className="flex flex-col items-center mb-1">
                                            <div className="text-sm" title={d.date}>{dayLetter}</div>
                                            <img src={d.icon} alt={d.desc} className="w-15 h-15 m-[-10px]" />
                                            <div className="text-[15px]">{d.maxTemp.toFixed(1)}°C <span className="text-gray-400">{d.minTemp.toFixed(1)}°C</span></div>
                                        </div>
                                        <div>
                                            <div className="text-[12px] text-gray-400 mb-1">💧{d.humidity}% 🌬️{d.wind.toFixed(1)} m/s</div>
                                            <div className="text-[12px] text-gray-400 mb-1">🔽{d.pressure} hPa</div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ) : (
                <div className="text-xs text-gray-500">Előrejelzés nem elérhető</div>
            )}
        </section>
    );
}
