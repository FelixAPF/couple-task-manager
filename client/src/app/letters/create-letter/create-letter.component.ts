import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LetterService } from '../../service/letter.service';
import { HouseholdService } from '../../service/household.service';
import { HouseholdMember } from '../../model/household';

@Component({
  selector: 'app-create-letter',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-letter.component.html',
  styleUrls: ['./create-letter.component.css']
})
export class CreateLetterComponent implements OnInit {
  letterForm: FormGroup;
  householdMembers: HouseholdMember[] = [];
  currentUser: HouseholdMember | null = null;

  constructor(
    private fb: FormBuilder,
    private letterService: LetterService,
    private householdService: HouseholdService,
    private router: Router
  ) {
    this.letterForm = this.fb.group({
      receiverId: [null, Validators.required],
      title: ['', Validators.required],
      letterType: ['', Validators.required],
      description: ['', Validators.required],
      hasOptions: [false],
      optionsTitle: [''],
      options: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.householdService.retrieveHousehold().subscribe(household => {
      // Filter out current user if needed, or backend handles "self" check
      if(household?.currentUser)
        this.currentUser = household.currentUser;
      if(!household?.members) return;
      this.householdMembers = household?.members;

    });

    // Watch for toggle changes
    this.letterForm.get('hasOptions')?.valueChanges.subscribe(val => {
      if (val) {
        this.addInitialOptions();
        this.letterForm.get('optionsTitle')?.setValidators(Validators.required);
      } else {
        this.options.clear();
        this.letterForm.get('optionsTitle')?.clearValidators();
      }
      this.letterForm.get('optionsTitle')?.updateValueAndValidity();
    });
  }

  get nonSelfHouseholdMembers(): HouseholdMember[] {
    return this.householdMembers.filter(member => member.id !== this.currentUser?.id);
  }

  get options(): FormArray {
    return this.letterForm.get('options') as FormArray;
  }

  addInitialOptions() {
    if (this.options.length === 0) {
      this.addOption();
      this.addOption();
    }
  }

  addOption(value: string = '') {
    this.options.push(this.fb.control(value, Validators.required));
  }

  removeOption(index: number) {
    this.options.removeAt(index);
  }

  onSubmit() {
    if (this.letterForm.invalid) return;

    this.letterService.createLetter(this.letterForm.value).subscribe(() => {
      this.router.navigate(['/letters']);
    });
  }
}
