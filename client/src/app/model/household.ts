export interface Household {
    id: number;
    name: string;
    householdJoinKey: string;
    members: HouseholdMember[];
}

export interface HouseholdMember {
    id: number;
    name: string;
    email: string;
    imageUrl?: string;
}