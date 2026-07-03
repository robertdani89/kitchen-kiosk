import Calendar from "../components/Calendar";
import Photos from "../components/Photos";
import Sensors from "../components/Sensors";
import Tasks from "../components/Tasks";
import Verbs from "../components/Verbs";
import WeatherForecast from "../components/WeatherForecast";
import WeatherToday from "../components/WeatherToday";



export function Home() {
    return (
        <div className="h-[100vh] w-[100vw] p-1 bg-gray-100 text-gray-900 font-sans">
            <main className="mx-auto h-full grid grid-cols-5 grid-rows-3 gap-1">
                <div className="row-start-1 col-span-2">
                    <WeatherToday />
                </div>
                <div className="row-start-2 col-span-2">
                    <WeatherForecast />
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