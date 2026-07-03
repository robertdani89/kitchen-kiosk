"use client";

import { LogProvider } from './context/LogContext';
import { WeatherProvider } from "./context/WeatherContext";
import { GoogleProvider } from './context/GoogleAuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { PageProvider, usePage } from './context/PageContext';
import HelloWorldPage from "./components/HelloWorldPage";
import { Home as HomeContent } from "./pages/Home";


function AppRouter() {
    const { currentPage } = usePage();
    if (currentPage === 'hello') return <HelloWorldPage />;
    return <HomeContent />;
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
