import { HouseholdMember } from "./household";

export interface TaskHistoryDto {
    id: number;
    taskId: number;
    completedDate: Date;
    completedBy: HouseholdMember;
}