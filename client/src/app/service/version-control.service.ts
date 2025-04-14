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
export class VersionControlService {
  readonly baseUrl: string = `${environment.apiUrl}version`;
  
  constructor(private http: HttpClient) { }
  
  retrieveVersion(): Observable<string> {
    return this.http.get<string>(this.baseUrl);
  }
}
