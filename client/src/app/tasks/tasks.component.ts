import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../shared.module';
import { TaskAssignmentDialogComponent } from './task-assignment-dialog/task-assignment-dialog.component';
import { TaskPeriodService } from '../service/task-period.service';
import { Subscription } from 'rxjs';
import { Assignee, TaskPeriod } from '../model/task-period';
import { DialogService } from 'primeng/dynamicdialog';
import { TaskListService } from '../service/task-list.service';
import { TaskList } from '../model/task-list';
import { DialogRef } from '@angular/cdk/dialog';
import { Task } from '../model/task';
import { AssigneeTaskListComponent } from "../tasks/split-task/assignee-task-list/assignee-task-list.component";
import { TaskService } from '../service/task-service.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { AddTaskComponent } from './add-task/add-task.component';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-tasks',
  imports: [SharedModule, AssigneeTaskListComponent],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.css',
  providers:[MessageService, ConfirmationService]
})
export class TasksComponent implements OnInit {
  readonly ASSIGNEE = Assignee;
  subscription: Subscription = new Subscription();
  taskLists: TaskList[] = [];
  tasksCopine?: TaskList;
  tasksCopain?: TaskList;
  tasks?: Task[];
  unassignedTasks?: TaskList;
  
  constructor(private taskPeriodService: TaskPeriodService, private taskListService: TaskListService, private dialog: DialogService, private taskService: TaskService, private messageService: MessageService, private router: Router, private confirmationService: ConfirmationService, private dialogService: DialogService){}

  ngOnInit(): void {
    this.retrieveTasks();
  }

  retrieveTasks(){
    this.subscription.add(this.taskService.retrieveTasks()
    .subscribe(tasks => {
      this.tasks = tasks;

      this.subscription.add(this.taskListService.retrieveTaskList(Assignee.Felix).subscribe((taskLists) => {
        const newTaskList: TaskList = {
          assignee: Assignee.Felix,
          tasks: [],
          id: taskLists.find((taskList) => taskList.assignee === Assignee.Felix)?.id,
        }
        for(const taskList of taskLists){
          newTaskList.tasks!.push(...taskList.tasks!);
        }
        this.tasksCopain = newTaskList;
  
        
  
        this.subscription.add(this.taskListService.retrieveTaskList(Assignee.Camille).subscribe((taskLists) => {
          const newTaskList: TaskList = {
            assignee: Assignee.Camille,
            tasks: [],
            id: taskLists.find((taskList) => taskList.assignee === Assignee.Camille)?.id,
          }
          for(const taskList of taskLists){
            newTaskList.tasks!.push(...taskList.tasks!);
          }
          this.tasksCopine = newTaskList;
          this.generateUnassignedTasks();
        }))
      }))
    }));
  }

  unassign({ element, taskList }: any){
    this.taskListService.deleteTaskList({ taskListId: taskList?.id, assignee: taskList?.assignee, taskId: element.id }).subscribe(resp => {
      switch(taskList?.assignee){
        case Assignee.Felix: 
          this.tasksCopain = resp;
          break;
        case Assignee.Camille:
          this.tasksCopine = resp;
          break;
      }
    });
  }

  create(){
    const dialogRef = this.dialog.open(TaskAssignmentDialogComponent, {
      header: 'Assigner des tâches',
      width: '30vw',
      dismissableMask: true,
      modal:true,
      breakpoints: {
 '1199px': '75vw', '575px': '90vw'
      },
    });  

    dialogRef.onClose.subscribe((taskPeriod: TaskPeriod) => {
      this.retrieveTasks();
    });
  }
  
  displayedColumns = [ "title", "description", "delete"]
  dataSource = new MatTableDataSource<Task>();
  

    items(row: any) {
      return [
      ];
    }

    generateUnassignedTasks(){
      const assignedTasks: Task[] = [];
      assignedTasks.push(...this.tasksCopain?.tasks!);
      assignedTasks.push(...this.tasksCopine?.tasks!);
      const unassignedTasks = this.tasks?.filter((task) => !assignedTasks.some((assignedTask) => assignedTask.id === task.id));
      this.unassignedTasks = {
        assignee: Assignee.Unassigned,
        tasks: unassignedTasks
      }
    }

      openNewTaskDialog(task: any | null = null){
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
  
    deleteTask({event, element}: any){
      if(!element.id) return;
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
          this.subscription.add(this.taskService.deleteTask(element.id).subscribe(() => { 
            this.retrieveTasks() 
            this.messageService.add({ severity: 'info', summary: 'Confirmed', detail: 'La tâche a bien été supprimée' });
          }));
        },
        reject: () => {
        },
    });
    }
}
