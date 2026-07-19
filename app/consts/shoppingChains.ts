export type ShoppingChain = {
    name: string;
    uuid: string;
    icon: string;
};

export const shoppingChains: ShoppingChain[] = [
    { name: "Tesco", uuid: "792ea257-0af9-4588-ada7-81bd96c96400", icon: "https://upload.wikimedia.org/wikipedia/commons/2/23/Tesco_logo.png" },
    { name: "Rossmann", uuid: "41e81400-3e3d-47b4-84f7-7dce01cc9b43", icon: "https://upload.wikimedia.org/wikipedia/commons/8/8e/Rossmann_Logo.svg" },
    { name: "Spar", uuid: "3ccc9f35-604c-4ccf-8376-64822ce4bc70", icon: "https://upload.wikimedia.org/wikipedia/commons/7/7c/Spar-logo.svg" },
    { name: "Müller", uuid: "e313905a-b57e-4016-b4d2-1d1f45e53157", icon: "https://upload.wikimedia.org/wikipedia/commons/e/e1/Logo_Drogerie_Mueller.svg" },
    { name: "Lidl", uuid: "f95031d8-84a5-4edf-b4fa-18b2cbae2ea1", icon: "https://upload.wikimedia.org/wikipedia/commons/9/91/Lidl-Logo.svg" },
    { name: "dm", uuid: "555f7e7c-8229-4f4f-ba60-450925a5b308", icon: "https://upload.wikimedia.org/wikipedia/commons/d/d7/Logo_of_dm-drogerie_markt.jpg" },
    { name: "Auchan", uuid: "e9cc63fd-52e0-4c1e-ba8d-d135d7285c63", icon: "https://upload.wikimedia.org/wikipedia/commons/6/67/Auchan_wordmark.svg" },
    { name: "Penny", uuid: "53b66cb6-a24f-420d-9861-d38757467d07", icon: "https://upload.wikimedia.org/wikipedia/commons/8/8e/Penny-Logo.svg" },
    { name: "Aldi", uuid: "55b678e0-4e02-49d7-86da-ba6fba862a7e", icon: "https://upload.wikimedia.org/wikipedia/commons/d/dc/Logo_of_Aldi_south_in_Germany.jpg" },
] as const;

export const shoppingChainsMap = shoppingChains.reduce((acc, chain) => {
    acc[chain.name] = chain;
    return acc;
}, {} as Record<string, ShoppingChain>);