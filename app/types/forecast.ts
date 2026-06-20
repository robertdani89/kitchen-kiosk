export type Forecast = {
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