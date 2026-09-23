import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared.module';
import { BlindBoxService } from '../../service/blind-box.service';
import { HouseholdService } from '../../service/household.service';
import { 
  CollectionProgress, 
  PokedexCard, 
  UserKeyInventory, 
  BlindBoxKey, 
  UnboxResult 
} from '../../model/blind-box.model';
import { MessageService } from 'primeng/api';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-pokedex',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule],
  templateUrl: './pokedex.component.html',
  styleUrls: ['./pokedex.component.css'],
  providers: [MessageService]
})
export class PokedexComponent implements OnInit {
  private blindBoxService = inject(BlindBoxService);
  private householdService = inject(HouseholdService);
  private messageService = inject(MessageService);

  collections: CollectionProgress[] = [];
  selectedCollectionId: number | null = null;
  cards: PokedexCard[] = [];
  userKeys: UserKeyInventory[] = [];
  
  canInspectPartner = false;
  householdMembers: any[] = [];
  viewingUserId: number | null = null;
  memberSelectOptions: { label: string; value: number }[] = [];

  // Unboxing Modal
  showUnboxingDialog = false;
  activeKeyToOpen: BlindBoxKey | null = null;
  isUnboxingRunning = false;
  revealResult: UnboxResult | null = null;

  // Detail Modal
  showDetailDialog = false;
  inspectedCard: PokedexCard | null = null;

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.blindBoxService.getMyKeys().subscribe(keys => this.userKeys = keys);
    this.blindBoxService.isInspectionEnabled().subscribe(enabled => this.canInspectPartner = enabled);

    this.householdService.retrieveHousehold().subscribe(hh => {
      if (hh?.members) {
        this.householdMembers = hh.members;
        this.viewingUserId = hh.currentUser?.id || null;
        this.memberSelectOptions = hh.members.map(m => ({
          label: m.id === hh.currentUser?.id ? 'Ma collection' : m.name,
          value: m.id
        }));
      }
    });

    this.blindBoxService.getCollections().subscribe(cols => {
      this.collections = cols;
      if (cols.length > 0) {
        this.selectCollection(cols[0].id);
      }
    });
  }

  selectCollection(id: number): void {
    this.selectedCollectionId = id;
    this.loadPokedex();
  }

  loadPokedex(): void {
    if (!this.selectedCollectionId) return;
    this.blindBoxService.getPokedex(this.selectedCollectionId, this.viewingUserId || undefined)
      .subscribe(cards => this.cards = cards);
  }

  openUnboxingModal(key: BlindBoxKey): void {
    this.activeKeyToOpen = key;
    this.revealResult = null;
    this.isUnboxingRunning = false;
    this.showUnboxingDialog = true;
  }

  triggerOpen(): void {
    if (!this.activeKeyToOpen?.blindBox?.id) return;
    this.isUnboxingRunning = true;

    // Suspense delay
    setTimeout(() => {
      this.blindBoxService.openBox(this.activeKeyToOpen!.blindBox.id!).subscribe({
        next: (res) => {
          this.revealResult = res;
          this.isUnboxingRunning = false;
          this.loadInitialData(); // Refresh keys & cards

          // Trigger celebratory burst
          confetti({
            particleCount: 180,
            spread: 90,
            origin: { y: 0.5 },
            colors: [res.item.rarity.borderColor, '#f97316', '#eab308']
          });
        },
        error: (err) => {
          this.isUnboxingRunning = false;
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err?.error?.message || "Impossible d'ouvrir le coffre" });
        }
      });
    }, 1500);
  }

  closeUnboxing(): void {
    this.showUnboxingDialog = false;
    this.revealResult = null;
  }

  inspectCard(card: PokedexCard): void {
    if (!card.unlocked) return;
    this.inspectedCard = card;
    this.showDetailDialog = true;
  }
}