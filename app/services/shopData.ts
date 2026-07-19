import { Shop, ShopDto } from "@/app/types/shop";

const SHOPS_API_URL = "https://arfigyelo.gvh.hu/api/shops";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const earthRadiusKm = 6371;

let cache: {
    shops: Shop[];
    shopsMap: Map<string, Shop>;
    fetchedAt: number;
} | null = null;

const homeLatitude = process.env.NEXT_PUBLIC_HOME_LATITUDE
const homeLongitude = process.env.NEXT_PUBLIC_HOME_LONGITUDE

export async function fetchShops(): Promise<Shop[]> {
    const now = Date.now();

    if (cache && now - cache.fetchedAt < ONE_DAY_MS) {
        return cache.shops;
    }

    const response = await fetch(SHOPS_API_URL);
    if (!response.ok) {
        throw new Error(`Failed to fetch shops: ${response.status} ${response.statusText}`);
    }

    const shopsData: ShopDto[] = (await response.json()).shops;
    const shops = shopsData.map((shopDto) => ({
        ...shopDto,
        distanceFromHome: calculateDistanceFromHome(shopDto.location.latitude, shopDto.location.longitude),
    }));
    shops.sort((a, b) => a.distanceFromHome - b.distanceFromHome);
    const shopsMap = new Map(shops.map(shop => [shop.chainStoreUuid, shop]));
    cache = { shops, shopsMap, fetchedAt: now };
    return shops;
}

function calculateDistanceFromHome(latitude: number, longitude: number): number {
    if (!homeLatitude || !homeLongitude) {
        console.warn("Home coordinates are not set. Returning distance as 0.");
        return 1000;
    }
    const toRadians = (degrees: number) => degrees * (Math.PI / 180);
    const dLat = toRadians(latitude - parseFloat(homeLatitude));
    const dLon = toRadians(longitude - parseFloat(homeLongitude));
    const lat1 = toRadians(parseFloat(homeLatitude));
    const lat2 = toRadians(latitude);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
}