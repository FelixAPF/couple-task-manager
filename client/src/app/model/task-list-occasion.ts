import { HouseholdMember } from "./household";
import { Task } from "./task";

export interface TaskAssignDto {
    task: Task;
    householdMemberDto: HouseholdMember;
}

export interface TaskListOccasion {
    id: number;
    name: string;
    householdDto: HouseholdMember;
    taskAssignments: TaskAssignDto[];
}