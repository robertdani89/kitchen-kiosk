import Calendar from "../components/Calendar";
import Photos from "../components/Photos";
import Sensors from "../components/Sensors";
import Tasks from "../components/Tasks";
import Verbs from "../components/Verbs";
import WeatherForecast from "../components/WeatherForecast";
import WeatherToday from "../components/WeatherToday";

export default function Home() {
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
            </main>
        </div>
    );
}