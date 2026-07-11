"use client";

import { LogProvider } from './context/LogContext';
import { WeatherProvider } from "./context/WeatherContext";
import { GoogleProvider } from './context/GoogleAuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import MovementMonitor from './components/MovementMonitor';
import { PageProvider, pages, usePage } from './context/PageContext';
import Home from "./pages/Home";
import ShoppingPage from "./pages/ShoppingPage";
import ShoppingSettings from './pages/ShoppingSettings';
import Logs from "./pages/Logs";

export const pageToComponentMap: Record<typeof pages[number], any> = {
    'home': Home,
    'shopping': ShoppingPage,
    'shoppingSettings': ShoppingSettings,
    'logs': Logs,
};

function AppRouter() {
    const { currentPage } = usePage();
    const CurrentComponent = pageToComponentMap[currentPage];
    return CurrentComponent ? <CurrentComponent /> : <Home />;
}

export default function ProvidersWrapper() {
    const enableMovementMonitor = (process.env.NEXT_PUBLIC_ENABLE_MOVEMENT_MONITOR === '1' || process.env.NEXT_PUBLIC_ENABLE_MOVEMENT_MONITOR === 'true');

    return (
        <LogProvider>
            <WeatherProvider>
                <GoogleProvider>
                    <WebSocketProvider>
                        {enableMovementMonitor && <MovementMonitor />}
                        <PageProvider>
                            <AppRouter />
                        </PageProvider>
                    </WebSocketProvider>
                </GoogleProvider>
            </WeatherProvider>
        </LogProvider>
    );
}
