// src/app/model/travel-checklist.model.ts

export interface ChecklistItem {
  id: string;
  name: string;
  isCompleted: boolean;
  assignedTo?: string; // Optional: Assign tasks to specific people in the household
}

export interface ChecklistCategory {
  id: string;
  title: string;
  items: ChecklistItem[];
}

export interface TripChecklist {
  tripId: string;
  destination: string;
  categories: ChecklistCategory[];
}