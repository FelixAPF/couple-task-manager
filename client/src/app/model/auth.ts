export interface AuthRequest{
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    name?: string;
    householdToken?: string | null; // Optional field for household token
    createNewHousehold?: boolean; // Optional field for creating a new household
    newHouseholdName?: string | null; // Optional field for new household name
}