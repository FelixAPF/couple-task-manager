// c:\Users\Felix\Documents\Projects\couple-task-manager\client\src\app\tasks\tasks.component.ts
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <-- Import FormsModule
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { finalize, forkJoin, skipWhile, Subject, take, takeUntil } from 'rxjs';

// PrimeNG Modules (Import via SharedModule or directly if standalone)
import { SharedModule } from '../shared.module';

// Components
import { AddTaskComponent } from './add-task/add-task.component';
import { AssigneeTaskListComponent } from './split-task/assignee-task-list/assignee-task-list.component';
import { TaskAssignmentDialogComponent } from './task-assignment-dialog/task-assignment-dialog.component';

// Services
import { TaskListService } from '../service/task-list.service';
import { TaskService } from '../service/task-service.service';
import { HouseholdService } from '../service/household.service';
import { TaskPeriodService } from '../service/task-period.service';
import { TaskAssignmentService } from '../service/task-assignment.service';
import { LoadingService } from '../service/loading/loading.service';

// Models
import { Frequency, Task } from '../model/task';
import { HouseholdMember } from '../model/household';
import { TaskList } from '../model/task-list';

// Define the new interface for column data
interface MemberTaskColumn {
  member: HouseholdMember | null;
  tasks: Task[];
}


const frequencyOrder: { [key in Frequency]: number } = {
  [Frequency.DAILY]: 1,
  [Frequency.WEEKLY]: 2,
  [Frequency.BIWEEKLY]: 3, // Every two weeks
  [Frequency.MONTHLY]: 4,
  [Frequency.QUARTERLY]: 5, // Every three months
  [Frequency.BIYEARLY]: 6, // Every six months / Twice a year
  [Frequency.YEARLY]: 7,
};
const UNKNOWN_FREQUENCY_ORDER = Number.MAX_SAFE_INTEGER;

