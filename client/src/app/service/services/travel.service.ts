import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';
import { HouseholdService } from '../household.service';

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
  departureDate: string;
  items: TripItem[];
  completed: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TravelService {
  private http = inject(HttpClient);
  private householdService = inject(HouseholdService);

  private resolveHouseholdId(householdId?: number | null): number {
    if (householdId && !isNaN(Number(householdId))) {
      return Number(householdId);
    }
    const current = this.householdService.getCurrentHousehold();
    return current?.id || 1;
  }

  private getBaseUrl(): string {
    return environment.apiUrl.endsWith('/') ? environment.apiUrl : `${environment.apiUrl}/`;
  }

  private getApiUrl(householdId?: number | null): string {
    const id = this.resolveHouseholdId(householdId);
    return `${this.getBaseUrl()}api/households/${id}/travel`;
  }

  // --- Modèles par défaut ---
  getTemplate(householdId?: number | null): Observable<TravelTemplateItem[]> {
    return this.http.get<TravelTemplateItem[]>(`${this.getApiUrl(householdId)}/template`);
  }

  addTemplateItem(householdId: number | null | undefined, item: TravelTemplateItem): Observable<TravelTemplateItem> {
    return this.http.post<TravelTemplateItem>(`${this.getApiUrl(householdId)}/template`, item);
  }

  deleteTemplateItem(householdId: number | null | undefined, itemId: number): Observable<void> {
    return this.http.delete<void>(`${this.getApiUrl(householdId)}/template/${itemId}`);
  }

  // --- Voyages & Bagages ---
  getTrips(householdId?: number | null): Observable<Trip[]> {
    return this.http.get<Trip[]>(`${this.getApiUrl(householdId)}/trips`);
  }

  createTrip(householdId: number | null | undefined, destination: string, departureDate: string): Observable<Trip> {
    return this.http.post<Trip>(`${this.getApiUrl(householdId)}/trips`, { destination, departureDate });
  }

  deleteTrip(householdId: number | null | undefined, tripId: number): Observable<void> {
    return this.http.delete<void>(`${this.getApiUrl(householdId)}/trips/${tripId}`);
  }

  addTripItem(householdId: number | null | undefined, tripId: number, item: { name: string; category: string }): Observable<TripItem> {
    return this.http.post<TripItem>(`${this.getApiUrl(householdId)}/trips/${tripId}/items`, item);
  }

  updateTripItem(householdId: number | null | undefined, tripId: number, itemId: number, itemChanges: Partial<TripItem>): Observable<TripItem> {
    return this.http.put<TripItem>(`${this.getApiUrl(householdId)}/trips/${tripId}/items/${itemId}`, itemChanges);
  }

  deleteTripItem(householdId: number | null | undefined, tripId: number, itemId: number): Observable<void> {
    return this.http.delete<void>(`${this.getApiUrl(householdId)}/trips/${tripId}/items/${itemId}`);
  }
}