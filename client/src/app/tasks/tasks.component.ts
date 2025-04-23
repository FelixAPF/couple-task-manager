// c:\Users\Felix\Documents\Projects\couple-task-manager\client\src\app\tasks\tasks.component.ts
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { finalize, forkJoin, skipWhile, Subject, takeUntil } from 'rxjs'; // Import forkJoin, Subject, takeUntil

// PrimeNG Modules (Import via SharedModule or directly if standalone)
import { SharedModule } from '../shared.module';

// Components
import { AddTaskComponent } from './add-task/add-task.component';
import { AssigneeTaskListComponent } from './split-task/assignee-task-list/assignee-task-list.component';
import { TaskAssignmentDialogComponent } from './task-assignment-dialog/task-assignment-dialog.component';

// Services
import { TaskListService } from '../service/task-list.service';
import { TaskService } from '../service/task-service.service';
import { HouseholdService } from '../service/household.service'; // <-- Import HouseholdService

// Models
import { Task } from '../model/task';
import { HouseholdMember } from '../model/household'; // <-- Import HouseholdMember
import { TaskPeriodService } from '../service/task-period.service';
import { TaskAssignmentService } from '../service/task-assignment.service';
import { TaskList } from '../model/task-list';
// Remove Assignee enum import if present: import { Assignee } from '../model/task-period';

// Define the new interface for column data
interface MemberTaskColumn {
  member: HouseholdMember | null;
  tasks: Task[];
}

@Component({
  selector: 'app-tasks',
  standalone: true, // Assuming standalone based on previous context
  imports: [
    CommonModule,
    SharedModule, // Imports PrimeNG modules, pipes etc.
    AssigneeTaskListComponent, // Import child component
    // Add other necessary imports if not in SharedModule
  ],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css'],
  providers: [ConfirmationService, MessageService] // Provide services needed
})
export class TasksComponent implements OnInit, OnDestroy {
  // --- Injected Services ---
  private taskListService = inject(TaskListService);
  private taskService = inject(TaskService);
  private taskAssignmentService = inject(TaskAssignmentService);
  private householdService = inject(HouseholdService); // <-- Inject
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private initialLoadDone = false;


  // --- State ---
  isLoading = false; // Add loading state if needed
  memberTaskColumns: MemberTaskColumn[] = []; // Array to drive the *ngFor
  private destroy$ = new Subject<void>(); // For unsubscribing
  accordionsOpenByDefault: number[] = []

  constructor(private taskPeriodService: TaskPeriodService, private dialogService: DialogService){}


  // --- Lifecycle Hooks ---
  ngOnInit(): void {
    this.loadInitialData();
  
    this.householdService.household$
      .pipe(
        takeUntil(this.destroy$),
        skipWhile(() => !this.initialLoadDone) // Ignore emissions until initial load is done
      )
      .subscribe(household => {
        if (household) {
          this.loadTaskData();
        } else {
          this.memberTaskColumns = [];
        }
      });
  }
  

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- Data Loading ---
  loadInitialData(): void {
    this.isLoading = true;
    this.householdService.retrieveHousehold()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (household) => {
          if (household) {
            this.loadTaskData();
            this.initialLoadDone = true;
            this.accordionsOpenByDefault =Array.from(Array(household.members.length + 1).keys()); // Open all accordions by default
          } else {
            console.warn("No household found...");
            this.isLoading = false;
            this.memberTaskColumns = [];
          }
        },
        error: (err) => {
          // ... error handling
          this.isLoading = false;
        }
      });
  }

  unassign(event: any){

  }

  loadTaskData(): void {
    this.isLoading = true;
    this.taskListService.retrieveWithUnassigned()
      .pipe(
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (taskLists: TaskList[]) => {
          this.memberTaskColumns = taskLists.map(taskList => ({
            member: taskList.assignee,
            tasks: taskList.tasks ?? [] // Ensure tasks is always an array
          }));
        },
        error: (err) => {
          console.error("Error loading task lists", err);
          this.messageService.add({ severity: 'error', summary: 'Erreur Tâches', detail: 'Impossible de charger les listes de tâches.' });
        }
      });
  }


  // --- Event Handlers & Dialog Openers ---
  create(): void {
    const ref = this.dialogService.open(TaskAssignmentDialogComponent, {
      header: 'Assigner les tâches pour la période',
      width: '90%',
      contentStyle: { overflow: 'auto' },
      baseZIndex: 10000,
    });
    ref.onClose.pipe(takeUntil(this.destroy$)).subscribe(() => this.loadTaskData()); // Reload on close
  }

  openNewTaskDialog(task?: Task): void {
    const ref = this.dialogService.open(AddTaskComponent, {
      header: task ? 'Modifier la Tâche' : 'Créer une Tâche',
      width: '90%',
      contentStyle: { overflow: 'auto' },
      baseZIndex: 10000,
      data: { taskToEdit: task } // Pass task data for editing
    });
    ref.onClose.pipe(takeUntil(this.destroy$)).subscribe((result) => {
      if (result) { // Only reload if save was successful (component should return true)
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
        this.taskService.deleteTask(task.id!) // Use non-null assertion if ID is guaranteed
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.messageService.add({ severity: 'success', summary: 'Supprimée', detail: 'Tâche supprimée avec succès.' });
              this.loadTaskData(); // Refresh lists
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
    // Use member ID or a specific string for 'unassigned'
    return item.member?.id ?? 'unassigned';
  }
}
