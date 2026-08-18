import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environment';
import { FoodIntakeUnit, FoodIntakeUnitGoal } from '../food-intake-tracking-dashboard/food-intake-tracking-dashboard.component';

@Injectable({
  providedIn: 'root'
})
export class FoodIntakeService {
  private apiUrl = `${environment.apiUrl}food-intake`;

  constructor(private http: HttpClient) {}

  getIntakeUnits(startDate: string, endDate: string): Observable<FoodIntakeUnit[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<FoodIntakeUnit[]>(this.apiUrl, { params });
  }

  saveIntakeUnit(unit: FoodIntakeUnit): Observable<FoodIntakeUnit> {
    if (unit.id && unit.id.toString().length < 10) {
      return this.http.put<FoodIntakeUnit>(`${this.apiUrl}/${unit.id}`, unit);
    } else {
      return this.http.post<FoodIntakeUnit>(this.apiUrl, unit);
    }
  }

  deleteIntakeUnit(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // --- Goals ---

  /** Returns a map keyed by ISO date string (e.g. "2026-08-18") -> resolved goal for that day. */
  getGoals(assigneeId: number, startDate: string, endDate: string): Observable<Record<string, FoodIntakeUnitGoal>> {
    const params = new HttpParams()
      .set('assigneeId', assigneeId)
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<Record<string, FoodIntakeUnitGoal>>(`${this.apiUrl}/goals`, { params });
  }

  /** Always applies from today forward server-side, regardless of what date is passed in. */
  upsertGoal(goal: FoodIntakeUnitGoal): Observable<FoodIntakeUnitGoal> {
    return this.http.put<FoodIntakeUnitGoal>(`${this.apiUrl}/goals`, goal);
  }
}