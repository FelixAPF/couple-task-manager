import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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
export class CreateTaskDialogComponent {
  task: Task = {};
  
  frequencies = [
    { label: 'Daily', value: 'DAILY' },
    { label: 'Weekly', value: 'WEEKLY' },
    { label: 'Bi-Weekly', value: 'BIWEEKLY' },
    { label: 'Monthly', value: 'MONTHLY' },
    { label: 'Quarterly', value: 'QUARTERLY' },
    { label: 'Yearly', value: 'YEARLY' }
  ];

  rooms = [
    { label: 'Kitchen', value: 'KITCHEN' },
    { label: 'Living Room', value: 'LIVING_ROOM' },
    { label: 'Dining Room', value: 'DINING_ROOM' },
    { label: 'Bedroom', value: 'BEDROOM' },
    { label: 'Bathroom', value: 'BATHROOM' },
    { label: 'Office', value: 'OFFICE' },
    { label: 'Outdoors', value: 'OUTDOOR' },
    { label: 'General', value: 'GENERAL' }
  ];

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