import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment';

export interface AdminMetricDto {
  householdName: string;
  numberOfUsers: number;
  numberOfRecipes: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  constructor(private http: HttpClient) {}

  getMetrics(): Observable<AdminMetricDto[]> {
    return this.http.get<AdminMetricDto[]>(`${environment.apiUrl}admin/metrics`);
  }
}