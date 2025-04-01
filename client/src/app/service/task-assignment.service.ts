import { Injectable } from '@angular/core';
import { TaskAssignment } from '../model/task-period';
import { BehaviorSubject, Observable } from 'rxjs';
import { TaskWithAssignee } from '../create-period-dialog/create-period-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class TaskAssignmentService {
  taskAssignments: BehaviorSubject<TaskWithAssignee[]> = new BehaviorSubject<TaskWithAssignee[]>([]);

  constructor() { }

  setTaskAssignments(tasks: TaskWithAssignee[]) {
    this.taskAssignments.next(tasks);
  }

  getTaskAssignments(): Observable<TaskWithAssignee[] | null> {
    return this.taskAssignments.asObservable();
  }
}
