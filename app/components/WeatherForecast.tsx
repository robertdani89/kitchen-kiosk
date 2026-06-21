"use client";

import { useWeather } from "../context/WeatherContext";


export default function WeatherForecast({
    city,
}: {
    city: string;
}) {
    const { weatherForecast, weatherCity } = useWeather();

    return (
        <section className="h-full bg-white p-1 rounded shadow">
            <div>
                {weatherForecast ? (
                    <div className="h-full">
                        <h2 className="mb-2">{weatherCity ?? city} előrejelzés</h2>
                        <div className="mt-2 text-sm flex flex-row justify-between gap-1">
                            {weatherForecast.map((d) => {
                                const dayLetter = (() => {
                                    try {
                                        const dt = new Date(d.date);
                                        const dayName = dt.toLocaleDateString(undefined, { weekday: 'long' });
                                        return dayName.charAt(0).toUpperCase() + dayName.slice(1);
                                    } catch (e) { return d.date; }
                                })();
                                return (
                                    <div key={d.date} className="py-2">
                                        <div className="">
                                            <div className="flex flex-col items-center mb-8">
                                                <div className="text-xs" title={d.date}>{dayLetter}</div>
                                                <img src={d.icon} alt={d.desc} className="w-15 h-15 m-[-10px]" />
                                                <div className="text-xs">{d.maxTemp.toFixed(1)}°C <span className="text-gray-400">{d.minTemp.toFixed(1)}°C</span></div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400 mb-1">💧{d.humidity}% </div>
                                                <div className="text-xs text-gray-400 mb-1">🔽{d.pressure} hPa</div>
                                                <div className="text-xs text-gray-400">🌬️{d.wind.toFixed(1)} m/s</div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}


                            {/* <ForecastCol days={weatherForecast} /> */}
                        </div>
                    </div>
                ) : (
                    <div className="text-xs text-gray-500">Előrejelzés nem elérhető</div>
                )}
            </div>
        </section>
    );
}