export function sortArrayByFrequency<T>(
  items: T[],
  frequencyExtractor: (item: T) => Frequency | string | undefined | null
): T[] {
  // Create a shallow copy to avoid modifying the original array
  const sortedItems = [...items];

  sortedItems.sort((a, b) => {
    const freqA = frequencyExtractor(a);
    const freqB = frequencyExtractor(b);

    // Get the sort order number for frequency A, defaulting for unknown/null values
    const orderA = (freqA && frequencyOrder[freqA as Frequency] !== undefined)
                   ? frequencyOrder[freqA as Frequency]
                   : UNKNOWN_FREQUENCY_ORDER;

    // Get the sort order number for frequency B, defaulting for unknown/null values
    const orderB = (freqB && frequencyOrder[freqB as Frequency] !== undefined)
                   ? frequencyOrder[freqB as Frequency]
                   : UNKNOWN_FREQUENCY_ORDER;

    // Compare the order numbers
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
    FormsModule, // <-- Add FormsModule here
    AssigneeTaskListComponent,
  ],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css'],
  providers: [ConfirmationService, MessageService]
})
export class TasksComponent implements OnInit, OnDestroy {
  // --- Injected Services ---
  private taskListService = inject(TaskListService);
  private taskService = inject(TaskService);
  private taskAssignmentService = inject(TaskAssignmentService);
  private householdService = inject(HouseholdService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private initialLoadDone = false;


  memberTaskColumns: MemberTaskColumn[] = []; // Original data from service
  filteredMemberTaskColumns: MemberTaskColumn[] = []; // Data displayed in the template
  searchTerm: string = ''; // <-- Add property for search term
  private destroy$ = new Subject<void>();
  accordionsOpenByDefault: number[] = []

  constructor(private taskPeriodService: TaskPeriodService, private dialogService: DialogService, private loadingService: LoadingService){}


  // --- Lifecycle Hooks ---
  ngOnInit(): void {
    this.loadInitialData();
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- Data Loading ---
  loadInitialData(): void {
    this.householdService.retrieveHousehold()
      .pipe(takeUntil(this.destroy$), take(1))
      .subscribe({
        next: (household) => {
          if (household) {
            this.loadTaskData(); // Load tasks if household exists
            this.initialLoadDone = true;
            // Open all accordions initially (or based on filtered results later if needed)
            this.accordionsOpenByDefault = Array.from(Array(household.members.length + 1).keys());
          } else {
            this.memberTaskColumns = [];
            this.filteredMemberTaskColumns = []; // Clear filtered data too
          }
        },
        error: (err) => {
          console.error("Error loading household", err);
          this.messageService.add({ severity: 'error', summary: 'Erreur Foyer', detail: 'Impossible de charger les informations du foyer.' });
          this.memberTaskColumns = [];
          this.filteredMemberTaskColumns = []; // Clear filtered data on error
        }
      });
  }

  unassign(event: any){
    // Implement unassignment logic if needed, then reload/refilter
    console.log("Unassign event received:", event);
    // Example: Call service to unassign, then this.loadTaskData();
    this.messageService.add({ severity: 'info', summary: 'Action Requise', detail: 'La fonctionnalité de désassignation n\'est pas encore implémentée.' });
  }

  loadTaskData(): void {
    this.taskListService.retrieveWithUnassigned()
      .subscribe({
        next: (taskLists: TaskList[]) => {
          this.memberTaskColumns = taskLists.map(taskList => ({
            member: taskList.assignee,
            tasks: taskList.tasks ?? []
          }));
          this.applyFilter(); // <-- Apply filter after loading data
        },
        error: (err) => {
          console.error("Error loading task lists", err);
          this.messageService.add({ severity: 'error', summary: 'Erreur Tâches', detail: 'Impossible de charger les listes de tâches.' });
          this.memberTaskColumns = []; // Clear original data on error
          this.filteredMemberTaskColumns = []; // Clear filtered data on error
        }
      });
  }

  // --- Filtering Logic ---
  applyFilter(): void {
    const searchTermLower = this.searchTerm.toLowerCase().trim();

    if (!searchTermLower) {
      // If search is empty, show all original tasks
      this.filteredMemberTaskColumns = this.memberTaskColumns.map(col => ({ ...col })); // Create shallow copies
      this.filteredMemberTaskColumns.forEach(column => {
        // Use sortArrayByFrequency to sort the copied task array *in place* for this column
        column.tasks = sortArrayByFrequency(column.tasks, task => task.frequency);
    });
      return;
    }

    this.filteredMemberTaskColumns = this.memberTaskColumns.map(column => {
      // Filter tasks within each column based on search term
      let filteredTasks = column.tasks.filter(task =>
        task.title?.toLowerCase().includes(searchTermLower) ||
        task.description?.toLowerCase().includes(searchTermLower)
        // Add more fields to search if needed
      );
      filteredTasks = sortArrayByFrequency(filteredTasks, task => task.frequency);

      // Return a new column object with potentially filtered tasks
      return {
        ...column,
        tasks: filteredTasks
      };
    })
    // **** THIS IS THE CORRECTED LINE ****
    // Only keep columns (assigned OR unassigned) that have tasks remaining AFTER filtering
    .filter(column => column.tasks.length > 0);
  }


  // --- Event Handlers & Dialog Openers ---
  create(): void {
    const ref = this.dialogService.open(TaskAssignmentDialogComponent, {
      header: 'Assigner les tâches pour la période',
      width: '90%',
      contentStyle: { overflow: 'auto' },
      baseZIndex: 10000,
    });
    ref.onClose.pipe(takeUntil(this.destroy$)).subscribe(() => this.loadTaskData());
  }

  openNewTaskDialog(task?: Task, assignee?: HouseholdMember | null): void {
    const ref = this.dialogService.open(AddTaskComponent, {
      header: task ? 'Modifier la Tâche' : 'Créer une Tâche',
      width: '90%',
      contentStyle: { overflow: 'auto' },
      baseZIndex: 10000,
      data: { taskToEdit: task, assignee }
    });
    ref.onClose.pipe(takeUntil(this.destroy$)).subscribe((result) => {
      if (result) {
        this.loadTaskData(); // Reload and refilter
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
              this.loadTaskData(); // Reload and refilter
            },
            error: (err) => {
              console.error("Error deleting task", err);
              this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de supprimer la tâche.' });
            }
          });
      }
    });
  }

  // --- trackBy Function ---
  trackByMemberId(index: number, item: MemberTaskColumn): string | number {
    return item.member?.id ?? 'unassigned';
  }
}