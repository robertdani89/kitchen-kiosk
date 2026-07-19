import type { shoppingChains } from "../consts/shoppingChains";

export type ShopLocation = {
    latitude: number;
    longitude: number;
};

export type ShopDto = {
    uuid: string;
    postalCode: string;
    city: string;
    address: string;
    chainStoreUuid: typeof shoppingChains[number]["uuid"];
    location: ShopLocation;
    openingTime: string;
};

export type Shop = {
    uuid: string;
    postalCode: string;
    city: string;
    address: string;
    chainStoreUuid: typeof shoppingChains[number]["uuid"];
    location: ShopLocation;
    openingTime: string;
    distanceFromHome: number;
};
