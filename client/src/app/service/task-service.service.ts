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


  retrieveTasksNotDoneInLongTime(): Observable<TaskWithCompletedDate[]> {
    return this.http.get<TaskWithCompletedDate[]>(`${this.baseUrl}/not-completed-in-long-time`);
  }


  saveTask(task: TaskCreationRqst): Observable<void>{
    return this.http.post<void>(`${this.baseUrl}/create`, task);
  }

  update(task: Task): Observable<Task> {
    return this.http.put<Task>(`${this.baseUrl}/${task.id}`, task);
  }
  claimTask(taskId: number): Observable<Task> {
    return this.http.post<Task>(`${this.baseUrl}/${taskId}/claim`, {});
  }

  unclaimTask(taskId: number): Observable<Task> {
    return this.http.post<Task>(`${this.baseUrl}/${taskId}/unclaim`, {});
  }

  deleteTask(id: number): Observable<void>{
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  sendThankYou(historyId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/history/${historyId}/thank`, {});
  }

  getUnseenThanks(): Observable<TaskHistoryDto[]> {
    return this.http.get<TaskHistoryDto[]>(`${this.baseUrl}/history/unseen-thanks`);
  }

  markThanksAsSeen(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/history/mark-thanks-seen`, {});
  }

  retrieveTaskByAssignee(assigneeId: number, frequency: Frequency): Observable<TaskAssignmentDto[]> {
    const options = { params: new HttpParams().set('frequency', frequency) };
    const dueDate = addTimeToCurrentDate(new Date(), 0, 0, 1);
    return this.http.get<TaskAssignmentDto[]>(`${this.baseUrl}/by-assignee/${assigneeId}/${dueDate}`, options);
  }

  quickComplete(taskId: number, assigneeId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${taskId}/complete`,  ({ taskId, assigneeId })).pipe(tap(() => {
      this.confettiService.fireConfetti();
    }));
  }

  retrieveTaskHistory(taskId: number): Observable<TaskHistoryDto> {
    return this.http.get<TaskHistoryDto>(`${this.baseUrl}/${taskId}/history`);
  }

  reassignTask(assignmentId: number, newAssigneeId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/reassign/${assignmentId}`, newAssigneeId);
  }

getDashboardTasks(horizon: string = 'MONTH'): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.baseUrl}/dashboard?horizon=${horizon}`);
  }

  completeTask(taskId: number): Observable<Task> {
    return this.http.post<Task>(`${this.baseUrl}/${taskId}/complete`, {});
  }

  getTodayHistory(): Observable<TaskHistoryDto[]> {
    return this.http.get<TaskHistoryDto[]>(`${this.baseUrl}/history/today`);
  }

  skipTask(taskId: number): Observable<Task> {
    return this.http.post<Task>(`${this.baseUrl}/${taskId}/skip`, {});
  }

  rescheduleTask(taskId: number, newDueDate: Date): Observable<Task> {
    return this.http.put<Task>(`${this.baseUrl}/${taskId}/reschedule`, { newDueDate });
  }
  getTaskHistory(taskId: number): Observable<TaskHistoryDto[]> {
    return this.http.get<TaskHistoryDto[]>(`${this.baseUrl}/${taskId}/history`);
  }
}
