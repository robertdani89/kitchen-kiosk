export type PriceItem = {
    prices: { price: number; chainName: string; storeName: string }[];
    categoryId: number;
    categoryName: string | null;
    productId: string | null;
    productName: string | null;
    unit: string | null;
    package: string | null;
    bestPossiblePrice: number | null;
    bestPossibleChainName: string | null;
    nearestNotFavoriteShopData: string | null;
};