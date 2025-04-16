export enum RecipeType {
    PATES = 'PATES',
    VIANDE = 'VIANDE',
    SANTE = 'SANTE',
    AUTRE = 'AUTRE',
}

export interface Ingredient {
    id?: number;
    name: string;
    quantity: number;
    unit: string;
}

export interface Recipe {
    id?: number;
    name: string,
    description: string;
    category: RecipeType;
    imageUrl: string;
    ingredients: Ingredient[];
}