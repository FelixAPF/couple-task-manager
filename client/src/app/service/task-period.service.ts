import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PeriodCreationRequest, TaskPeriod } from '../model/task-period';
import { Observable } from 'rxjs';
import { environment } from '../environment';

@Injectable({
  providedIn: 'root'
})
export class TaskPeriodService {
  readonly baseUrl = `${environment.apiUrl}task-periods`;

  constructor(private http: HttpClient) { }

  createTaskPeriod(taskPeriod: TaskPeriod): Observable<void>{
    return this.http.post<void>(this.baseUrl, taskPeriod);
  }

  initiateCreatePeriod(creationRqst: PeriodCreationRequest): Observable<void>{
    return this.http.post<void>(`${this.baseUrl}/creation`, creationRqst);
  }

  retrieveTaskPeriods(){
    return this.http.get<TaskPeriod[]>(this.baseUrl);
  }

  retrieveTaskPeriodsIncomplete(){
    return this.http.get<TaskPeriod[]>(`${this.baseUrl}/incomplete`);
  }

  deleteTaskPeriod(id?: number){
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
