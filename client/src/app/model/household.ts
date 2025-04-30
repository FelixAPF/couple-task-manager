export interface Household {
    id: number;
    name: string;
    householdJoinKey: string;
    members: HouseholdMember[];
    currentUser: HouseholdMember;
    enableWaysToCare: boolean;
    waysToCare: WayToCare[];
    enableToDoList: boolean;
    toDoItems: WayToCare[];
}

export interface HouseholdMember {
    id: number;
    name: string;
    email: string;
    imageUrl?: string;
    birthDay?: Date;
}

export interface WayToCare {
    id?: number;
    title: string;
    description: string;
    cost: number;
    location: string;
    assignee: HouseholdMember;
}
export interface ToDoItem {
    id?: number;
    title: string;
    description: string;
    cost: number;
    location: string;
    status: ToDoStatus;
    rating: number | null;
}

export interface UpdateHouseholdSettings {
    enableWaysToCare?: boolean;
    enableToDoList?: boolean;
    name?: string;
}

export enum ToDoStatus {
    TO_DO = "TO_DO",
    COMPLETED = "COMPLETED"
}

