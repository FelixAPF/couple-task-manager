import { Component, inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { SharedModule } from '../../shared.module';
import { finalize } from 'rxjs';
import { AuthService } from '../../service/auth.service';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { RegisterRequest } from '../../model/auth';

export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  // If controls haven't been initialized yet, or password hasn't been touched, don't validate yet
  if (!password || !confirmPassword || !password.value || !confirmPassword.value) {
    return null;
  }

  // Set error on confirmPassword if they don't match
  if (password.value !== confirmPassword.value) {
    confirmPassword.setErrors({ ...confirmPassword.errors, 'passwordMismatch': true });
    return { passwordMismatch: true }; // Return error at the form group level as well if needed
  } else {
    // Clear the mismatch error if they now match, but preserve other potential errors
    const errors = { ...confirmPassword.errors };
    delete errors['passwordMismatch'];
    confirmPassword.setErrors(Object.keys(errors).length > 0 ? errors : null);
    return null;
  }
};

@Component({
  selector: 'app-register',
  imports: [SharedModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
  providers: [MessageService] // Provide MessageService for this component
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  // --- Form Definition ---
  registerForm = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    householdToken: ['', []], 
    createNewHousehold: [false],
    newHouseholdName: ['', []], // Add householdName, not required by default
    password: ['', [Validators.required, Validators.minLength(6)]], // Add minLength or other password rules
    confirmPassword: ['', [Validators.required]]
  }, { validators: passwordMatchValidator }); // Apply the custom validator at the group level

  // --- Getters for easier template access ---
  get name() { return this.registerForm.get('name'); }
  get email() { return this.registerForm.get('email'); }
  get householdToken() { return this.registerForm.get('householdToken'); }
  get createNewHousehold() { return this.registerForm.get('createNewHousehold'); } // Added getter
  get newHouseholdName() { return this.registerForm.get('newHouseholdName'); } // Added getter
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }


  ngOnInit(): void {
    // Dynamically update validators based on createNewHousehold changes
    this.createNewHousehold?.valueChanges.subscribe(isCreatingNew => {
        if (isCreatingNew) {
            // Clear token validation/value
            this.householdToken?.clearValidators();
            this.householdToken?.setValue('');
            // Add householdName validation
            this.newHouseholdName?.setValidators([Validators.required]);
        } else {
            // Add token validation
            this.householdToken?.setValidators([Validators.required]);
            // Clear householdName validation/value
            this.newHouseholdName?.clearValidators();
            this.newHouseholdName?.setValue('');
        }
        // Trigger re-validation for both fields
        this.householdToken?.updateValueAndValidity();
        this.newHouseholdName?.updateValueAndValidity();
    });

    // Set initial validator states based on default value
    this.updateInitialValidators();
  }
  updateInitialValidators() {
    if (!this.createNewHousehold?.value) {
        this.householdToken?.setValidators([Validators.required]);
        this.newHouseholdName?.clearValidators();
    } else {
        this.householdToken?.clearValidators();
        this.newHouseholdName?.setValidators([Validators.required]);
    }
    this.householdToken?.updateValueAndValidity();
    this.newHouseholdName?.updateValueAndValidity();
}


  // --- Methods ---
  onSubmit(): void {
    this.registerForm.markAllAsTouched();

    if (!this.createNewHousehold?.value && !this.householdToken?.value) {
      // Manually set error on the control for UI feedback
      this.householdToken?.setErrors({ ...this.householdToken?.errors, 'required': true });
      this.messageService.add({
          severity: 'warn',
          summary: 'Validation Error',
          detail: 'Household Token is required if you are not creating a new household.',
          life: 3000
      });
      return; // Stop submission
  } else if (!this.createNewHousehold?.value && this.householdToken?.value) {
      // If token has value and not creating new, ensure 'required' error is removed if it was manually set
      const errors = { ...this.householdToken?.errors };
      delete errors['required'];
      this.householdToken?.setErrors(Object.keys(errors).length > 0 ? errors : null);
  }

  // Check overall form validity *after* conditional check
  if (this.registerForm.invalid) {
     this.messageService.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Please fill in all required fields correctly and ensure passwords match.',
      life: 3000
    });
    return;
  }


    // Exclude confirmPassword before sending to backend
    const { confirmPassword, ...registrationData } = this.registerForm.getRawValue();
    if(registrationData.email === null || registrationData.password === null || registrationData.name === null) return;
    const registerRequest: RegisterRequest = {
      name: registrationData.name,
      email: registrationData.email,
      password: registrationData.password,
      newHouseholdName: registrationData.createNewHousehold ? registrationData.newHouseholdName : null, // Only include if creating a new household
      createNewHousehold: registrationData.createNewHousehold || false,
      householdToken: registrationData.createNewHousehold ? null : registrationData.householdToken // Only include if not creating a new household
    }

    this.authService.register(registerRequest)
      .subscribe({
        next: (user) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Registration Successful',
            detail: 'Account created! Please login.',
            life: 4000
          });
          // Navigate to the login page after successful registration
          this.router.navigate(['/login']);
        },
        error: (err) => {
          console.error('Registration failed:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Registration Failed',
            detail: err?.error?.message || 'Could not create account. Please try again.', // Use backend message
            life: 5000
          });
        }
      });
  }
}