import { Injectable, OnDestroy } from '@angular/core';
import { Observable, of, Subscription } from 'rxjs';
import { Frequency, Task, TaskWithCompletedDate } from '../model/task';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Assignee, TaskAssignment, TaskAssignmentDto, TaskPeriod } from '../model/task-period';
import { environment } from '../environment';
import { addTimeToCurrentDate } from '../utils/DateUtils';

@Injectable({
  providedIn: 'root'
})
export class TaskService implements OnDestroy {
  readonly baseUrl: string = `${environment.apiUrl}tasks`;
  subscription: Subscription = new Subscription();
  constructor(private http: HttpClient) { }
  tasks: Observable<Task[]> = of([]);

  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  retrieveTask(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.baseUrl}/${id}`);
  }

  retrieveTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(this.baseUrl);
  }

  retrieveTasksByDate(date: Date): Observable<Task[]> {
    return this.http.post<Task[]>(`${this.baseUrl}/by-date`, date);
  }

  retrieveTasksNotDoneInLongTime(): Observable<TaskWithCompletedDate[]> {
    return this.http.get<TaskWithCompletedDate[]>(`${this.baseUrl}/not-completed-in-long-time`);
  }

  retrieveCurrentPeriodDate(){
    return this.retrieveTasksByDate(new Date());
  }

  saveTask(task: Task): Observable<void>{
    return this.http.post<void>(this.baseUrl, task);
  }

  completeTask(assignmentId: number): Observable<void>{
    return this.http.post<void>(`${this.baseUrl}/complete-assignment/${assignmentId}`, {});
  }

  deleteTask(id: number): Observable<void>{
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  retrieveTaskByAssignee(assignee: Assignee, frequency: Frequency): Observable<TaskAssignmentDto[]> {
    const options = { params: new HttpParams().set('frequency', frequency) };
    const dueDate = addTimeToCurrentDate(new Date(), 0, 0, 1);
    return this.http.get<TaskAssignmentDto[]>(`${this.baseUrl}/by-assignee/${assignee}/${dueDate}`, options);
  }
  
}
