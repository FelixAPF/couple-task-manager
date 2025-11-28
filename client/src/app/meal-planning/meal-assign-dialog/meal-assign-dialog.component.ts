import { Component } from '@angular/core';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { HouseholdMember } from '../../model/household';
import { SharedModule } from '../../shared.module';

@Component({
  selector: 'app-meal-assign-dialog',
  imports: [SharedModule],
  templateUrl: './meal-assign-dialog.component.html',
  styleUrl: './meal-assign-dialog.component.css'
})
export class MealAssignDialogComponent {
  householdMembers: (HouseholdMember | null)[] = [];
  
  // We use 'undefined' to mean "User hasn't clicked anything yet"
  // 'null' means "User clicked the Unassign option"
  selectedMember: HouseholdMember | null | undefined = undefined;

  constructor(
      public dialogRef: DynamicDialogRef,
      public dialogConfig: DynamicDialogConfig
  ) {
      if (this.dialogConfig.data?.householdMembers) {
        // Create a copy to avoid mutating the original array reference
        this.householdMembers = [...this.dialogConfig.data.householdMembers];
      }
      // Add the 'null' option for Unassigning
      this.householdMembers.push(null);
  }

  selectMember(member: HouseholdMember | null) {
    this.selectedMember = member;
  }

  confirm() {
    // Only proceed if the user has actually made a selection (not undefined)
    if (this.selectedMember !== undefined) {
      // If member is selected, return ID. If null (Unassigned), return null.
      this.dialogRef.close(this.selectedMember ? this.selectedMember.id : null);
    }
  }

  cancel() {
    this.dialogRef.close(false);
  }
}