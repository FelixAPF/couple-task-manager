import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared.module';
import { TaskService } from '../../service/task-service.service';
import { Task } from '../../model/task';
import { HouseholdService } from '../../service/household.service';
import { HouseholdMember } from '../../model/household';
import { ConfirmationService, MessageService } from 'primeng/api';
import confetti from 'canvas-confetti';
import { TaskHistoryDto } from '../../model/task-history';

@Component({
  selector: 'app-my-tasks',
  standalone: true,
  imports: [SharedModule, CommonModule, ReactiveFormsModule],
  templateUrl: './my-tasks.component.html',
  styleUrl: './my-tasks.component.css',
  providers: [ConfirmationService, MessageService]
})
export class MyTasksComponent implements OnInit {
  @Output() taskCompleteEmitter: EventEmitter<number> = new EventEmitter<number>();
  
  tasks: Task[] = [];
  householdMembers: HouseholdMember[] = [];
  selectedAssignee: HouseholdMember | null = null;
  today: Date = new Date();
  todayCompleted: TaskHistoryDto[] = [];
  // Re-added Form variables
  formGroup!: FormGroup;

  // New moving date-range horizon options matching your exact specs
  get options() {
    return [
      { label: 'Cette semaine', value: 'WEEK' },
      { label: 'Deux semaines', value: 'BIWEEKLY' },
      { label: '1 mois', value: 'MONTH' },
      { label: '3 mois', value: 'QUARTER' },
      { label: '6 mois', value: 'HALFYEAR' },
      { label: '1 an', value: 'YEAR' }
    ];
  }

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private householdService: HouseholdService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    // Initialize the Reactive Form group control tracker
    this.formGroup = this.fb.group({
      displayDuration: ['MONTH']
    });

    this.householdService.retrieveHousehold().subscribe(household => {
      this.householdMembers = household?.members || [];
      this.selectedAssignee = household?.currentUser || null;
      
      const selectedHorizon = localStorage.getItem("myTasksHorizon");
      if (selectedHorizon != null) {
        this.formGroup.get('displayDuration')?.setValue(selectedHorizon);
      } else {
        this.formGroup.get('displayDuration')?.setValue('MONTH');
        localStorage.setItem("myTasksHorizon", 'MONTH');
      }
      
      this.loadDashboardTasks();
    });
  }

loadDashboardTasks() {
    const horizon = this.formGroup.get('displayDuration')?.value || 'MONTH';
    localStorage.setItem("myTasksHorizon", horizon);

    this.taskService.getDashboardTasks(horizon).subscribe(tasks => {
      this.tasks = tasks.sort((a, b) => {
        if (!a.dueDate || !b.dueDate) return 0;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    });

    // Fetch today's completed tasks!
    this.taskService.getTodayHistory().subscribe(history => {
      this.todayCompleted = history;
    });
  }

  onFrequencySelectChange({ value }: any) {
    this.loadDashboardTasks();
  }

  
  completeTask(task: Task) {
    if (!task.id) return;
    this.taskService.completeTask(task.id).subscribe(() => {
      
      // 🎉 FIRE THE CONFETTI!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899']
      });

      this.messageService.add({ severity: 'success', summary: 'Bravo!', detail: 'Tâche complétée!' });
      this.loadDashboardTasks(); 
      this.taskCompleteEmitter.emit(task.id);
    });
  }

  skipTask(task: Task) {
    if (!task.id) return;
    this.taskService.skipTask(task.id).subscribe(() => {
      this.messageService.add({ severity: 'info', summary: 'Ignorée', detail: 'Tâche repoussée à la prochaine date.' });
      this.loadDashboardTasks(); 
    });
  }

  datePastDeadline(dueDate: any): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < this.today;
  }
}