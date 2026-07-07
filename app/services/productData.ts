export const ProductDataExcelHeaders: string[] = [
    "Termék azonosító",
    "Termék név",
    "Kategória azonosító",
    "Kategória név",
    "Üzletlánc név",
    "Egység",
    "Kiszerelés",
    "Minimum ár",
    "Maximum ár",
    "Minimum egységár",
    "Maximum egységár",
    "Hány üzletláncban elérhető",
    "Hány boltban elérhető",
    "Üzletlánc összes boltja"
];

export const ProductDataHeadersToEntityMap = [
    "productId",
    "productName",
    "categoryId",
    "categoryName",
    "chainName",
    "unit",
    "package",
    "minPrice",
    "maxPrice",
    "minUnitPrice",
    "maxUnitPrice",
    "availableInChains",
    "availableInStores",
    "totalStoresInChain"
]

export const ProductDataExcelHeadersMap: Record<string, string> = {
    "Termék azonosító": "productId",
    "Termék név": "productName",
    "Kategória azonosító": "categoryId",
    "Kategória név": "categoryName",
    "Üzletlánc név": "chainName",
    "Egység": "unit",
    "Kiszerelés": "package",
    "Minimum ár": "minPrice",
    "Maximum ár": "maxPrice",
    "Minimum egységár": "minUnitPrice",
    "Maximum egységár": "maxUnitPrice",
    "Hány üzletláncban elérhető": "availableInChains",
    "Hány boltban elérhető": "availableInStores",
    "Üzletlánc összes boltja": "totalStoresInChain"
};

export type ProductDataExcelRow = {
    productId: string;
    productName: string;
    categoryId: string;
    categoryName: string;
    chainName: string;
    unit: string;
    package: string;
    minPrice: number;
    maxPrice: number;
    minUnitPrice: number;
    maxUnitPrice: number;
    availableInChains: number;
    availableInStores: number;
    totalStoresInChain: number;
};
