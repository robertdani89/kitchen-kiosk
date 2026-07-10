export const shoppingChains = [
    { name: "Tesco", icon: "https://upload.wikimedia.org/wikipedia/commons/2/23/Tesco_logo.png" },
    { name: "Rossmann", icon: "https://upload.wikimedia.org/wikipedia/commons/8/8e/Rossmann_Logo.svg" },
    { name: "Spar", icon: "https://upload.wikimedia.org/wikipedia/commons/7/7c/Spar-logo.svg" },
    { name: "Müller", icon: "https://upload.wikimedia.org/wikipedia/commons/e/e1/Logo_Drogerie_Mueller.svg" },
    { name: "Lidl", icon: "https://upload.wikimedia.org/wikipedia/commons/9/91/Lidl-Logo.svg" },
    { name: "dm", icon: "https://upload.wikimedia.org/wikipedia/commons/d/d7/Logo_of_dm-drogerie_markt.jpg" },
    { name: "Auchan", icon: "https://upload.wikimedia.org/wikipedia/commons/6/67/Auchan_wordmark.svg" },
    { name: "Penny", icon: "https://upload.wikimedia.org/wikipedia/commons/8/8e/Penny-Logo.svg" },
    { name: "Aldi", icon: "https://upload.wikimedia.org/wikipedia/commons/d/dc/Logo_of_Aldi_south_in_Germany.jpg" },
];

export const shoppingChainsMap = shoppingChains.reduce((acc, chain) => {
    acc[chain.name] = chain;
    return acc;
}, {} as Record<string, { name: string; icon: string }>);