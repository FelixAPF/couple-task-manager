import { Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { HouseholdService } from '../../service/household.service';
import { HouseholdMember } from '../../model/household';
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
  
  // NEW: Allow passing a pre-selected user
  @Input() preSelectedUser: HouseholdMember | null | undefined = null;
  
  @Output() householdMemberSelected: EventEmitter<HouseholdMember> = new EventEmitter();

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.subscription.add(
      this.householdService.retrieveHousehold().subscribe((household) => {
        this.householdMembers = household?.members ?? []
        this.currentUser = household?.currentUser ?? null;
        
        // Use the pre-selected user if provided, otherwise default to current user
        if (this.preSelectedUser) {
            this.selectedUser = this.householdMembers.find(m => m.id === this.preSelectedUser?.id) || this.currentUser;
        } else {
            this.selectedUser = this.currentUser;
        }

        // Emit the initial state so the parent component gets the value immediately
        if (this.selectedUser) {
            this.householdMemberSelected.emit(this.selectedUser);
        }
      })
    )
  }

  clicked(householdMember: HouseholdMember): void{
    this.selectedUser = householdMember;
    this.householdMemberSelected.emit(householdMember);
  }
}