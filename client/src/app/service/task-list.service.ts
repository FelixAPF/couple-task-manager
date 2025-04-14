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


  retrieveTaskList(assignee: Assignee): Observable<TaskList[]> {
    return this.http.get<TaskList[]>(`${this.baseUrl}/by-assignee/${assignee}`);
  }

  retrieveTaskLists(): Observable<TaskList[]> {
    return this.http.get<TaskList[]>(this.baseUrl);
  }

  saveTaskList(taskList: TaskList): Observable<void>{
    return this.http.post<void>(this.baseUrl, taskList);
  }

  saveTasksToExistingTaskList(basicTaskAssignmentRqst: BasicTaskAssignmentRqst[]): Observable<void>{
    return this.http.post<void>(`${this.baseUrl}/assign`, basicTaskAssignmentRqst);
  }

  deleteTaskList(taskList: TaskListRequest): Observable<TaskList>{
    return this.http.post<TaskList>(`${this.baseUrl}/unassign`, taskList);
  }

  retrieveWithUnassigned(): Observable<TaskList[]> {
    return this.http.get<TaskList[]>(`${this.baseUrl}/with-unassigned`);
  }

}
