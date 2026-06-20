"use client";

type Sensor = {
    id: number;
    name: string;
    topic: string;
    temperature: number | null;
    humidity: number | null;
    last_seen: string;
    icon: string;
};

export default function Sensors({
    sensors,
    onInjectSample,
    onClear,
}: {
    sensors: Sensor[];
    onInjectSample?: () => void;
    onClear?: () => void;
}) {
    return (
        <section className="col-span-1 bg-white p-4 rounded shadow">
            <div className="space-y-3">
                {sensors.map((s) => (
                    <div key={s.id} className="border rounded p-3">
                        <div className="font-medium">{s.icon} {s.name} </div>
                        <div className="flex justify-between items-center">
                            <div className="text-2xl">🌡️{s.temperature != null ? `${s.temperature.toFixed(1)} °C` : '—'}</div>
                            <div className="text-xl">💦{s.humidity != null ? `${s.humidity.toFixed(1)} %` : '—'}</div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{s.last_seen ? new Date(s.last_seen).toLocaleString() : ''}</div>
                    </div>
                ))}
            </div>
            <div className="flex gap-2 mt-3">
                {onInjectSample && (
                    <button className="px-3 py-1 bg-indigo-600 text-white rounded" onClick={onInjectSample}>Inject Sample</button>
                )}
                {onClear && (
                    <button className="px-3 py-1 bg-gray-600 text-white rounded" onClick={onClear}>Clear</button>
                )}
            </div>
        </section>
    );
}
