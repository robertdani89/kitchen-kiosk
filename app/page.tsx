"use client";

import { LogProvider } from './context/LogContext';
import { WeatherProvider } from "./context/WeatherContext";
import { GoogleProvider } from './context/GoogleAuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { PageProvider, pages, usePage } from './context/PageContext';
import Home from "./pages/Home";
import ShoppingPage from "./components/ShoppingPage";
import ShoppingSettings from './components/ShoppingSettings';

export const pageToComponentMap: Record<typeof pages[number], any> = {
    'home': Home,
    'shopping': ShoppingPage,
    'shoppingSettings': ShoppingSettings,
};

function AppRouter() {
    const { currentPage } = usePage();
    const CurrentComponent = pageToComponentMap[currentPage];
    return CurrentComponent ? <CurrentComponent /> : <Home />;
}

export default function ProvidersWrapper() {
    return (
        <LogProvider>
            <WeatherProvider>
                <GoogleProvider>
                    <WebSocketProvider>
                        <PageProvider>
                            <AppRouter />
                        </PageProvider>
                    </WebSocketProvider>
                </GoogleProvider>
            </WeatherProvider>
        </LogProvider>
    );
}
