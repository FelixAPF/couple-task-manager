import { Injectable } from '@angular/core';
import { TaskAssignment } from '../model/task-period';
import { BehaviorSubject, Observable } from 'rxjs';
import { TaskWithAssignee } from '../create-period-dialog/create-period-dialog.component';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environment';

@Injectable({
  providedIn: 'root'
})
export class TaskAssignmentService {
  readonly baseUrl: string = `${environment.apiUrl}task-assignments`;

  taskAssignments: BehaviorSubject<TaskWithAssignee[]> = new BehaviorSubject<TaskWithAssignee[]>([]);

  constructor(private http: HttpClient) { }

  setTaskAssignments(tasks: TaskWithAssignee[]) {
    this.taskAssignments.next(tasks);
  }

  getTaskAssignments(): Observable<TaskWithAssignee[] | null> {
    return this.taskAssignments.asObservable();
  }


  reassignTask(assignmentId: number, newAssigneeId: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${assignmentId}/reassign/${newAssigneeId}`, {});
  }

  deleteTaskAssignment(assignmentId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${assignmentId}`)
  }
}
