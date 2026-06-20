"use client";

type Day = {
    date: string;
    minTemp: number;
    maxTemp: number;
    avgTemp: number;
    pressure: number;
    humidity: number;
    wind: number;
    desc: string;
    icon: string;
};

export default function DailyForecast({ days }: { days: Day[] }) {
    return (
        <div className="space-y-1">
            {days.map((d) => (
                <div key={d.date} className="border rounded p-1 border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col items-center">
                            <img src={d.icon} alt={d.desc} className="w-15 h-15 m-[-10px]" />
                            <div className="text-xs text-gray-400">{d.date}</div>
                            <div className="text-xs">{d.maxTemp.toFixed(1)}°C <span className="text-gray-400">{d.minTemp.toFixed(1)}°C</span></div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-gray-600 mb-2">{d.humidity}% 💧</div>
                            <div className="text-xs text-gray-600 mb-2">{d.pressure} hPa 🔽</div>
                            <div className="text-xs text-gray-600">{d.wind.toFixed(1)} m/s 🌬️</div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
