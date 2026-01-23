import { Injectable } from '@angular/core';
import { environment } from '../environment';
import { HttpClient } from '@angular/common/http';
import { TaskListOccasion } from '../model/task-list-occasion';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TaskListOccasionService {
  private apiUrl = `${environment.apiUrl}task-list-occasions`;

  constructor(private http: HttpClient) { }

  list(): Observable<TaskListOccasion[]> {
    return this.http.get<TaskListOccasion[]>(this.apiUrl);
  }

  create(name: string): Observable<TaskListOccasion> {
    // ID is ignored/handled by backend, but we pass 0 or null logic as needed. 
    // Passing 0 and backend forcing ID=null is a safe bet based on our fixes.
    return this.http.post<TaskListOccasion>(this.apiUrl, { id: 0, name: name });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  addTaskAssignment(occasionId: number, taskId: number, assigneeId: number): Observable<void> {
    // Sending assigneeId wrapped in an object or directly depending on your final controller fix.
    // Based on the controller fix `createAndAddTaskAssignment`, we send a POST
    return this.http.post<void>(`${this.apiUrl}/${occasionId}/add-task/${taskId}`, { assigneeId });
  }

  removeTaskAssignment(occasionId: number, taskId: number, assigneeId: number): Observable<void> {
    // Sending assigneeId wrapped in an object or directly depending on your final controller fix.
    // Based on the controller fix `createAndAddTaskAssignment`, we send a POST
    return this.http.delete<void>(`${this.apiUrl}/${occasionId}/tasks/${taskId}/assignee/${assigneeId}`)
  }
}