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
    task: Task;
    assignee: Assignee | null;
    period?: number;
    creationDate: Date;
    dueDate: Date | null;
}

export interface TaskAssignmentDto {
    id: number;
    taskTitle: string;
    taskDescription: string;
    assignee: Assignee;
    creationDate: Date;
    dueDate: Date;
    room: Room;
    completed: boolean;
    taskPeriodId: number;
    taskId: number;
}

export enum Assignee {
    Felix = "Felix", Camille = "Camille", Deux = "Deux"
}

export interface BasicTaskAssignmentRqst {
    taskId?: number;
    assignee?: Assignee;
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