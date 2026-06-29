"use client";

import Sensors from './components/Sensors';
import WeatherToday from './components/WeatherToday';
import WeatherForecast from './components/WeatherForecast';
import { LogProvider } from './context/LogContext';
import { WeatherProvider } from "./context/WeatherContext";
import { GoogleProvider } from './context/GoogleAuthContext';
import { WebSocketProvider, useWebSocket } from './context/WebSocketContext';
import Calendar from "./components/Calendar";
import Tasks from "./components/Tasks";
import Photos from "./components/Photos";
import Verbs from "./components/Verbs";

const weatherCity = process.env.NEXT_PUBLIC_WEATHER_CITY || "Budapest";

function HomeContent() {
    return (
        <div className="h-[100vh] w-[100vw] p-1 bg-gray-100 text-gray-900 font-sans">
            <main className="mx-auto h-full grid grid-cols-5 grid-rows-3 gap-1">
                <div className="row-start-1 col-span-2">
                    <WeatherToday city={weatherCity} />
                </div>
                <div className="row-start-2 col-span-2">
                    <WeatherForecast city={weatherCity} />
                </div>
                <div className="row-start-3 col-start-1 col-span-2">
                    <Sensors />
                </div>

                <Calendar />
                <Tasks />
                <Verbs />

                <div className="row-start-2 col-span-3 row-span-2">
                    <Photos />
                </div>


                {/* 
                <div className="col-span-5 mt-2">
                    <div className="bg-white p-3 rounded shadow">
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-sm">Connection: {connected ? 'Connected' : 'Disconnected'}</div>
                            <div className="text-xs text-gray-600">WebSocket: {address}</div>
                        </div>
                        <div className="max-h-40 overflow-auto border p-2 bg-gray-50">
                            {logs.map((l, i) => <div key={i} className="text-xs">{l}</div>)}
                        </div>
                    </div>
                </div> */}
            </main>
        </div>
    );
}

export default function Home() {
    return (
        <LogProvider>
            <WeatherProvider>
                <GoogleProvider>
                    <WebSocketProvider>
                        <HomeContent />
                    </WebSocketProvider>
                </GoogleProvider>
            </WeatherProvider>
        </LogProvider>
    );
}
