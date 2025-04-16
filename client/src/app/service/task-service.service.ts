import { Injectable, OnDestroy } from '@angular/core';
import { Observable, of, Subscription, tap } from 'rxjs';
import { Frequency, Task, TaskCreationRqst, TaskWithCompletedDate } from '../model/task';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Assignee, TaskAssignment, TaskAssignmentDto, TaskPeriod } from '../model/task-period';
import { environment } from '../environment';
import { addTimeToCurrentDate } from '../utils/DateUtils';
import { TaskHistoryDto } from '../model/task-history';
import { ConfettiService } from './confetti.service';

@Injectable({
  providedIn: 'root'
})
export class TaskService implements OnDestroy {
  readonly baseUrl: string = `${environment.apiUrl}tasks`;
  subscription: Subscription = new Subscription();
  constructor(private http: HttpClient, private confettiService: ConfettiService) { }
  tasks: Observable<Task[]> = of([]);

  
  getTaskAssignmentsByDate(completedDate: Date) {
    return this.http.get<TaskAssignmentDto[]>(`${this.baseUrl}/by-date/${completedDate}`);
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  retrieveTask(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.baseUrl}/${id}`);
  }

  retrieveTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(this.baseUrl);
  }

  retrieveTaskAssignmentsByTaskId(taskId: number): Observable<TaskAssignment[]> {
    return this.http.get<TaskAssignment[]>(`${this.baseUrl}/${taskId}/assignments-by-id`);
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

  saveTask(task: TaskCreationRqst): Observable<void>{
    return this.http.post<void>(`${this.baseUrl}/create`, task);
  }

  completeTask(assignmentId: number): Observable<void>{
    return this.http.post<void>(`${this.baseUrl}/complete-assignment/${assignmentId}`, {}).pipe(tap(() => {
      this.confettiService.fireBasicConfetti();
    }));
  }

  deleteTask(id: number): Observable<void>{
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  retrieveTaskByAssignee(assignee: Assignee, frequency: Frequency): Observable<TaskAssignmentDto[]> {
    const options = { params: new HttpParams().set('frequency', frequency) };
    const dueDate = addTimeToCurrentDate(new Date(), 0, 0, 1);
    return this.http.get<TaskAssignmentDto[]>(`${this.baseUrl}/by-assignee/${assignee}/${dueDate}`, options);
  }

  quickComplete(taskId: number, assignee: Assignee): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/quick-complete/${taskId}`,  ({ taskId, assignee })).pipe(tap(() => {
      this.confettiService.fireConfetti();
    }));
  }

  retrieveTaskHistory(taskId: number): Observable<TaskHistoryDto> {
    return this.http.get<TaskHistoryDto>(`${this.baseUrl}/${taskId}/history`);
  }
  
}
