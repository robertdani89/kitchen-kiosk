"use client";

import ForecastCol from './ForecastCol';
import { useWeather } from "../context/WeatherContext";


export default function WeatherForecast({
    city,
}: {
    city: string;
}) {
    const { weatherForecast, weatherCity } = useWeather();

    return (
        <section className="col-span-1 bg-white p-2 rounded shadow">
            <div>
                {weatherForecast ? (
                    <div>
                        <h2 className="mb-2">{weatherCity ?? city} előrejelzés</h2>
                        <div className="mt-2 text-sm">
                            <ForecastCol days={weatherForecast} />
                        </div>
                    </div>
                ) : (
                    <div className="text-xs text-gray-500">Előrejelzés nem elérhető</div>
                )}
            </div>
        </section>
    );
}
