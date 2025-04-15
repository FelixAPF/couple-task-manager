import { Task } from "./task";
import { TaskAssignmentDto } from "./task-period";

export interface TaskHistoryDto {
    task: Task;
    taskAssignments: TaskAssignmentDto[];
}