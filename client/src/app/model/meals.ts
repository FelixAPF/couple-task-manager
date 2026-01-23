import { HouseholdMember } from "./household";
import { Recipe } from "./recipes";

export interface Meal {
    id?: number;
    recipe: Recipe;
    date: Date;
    location: string;
    assignee?: HouseholdMember;
    isThawingNeeded?: boolean;
}