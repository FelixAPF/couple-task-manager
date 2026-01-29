import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { HouseholdMember } from '../../model/household';
import { SharedModule } from '../../shared.module';

@Component({
  selector: 'app-reassign-task',
  imports: [SharedModule, CommonModule, FormsModule],  
  templateUrl: './reassign-task.component.html',
  styleUrl: './reassign-task.component.css'
})
export class ReassignTaskDialogComponent implements OnInit {
  members: HouseholdMember[] = [];
  selectedMember: HouseholdMember | null = null;

  constructor(public ref: DynamicDialogRef, public config: DynamicDialogConfig) {}

  ngOnInit(): void {
    if (this.config.data?.members) {
      // Filter out the current assignee if needed, or just show all
      this.members = this.config.data.members;
    }
  }

  selectMember(member: HouseholdMember) {
    this.selectedMember = member;
  }

  submit() {
    if (this.selectedMember) {
      this.ref.close(this.selectedMember);
    }
  }

  cancel() {
    this.ref.close();
  }
}