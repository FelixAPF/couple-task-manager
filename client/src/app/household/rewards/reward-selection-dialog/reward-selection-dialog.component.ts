import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { SharedModule } from '../../../shared.module';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api'; // For showing a toast after selection

// Define a simple interface for a Reward
export interface Reward {
  id: string;
  name: string;
  description: string;
  icon: string; // PrimeNG icon class
}

@Component({
  selector: 'app-reward-selection-dialog',
  standalone: true,
  templateUrl: './reward-selection-dialog.component.html',
  styleUrls: ['./reward-selection-dialog.component.css'],
  imports: [
    CommonModule,
    SharedModule, // Make sure SharedModule exports ButtonModule and CardModule
    ButtonModule, // Explicitly import if not in SharedModule
    CardModule // Explicitly import if not in SharedModule
  ],
  providers: [MessageService] // Provide MessageService if you want to use toasts within the dialog
})
export class RewardSelectionDialogComponent {
  private config = inject(DynamicDialogConfig);
  ref = inject(DynamicDialogRef);
  private messageService = inject(MessageService);

  // Hardcode rewards for now
  rewards: Reward[] = [
    { id: 'coffee', name: 'rewards.coffee.name', description: 'rewards.coffee.description', icon: 'pi-coffee' },
    // Add more hardcoded rewards here if needed
    // { id: 'movie_night', name: 'Movie Night', description: 'Enjoy a cozy movie night together!', icon: 'pi-ticket' },
  ];

  constructor() {
    // You could potentially pass rewards data via config.data if they weren't hardcoded
  }

  selectReward(reward: Reward): void {
    // Here you would typically send this selection to a service to process the claim
    console.log(`User selected to claim: ${reward.name}`);
    this.messageService.add({ severity: 'success', summary: 'Récompense Réclamée', detail: `${reward.name} a été réclamée!` });
    this.ref.close(reward); // Close the dialog and pass the selected reward back
  }
}