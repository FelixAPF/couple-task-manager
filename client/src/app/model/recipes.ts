export enum RecipeType {
    PATES = 'PATES',
    VIANDE = 'VIANDE',
    SANDWICH = 'SANDWICH',
    BURGER = 'BURGER',
    SANTE = 'SANTE',
    AUTRE = 'AUTRE',
    POULET = 'POULET',
    BOEUF = 'BOEUF',
    WRAP = 'WRAP',
    SOUPE = 'SOUPE',
    FRUITS_DE_MER = 'FRUITS_DE_MER',
    ENTREE = 'ENTREE',
    POISSON = 'POISSON',
    TREMPETTE = 'TREMPETTE',
    SALADE = 'SALADE',
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