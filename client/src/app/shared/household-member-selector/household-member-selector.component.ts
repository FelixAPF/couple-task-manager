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
  
  // Allow passing a pre-selected user. Undefined triggers the fallback to currentUser.
  @Input() preSelectedUser: HouseholdMember | null | undefined = undefined;
  
  @Output() householdMemberSelected: EventEmitter<HouseholdMember | null> = new EventEmitter();

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.subscription.add(
      this.householdService.retrieveHousehold().subscribe((household) => {
        this.householdMembers = household?.members ?? []
        this.currentUser = household?.currentUser ?? null;
        
        // Use the pre-selected user if explicitly provided (even if it is null for "nobody")
        // otherwise default to current user for backward compatibility
        if (this.preSelectedUser !== undefined) {
            this.selectedUser = this.preSelectedUser ? (this.householdMembers.find(m => m.id === this.preSelectedUser?.id) || null) : null;
        } else {
            this.selectedUser = this.currentUser;
        }

        // Emit the initial state so the parent component gets the value immediately
        if (this.selectedUser !== undefined) {
            this.householdMemberSelected.emit(this.selectedUser);
        }
      })
    )
  }

  clicked(householdMember: HouseholdMember | null): void {
    this.selectedUser = householdMember;
    this.householdMemberSelected.emit(householdMember);
  }
}