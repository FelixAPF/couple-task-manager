import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subject, takeUntil, finalize } from 'rxjs';

// PrimeNG Modules
import { SharedModule } from '../../shared.module';
import { FileUpload, FileUploadModule, FileSelectEvent } from 'primeng/fileupload';
import { MessageService } from 'primeng/api';

// App Services & Models
import { HouseholdService } from '../../service/household.service';
import { Household, HouseholdMember } from '../../model/household';
import { ToastModule } from 'primeng/toast';
import { AvatarModule } from 'primeng/avatar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CheckboxChangeEvent } from 'primeng/checkbox';
import { AuthService } from '../../service/auth.service';
import { Router } from '@angular/router';
import { VersionControlService } from '../../service/version-control.service';

// Import the version.json file directly from the client root
import versionData from '../../../../version.json';

enum HouseholdSettingNames {
  WISH_LIST = "enableWishList",
  WAYS_TO_CARE = "enableWaysToCare",
  TO_DO_LIST = "enableToDoList",
  TRAVEL_CHECKLIST = "enableTravelChecklist",
  FOOD_INTAKE = "enableFoodIntakeTracking",
  MEALS = "enableMeal",
  TASKS = "enableTasks",
  SHOPPING_LIST = "enableShoppingList"
}

@Component({
  selector: 'app-manage-household',
  standalone: true,
  imports: [
    ToastModule,
    AvatarModule,
    CommonModule,
    SharedModule,
    FileUploadModule,
    FormsModule,
    ProgressSpinnerModule
  ],
  templateUrl: './manage-household.component.html',
  styleUrls: ['./manage-household.component.css'],
  providers: [MessageService]
})
export class ManageHouseholdComponent implements OnInit, OnDestroy {
  // --- Injected Services ---
  private householdService = inject(HouseholdService);
  private messageService = inject(MessageService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private versionControlService = inject(VersionControlService);

  SETTING_NAMES = HouseholdSettingNames;

  // --- State ---
  household$: Observable<Household | null>; 
  uploadingMemberId = signal<number | null>(null);
  selectedFiles: { [memberId: number]: File } = {};
  private destroy$ = new Subject<void>();

  // Client & Server versions
  appVersion = versionData.version || 'Inconnue';
  serverVersion = signal<string>('Chargement...');

  isUpdatingSettings = signal(false);

  // --- Lifecycle Hooks ---
  ngOnInit(): void {
    this.household$ = this.householdService.household$; 
    if (!this.householdService.getCurrentHousehold()) { 
      this.householdService.retrieveHousehold() 
        .pipe(takeUntil(this.destroy$))
        .subscribe({
            error: (err) => {
                console.error("Error loading household", err);
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les informations du foyer.' });
            }
        });
    }

    // Fetch server version
    this.versionControlService.retrieveVersion()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => this.serverVersion.set(res || 'Inconnue'),
        error: () => this.serverVersion.set('Inaccessible')
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- Event Handlers ---

  onFileSelect(event: FileSelectEvent, memberId: number): void {
    if (event.files && event.files.length > 0) {
      this.selectedFiles[memberId] = event.files[0];
    } else {
      delete this.selectedFiles[memberId];
    }
  }

  triggerImageUpload(memberId: number, uploader?: FileUpload): void {
    const fileToUpload = this.selectedFiles[memberId];

    if (!fileToUpload) {
      this.messageService.add({ severity: 'warn', summary: 'Aucun fichier', detail: 'Veuillez d\'abord choisir un fichier.', life: 3000 });
      return;
    }

    this.uploadingMemberId.set(memberId); 

    this.householdService.updateMemberImage(memberId, fileToUpload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
            this.uploadingMemberId.set(null); 
            delete this.selectedFiles[memberId]; 
            uploader?.clear(); 
        })
      )
      .subscribe({
        next: (result) => {
          this.messageService.add({
            severity: 'success', summary: 'Succès',
            detail: `Image mise à jour.`, life: 3000
          });
        },
        error: (err) => {
          console.error(`Error uploading image for member ${memberId}:`, err);
          this.messageService.add({
            severity: 'error', summary: 'Échec Upload',
            detail: err?.error?.message || "Impossible de mettre à jour l'image.", life: 5000
          });
        }
      });
  }

  trackByMemberId(index: number, member: HouseholdMember): number {
    return member.id;
  }

  toggleWaysToCare(event: CheckboxChangeEvent, household: Household): void {
    const newState = event.checked; 

    this.isUpdatingSettings.set(true);

    this.householdService.updateHouseholdSettings({ enableWaysToCare: newState })
        .pipe(
            takeUntil(this.destroy$),
            finalize(() => this.isUpdatingSettings.set(false))
        )
        .subscribe({
            next: (updatedHousehold) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: 'Paramètre "Petites Attentions" mis à jour.',
                    life: 3000
                });
            },
            error: (err) => {
                console.error("Error updating household settings:", err);
                
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: err?.error?.message || 'Impossible de mettre à jour le paramètre.',
                    life: 5000
                });
            }
        });
  }  
  
  toggleNewSetting(event: CheckboxChangeEvent, household: Household, settingName: HouseholdSettingNames): void {
    const newState = event.checked; 

    this.isUpdatingSettings.set(true);

    if(!Object.values(HouseholdSettingNames).includes(settingName)){
      console.error(`Invalid setting name: ${settingName}`);
      this.isUpdatingSettings.set(false);
      return;
    }
    this.householdService.updateHouseholdSettings({ [settingName]: newState })
        .pipe(
            takeUntil(this.destroy$),
            finalize(() => this.isUpdatingSettings.set(false))
        )
        .subscribe({
            next: (updatedHousehold) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: 'Paramètre mis à jour.',
                    life: 3000
                });
            },
            error: (err) => {
                console.error("Error updating household settings:", err);
                
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: err?.error?.message || 'Impossible de mettre à jour le paramètre.',
                    life: 5000
                });
            }
        });
  }

  confirmDeleteAccount() {
    if (confirm("Are you absolutely sure? All your data will be permanently removed.")) {
      this.authService.deleteAccount().subscribe({
        next: () => {
          this.authService.logout(); 
          this.router.navigate(['/login']);
        },
        error: (err) => {
          console.error("Failed to delete account", err);
          alert("An error occurred while deleting your account.");
        }
      });
    }
  }

  togglToDoList(event: CheckboxChangeEvent, household: Household): void {
    const newState = event.checked; 

    this.isUpdatingSettings.set(true);

    this.householdService.updateHouseholdSettings({ enableToDoList: newState })
        .pipe(
            takeUntil(this.destroy$),
            finalize(() => this.isUpdatingSettings.set(false))
        )
        .subscribe({
            next: (updatedHousehold) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: 'Paramètre "Liste activités" mis à jour.',
                    life: 3000
                });
            },
            error: (err) => {
                console.error("Error updating household settings:", err);
                
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: err?.error?.message || 'Impossible de mettre à jour le paramètre.',
                    life: 5000
                });
            }
        });
  }
}