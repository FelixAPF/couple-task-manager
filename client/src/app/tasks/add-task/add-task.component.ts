import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { SharedModule } from '../../shared.module';
import { TaskService } from '../../service/task-service.service';
import { Frequency, Room, Task, TaskCreationRqst } from '../../model/task';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';
import { FrequencyPipe } from '../../shared/pipes/frequency-pipe';
import { RoomPipe } from '../../shared/pipes/room-pipe';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PluginListenerHandle } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Platform } from '@angular/cdk/platform';
import { Assignee } from '../../model/task-period';
import { HouseholdService } from '../../service/household.service';
import { HouseholdMember } from '../../model/household';

enum FormControlName {
  ID = 'id',
  TITLE = 'title',
  DESCRIPTION = 'description',
  FREQUENCY = 'frequency',
  ROOM = 'room',
  ASSIGNEE = "assignee"
}

@Component({
  selector: 'app-add-task',
  standalone: true,
  imports: [SharedModule, ReactiveFormsModule, FormsModule ],
  templateUrl: './add-task.component.html',
  styleUrl: './add-task.component.css'
})
export class AddTaskComponent implements OnInit {
  display:boolean = false;
  
  FORM_CONTROL_NAME = FormControlName;
  ROOM = Room;
  ASSIGNEE = Assignee;
  FREQUENCY = Frequency;
  fb = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({});
  subscription: Subscription = new Subscription();
  loadedTask: Task | null = null;
  showAssignee = false;
  householdMembers: HouseholdMember[] = [];
  householdMembersOptions: { label: string, value: number | null }[] = [];

  get titleFormControl(){ return this.formGroup.get(FormControlName.TITLE) }
  get idFormControl(){ return this.formGroup.get(FormControlName.ID) }
  get descriptionFormControl(){ return this.formGroup.get(FormControlName.DESCRIPTION) }
  get frequencyFormControl(){ return this.formGroup.get(FormControlName.FREQUENCY) }
  get roomFormControl(){ return this.formGroup.get(FormControlName.ROOM) }
  get assigneeFormControl(){ return this.formGroup.get(FormControlName.ASSIGNEE) }

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
      { label: 'Trimestriel', value: Frequency.QUARTERLY },
      { label: 'Bi-annuel', value: Frequency.BIYEARLY },
      { label: 'Annuel', value: Frequency.YEARLY }
    ]
  }


  constructor(private taskService: TaskService, private ref: DynamicDialogRef, private householdService: HouseholdService, private config: DynamicDialogConfig, private router: Router, private _location: Location, private route: ActivatedRoute
    , private platform: Platform
  ){
    this.buildFormGroup();
  }

  buildFormGroup(task: Task | null = null){
    this.formGroup = this.fb.group({
      [FormControlName.ID]: [task?.id || null],
      [FormControlName.TITLE]: [task?.title || "", [Validators.required]],
      [FormControlName.DESCRIPTION]: [task?.description || "", [Validators.required]],
      [FormControlName.FREQUENCY]: [task?.frequency || "", [Validators.required]],
      [FormControlName.ROOM]: [task?.room || "", [Validators.required]],
      [FormControlName.ASSIGNEE]: [null, []],
    })
  }

  ngOnInit(): void {
    this.buildFormGroup(this.config.data.taskToEdit);

    this.subscription.add(this.householdService.retrieveHousehold().subscribe((household) => {
      this.householdMembers = household?.members || [];
      this.getHouseholdMemberOptions();
    }));
  }

  getHouseholdMemberOptions(){
    this.householdMembersOptions = this.householdMembers.map((member) => {
      return { label: member.name, value: member.id };
    });
  }

  backButtonListener: PluginListenerHandle;


  async setupBackButtonListener(): Promise<void> {
    // Only add listener on Android platform
    if (!this.platform.ANDROID) return;
    // Use await to get the actual handle from the promise
    this.backButtonListener = await App.addListener('backButton', () => {
      this.close();
    });
  }

  ngOnDestroy(): void {
    if (this.backButtonListener) {
      this.backButtonListener.remove();
    }
  }

  save(){
    if(this.formGroup.invalid) return;
    const taskCreateRqst: TaskCreationRqst = {
      assigneeUserId: this.assigneeFormControl?.value,
      task: {
        title: this.titleFormControl?.value,
        description: this.descriptionFormControl?.value,
        id: this.idFormControl?.value,
        frequency: this.frequencyFormControl?.value,
        room: this.roomFormControl?.value
      }
    }
    this.taskService.saveTask(taskCreateRqst).subscribe(() => this.close(true));
  }

  close(saved: boolean = false){
    this.ref.close(saved);
  }

}
