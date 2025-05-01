import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environment';
import { HouseholdMember, Item } from '../model/household';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WishListService {
  readonly baseUrl: string = `${environment.apiUrl}wish-list`;
  
  constructor(private http: HttpClient) { }

  retrieveWaysToCare(): Observable<Item[]> { // Add return type
    return this.http.get<Item[]>(this.baseUrl);
  }

  createWishListItem(item: Omit<Item, 'householdMember'>): Observable<Item> {
    // Send only necessary data; backend handles assignee and ID
    return this.http.post<Item>(this.baseUrl, item);
  }
  
  updateWishListItem(item: Item, assignee: HouseholdMember | null): Observable<Item> {
    if (item.id == null) {
      throw new Error('Cannot update wish list item without an ID.');
    }
    if(assignee == null){
      throw new Error('Cannot update wish list item without an assignee.');
    }
    // Send the whole item, backend should verify ownership based on ID and logged-in user
    return this.http.put<Item>(`${this.baseUrl}/${item.id}`, { ...item, assignee});
  }

  deleteWishListItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
