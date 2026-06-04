import { HouseholdMember } from "./household";

export interface TaskHistoryDto {
    id: number;
    taskId: number;
    taskTitle: string; // <-- Here is the missing piece!
    completedDate: Date;
    completedBy: HouseholdMember;
}