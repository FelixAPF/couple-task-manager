import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { Task } from '../../model/task';
import { TaskService } from '../../service/task-service.service';
import { HouseholdService } from '../../service/household.service';
import { SharedModule } from '../../shared.module';
import { ProcedureService } from '../../service/procedure.service';
import { Procedure } from '../../model/procedure';

@Component({
  selector: 'app-create-task-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule],
  templateUrl: './create-task-dialog.component.html',
  styleUrls: ['./create-task-dialog.component.css']
})
export class CreateTaskDialogComponent implements OnInit {
  task: Task = { title: '', doNotify: false, description: '' };
  isEditMode: boolean = false;
  assigneeUserId: number | null = null;
  householdMembers: { label: string, value: number | null }[] = [];
  procedures: Procedure[] = [];
  procedureId: number | null = null;
  
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
    private householdService: HouseholdService,
    private procedureService: ProcedureService,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {}

  ngOnInit() {
    this.householdService.retrieveHousehold().subscribe(h => {
       this.householdMembers = [{ label: 'Non assignée (Tout le monde)', value: null }];
       if (h && h.members) {
           h.members.forEach(m => {
               this.householdMembers.push({ label: m.name, value: m.id });
           });
       }
    });

    this.procedureService.getProcedures().subscribe(procs => {
      this.procedures = procs;
    });

    if (this.config.data?.task) {
        this.task = { ...this.config.data.task }; 
        this.isEditMode = true;
        if(this.task.referenceDate){
          this.task.referenceDate = new Date(this.task.referenceDate);
        }
        this.assigneeUserId = this.task.assignee ? this.task.assignee.id! : null;
    }
  }

  save() {
    if (this.task.title && this.task.frequency && this.task.room) {
        this.taskService.saveTask({ task: this.task, procedureId: this.procedureId, assigneeUserId: this.assigneeUserId }).subscribe((createdTask) => {
            this.ref.close(createdTask);
        });
    }
  }

  close() {
    this.ref.close();
  }
}