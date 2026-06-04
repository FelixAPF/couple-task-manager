import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';

// PrimeNG Modules
import { MultiSelectModule } from 'primeng/multiselect';
import { CalendarModule } from 'primeng/calendar';

import { SharedModule } from '../shared.module';
import { CreateTaskDialogComponent } from './create-task-dialog/create-task-dialog.component';
import { TaskService } from '../service/task-service.service';
import { HouseholdService } from '../service/household.service';
import { TaskGroupService, TaskGroup } from '../service/task-group.service';
import { Task } from '../model/task';
import { HouseholdMember } from '../model/household';
import { FrequencyPipe } from '../shared/pipes/frequency-pipe';
import { RoomPipe } from '../shared/pipes/room-pipe';
import { DialogModule } from 'primeng/dialog';
import { TaskHistoryComponent } from './task-history/task-history.component';

interface RoomGroup {
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
    FrequencyPipe,
    RoomPipe,
    MultiSelectModule,
    CalendarModule,
    DialogModule,
    TaskHistoryComponent
  ],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css'],
  providers: [ConfirmationService, MessageService, DialogService]
})
export class TasksComponent implements OnInit, OnDestroy {
  allTasks: Task[] = [];
  groupedTasks: RoomGroup[] = [];
  householdMembers: HouseholdMember[] = [];
  taskSearchTerm: string = '';
  filteredCount: number = 0; 

  // Macros / Task Group State
  groups: TaskGroup[] = [];
  showGroupDialog: boolean = false;
  isEditGroupMode: boolean = false;
  editingGroupId: number | null = null;
  newGroupName: string = '';
  selectedTaskIdsForGroup: number[] = [];

  showHistoryDialog: boolean = false;
  selectedTaskIdForHistory: number | null = null;
  selectedTaskTitleForHistory: string = '';

  showTriggerDialog: boolean = false;
  selectedGroupToTrigger: TaskGroup | null = null;
  triggerDate: Date = new Date();

  ref: DynamicDialogRef | undefined;
  subscription: Subscription = new Subscription();

  constructor(
    private taskService: TaskService,
    private householdService: HouseholdService,
    private taskGroupService: TaskGroupService,
    public dialogService: DialogService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.subscription.add(this.householdService.household$.subscribe(h => {
        if(h) this.householdMembers = h.members;
    }));
    this.loadTasks();
    this.loadGroups();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    if (this.ref) this.ref.close();
  }

  // --- Task Library Logic ---
  openTaskHistory(task: Task, event: Event) {
    event.stopPropagation(); // Prevents card actions from conflicting
    if (task.id) {
      this.selectedTaskIdForHistory = task.id;
      this.selectedTaskTitleForHistory = task.title || '';
      this.showHistoryDialog = true;
    }
  }

  loadTasks() {
    this.subscription.add(this.taskService.retrieveTasks().subscribe(tasks => {
      this.allTasks = tasks;
      this.filterTasks();
    }));
  }

  filterTasks() {
    let tasksToGroup = this.allTasks;

    if (this.taskSearchTerm) {
      const term = this.taskSearchTerm.toLowerCase();
      tasksToGroup = this.allTasks.filter(t => 
        (t.title && t.title.toLowerCase().includes(term)) || 
        (t.description && t.description.toLowerCase().includes(term))
      );
    }
    
    this.filteredCount = tasksToGroup.length;

    const groups: { [key: string]: Task[] } = {};
    tasksToGroup.forEach(task => {
        const roomKey = task.room || 'OTHER';
        if (!groups[roomKey]) {
            groups[roomKey] = [];
        }
        groups[roomKey].push(task);
    });

    this.groupedTasks = Object.keys(groups).map(room => ({
        room,
        tasks: groups[room]
    })).sort((a, b) => a.room.localeCompare(b.room));
  }

