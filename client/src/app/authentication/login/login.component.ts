import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { AuthService } from '../../service/auth.service';
import { AuthRequest } from '../../model/auth';
import { SharedModule } from '../../shared.module';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
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
  isBiometricAvailable = signal(false);

  ngOnInit(): void {
this.route.queryParams.subscribe((params) => {
      if (params['sessionExpired']) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Déconnexion',
          detail: 'La session est expirée, veuillez vous reconnecter.',
          life: 3000,
          key: 'tc'
        });
      }
    });

    // Check if biometric login is configured and available
    this.checkBiometricAvailability();
  }
  // --- Methods ---

  async checkBiometricAvailability() {
    try {
      const result = await NativeBiometric.isAvailable();
      if (result.isAvailable) {
        // Only show the biometric button if credentials were saved previously
        const credentials = await NativeBiometric.getCredentials({
          server: 'com.couple.taskmanager'
        });
        if (credentials) {
          this.isBiometricAvailable.set(true);
        }
      }
    } catch (error) {
      // Biometrics not available or no credentials saved yet
      console.log('Biometrics not available or not configured', error);
    }
  }

 async loginWithBiometrics() {
    try {
      // Wait for biometric verification. 
      // If it fails or the user cancels, it throws an error and jumps to the catch block.
      await NativeBiometric.verifyIdentity({
        reason: 'Connectez-vous avec votre empreinte',
        title: 'Authentification biométrique',
        subtitle: 'Utilisez votre empreinte pour vous connecter',
        description: 'Sécurisé et rapide'
      });

      // If we reach this line, the fingerprint was successfully verified!
      const credentials = await NativeBiometric.getCredentials({
        server: 'com.couple.taskmanager'
      });

      const authRequest: AuthRequest = {
        email: credentials.username,
        password: credentials.password
      };

      this.executeLogin(authRequest);
      
    } catch (error) {
      // This catches failed biometric attempts, user cancellations, or missing credentials.
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Échec de l\'authentification biométrique',
        life: 3000
      });
    }
  }

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

  private executeLogin(authRequest: AuthRequest, saveCredentials = false) {
    this.authService.login(authRequest)
      .subscribe({
        next: (user) => {
          this.messageService.add({ 
            severity: 'success', 
            summary: 'Succès', 
            detail: 'Connexion réussie' 
          });
          this.pushService.sendTokenToBackend();

          // Save credentials for future biometric logins
          if (saveCredentials) {
            NativeBiometric.setCredentials({
              username: authRequest.email,
              password: authRequest.password,
              server: 'com.couple.taskmanager'
            }).then(() => this.isBiometricAvailable.set(true))
              .catch(err => console.error('Failed to save biometric credentials', err));
          }

          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
          this.router.navigateByUrl(returnUrl);
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Identifiants invalides',
            life: 3000
          });
        }
      });
  }
}