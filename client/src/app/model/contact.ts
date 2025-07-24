import { Household } from "./household";

export interface Contact {
    id: number;
    name: string;
    email: string;
    phoneNumber: string;
    contactType: string;
    transactions: Transaction[];
    household: Household;
}

export interface Transaction {
    id: number;
    description: string;
    amount: number;
    date: Date;
    household: Household;
    note: string;
}