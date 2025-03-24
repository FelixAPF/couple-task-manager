import { Injectable } from '@angular/core';
import { environment } from '../environment';
import { HttpClient } from '@angular/common/http';
import { TaskList, TaskListRequest } from '../model/task-list';
import { Assignee } from '../model/task-period';
import { Observable } from 'rxjs';
import { Task } from '../model/task';

@Injectable({
  providedIn: 'root'
})
export class TaskListService {
  readonly baseUrl: string = `${environment.apiUrl}task-list`;
  constructor(private http: HttpClient) { }


  retrieveTaskList(assignee: Assignee): Observable<TaskList> {
    return this.http.get<TaskList>(`${this.baseUrl}/by-assignee/${assignee}`);
  }

  retrieveTaskLists(): Observable<TaskList[]> {
    return this.http.get<TaskList[]>(this.baseUrl);
  }

  saveTaskList(taskList: TaskList): Observable<void>{
    return this.http.post<void>(this.baseUrl, taskList);
  }

  saveTasksToExistingTaskList(assignee: Assignee, tasks: number[]): Observable<void>{
    return this.http.post<void>(`${this.baseUrl}/${assignee}`, tasks);
  }

  deleteTaskList(taskList: TaskListRequest): Observable<TaskList>{
    return this.http.post<TaskList>(`${this.baseUrl}/unassign`, taskList);
  }

}
