import { Component, inject, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { Household, HouseholdMember } from '../../model/household';
import { AuthService } from '../../service/auth.service';
import { HouseholdService } from '../../service/household.service';
import { SharedModule } from '../../shared.module';
import { FormsModule } from '@angular/forms';
import { ColorPickerModule } from 'primeng/colorpicker';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog'; // Import DialogService and DynamicDialogRef
import { RewardSelectionDialogComponent, Reward } from './reward-selection-dialog/reward-selection-dialog.component'; // Import the new dialog component and Reward interface

@Component({
  selector: 'app-rewards',
  standalone: true,
  imports: [SharedModule, FormsModule, ColorPickerModule],
  templateUrl: './rewards.component.html',
  styleUrls: ['./rewards.component.css'],
  providers: [MessageService, ConfirmationService, DialogService] // Add DialogService to providers
})
export class RewardsComponent implements OnInit, OnDestroy {
  // Injected Services
  private householdService = inject(HouseholdService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private dialogService = inject(DialogService); // Inject DialogService

  // Component State
  household: WritableSignal<Household | null> = signal(null);
  currentUser: HouseholdMember | null = null;
  
  dialogRef: DynamicDialogRef | undefined; // For managing the dialog instance

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // Close any open dialogs when component is destroyed
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  loadInitialData(): void {
    this.householdService.retrieveHousehold()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (hh) => {
          this.household.set(hh);
          this.currentUser = hh?.currentUser ?? null;
          // Assuming hh.members already have rewardPoints and rewardColor initialized by the service/backend
          // If not, you might need to iterate and add default values here.
        },
        error: (err) => {
          console.error("Error loading household data:", err);
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les informations du foyer.' });
        }
      });
  }

  // Helper
  isCurrentUser(memberId: number): boolean {
    return this.currentUser?.id === memberId;
  }

  isAdmin(member: HouseholdMember): boolean {
    return this.currentUser?.email === 'felix.pelletierf@hotmail.com';
  }

  submitChangeColor(memberId: number | undefined, color: string): void {
    if (memberId === undefined) {
      console.warn('Cannot submit color: memberId is undefined.');
      return;
    }

    this.householdService.changeMemberRewardColor(memberId, color)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Couleur mise à jour!' });
          this.household.update(currentHousehold => {
            if (!currentHousehold || !currentHousehold.members) return currentHousehold;

            const updatedMembers = currentHousehold.members.map(m => {
              if (m.id === memberId) {
                return { ...m, rewardColor: color };
              }
              return m;
            });
            return { ...currentHousehold, members: updatedMembers };
          });
        },
        error: (err) => {
          console.error(`Error changing reward color for member ${memberId}:`, err);
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de changer la couleur de récompense.' });
        }
      });
  }

  addPointToMember(member: HouseholdMember): void {
    if (member.id === undefined) {
      console.warn('Cannot add point: member ID is undefined.');
      return;
    }

    this.householdService.increaseMemberRewardPoint(member.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Point ajouté!' });
          this.household.update(currentHousehold => {
            if (!currentHousehold || !currentHousehold.members) return currentHousehold;

            const updatedMembers = currentHousehold.members.map(m => {
              if (m.id === member.id) {
                return { ...m, rewardPoints: (m.rewardPoints || 0) + 1 };
              }
              return m;
            });
            return { ...currentHousehold, members: updatedMembers };
          });
        },
        error: (err) => {
          console.error(`Error increasing reward point for member ${member.id}:`, err);
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible d\'ajouter un point.' });
        }
      });
  }

  /**
   * Opens the reward selection modal when a member has max points.
   * @param member The HouseholdMember claiming the reward.
   */
  openRewardSelectionModal(member: HouseholdMember): void {
    this.dialogRef = this.dialogService.open(RewardSelectionDialogComponent, {
      header: 'Réclamer Récompense pour ' + member.name,
      width: '90%',
      modal: true,
      closable: true,
      contentStyle: { "max-height": "500px", "overflow": "auto" },
      data: {
        // You could pass member data or specific rewards here if needed
        member: member
      }
    });

    this.dialogRef.onClose
      .pipe(takeUntil(this.destroy$))
      .subscribe((selectedReward?: Reward) => {
        if (selectedReward) {
          this.messageService.add({ severity: 'info', summary: 'Réclamé', detail: `${selectedReward.name} a été réclamée par ${member.name}!` });
          
          // Optionally, send a request to backend to "claim" the reward
          // and reduce points, or mark reward as claimed.
          // For now, let's reset points to 0 after claiming
          this.household.update(currentHousehold => {
            if (!currentHousehold || !currentHousehold.members) return currentHousehold;
            this.householdService.resetMemberPoints(member.id!).subscribe();
            const updatedMembers = currentHousehold.members.map(m => {
              if (m.id === member.id) {
                return { ...m, rewardPoints: 0 }; // Reset points after claiming
              }
              return m;
            });
            return { ...currentHousehold, members: updatedMembers };
          });

          // You might also call a service method like:
          // this.householdService.claimReward(member.id!, selectedReward.id).subscribe(...);
        } else {
          this.messageService.add({ severity: 'warn', summary: 'Annulé', detail: 'Sélection de récompense annulée.' });
        }
      });
  }

  // trackBy function for ngFor performance
  trackByMemberId(index: number, member: HouseholdMember): number {
    return member.id!;
  }

  // Placeholder for the main submit modal logic (if applicable)
  openRewardSubmitModal(): void {
    this.messageService.add({ severity: 'info', summary: 'Soumettre', detail: 'Logic for submitting overall reward state will go here.' });
    const currentHouseholdData = this.household();
    console.log('Current household state for submission:', currentHouseholdData);
  }
}