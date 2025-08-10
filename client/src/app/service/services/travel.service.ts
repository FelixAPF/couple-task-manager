import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';

// Define interfaces for your data models
export interface TravelTemplateItem {
  id?: number;
  name: string;
  category: string;
}

export interface TripItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  included: boolean;
  packed: boolean;
}

export interface Trip {
  id: number;
  destination: string;
  departureDate: string; // ISO date string
  items: TripItem[];
  completed: boolean;
}


@Injectable({
  providedIn: 'root'
})
export class TravelService {
  private getApiUrl(householdId: number) {
    return `${environment.apiUrl}api/households/${householdId}/travel`;
  }

  constructor(private http: HttpClient) { }

  // Template Methods
  getTemplate(householdId: number): Observable<TravelTemplateItem[]> {
    return this.http.get<TravelTemplateItem[]>(`${this.getApiUrl(householdId)}/template`);
  }

  addTemplateItem(householdId: number, item: TravelTemplateItem): Observable<TravelTemplateItem> {
    return this.http.post<TravelTemplateItem>(`${this.getApiUrl(householdId)}/template`, item);
  }

  // Trip Methods
  getTrips(householdId: number): Observable<Trip[]> {
    return this.http.get<Trip[]>(`${this.getApiUrl(householdId)}/trips`);
  }

  createTrip(householdId: number, destination: string, departureDate: string): Observable<Trip> {
    return this.http.post<Trip>(`${this.getApiUrl(householdId)}/trips`, { destination, departureDate });
  }

    /**
   * Updates a specific item within a trip.
   */
  updateTripItem(householdId: number, tripId: number, itemId: number, itemChanges: Partial<TripItem>): Observable<TripItem> {
    const url = `${this.getApiUrl(householdId)}/trips/${tripId}/items/${itemId}`;
    return this.http.put<TripItem>(url, itemChanges);
  }

  /**
   * Adds a new item to a specific trip (not the template).
   */
  addTripItem(householdId: number, tripId: number, item: { name: string; category: string }): Observable<TripItem> {
    const url = `${this.getApiUrl(householdId)}/trips/${tripId}/items`;
    return this.http.post<TripItem>(url, item);
  }

  deleteTrip(householdId: number, tripId: number) {
    const url = `${this.getApiUrl(householdId)}/trips/${tripId}`;
    return this.http.delete(url);
  }

  /**
   * Deletes an item from a specific trip.
   */
  deleteTripItem(householdId: number, tripId: number, itemId: number): Observable<any> {
    const url = `${this.getApiUrl(householdId)}/trips/${tripId}/items/${itemId}`;
    return this.http.delete(url);
  }
}