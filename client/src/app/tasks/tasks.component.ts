// c:\Users\Felix\Documents\Projects\couple-task-manager\client\src\app\tasks\tasks.component.ts
import { Component, inject, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { forkJoin, Subject, Subscription } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';

// PrimeNG Modules
import { SharedModule } from '../shared.module';

// Components
import { AddTaskComponent } from './add-task/add-task.component';
import { AssigneeTaskListComponent } from './split-task/assignee-task-list/assignee-task-list.component';
import { TaskAssignmentDialogComponent } from './task-assignment-dialog/task-assignment-dialog.component';

// Services
import { TaskListService } from '../service/task-list.service';
import { TaskService } from '../service/task-service.service';
import { HouseholdService } from '../service/household.service';
// Assuming TaskPeriodService, TaskAssignmentService, LoadingService are used/injected if needed
// For this fix, focusing on what's directly in the provided code for sorting.

// Models
import { Frequency, Task } from '../model/task';
import { HouseholdMember } from '../model/household'; // Ensure this path and interface are correct
import { TaskList } from '../model/task-list';
import { LoadingService } from '../service/loading/loading.service';
import { TaskAssignDto, TaskListOccasion } from '../model/task-list-occasion';
import { TaskListOccasionService } from '../service/task-list-occasion-service.service';
import { AssignTasksDialogComponent } from './assign-tasks-dialog/assign-tasks-dialog.component';
import { CreateTaskDialogComponent } from './create-task-dialog/create-task-dialog.component';
import { FrequencyPipe } from '../shared/pipes/frequency-pipe';
import { RoomPipe } from '../shared/pipes/room-pipe';

interface MemberTaskColumn {
  member: HouseholdMember | null;
  tasks: Task[];
}

const frequencyOrder: { [key in Frequency]: number } = {
  [Frequency.DAILY]: 1,
  [Frequency.WEEKLY]: 2,
  [Frequency.BIWEEKLY]: 3,
  [Frequency.MONTHLY]: 4,
  [Frequency.QUARTERLY]: 5,
  [Frequency.BIYEARLY]: 6,
  [Frequency.YEARLY]: 7,
};
const UNKNOWN_FREQUENCY_ORDER = Number.MAX_SAFE_INTEGER;

export function sortArrayByFrequency<T>(
  items: T[],
  frequencyExtractor: (item: T) => Frequency | string | undefined | null
): T[] {
  const sortedItems = [...items];
  sortedItems.sort((a, b) => {
    const freqA = frequencyExtractor(a);
    const freqB = frequencyExtractor(b);
    const orderA = (freqA && frequencyOrder[freqA as Frequency] !== undefined)
                    ? frequencyOrder[freqA as Frequency]
                    : UNKNOWN_FREQUENCY_ORDER;
    const orderB = (freqB && frequencyOrder[freqB as Frequency] !== undefined)
                    ? frequencyOrder[freqB as Frequency]
                    : UNKNOWN_FREQUENCY_ORDER;
    return orderA - orderB;
  });
  return sortedItems;
}

interface TaskGroup {
  room: string;
  tasks: Task[];
}

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    AssigneeTaskListComponent,
    FrequencyPipe,
    RoomPipe
  ],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css'],
  providers: [ConfirmationService, MessageService, DialogService] // Added DialogService
})
export class TasksComponent implements OnInit {
  // Occasions State
  taskListOccasions: TaskListOccasion[] = [];
  selectedOccasion: TaskListOccasion | null = null;
  newListName: string = '';
  householdMembers: HouseholdMember[] = [];
  
  // Library State (New)
  allTasks: Task[] = [];
  filteredTasks: Task[] = [];
  taskSearchTerm: string = '';

  ref: DynamicDialogRef | undefined;
  subscription: Subscription = new Subscription();
  groupedTasks: TaskGroup[] = [];
  filteredCount: number = 0; 

  constructor(
    private taskListOccasionService: TaskListOccasionService,
    private taskService: TaskService, // Added
    private householdService: HouseholdService,
    public dialogService: DialogService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.subscription.add(this.householdService.household$.subscribe(h => {
        if(h) this.householdMembers = h.members;
    }));
  }

  loadData() {
    this.loadOccasions();
    this.loadTasks();
  }

  loadOccasions() {
    this.subscription.add(this.taskListOccasionService.list().subscribe(data => {
      this.taskListOccasions = data;
      if (this.selectedOccasion) {
        this.selectedOccasion = data.find(o => o.id === this.selectedOccasion!.id) || null;
      }
    }));
  }

