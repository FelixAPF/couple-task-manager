import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Task } from '../model/task';
import { HttpClient } from '@angular/common/http';
import { Assignee, TaskAssignment, TaskPeriod } from '../model/task-period';
import { environment } from '../environment';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  readonly baseUrl: string = `${environment.apiUrl}tasks`;
  constructor(private http: HttpClient) { }


  retrieveTask(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.baseUrl}/${id}`);
  }

  retrieveTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(this.baseUrl);
  }

  retrieveTasksByDate(date: Date): Observable<Task[]> {
    return this.http.post<Task[]>(`${this.baseUrl}/by-date`, date);
  }

  retrieveCurrentPeriodDate(){
    return this.retrieveTasksByDate(new Date());
  }

  saveTask(task: Task): Observable<void>{
    return this.http.post<void>(this.baseUrl, task);
  }

  completeTask(assignmentId: number): Observable<void>{
    return this.http.post<void>(`${this.baseUrl}/complete-assignment`, assignmentId);
  }

  deleteTask(id: number): Observable<void>{
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  retrieveTaskByAssignee(assignee: Assignee): Observable<TaskAssignment[]> {
    return this.http.get<TaskAssignment[]>(`${this.baseUrl}/by-assignee/${assignee}`);
  }
  
}
