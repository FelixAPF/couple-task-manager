import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TaskPeriod } from '../model/task-period';
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

  retrieveTaskPeriods(){
    return this.http.get<TaskPeriod[]>(this.baseUrl);
  }

  deleteTaskPeriod(id?: number){
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
