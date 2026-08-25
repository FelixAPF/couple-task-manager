import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

// PrimeNG Modules
import { SharedModule } from '../../shared.module';
import { FileUpload, FileUploadModule, FileSelectEvent } from 'primeng/fileupload';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AvatarModule } from 'primeng/avatar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CheckboxChangeEvent } from 'primeng/checkbox';
import { Router, RouterModule } from '@angular/router';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';

// App Services & Models
import { HouseholdService } from '../../service/household.service';
import { AuthService } from '../../service/auth.service';
import { VersionControlService } from '../../service/version-control.service';
import { Household, HouseholdMember } from '../../model/household';
import versionData from '../../../../version.json';

export interface TopMealDto {
  recipeId?: number;
  recipeName: string;
  category?: string;
  imageUrl?: string;
  count: number;
  lastEaten?: Date | string;
}

export interface MemberTaskStatDto {
  memberId: number;
  name: string;
  imageUrl?: string;
  count: number;
  percentage: number;
}

export interface MemberChefStatDto {
  memberId: number;
  name: string;
  imageUrl?: string;
  count: number;
  percentage: number;
}

export interface HouseholdStatsDto {
  year: number;
  totalTasksDone: number;
  totalActiveTasks: number;
  totalGrocerySpent: number;
  totalHouseholdFundSaved: number;
  householdFundBalance: number;
  totalHydroCost: number;
  totalHydroKwh: number;
  totalMealsCount: number;
  topMeals: TopMealDto[];
  memberTaskStats: MemberTaskStatDto[];
  memberChefStats: MemberChefStatDto[];
  topChef: MemberChefStatDto | null;
}

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
    CommonModule,
    SharedModule,
    FileUploadModule,
    FormsModule,
    ReactiveFormsModule,
    ToastModule,
    AvatarModule,
    ProgressSpinnerModule,
    RouterModule,
    TagModule,
    TooltipModule,
    ButtonModule
  ],
  templateUrl: './manage-household.component.html',
  styleUrls: ['./manage-household.component.css'],
  providers: [MessageService]
})
export class ManageHouseholdComponent implements OnInit, OnDestroy {
  private householdService = inject(HouseholdService);
  private messageService = inject(MessageService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private versionControlService = inject(VersionControlService);

  SETTING_NAMES = HouseholdSettingNames;
  currentYear: number = new Date().getFullYear();

  household$: Observable<Household | null>;
  uploadingMemberId = signal<number | null>(null);
  selectedFiles: { [memberId: number]: File } = {};
  isUpdatingSettings = signal(false);
  private destroy$ = new Subject<void>();

  // --- Statistics Signals ---
  isLoadingStats = signal<boolean>(true);
  tasksDoneThisYear = signal<number>(0);
  totalRegisteredTasks = signal<number>(0);
  grocerySpentThisYear = signal<number>(0);
  householdFundSavedThisYear = signal<number>(0);
  householdFundCurrentBalance = signal<number>(0);
  totalHydroCost = signal<number>(0);
  totalHydroKwh = signal<number>(0);
  totalMealsThisYear = signal<number>(0);
  topMealsThisYear = signal<TopMealDto[]>([]);
  memberTaskStats = signal<MemberTaskStatDto[]>([]);
  memberChefStats = signal<MemberChefStatDto[]>([]);
  topChef = signal<MemberChefStatDto | null>(null);

  appVersion = versionData.version || 'Inconnue';
  serverVersion = signal<string>('Chargement...');

  ngOnInit(): void {
    this.household$ = this.householdService.household$;

    if (!this.householdService.getCurrentHousehold()) {
      this.householdService.retrieveHousehold()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          error: (err) => {
            console.error("Error loading household", err);
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: 'Impossible de charger les informations du foyer.'
            });
          }
        });
    }

    this.versionControlService.retrieveVersion()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => this.serverVersion.set(res || 'Inconnue'),
        error: () => this.serverVersion.set('Inaccessible')
      });

    this.loadHouseholdStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadHouseholdStats(): void {
    this.isLoadingStats.set(true);
    this.householdService.getHouseholdStats(this.currentYear)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingStats.set(false))
      )
      .subscribe({
        next: (stats: HouseholdStatsDto) => {
          this.tasksDoneThisYear.set(stats.totalTasksDone || 0);
          this.totalRegisteredTasks.set(stats.totalActiveTasks || 0);
          this.grocerySpentThisYear.set(stats.totalGrocerySpent || 0);
          this.householdFundSavedThisYear.set(stats.totalHouseholdFundSaved || 0);
          this.householdFundCurrentBalance.set(stats.householdFundBalance || 0);
          this.totalHydroCost.set(stats.totalHydroCost || 0);
          this.totalHydroKwh.set(stats.totalHydroKwh || 0);
          this.totalMealsThisYear.set(stats.totalMealsCount || 0);
          this.topMealsThisYear.set(stats.topMeals || []);
          this.memberTaskStats.set(stats.memberTaskStats || []);
          this.memberChefStats.set(stats.memberChefStats || []);
          this.topChef.set(stats.topChef || null);
        },
        error: (err) => {
          console.error('Error loading household stats:', err);
        }
      });
  }

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
      this.messageService.add({
        severity: 'warn',
        summary: 'Aucun fichier',
        detail: 'Veuillez d\'abord choisir un fichier.',
        life: 3000
      });
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
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Image mise à jour.',
            life: 3000
          });
        },
        error: (err) => {
          console.error(`Error uploading image for member ${memberId}:`, err);
          this.messageService.add({
            severity: 'error',
            summary: 'Échec Upload',
            detail: err?.error?.message || "Impossible de mettre à jour l'image.",
            life: 5000
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
        next: () => {
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
    if (!Object.values(HouseholdSettingNames).includes(settingName)) {
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
        next: () => {
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

  togglToDoList(event: CheckboxChangeEvent, household: Household): void {
    const newState = event.checked;
    this.isUpdatingSettings.set(true);
    this.householdService.updateHouseholdSettings({ enableToDoList: newState })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isUpdatingSettings.set(false))
      )
      .subscribe({
        next: () => {
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

  confirmDeleteAccount() {
    if (confirm("Êtes-vous absolument certain ? Toutes vos données seront définitivement supprimées.")) {
      this.authService.deleteAccount().subscribe({
        next: () => {
          this.authService.logout();
          this.router.navigate(['/login']);
        },
        error: (err) => {
          console.error("Failed to delete account", err);
          alert("Une erreur est survenue lors de la suppression de votre compte.");
        }
      });
    }
  }
}