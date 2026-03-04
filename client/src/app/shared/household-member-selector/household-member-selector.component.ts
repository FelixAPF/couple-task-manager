import { Component, EventEmitter, inject, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { HouseholdService } from '../../service/household.service';
import { HouseholdMember } from '../../model/household';
import { SharedModule } from '../../shared.module';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-household-member-selector',
  imports: [CommonModule],
  templateUrl: './household-member-selector.component.html',
  styleUrl: './household-member-selector.component.css'
})
export class HouseholdMemberSelectorComponent implements OnInit, OnDestroy {
  private subscription: Subscription = new Subscription();
  private householdService: HouseholdService = inject(HouseholdService);

  householdMembers: HouseholdMember[] = [];
  currentUser: HouseholdMember | null = null;
  selectedUser: HouseholdMember | null = null;
  @Output() householdMemberSelected: EventEmitter<HouseholdMember> = new EventEmitter();

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.subscription.add(
      this.householdService.retrieveHousehold().subscribe((household) => {
        console.log("Household " ,household);
        this.householdMembers = household?.members ?? []
        console.log(this.householdMembers)
        this.currentUser = household?.currentUser ?? null;
        this.selectedUser = this.currentUser;
      })
    )
  }

  clicked(householdMember: HouseholdMember): void{
    this.selectedUser = householdMember;
    this.householdMemberSelected.emit(householdMember);
  }


}
