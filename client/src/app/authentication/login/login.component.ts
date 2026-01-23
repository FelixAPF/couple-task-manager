import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { AuthService } from '../../service/auth.service';
import { AuthRequest } from '../../model/auth';
import { SharedModule } from '../../shared.module';
import { PushNotificationService } from '../../service/push.notification.service';

@Component({
  selector: 'app-login',
  imports: [SharedModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  providers: [MessageService] // Provide MessageService for this component
})
export class LoginComponent implements OnInit {
  // --- Dependencies ---
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService); // Inject MessageService
  private route = inject(ActivatedRoute); // Inject ActivatedRoute 
  private pushService = inject(PushNotificationService);

  // --- Form Definition ---
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  // --- Getters for easier template access ---
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  ngOnInit(): void {

    this.route.queryParams.subscribe((params) => {
      if (params['sessionExpired']) {
        this.messageService.add({
        severity: 'warn',
        summary: 'Déconnexion',
        detail: 'La session est expirée, veuillez vous reconnecter.',
        life: 3000,
        key: 'tc'
      })
      }
    })
  }
  // --- Methods ---
  onSubmit(): void {
    this.loginForm.markAllAsTouched(); // Show validation errors on submit attempt

    if (this.loginForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please fill in all required fields correctly.',
        life: 3000
      });
      return;
    } 

    const credentials = this.loginForm.getRawValue();
    if(credentials.email === null || credentials.password === null) return;
    const authRequest: AuthRequest = {
      email: credentials.email,
      password: credentials.password
    }

    this.authService.login(authRequest)
      .subscribe({
        next: (user) => {
          this.messageService.add({ /* ... success message ... */ });
          this.pushService.sendTokenToBackend();

          // Check for returnUrl query parameter
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard'; // Default to dashboard
          this.router.navigateByUrl(returnUrl); // Use navigateByUrl for potentially complex URLs

        },
        error: (err) => {
          // ... (error handling) ...
        }
      });
  }
}