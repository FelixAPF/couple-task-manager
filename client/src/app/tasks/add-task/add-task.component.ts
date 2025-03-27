import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SharedModule } from '../../shared.module';
import { TaskService } from '../../service/task-service.service';
import { Frequency, Room, Task } from '../../model/task';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';
import { FrequencyPipe } from '../../shared/pipes/frequency-pipe';
import { RoomPipe } from '../../shared/pipes/room-pipe';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

enum FormControlName {
  ID = 'id',
  TITLE = 'title',
  DESCRIPTION = 'description',
  FREQUENCY = 'frequency',
  ROOM = 'room'
}

@Component({
  selector: 'app-add-task',
  standalone: true,
  imports: [SharedModule, ReactiveFormsModule ],
  templateUrl: './add-task.component.html',
  styleUrl: './add-task.component.css'
})
export class AddTaskComponent implements OnInit {
  display:boolean = false;
log() {
  this.display=true;
}
  ROOM = Room;
  FREQUENCY = Frequency;
  fb = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({});
  subscription: Subscription = new Subscription();
  loadedTask: Task | null = null;

  get titleFormControl(){ return this.formGroup.get(FormControlName.TITLE) }
  get idFormControl(){ return this.formGroup.get(FormControlName.ID) }
  get descriptionFormControl(){ return this.formGroup.get(FormControlName.DESCRIPTION) }
  get frequencyFormControl(){ return this.formGroup.get(FormControlName.FREQUENCY) }
  get roomFormControl(){ return this.formGroup.get(FormControlName.ROOM) }

  get rooms(): { label: string, value: Room }[]{
    return [
      { label: 'Salon', value: Room.LIVING_ROOM },
      { label: 'Chambre', value: Room.BEDROOM },
      { label: 'Cuisine', value: Room.KITCHEN },
      { label: 'Salle de bain', value: Room.BATHROOM },
      { label: 'Bureau', value: Room.OFFICE },
      { label: 'Balcon', value: Room.BALCONY },
      { label: 'Autre', value: Room.OTHER },
      { label: 'Partout', value: Room.EVERYWHERE },
      { label: 'Dehors', value: Room.OUTSIDE },
      { label: 'Couloir', value: Room.HALLWAY }
    ]
  }
  get frequencies(): { label: string, value: Frequency }[]{
    return [
      { label: 'Quotidien', value: Frequency.DAILY },
      { label: 'Hebdomadaire', value: Frequency.WEEKLY },
      { label: 'Bi-mensuel', value: Frequency.BIWEEKLY },
      { label: 'Mensuel', value: Frequency.MONTHLY },
      { label: 'Bi-annuel', value: Frequency.BIYEARLY },
      { label: 'Annuel', value: Frequency.YEARLY }
    ]
  }


  constructor(private taskService: TaskService, private ref: DynamicDialogRef, private config: DynamicDialogConfig, private router: Router, private _location: Location, private route: ActivatedRoute){
    this.buildFormGroup();
  }

  buildFormGroup(task: Task | null = null){
    this.formGroup = this.fb.group({
      [FormControlName.ID]: [task?.id || null],
      [FormControlName.TITLE]: [task?.title || "", [Validators.required]],
      [FormControlName.DESCRIPTION]: [task?.description || "", [Validators.required]],
      [FormControlName.FREQUENCY]: [task?.frequency || "", [Validators.required]],
      [FormControlName.ROOM]: [task?.room || "", [Validators.required]],
    })
  }

  ngOnInit(): void {
    this.buildFormGroup(this.config.data.task);
  }

  save(){
    if(this.formGroup.invalid) return;
    const task: Task = {
      title: this.titleFormControl?.value,
      description: this.descriptionFormControl?.value,
      id: this.idFormControl?.value,
      frequency: this.frequencyFormControl?.value,
      room: this.roomFormControl?.value
    }

    this.taskService.saveTask(task).subscribe(() => this.close());
  }

  close(){
    this.ref.close();
  }

}
