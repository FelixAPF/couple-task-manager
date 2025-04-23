import { Injectable } from '@angular/core';
import { environment } from '../environment';
import { HttpClient } from '@angular/common/http';
import { TaskList, TaskListRequest } from '../model/task-list';
import { Assignee, BasicTaskAssignmentRqst } from '../model/task-period';
import { Observable } from 'rxjs';
import { Task } from '../model/task';
import { TaskWithAssignee } from '../create-period-dialog/create-period-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class TaskListService {
  readonly baseUrl: string = `${environment.apiUrl}task-list`;
  constructor(private http: HttpClient) { }


  retrieveTaskList(assigneeUserId: number): Observable<TaskList[]> {
    return this.http.get<TaskList[]>(`${this.baseUrl}/by-assignee/${assigneeUserId}`);
  }

  retrieveTaskLists(): Observable<TaskList[]> {
    return this.http.get<TaskList[]>(this.baseUrl);
  }

  saveTaskList(taskList: TaskList): Observable<void>{
    return this.http.post<void>(this.baseUrl, taskList);
  }

  assignTaskToAssigneeList(taskId: number, newAssignee: Assignee): Observable<void>{
    return this.http.post<void>(`${this.baseUrl}/move/${taskId}/${newAssignee}`, {});
  }

  saveTasksToExistingTaskList(basicTaskAssignmentRqst: BasicTaskAssignmentRqst[]): Observable<void>{
    return this.http.post<void>(`${this.baseUrl}/assign`, basicTaskAssignmentRqst);
  }

  deleteTaskList(taskList: TaskListRequest): Observable<TaskList>{
    return this.http.post<TaskList>(`${this.baseUrl}/unassign`, taskList);
  }

  retrieveWithUnassigned(): Observable<TaskList[]> {
    console.log('retrieveWithUnassigned called');
    return this.http.get<TaskList[]>(`${this.baseUrl}/with-unassigned`);
  }

}
