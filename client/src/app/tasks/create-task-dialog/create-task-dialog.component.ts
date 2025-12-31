import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { Task } from '../../model/task';
import { TaskService } from '../../service/task-service.service';
import { SharedModule } from '../../shared.module';

@Component({
  selector: 'app-create-task-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule],
  templateUrl: './create-task-dialog.component.html',
  styleUrls: ['./create-task-dialog.component.css']
})
export class CreateTaskDialogComponent implements OnInit {
  task: Task = {};
  isEditMode: boolean = false;
  
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

  ngOnInit() {
    // If a task is passed, we are in Edit Mode
    if (this.config.data?.task) {
        this.task = { ...this.config.data.task }; // Clone to avoid mutating parent list
        this.isEditMode = true;
    }
  }
  constructor(
    private taskService: TaskService,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {}

  save() {
    if (this.task.title && this.task.frequency && this.task.room) {
        // We assume the service handles the basic 'Task' object creation
        this.taskService.saveTask({ task: this.task, assigneeUserId: null }).subscribe((createdTask) => {
            this.ref.close(createdTask);
        });
    }
  }

  close() {
    this.ref.close();
  }
}