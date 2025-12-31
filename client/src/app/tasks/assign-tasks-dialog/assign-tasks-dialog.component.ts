import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../service/task-service.service';
import { SharedModule } from '../../shared.module';
import { Task } from '../../model/task';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { RoomPipe } from '../../shared/pipes/room-pipe';
import { FrequencyPipe } from '../../shared/pipes/frequency-pipe';


@Component({
  selector: 'app-assign-tasks-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, RoomPipe, FrequencyPipe],
  templateUrl: './assign-tasks-dialog.component.html',
  styleUrl: './assign-tasks-dialog.component.css'
})
export class AssignTasksDialogComponent implements OnInit {
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  selectedTasks: number[] = []; 
  
  // Search & Filter State
  searchTerm: string = '';
  selectedRoom: string | null = null;
  selectedFrequency: string | null = null;
  assigneeName: string = '';

  // Filter Options
  rooms = [
    { label: 'Cuisine', value: 'KITCHEN' },
    { label: 'Salle à manger', value: 'DINING_ROOM' },
    { label: 'Salle de bain #2', value: 'BATHROOM_2' },
    { label: 'Salle de bain', value: 'BATHROOM' },
    { label: 'Salon', value: 'LIVING_ROOM' },
    { label: 'Bureau', value: 'OFFICE' },
    { label: 'Chambre', value: 'BEDROOM' },
    { label: 'Corridor', value: 'HALLWAY' },
    { label: 'Balcon', value: 'BALCONY' },
    { label: 'Dehors', value: 'OUTSIDE' },
    { label: 'Partout', value: 'EVERYWHERE' },
    { label: 'Sous-sol', value: 'BASEMENT' },
    { label: 'Autre', value: 'OTHER' }
  ];

  frequencies = [
    { label: 'Bi-annuel', value: 'BIYEARLY' },
    { label: 'Quotidien', value: 'DAILY' },
    { label: 'Hebdomadaire', value: 'WEEKLY' },
    { label: 'Bi-mensuel', value: 'BIWEEKLY' },
    { label: 'Mensuel', value: 'MONTHLY' },
    { label: 'Trimestriel', value: 'QUARTERLY' },
    { label: 'Annuel', value: 'YEARLY' }
  ];

  constructor(
    private taskService: TaskService,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {}

  ngOnInit(): void {
    this.assigneeName = this.config.data?.assigneeName || 'User';
    this.taskService.retrieveTasks().subscribe(tasks => {
      this.tasks = tasks;
      this.filteredTasks = tasks;
    });
  }

  filterTasks() {
    this.filteredTasks = this.tasks.filter(t => {
      // 1. Text Search
      const matchesSearch = !this.searchTerm || 
        (t.title && t.title.toLowerCase().includes(this.searchTerm.toLowerCase())) || 
        (t.description && t.description.toLowerCase().includes(this.searchTerm.toLowerCase()));

      // 2. Room Filter
      const matchesRoom = !this.selectedRoom || t.room === this.selectedRoom;

      // 3. Frequency Filter
      const matchesFrequency = !this.selectedFrequency || t.frequency === this.selectedFrequency;

      return matchesSearch && matchesRoom && matchesFrequency;
    });
  }

  toggleSelection(taskId: number) {
    const index = this.selectedTasks.indexOf(taskId);
    if (index > -1) {
      this.selectedTasks.splice(index, 1);
    } else {
      this.selectedTasks.push(taskId);
    }
  }

  isSelected(taskId: number): boolean {
    return this.selectedTasks.includes(taskId);
  }

  submit() {
    this.ref.close(this.selectedTasks);
  }

  close() {
    this.ref.close();
  }
}