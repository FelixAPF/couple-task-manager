import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environment';
import { Observable } from 'rxjs';

export interface TaskGroup {
    id?: number;
    name: string;
    tasks: any[];
}

@Injectable({ providedIn: 'root' })
export class TaskGroupService {
    private apiUrl = `${environment.apiUrl}task-groups`;

    constructor(private http: HttpClient) {}

    getGroups(): Observable<TaskGroup[]> {
        return this.http.get<TaskGroup[]>(this.apiUrl);
    }

    createGroup(name: string, taskIds: number[]): Observable<TaskGroup> {
        return this.http.post<TaskGroup>(this.apiUrl, { name, taskIds });
    }

    deleteGroup(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    triggerGroup(id: number, targetDate: Date): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/${id}/trigger`, { targetDate });
    }

    updateGroup(id: number, name: string, taskIds: number[]): Observable<TaskGroup> {
        return this.http.put<TaskGroup>(`${this.apiUrl}/${id}`, { name, taskIds });
    }
}