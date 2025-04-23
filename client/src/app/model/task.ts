import { Assignee, TaskAssignment } from "./task-period";

export interface Task {
    id?: number;
    title?: string;
    description?: string;
    frequency?: Frequency;
    room?: Room;
    taskAssignments?: TaskAssignment[]; // This line must be present and correctly typed

}

export interface TaskCreationRqst {
    task: Task;
    assigneeUserId: number | null;
}

export interface TaskWithCompletedDate {
    task: Task;
    completedDate: Date;
}

export enum Frequency {
    DAILY = "DAILY", BIWEEKLY = "BIWEEKLY", WEEKLY = "WEEKLY", MONTHLY = "MONTHLY", QUARTERLY = "QUARTERLY", BIYEARLY = "BIYEARLY", YEARLY = "YEARLY"
}

export enum CreationMethod {
    AUTOMATIC = "AUTOMATIC", MANUAL = "MANUAL"
}

export enum Room {
    LIVING_ROOM = "LIVING_ROOM",
    KITCHEN = "KITCHEN",
    BATHROOM = "BATHROOM",
    BEDROOM = "BEDROOM",
    OFFICE = "OFFICE",
    HALLWAY = "HALLWAY",
    BALCONY = "BALCONY",
    OUTSIDE =  "OUTSIDE",
    EVERYWHERE = "EVERYWHERE",
    OTHER = "OTHER"
}