import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environment';
import { 
  Household, 
  HouseholdMember, 
  HouseholdStatsDto, 
  TopMealDto,
  MemberTaskStatDto,
  MemberChefStatDto,
  UpdateHouseholdSettings 
} from '../model/household';
import { BehaviorSubject, map, Observable, of, tap } from 'rxjs';

// Use 'export type' for isolatedModules compatibility
export type { 
  HouseholdStatsDto, 
  TopMealDto, 
  MemberTaskStatDto, 
  MemberChefStatDto 
};

@Injectable({
  providedIn: 'root'
})
export class HouseholdService {
  readonly baseUrl: string = `${environment.apiUrl}household`;
  private householdSubject = new BehaviorSubject<Household | null>(null);

  public household$: Observable<Household | null> = this.householdSubject.asObservable();
  public currentUser$: Observable<HouseholdMember | null> = this.household$.pipe(map(household => household?.currentUser ?? null));

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
        this.setHousehold(joinedHousehold);
      })
    );
  }

  getHouseholdStats(period: 'WEEK' | 'MONTH' | 'YEAR' = 'YEAR', year?: number): Observable<HouseholdStatsDto> {
    let params = `period=${period}`;
    if (year) {
      params += `&year=${year}`;
    }
    return this.http.get<HouseholdStatsDto>(`${this.baseUrl}/stats?${params}`);
  }

  getCurrentHousehold(){
    return this.householdSubject.value;
  }

  updateMemberImage(memberId: number, imageFile: File): Observable<{ url: string, message: string }> {
    const formData = new FormData();
    formData.append('file', imageFile, imageFile.name);
    return this.http.post<{ url: string, message: string }>(`${environment.apiUrl}files/household/${memberId}/image`, formData)
      .pipe(
        tap(response => {
          const currentHousehold = this.householdSubject.getValue();
          if (currentHousehold && currentHousehold.members) {
            const memberIndex = currentHousehold.members.findIndex(m => m.id === memberId);
            if (memberIndex !== -1) {
              const originalMember = currentHousehold.members[memberIndex];
              const updatedMember: HouseholdMember = {
                ...originalMember,
                imageUrl: response.url
              };
              const updatedMembers = [
                ...currentHousehold.members.slice(0, memberIndex),
                updatedMember,
                ...currentHousehold.members.slice(memberIndex + 1)
              ];
              this.householdSubject.next({ ...currentHousehold, members: updatedMembers });
            }
          }
        })
      );
  }

  getCurrentMembers(): HouseholdMember[] | null {
    const currentHousehold = this.householdSubject.getValue();
    return currentHousehold?.members ?? null;
  }

  getHouseholdMembersBirthdays(): Observable<(Date | null)[]> {
    return this.householdSubject.pipe(map(household => {
      if (!household) return [];
      return household.members.map(member => {
        return member.birthDay ? new Date(member.birthDay) : null;
      });
    }));
  }

  updateHouseholdSettings(updateHouseholdSettings: UpdateHouseholdSettings): Observable<Household> {
    return this.http.put<Household>(`${this.baseUrl}/settings`, updateHouseholdSettings).pipe(
      tap(updatedHousehold => {
        const household = this.householdSubject.value;
        if(household === null) return;
        this.householdSubject.next({ ...household, ...updatedHousehold });
      })
    );
  }

  changeMemberRewardColor(memberId: number, color: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/members/${memberId}/reward-color`, color);
  }

  increaseMemberRewardPoint(memberId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/members/${memberId}/reward-point`, {});
  }

  resetMemberPoints(memberId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/members/${memberId}/reward-point/reset`, {});
  }
}