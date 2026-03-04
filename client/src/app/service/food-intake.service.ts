import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
 // Ensure path points to your component
import { environment } from '../environment';
import { FoodIntakeUnit } from '../food-intake-tracking-dashboard/food-intake-tracking-dashboard.component';

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
    // If the ID is a true number or string from DB, do a PUT. If it's a temporary timestamp (has length > 10 usually), do a POST
    if (unit.id && unit.id.toString().length < 10) { 
      return this.http.put<FoodIntakeUnit>(`${this.apiUrl}/${unit.id}`, unit);
    } else {
      return this.http.post<FoodIntakeUnit>(this.apiUrl, unit);
    }
  }

  deleteIntakeUnit(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}