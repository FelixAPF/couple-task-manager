import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environment';
import { WayToCare } from '../model/household';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WaysToCareService {
  readonly baseUrl: string = `${environment.apiUrl}ways-to-care`;
  
  constructor(private http: HttpClient) { }

  retrieveWaysToCare(): Observable<WayToCare[]> { // Add return type
    return this.http.get<WayToCare[]>(this.baseUrl);
  }

  // --- ADD CRUD METHODS ---

  /**
   * Creates a new WayToCare item.
   * The backend should associate this with the currently logged-in user.
   * @param item - The WayToCare item data (assignee will be set by backend).
   * @returns Observable<WayToCare> - The created item including its ID.
   */
  createWayToCare(item: Omit<WayToCare, 'id' | 'assignee'>): Observable<WayToCare> {
    // Send only necessary data; backend handles assignee and ID
    return this.http.post<WayToCare>(this.baseUrl, item);
  }

  /**
   * Updates an existing WayToCare item.
   * The backend should verify ownership before updating.
   * @param item - The WayToCare item with updated data and its ID.
   * @returns Observable<WayToCare> - The updated item.
   */
  updateWayToCare(item: WayToCare): Observable<WayToCare> {
    if (item.id == null) {
      throw new Error('Cannot update WayToCare without an ID.');
    }
    // Send the whole item, backend should verify ownership based on ID and logged-in user
    return this.http.put<WayToCare>(`${this.baseUrl}/${item.id}`, item);
  }

  /**
   * Deletes a WayToCare item by its ID.
   * The backend should verify ownership before deleting.
   * @param id - The ID of the item to delete.
   * @returns Observable<void>
   */
  deleteWayToCare(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
