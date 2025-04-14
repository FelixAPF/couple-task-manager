import { Component } from '@angular/core';
import { TaskService } from '../service/task-service.service';
import { Task } from '../model/task';
import { Subscription } from 'rxjs';
import { SharedModule } from '../shared.module';
import { MatTableDataSource } from '@angular/material/table';
import { ConfirmationService, MenuItem, MenuItemCommandEvent, MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { RoomPipe } from '../shared/pipes/room-pipe';
import { AddTaskComponent } from './add-task/add-task.component';
import { DialogService } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-tasks',
  imports: [SharedModule, RoomPipe],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.css',
  providers: [ConfirmationService, MessageService]
})
export class TasksComponent {
  tasks: Task[] = [];
  
  subscription: Subscription = new Subscription();
  displayedColumns = [ "title", "description", "delete"]
  dataSource = new MatTableDataSource<Task>();
  
    constructor(private taskService: TaskService, private messageService: MessageService, private router: Router, private confirmationService: ConfirmationService, private dialogService: DialogService) {
    };

    items(row: any) {
      return [
        {
          label: 'Update', 
          icon: 'pi pi-clone', 
          command: () => {
            this.onModify(row);
          }
        }
      ];
    }

    onModify(item: any): void {
      this.openNewTaskDialog(item);
      //this.router.navigate(['tasks/add-task'], { queryParams: { id: item.id, title: item.title, description: item.description, frequency: item.frequency, room: item.room } });
    }

  
    ngOnInit(): void {
      this.retrieveTasks();
    }

    retrieveTasks(){
      this.subscription.add(this.taskService.retrieveTasks()
        .subscribe(tasks => {
          this.tasks = tasks;
      }));
    }

      openNewTaskDialog(task: Task | null = null){
        const dialogRef = this.dialogService.open(AddTaskComponent, {
          width: '40vw',
          dismissableMask: true,
          modal:true,
          breakpoints: {
     '1199px': '75vw', '575px': '90vw'
          },
          data: {
            task: task
          }
        });  
        dialogRef.onClose.subscribe(() => {
          this.retrieveTasks();
        })
      }
  
    delete(event: any, id: number | undefined){
      if(!id) return;
      this.confirmationService.confirm({
        target: event.target as EventTarget,
        message: 'Voulez-vous réellement supprimer la tâche? \n Cela supprimera toute assignation reliée à celle-ci.',
        header: 'Supprimer une tâche',
        closable: true,
        closeOnEscape: true,
        icon: 'pi pi-exclamation-triangle',
        rejectButtonProps: {
            label: 'Annuler',
            severity: 'secondary',
            outlined: true,
        },
        acceptButtonProps: {
            label: 'Supprimer',
            severity: 'danger',
        },
        accept: () => {
          this.subscription.add(this.taskService.deleteTask(id).subscribe(() => { 
            this.retrieveTasks() 
            this.messageService.add({ severity: 'info', summary: 'Confirmed', detail: 'La tâche a bien été supprimée' });
          }));
        },
        reject: () => {
        },
    });
    }
}
