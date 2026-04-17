import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environment';
import { Meal } from '../model/meals';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MealService {
  readonly baseUrl: string = `${environment.apiUrl}meals`;

  constructor(private http: HttpClient) { }
    
  getAllMeals() {
    return this.http.get<Meal[]>(`${this.baseUrl}`);
  }
  
  getMealById(id: number) {
    return this.http.get<Meal>(`${this.baseUrl}/${id}`);
  }
  
  addMeal(meal: Meal) {
    return this.http.post<Meal>(`${this.baseUrl}`, meal);
  }
  
  updateMeal(meal: Meal) {
    return this.http.put<Meal>(`${this.baseUrl}/${meal.id}`, meal);
  }
  
  deleteMeal(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
  
  getMealsByDateRange(startDate: number, endDate: number) {
    return this.http.post<Meal[]>(`${this.baseUrl}/by-date-range`, { startDate, endDate });
  }
  
  getMealByDate(date: Date){
    return this.http.get<Meal>(`${this.baseUrl}/by-date/${date}`);
  }

  moveMeal(meal: Meal, date: Date) {
    return this.http.put<Meal>(`${this.baseUrl}/${meal.id}/move`, date );
  }

  swapMeal(meal: Meal, date: Date) {
    return this.http.put<Meal>(`${this.baseUrl}/${meal.id}/swap`, date );
  }

  assignMeal(meal: Meal, assigneeId: number) {
    return this.http.post<Meal>(`${this.baseUrl}/${meal.id}/assign/${assigneeId}`, {});
  }

  saveMultipleMeals(meals: Meal[]): Observable<Meal[]> {
    return this.http.post<Meal[]>(`${this.baseUrl}/bulk`, meals);
  }
}