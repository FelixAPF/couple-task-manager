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
import { Capacitor } from '@capacitor/core';
import { AUTH_SERVER_KEY } from '../../service/auth.service';
import { TranslateService } from '@ngx-translate/core';


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
  private translate = inject(TranslateService); 

  // --- Form Definition ---
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  // --- Getters for easier template access ---
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
  isBiometricAvailable: boolean = false;
  hasSavedCredentials: boolean = false;

  get currentLang(){
    return this.translate.currentLang;
  }

  async ngOnInit() {
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
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await NativeBiometric.isAvailable();
        this.isBiometricAvailable = result.isAvailable;
        
        if (this.isBiometricAvailable) {
          // Check if there's a stored fingerprint login available
          const creds = await NativeBiometric.getCredentials({ server: AUTH_SERVER_KEY });
          if (creds && creds.username) {
            this.hasSavedCredentials = true;
          }
        }
      } catch (e) {
        // No saved credentials or biometrics disabled
        this.hasSavedCredentials = false;
      }
    }
  }
  // --- Methods ---

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

          if (this.isBiometricAvailable) {
            NativeBiometric.setCredentials({
              username: this.loginForm.value.email!,
              password: this.loginForm.value.password!,
              server: AUTH_SERVER_KEY
            }).catch(err => console.error('Failed to save biometric creds', err));
          }

          // Check for returnUrl query parameter
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard'; // Default to dashboard
          this.router.navigateByUrl(returnUrl); // Use navigateByUrl for potentially complex URLs

        },
        error: (err) => {
          // ... (error handling) ...
        }
      });
  }

  
async loginWithBiometric() {
    try {
      // Prompt the native OS fingerprint/FaceID scanner overlay
      await NativeBiometric.verifyIdentity({
        reason: this.currentLang === 'fr' ? "Connectez-vous" : "Log in",
        title: this.currentLang === 'fr' ? "Connexion Rapide" : "Quick Login",
        subtitle: this.currentLang === 'fr' ? "Utilisez votre biométrie" : "Use your biometrics",
      });

      
      
      // Retrieve the securely stored password from the native Keystore
      const creds = await NativeBiometric.getCredentials({ server: AUTH_SERVER_KEY });
      
      // Patch the form and trigger your standard backend auth
      this.loginForm.patchValue({ email: creds.username, password: creds.password });
      this.onSubmit();
      
    } catch (error) {
      // 👇 If it fails, is cancelled, or errors out, it jumps immediately here.
      console.log('Biometric verification failed or cancelled by user', error);
    }
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
          
          if (this.isBiometricAvailable) {
            NativeBiometric.setCredentials({
              username: this.loginForm.value.email!,
              password: this.loginForm.value.password!,
              server: AUTH_SERVER_KEY
            }).catch(err => console.error('Failed to save biometric creds', err));
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