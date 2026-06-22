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
import { ProcedureExecutionComponent } from '../procedure-execution/procedure-execution.component';
import { DialogService } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-my-tasks',
  standalone: true,
  imports: [SharedModule, CommonModule, ReactiveFormsModule],
  templateUrl: './my-tasks.component.html',
  styleUrl: './my-tasks.component.css',
  providers: [ConfirmationService, MessageService, DialogService]
})
export class MyTasksComponent implements OnInit {
  @Output() taskCompleteEmitter: EventEmitter<number> = new EventEmitter<number>();
  
  tasks: Task[] = [];
  householdMembers: HouseholdMember[] = [];
  selectedAssignee: HouseholdMember | null = null;
  today: Date = new Date();
  todayCompleted: TaskHistoryDto[] = [];
  formGroup!: FormGroup;

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
    private messageService: MessageService,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
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
      this.checkForSurpriseThanks();
    });
  }

  checkForSurpriseThanks() {
    this.taskService.getUnseenThanks().subscribe(thanks => {
      if (thanks && thanks.length > 0) {
        const message = thanks.length === 1 
          ? `Votre partenaire vous remercie pour : ${thanks[0].taskTitle} !` 
          : `Votre partenaire vous remercie pour ${thanks.length} tâches accomplies !`;

        this.messageService.add({ severity: 'success', summary: '👋 Coucou !', detail: message, life: 5000 });

        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.3 },
          colors: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#a855f7']
        });

        this.taskService.markThanksAsSeen().subscribe();
      }
    });
  }

  sendThankYou(log: TaskHistoryDto) {
    if (log.isThanked) return;
    
    this.taskService.sendThankYou(log.id).subscribe(() => {
      log.isThanked = true;
      this.messageService.add({ severity: 'success', summary: 'Envoyé!', detail: 'Votre partenaire a été remercié.' });
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
    // Strip time for a fair day-to-day comparison
    const todayAtMidnight = new Date();
    todayAtMidnight.setHours(0, 0, 0, 0);
    return new Date(dueDate) < todayAtMidnight;
  }

  startProcedure(task: Task): void {
      const ref = this.dialogService.open(ProcedureExecutionComponent, {
          header: `Procedure: ${task.procedure?.name}`,
          width: '95%',
          data: { task: task },
          baseZIndex: 10000,
          closable: false,
          showHeader: true
      });

      ref.onClose.subscribe((completed: boolean) => {
          if (completed) {
              this.messageService.add({ severity: 'success', summary: 'Procedure Done', detail: 'Task has been completed via procedure.' });
              this.loadDashboardTasks();
          }
      });
  }
}