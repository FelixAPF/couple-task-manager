import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Task } from '../model/task';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  constructor(private http: HttpClient) { }

  retrieveTask(): Observable<Task> {
    return this.http.get<Task>("http://localhost:8080/task/test-connection");
  }
}