  loadTasks() {
    this.subscription.add(this.taskService.retrieveTasks().subscribe(tasks => {
      this.allTasks = tasks;
      this.filterTasks();
    }));
  }

filterTasks() {
    let tasksToGroup = this.allTasks;

    // 1. Filter based on search
    if (this.taskSearchTerm) {
      const term = this.taskSearchTerm.toLowerCase();
      tasksToGroup = this.allTasks.filter(t => 
        (t.title && t.title.toLowerCase().includes(term)) || 
        (t.description && t.description.toLowerCase().includes(term))
      );
    }
    
    this.filteredCount = tasksToGroup.length;

    // 2. Group by Room
    const groups: { [key: string]: Task[] } = {};
    tasksToGroup.forEach(task => {
        const roomKey = task.room || 'OTHER'; // Default grouping
        if (!groups[roomKey]) {
            groups[roomKey] = [];
        }
        groups[roomKey].push(task);
    });

    // 3. Convert Map to Array and Sort
    this.groupedTasks = Object.keys(groups).map(room => ({
        room,
        tasks: groups[room]
    })).sort((a, b) => a.room.localeCompare(b.room));
  }

  createTaskList() {
    if (!this.newListName.trim()) return;
    this.taskListOccasionService.create(this.newListName).subscribe(() => {
      this.newListName = '';
      this.loadOccasions();
    });
  }

  deleteTaskList(occasion: TaskListOccasion, event: Event) {
    event.stopPropagation();
    this.confirmationService.confirm({
        target: event.target as EventTarget,
        message: `Are you sure you want to delete "${occasion.name}"?`,
        header: 'Delete List',
        icon: 'pi pi-exclamation-triangle',
        acceptButtonStyleClass: "p-button-danger p-button-text",
        rejectButtonStyleClass: "p-button-text p-button-text",
        acceptIcon: "none",
        rejectIcon: "none",
        accept: () => {
            this.taskListOccasionService.delete(occasion.id).subscribe(() => {
                if (this.selectedOccasion?.id === occasion.id) {
                    this.selectedOccasion = null;
                }
                this.loadOccasions();
            });
        }
    });
  }

  // --- Task Library Actions ---
  
  deleteGlobalTask(task: Task, event: Event) {
    event.stopPropagation();
    this.confirmationService.confirm({
        target: event.target as EventTarget,
        message: `Delete task "${task.title}"? This will remove it from all assignments.`,
        header: 'Delete Task',
        icon: 'pi pi-exclamation-triangle',
        acceptButtonStyleClass: "p-button-danger p-button-text",
        rejectButtonStyleClass: "p-button-text p-button-text",
        acceptIcon: "none",
        rejectIcon: "none",
        accept: () => {
            if (task.id) {
                this.taskService.deleteTask(task.id).subscribe(() => {
                    this.loadTasks(); // Reload global list
                    this.loadOccasions(); // Reload occasions as they might be affected
                    this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Task removed' });
                });
            }
        }
    });
  }

  openCreateTaskDialog() {
    this.ref = this.dialogService.open(CreateTaskDialogComponent, {
        header: 'Create New Task',
        width: '500px',
        contentStyle: { overflow: 'visible' },
        baseZIndex: 10000
    });

    this.ref.onClose.subscribe((task: any) => {
        if (task) {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Task created successfully' });
            this.loadTasks(); // Refresh the library
        }
    });
  }

  // --- Helpers ---

  selectOccasion(occasion: TaskListOccasion) {
    this.selectedOccasion = occasion;
  }

  backToOverview() {
    this.selectedOccasion = null;
  }

  getTasksForUser(userId: number): TaskAssignDto[] {
    if (!this.selectedOccasion) return [];
    return this.selectedOccasion.taskAssignments.filter(ta => ta.householdMemberDto.id === userId);
  }

  getTaskCountForUserInOccasion(occasion: TaskListOccasion, userId: number): number {
    return occasion.taskAssignments.filter(ta => ta.householdMemberDto.id === userId).length;
  }

  openAssignDialog(member: HouseholdMember) {
    if (!this.selectedOccasion) return;

    this.ref = this.dialogService.open(AssignTasksDialogComponent, {
        header: `Assign Tasks to ${member.name}`,
        width: '500px',
        contentStyle: { overflow: 'auto' },
        baseZIndex: 10000,
        data: { assigneeName: member.name }
    });

    this.ref.onClose.subscribe((taskIds: number[]) => {
        if (taskIds && taskIds.length > 0) {
            const requests = taskIds.map(taskId => 
              this.taskListOccasionService.addTaskAssignment(this.selectedOccasion!.id, taskId, member.id)
            );
    
            forkJoin(requests).subscribe(() => {
              this.loadOccasions(); 
            });
        }
    });
  }
}