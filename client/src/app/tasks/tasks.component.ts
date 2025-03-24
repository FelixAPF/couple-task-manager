import { Component } from '@angular/core';
import { TaskService } from '../service/task-service.service';
import { Task } from '../model/task';
import { Subscription } from 'rxjs';
import { SharedModule } from '../shared.module';
import { MatTableDataSource } from '@angular/material/table';
import { MenuItem, MenuItemCommandEvent, MessageService } from 'primeng/api';
import { FrequencyPipe } from '../shared/pipes/frequency-pipe';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tasks',
  imports: [SharedModule, FrequencyPipe],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.scss',
  providers: [MessageService]
})
export class TasksComponent {
  tasks: Task[] = [];
  
  subscription: Subscription = new Subscription();
  displayedColumns = [ "title", "description", "delete"]
  dataSource = new MatTableDataSource<Task>();
  
    constructor(private taskService: TaskService, private messageService: MessageService, private router: Router){

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
      this.router.navigate(['tasks/add-task'], { queryParams: { id: item.id, title: item.title, description: item.description, frequency: item.frequency } });
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
  
    delete(id: number){
      this.subscription.add(this.taskService.deleteTask(id).subscribe(() => this.retrieveTasks()));
    }
}
