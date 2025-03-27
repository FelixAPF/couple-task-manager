export enum Store {
    COSTCO = "COSTCO",
    SUPER_C = "SUPER_C",
    MAXI = "MAXI",
    IGA = "IGA",
    METRO = "METRO",
    SAQ = "SAQ",
    CINQ_SAVEUR = "CINQ_SAVEUR",
    TERRE_ET_OCEAN = "TERRE_ET_OCEAN",
    PROVIGO = "PROVIGO",
    MAYRAND = "MAYRAND",
    RESTAURANT = "RESTAURANT",
    WALMART = "WALMART",
    DOLLARAMA = "DOLLARAMA",
    AMAZON = "AMAZON",
    MUNCHIZ = "MUNCHIZ",
    AUTRE = "AUTRE"
}

export enum ItemType {
    GROCERY = "GROCERY",
    HOME = "HOME",
    OTHER = "OTHER",
}


export class ShoppingItem {
    id: number; // Assuming Long maps to number in TypeScript
    name: string;
    bought: boolean;
    store: Store;
    type: ItemType;
}