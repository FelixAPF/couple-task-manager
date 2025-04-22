import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environment';
import { Household } from '../model/household';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HouseholdService {
  readonly baseUrl: string = `${environment.apiUrl}household`;
  
  private householdSubject = new BehaviorSubject<Household | null>(null);
  // Expose the login state as an observable
  public household$: Observable<Household | null> = this.householdSubject.asObservable();

  constructor(private http: HttpClient) { }

  retrieveHousehold() {
    return this.http.get<Household>(`${this.baseUrl}`);
  }

  setHousehold(household: Household | null) {
    this.householdSubject.next(household);
  }

  joinHousehold(joinKey: string) {
    return this.http.post<Household>(`${this.baseUrl}/join`, joinKey).pipe(
      tap(joinedHousehold => {
        // Update the shared household state upon successful join
        this.setHousehold(joinedHousehold);
        console.log('Successfully joined household:', joinedHousehold);
      })
    );;
  }
}
