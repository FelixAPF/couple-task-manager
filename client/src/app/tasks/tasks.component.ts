// c:\Users\Felix\Documents\Projects\couple-task-manager\client\src\app\tasks\tasks.component.ts
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogService } from 'primeng/dynamicdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
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

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    AssigneeTaskListComponent,
  ],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css'],
  providers: [ConfirmationService, MessageService, DialogService] // Added DialogService
})
export class TasksComponent implements OnInit, OnDestroy {
  private taskListService = inject(TaskListService);
  private taskService = inject(TaskService);
  // private taskAssignmentService = inject(TaskAssignmentService); // Uncomment if used
  private householdService = inject(HouseholdService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private dialogService = inject(DialogService);
  // private loadingService = inject(LoadingService); // Uncomment if used
  // private taskPeriodService = inject(TaskPeriodService); // Uncomment if used

  private initialLoadDone = false;

  memberTaskColumns: MemberTaskColumn[] = [];
  filteredMemberTaskColumns: MemberTaskColumn[] = [];
  searchTerm: string = '';
  private destroy$ = new Subject<void>();
  accordionsOpenByDefault: number[] = [];
  currentMember: HouseholdMember | null = null;

  // Constructor can be kept if other services were injected there, or removed if all use inject()
  // constructor(private taskPeriodService: TaskPeriodService, private dialogService: DialogService, private loadingService: LoadingService){}


  ngOnInit(): void {
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadInitialData(): void {
    this.householdService.retrieveHousehold()
      .pipe(takeUntil(this.destroy$), take(1))
      .subscribe({
        next: (household) => {
          if (household) {
            this.currentMember = household.currentUser; // CRITICAL: Set currentMember BEFORE loading tasks
            this.loadTaskData();
            this.initialLoadDone = true;
          } else {
            this.memberTaskColumns = [];
            this.filteredMemberTaskColumns = [];
            this.currentMember = null;
            this.updateOpenAccordionsState(); // Update accordion if list becomes empty
          }
        },
        error: (err) => {
          console.error("Error loading household", err);
          this.messageService.add({ severity: 'error', summary: 'Erreur Foyer', detail: 'Impossible de charger les informations du foyer.' });
          this.memberTaskColumns = [];
          this.filteredMemberTaskColumns = [];
          this.currentMember = null;
          this.updateOpenAccordionsState();
        }
      });
  }

  unassign(event: any){
    console.log("Unassign event received:", event);
    this.messageService.add({ severity: 'info', summary: 'Action Requise', detail: 'La fonctionnalité de désassignation n\'est pas encore implémentée.' });
    // Potentially: this.loadTaskData(); after unassignment logic
  }

  loadTaskData(): void {
    this.taskListService.retrieveWithUnassigned()
      .pipe(takeUntil(this.destroy$)) // Continue to listen for changes if service provides an ongoing observable
      .subscribe({
        next: (taskLists: TaskList[]) => {
          this.memberTaskColumns = taskLists.map(taskList => ({
            member: taskList.assignee,
            tasks: taskList.tasks ?? []
          }));
          this.applyFilter(); // This will filter, sort tasks within columns, and sort columns
        },
        error: (err) => {
          console.error("Error loading task lists", err);
          this.messageService.add({ severity: 'error', summary: 'Erreur Tâches', detail: 'Impossible de charger les listes de tâches.' });
          this.memberTaskColumns = [];
          this.filteredMemberTaskColumns = [];
          this.updateOpenAccordionsState();
        }
      });
  }

  private sortColumnsPuttingCurrentUserFirst(): void {
    if (!this.filteredMemberTaskColumns || this.filteredMemberTaskColumns.length === 0) {
      return;
    }

    this.filteredMemberTaskColumns.sort((colA, colB) => {
      const memberA = colA.member;
      const memberB = colB.member;

      // Rule 1: Current user first
      if (this.currentMember) {
        const isACurrent = memberA?.id === this.currentMember.id;
        const isBCurrent = memberB?.id === this.currentMember.id;
        if (isACurrent && !isBCurrent) return -1;
        if (!isACurrent && isBCurrent) return 1;
      }

      // Rule 2: Unassigned tasks column last
      const isAUnassigned = memberA === null;
      const isBUnassigned = memberB === null;
      if (isAUnassigned && !isBUnassigned) return 1;
      if (!isAUnassigned && isBUnassigned) return -1;
      if (isAUnassigned && isBUnassigned) return 0;

      // Rule 3: Other assigned members (sort alphabetically by name)
      const nameA = memberA?.name?.toLowerCase() || '';
      const nameB = memberB?.name?.toLowerCase() || '';
      return nameA.localeCompare(nameB);
    });
    // DO NOT CALL this.sortColumnsPuttingCurrentUserFirst(); recursively here.
  }

  applyFilter(): void {
    const searchTermLower = this.searchTerm.toLowerCase().trim();

    if (!searchTermLower) {
      this.filteredMemberTaskColumns = this.memberTaskColumns.map(col => ({
        member: col.member,
        tasks: sortArrayByFrequency([...col.tasks], task => task.frequency)
      }));
    } else {
      this.filteredMemberTaskColumns = this.memberTaskColumns.map(column => {
        const filteredTasks = column.tasks.filter(task =>
          task.title?.toLowerCase().includes(searchTermLower) ||
          task.description?.toLowerCase().includes(searchTermLower)
        );
        const sortedFilteredTasks = sortArrayByFrequency(filteredTasks, task => task.frequency);
        return {
          member: column.member,
          tasks: sortedFilteredTasks
        };
      }).filter(column => column.tasks.length > 0);
    }

    this.sortColumnsPuttingCurrentUserFirst(); // Sort columns after they are filtered/prepared
    this.updateOpenAccordionsState(); // Update accordion state based on the final list
  }

  private updateOpenAccordionsState(): void {
    // Example: Open all currently displayed panels
    this.accordionsOpenByDefault = Array.from(Array(this.filteredMemberTaskColumns.length).keys());
    // You might want more sophisticated logic, e.g., to keep the current user's panel open
    // if (this.currentMember) {
    //   const currentUserIndex = this.filteredMemberTaskColumns.findIndex(col => col.member?.id === this.currentMember?.id);
    //   if (currentUserIndex !== -1) {
    //     this.accordionsOpenByDefault = [currentUserIndex];
    //   } else {
    //     this.accordionsOpenByDefault = this.filteredMemberTaskColumns.length > 0 ? [0] : []; // Fallback: open first or none
    //   }
    // } else {
    //    this.accordionsOpenByDefault = this.filteredMemberTaskColumns.length > 0 ? [0] : []; // Fallback
    // }
  }

  create(): void {
    const ref = this.dialogService.open(AddTaskComponent, {
      header: 'Créer une Tâche',
      style: {
        'width': '90vw',         // Use 90% of viewport width on smaller screens
        'max-width': '650px'     // But cap it at 650px (or your preferred max) on larger screens
      },
      contentStyle: { overflow: 'auto' }, // Good for content that might exceed dialog height
      baseZIndex: 10000,
    });
    ref.onClose.pipe(takeUntil(this.destroy$)).subscribe(() => this.loadTaskData());
  }

  openNewTaskDialog(task?: Task, assignee?: HouseholdMember | null): void {
    const ref = this.dialogService.open(AddTaskComponent, {
      header: task ? 'Modifier la Tâche' : 'Créer une Tâche',
      style: {
        'width': '90vw',         // Use 90% of viewport width on smaller screens
        'max-width': '650px'     // But cap it at 650px (or your preferred max) on larger screens
      },
      contentStyle: { overflow: 'auto' }, // Good for content that might exceed dialog height
      baseZIndex: 10000,
      data: { taskToEdit: task, assignee }
    });
    ref.onClose.pipe(takeUntil(this.destroy$)).subscribe((result) => {
      if (result) {
        this.loadTaskData();
      }
    });
  }

  deleteTask(task: Task): void {
    if (!task || !task.id) return;
    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir supprimer la tâche "${task.title}" ? Cette action est irréversible.`,
      header: 'Confirmation de suppression',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui, supprimer',
      rejectLabel: 'Non, annuler',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.taskService.deleteTask(task.id!)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.messageService.add({ severity: 'success', summary: 'Supprimée', detail: 'Tâche supprimée avec succès.' });
              this.loadTaskData();
            },
            error: (err) => {
              console.error("Error deleting task", err);
              this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de supprimer la tâche.' });
            }
          });
      }
    });
  }

  trackByMemberId(index: number, item: MemberTaskColumn): string | number {
    return item.member?.id ?? 'unassigned';
  }
}