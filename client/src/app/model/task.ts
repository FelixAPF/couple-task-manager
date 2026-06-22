import { HouseholdMember } from "./household";
import { Procedure } from "./procedure";
import { Assignee, TaskAssignment } from "./task-period";

export interface Task {
    id?: number;
    title?: string;
    description?: string;
    frequency?: Frequency;
    room?: Room;
    startDate?: Date;
    dueDate?: Date;
    assignee?: HouseholdMember | null; // null = unassigned
    doNotify?: boolean;
    procedure?: Procedure; // NEW
    procedureId?: number | null;  // NEW
}

export interface CreateTaskV1 {
    title: string;
    description?: string;
    points: number;
    durationMinutes: number;
    frequency?: Frequency | null;
    room?: string;
    procedureId?: number; // NEW
}

export interface TaskCreationRqst {
    task: Task;
    assigneeUserId: number | null;
    procedureId: number | null; // NEW
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