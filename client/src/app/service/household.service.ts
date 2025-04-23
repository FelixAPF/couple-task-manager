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

  updateMemberImage(memberId: number, imageFile: File): Observable<{ url: string, message: string }> {
    const formData = new FormData();
    // Ensure the key 'file' matches your backend expectation
    formData.append('file', imageFile, imageFile.name);

    // Expect ImageUploadResponse from the backend
    return this.http.post<{ url: string, message: string }>(`${environment.apiUrl}files/household/${memberId}/image`, formData)
      .pipe(
        tap(response => { // response is now { url: string, message: string }
          // Update local state optimistically
          const currentHousehold = this.householdSubject.getValue();
          if (currentHousehold && currentHousehold.members) {
            const memberIndex = currentHousehold.members.findIndex(m => m.id === memberId);

            if (memberIndex !== -1) {
              // Get the original member object
              const originalMember = currentHousehold.members[memberIndex];

              // Create a *new* member object with the updated imageUrl
              const updatedMember: HouseholdMember = {
                ...originalMember, // Spread existing properties
                imageUrl: response.url // Update the imageUrl from the response
              };

              // Create a new members array with the updated member
              const updatedMembers = [
                ...currentHousehold.members.slice(0, memberIndex),
                updatedMember, // Insert the modified member object
                ...currentHousehold.members.slice(memberIndex + 1)
              ];

              // Emit a new household object with the updated members list
              this.householdSubject.next({ ...currentHousehold, members: updatedMembers });
              console.log(`Member ${memberId} image updated locally. Message: ${response.message}`);

            } else {
               console.warn(`Member ${memberId} not found in current household state during image update.`);
            }
          }
        })
      );
  }
  
  getCurrentMembers(): HouseholdMember[] | null {
    const currentHousehold = this.householdSubject.getValue();
    return currentHousehold?.members ?? null;
  }
}
