import { Task } from "./task";

export interface TaskPeriod {
    id?: number;
    startDate?: Date;
    endDate?: Date;
    taskAssignments: TaskAssignment[];
}

export interface TaskAssignment {
    id?: number;
    task: Task;
    assignee: Assignee | null;
    period?: number;
    creationDate: Date;
    dueDate: Date | null;
}

export enum Assignee {
    Felix = "Felix", Camille = "Camille"
}