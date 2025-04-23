import { HouseholdMember } from "./household";
import { CreationMethod, Frequency, Room, Task } from "./task";

export interface TaskPeriod {
    id?: number;
    startDate?: Date;
    endDate?: Date;
    taskAssignments: TaskAssignment[];
    completed: boolean;
}

export interface TaskAssignment {
    id?: number;
    task: Task; // Assuming you have this
    assignee: HouseholdMember | null; // Add this line with the correct type
    assigneeUserId: number | null; // This might be redundant if 'assignee' is the full object
    period?: number;
    creationDate: Date | string; // Adjust type if needed
    dueDate: Date | string | null; // Adjust type if needed
    completed?: boolean;
    // Add other properties if needed
  }

export interface TaskAssignmentDto {
    id: number;
    taskTitle: string;
    taskDescription: string;
    householdMemberDto: HouseholdMember | null;
    creationDate: Date;
    completedDate: Date;
    dueDate: Date;
    room: Room;
    completed: boolean;
    frequency: Frequency;
    taskPeriodId: number;
    taskId: number;
}

export enum Assignee {
    Felix = "Felix", Camille = "Camille", Deux = "Deux", Unassigned = "Unassigned"
}

export interface BasicTaskAssignmentRqst {
    taskId?: number;
    assigneeUserId?: number | null;
}

export interface PeriodCreationRequest {
    periodId?: number | null;
    duration: Frequency;
    startDate: Date;
    explicitDueDate?: Date | null;
    creationMethod: CreationMethod;
    taskAssignmentRqst: BasicTaskAssignmentRqst[];
    createEachTaskOnce?: boolean;
}

export enum DurationType {
    PERIOD, EXPLICIT
}