  deleteGlobalTask(task: Task, event: Event) {
    event.stopPropagation();
    this.confirmationService.confirm({
        target: event.target as EventTarget,
        message: `Voulez-vous vraiment supprimer "${task.title}"?`,
        header: 'Supprimer la tâche',
        icon: 'pi pi-exclamation-triangle',
        acceptButtonStyleClass: "p-button-danger p-button-text",
        rejectButtonStyleClass: "p-button-text p-button-text",
        accept: () => {
            if (task.id) {
                this.taskService.deleteTask(task.id).subscribe(() => {
                    this.loadTasks(); 
                    this.loadGroups(); 
                    this.messageService.add({ severity: 'success', summary: 'Supprimée', detail: 'Tâche retirée' });
                });
            }
        }
    });
  }

  openCreateTaskDialog() {
    this.ref = this.dialogService.open(CreateTaskDialogComponent, {
        header: 'Créer une nouvelle tâche',
        width: '500px',
        contentStyle: { overflow: 'visible' },
        baseZIndex: 10000
    });

    this.ref.onClose.subscribe((task: any) => {
        if (task) {
            this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Tâche créée!' });
            this.loadTasks(); 
        }
    });
  }

  openEditTaskDialog(task: Task, event: Event) {
    event.stopPropagation(); 
    this.ref = this.dialogService.open(CreateTaskDialogComponent, {
        header: 'Modifier la tâche',
        width: '500px',
        contentStyle: { overflow: 'visible' },
        baseZIndex: 10000,
        data: { task: task } 
    });

    this.ref.onClose.subscribe((result: any) => {
        if (result) {
            this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Tâche mise à jour!' });
            this.loadTasks(); 
            this.loadGroups(); 
        }
    });
  }

  // --- Macro / Task Group Logic ---

  loadGroups() {
    this.taskGroupService.getGroups().subscribe(groups => this.groups = groups);
  }

  openCreateGroup() {
    this.isEditGroupMode = false;
    this.editingGroupId = null;
    this.newGroupName = '';
    this.selectedTaskIdsForGroup = [];
    this.showGroupDialog = true;
  }

  openEditGroup(group: TaskGroup) {
    this.isEditGroupMode = true;
    this.editingGroupId = group.id!;
    this.newGroupName = group.name;
    this.selectedTaskIdsForGroup = group.tasks.map(t => t.id);
    this.showGroupDialog = true;
  }

  saveGroup() {
    if (this.isEditGroupMode && this.editingGroupId) {
        this.taskGroupService.updateGroup(this.editingGroupId, this.newGroupName, this.selectedTaskIdsForGroup).subscribe(() => {
            this.showGroupDialog = false;
            this.loadGroups();
            this.messageService.add({ severity: 'success', summary: 'Mis à jour', detail: 'Macro mise à jour avec succès' });
        });
    } else {
        this.taskGroupService.createGroup(this.newGroupName, this.selectedTaskIdsForGroup).subscribe(() => {
            this.showGroupDialog = false;
            this.loadGroups();
            this.messageService.add({ severity: 'success', summary: 'Créé', detail: 'Macro créée avec succès' });
        });
    }
  }

  deleteGroup(id: number) {
      this.confirmationService.confirm({
          message: 'Voulez-vous supprimer cette macro ? (Les tâches ne seront pas supprimées)',
          header: 'Confirmation',
          icon: 'pi pi-info-circle',
          accept: () => {
              this.taskGroupService.deleteGroup(id).subscribe(() => this.loadGroups());
          }
      });
  }

  openTriggerDialog(group: TaskGroup) {
      this.selectedGroupToTrigger = group;
      this.triggerDate = new Date();
      this.showTriggerDialog = true;
  }

  triggerGroup() {
      if (!this.selectedGroupToTrigger || !this.selectedGroupToTrigger.id) return;
      
      this.taskGroupService.triggerGroup(this.selectedGroupToTrigger.id, this.triggerDate).subscribe(() => {
          this.showTriggerDialog = false;
          this.loadTasks(); 
          this.messageService.add({ severity: 'success', summary: 'Déclenché!', detail: 'Toutes les tâches ont été reprogrammées.' });
      });
  }
}