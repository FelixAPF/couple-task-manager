import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environment';
import { Household, HouseholdMember } from '../model/household';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';

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
    if(this.getCurrentHousehold()) {
      return of(this.getCurrentHousehold());
    }
    return this.http.get<Household>(`${this.baseUrl}`).pipe(
      tap(household => {
        this.setHousehold(household);
      })
    );
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

  getCurrentHousehold(){
    return this.householdSubject.value;
  }

  updateMemberImage(memberId: number, imageFile: File): Observable<HouseholdMember> {
    const formData = new FormData();
    formData.append('file', imageFile, imageFile.name);

    // Assuming interceptor adds Auth header
    return this.http.post<HouseholdMember>(`${environment.apiUrl}files/household/${memberId}/image`, formData) // Adjusted endpoint based on previous code
      .pipe(
        tap(updatedMember => {
          // Update local state
          const currentHousehold = this.householdSubject.getValue();
          if (currentHousehold && currentHousehold.members) {
            const memberIndex = currentHousehold.members.findIndex(m => m.id === memberId);
            if (memberIndex !== -1) {
              const updatedMembers = [
                ...currentHousehold.members.slice(0, memberIndex),
                updatedMember,
                ...currentHousehold.members.slice(memberIndex + 1)
              ];
              this.householdSubject.next({ ...currentHousehold, members: updatedMembers });
            }
          }
          console.log('Member image updated successfully:', updatedMember);
        })
      );
  }
  
  getCurrentMembers(): HouseholdMember[] | null {
    const currentHousehold = this.householdSubject.getValue();
    return currentHousehold?.members ?? null;
  }
}
