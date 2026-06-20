"use client";

import ForecastCol from './ForecastCol';
import { useWeather } from "../context/WeatherContext";


export default function WeatherToday({
    city,
}: {
    city: string;
}) {
    const { weatherToday, weatherCity } = useWeather();

    return (
        <section className="col-span-1 bg-white p-2 rounded shadow">
            <div>
                {weatherToday ? (
                    <div>
                        <h2 className="mb-2">{weatherCity ?? city} mai időjárás</h2>
                        <div className="mt-2 text-sm">
                            <ForecastCol days={weatherToday} />
                        </div>
                    </div>
                ) : (
                    <div className="text-xs text-gray-500">Mai időjárás nem elérhető</div>
                )}
            </div>
        </section>
    );
}
