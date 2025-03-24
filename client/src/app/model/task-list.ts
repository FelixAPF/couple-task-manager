import { Task } from "./task";
import { Assignee } from "./task-period";

export interface TaskList {
    id?: number | null;
    assignee: Assignee;
    tasks?: Task[];
}

export interface TaskListRequest {
    taskListId?: number | null;
    assignee?: Assignee;
    taskId?: number;
}
