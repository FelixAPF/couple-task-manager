import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared.module';
import { BlindBoxService } from '../../service/blind-box.service';
import { HouseholdService } from '../../service/household.service';
import { SoundService } from '../../service/sound.service';
import { HapticService } from '../../service/haptic.service';
import {
  CollectionProgress,
  PokedexCard,
  UserKeyInventory,
  BlindBoxKey,
  UnboxResult
} from '../../model/blind-box.model';
import { MessageService } from 'primeng/api';
import confetti from 'canvas-confetti';

export type CardStatusFilter = 'ALL' | 'UNLOCKED' | 'LOCKED';

export interface RarityFilterOption {
  id: number | null;
  name: string;
  borderColor: string;
  badgeColor: string;
  count: number;
}

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
  public soundService = inject(SoundService);
  public hapticService = inject(HapticService);

  collections: CollectionProgress[] = [];
  selectedCollectionId: number | null = null;
  cards: PokedexCard[] = [];
  filteredCards: PokedexCard[] = [];
  isLoadingCards = true;

  userKeys: UserKeyInventory[] = [];
  canInspectPartner = false;
  householdMembers: any[] = [];
  viewingUserId: number | null = null;
  currentUserId: number | null = null;

  // --- FILTRES ---
  searchQuery: string = '';
  selectedRarityId: number | null = null;
  statusFilter: CardStatusFilter = 'ALL';
  availableRarities: RarityFilterOption[] = [];

  // --- 1.B: UNBOXING — TAP-TO-OPEN (à la Hearthstone) ---
  // Un seul geste : on touche le paquet. Il tremble (anticipation), explose de lumière,
  // puis disparaît pour laisser place au dos de carte suspense + flip 3D.
  showUnboxingDialog = false;
  activeKeyToOpen: BlindBoxKey | null = null;
  isUnboxingRunning = false;
  isShaking = false;
  isBursting = false;

  isCardFlipped = false;
  revealResult: UnboxResult | null = null;

  // --- 1.D: FORGE / RECYCLAGE DES DOUBLONS ---
  showForgeDialog = false;
  selectedDuplicateIds: number[] = [];
  forgeTargetKeyId: number | null = null;
  isForging = false;

  // --- DETAIL MODAL ---
  showDetailDialog = false;
  inspectedCard: PokedexCard | null = null;

  get currentCollection(): CollectionProgress | undefined {
    return this.collections.find(c => c.id === this.selectedCollectionId);
  }

  // 4.A: Vérifie si la collection est terminée à 100%
  get isCollectionCompleted(): boolean {
    const col = this.currentCollection;
    return !!col && col.totalItemsCount > 0 && col.ownedItemsCount >= col.totalItemsCount;
  }

  // 1.C: Compteurs pour le filtre d'état
  get unlockedCardsCount(): number {
    return this.cards.filter(c => c.unlocked).length;
  }

  get missingCardsCount(): number {
    return this.cards.filter(c => !c.unlocked).length;
  }

  // 1.D: Liste des cartes en doublon
  get duplicateCards(): PokedexCard[] {
    return this.cards.filter(c => c.unlocked && c.count > 1);
  }

  get totalDuplicatesCount(): number {
    return this.cards.reduce((sum, c) => sum + (c.unlocked && c.count > 1 ? c.count - 1 : 0), 0);
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.blindBoxService.getMyKeys().subscribe(keys => this.userKeys = keys);
    this.blindBoxService.isInspectionEnabled().subscribe(enabled => this.canInspectPartner = enabled);

    this.householdService.retrieveHousehold().subscribe(hh => {
      if (hh?.members) {
        this.householdMembers = hh.members;
        this.currentUserId = hh.currentUser?.id || null;
        if (!this.viewingUserId) {
          this.viewingUserId = this.currentUserId;
        }
        this.loadCollections();
      }
    });
  }

  loadCollections(): void {
    this.blindBoxService.getCollections(this.viewingUserId || undefined).subscribe(cols => {
      this.collections = cols;
      if (cols.length > 0 && !this.selectedCollectionId) {
        this.selectCollection(cols[0].id);
      }
    });
  }

  selectCollection(id: number): void {
    this.selectedCollectionId = id;
    this.selectedRarityId = null;
    this.statusFilter = 'ALL';
    this.loadPokedex();
  }

  switchMemberView(userId: number): void {
    if (this.viewingUserId === userId) return;
    this.hapticService.light();
    this.viewingUserId = userId;
    this.loadCollections();
    this.loadPokedex();
  }

  isCurrentMember(userId: number): boolean {
    return this.currentUserId === userId;
  }

  loadPokedex(): void {
    if (!this.selectedCollectionId) return;
    this.isLoadingCards = true;
    this.blindBoxService.getPokedex(this.selectedCollectionId, this.viewingUserId || undefined)
      .subscribe({
        next: (cards) => {
          this.cards = cards.map(c => ({
            ...c,
            unlocked: c.unlocked ?? (c as any).isUnlocked ?? (c.count > 0)
          }));
          this.updateAvailableRarities();
          this.applyFilters();
          this.isLoadingCards = false;
        },
        error: () => this.isLoadingCards = false
      });
  }

  updateAvailableRarities(): void {
    const rarityMap = new Map<number, { option: RarityFilterOption; order: number }>();
    for (const card of this.cards) {
      if (card.rarity && card.rarity.id != null) {
        if (!rarityMap.has(card.rarity.id)) {
          rarityMap.set(card.rarity.id, {
            option: {
              id: card.rarity.id,
              name: card.rarity.name,
              borderColor: card.rarity.borderColor,
              badgeColor: card.rarity.badgeColor,
              count: 0
            },
            order: card.rarity.displayOrder ?? 0
          });
        }
        rarityMap.get(card.rarity.id)!.option.count++;
      }
    }
    this.availableRarities = Array.from(rarityMap.values())
      .sort((a, b) => a.order - b.order)
      .map(entry => entry.option);
  }

  // --- FILTRAGE AVANCÉ ---
  setStatusFilter(status: CardStatusFilter): void {
    this.hapticService.light();
    this.statusFilter = status;
    this.applyFilters();
  }

  selectRarity(rarityId: number | null): void {
    this.hapticService.light();
    this.selectedRarityId = rarityId;
    this.applyFilters();
  }

  applyFilters(): void {
    const term = this.searchQuery.trim().toLowerCase();

    this.filteredCards = this.cards.filter(card => {
      // 1. Filtre d'état Débloquées / Manquantes
      if (this.statusFilter === 'UNLOCKED' && !card.unlocked) return false;
      if (this.statusFilter === 'LOCKED' && card.unlocked) return false;

      // 2. Filtre par type de rareté
      if (this.selectedRarityId !== null && card.rarity?.id !== this.selectedRarityId) {
        return false;
      }

      // 3. Filtre de recherche textuelle anti-spoiler
      if (term) {
        if (card.unlocked) {
          const matchesName = card.name && card.name.toLowerCase().includes(term);
          const matchesSubtitle = card.subtitle && card.subtitle.toLowerCase().includes(term);
          const numStr = String(card.itemNumber);
          const matchesNum = numStr.includes(term) || numStr.padStart(3, '0').includes(term);
          const matchesRarity = card.rarity?.name && card.rarity.name.toLowerCase().includes(term);
          return matchesName || matchesSubtitle || matchesNum || matchesRarity;
        } else {
          const cleanTerm = term.replace(/^n[°o\s#]*/i, '').trim();
          const isNumeric = /^\d+$/.test(cleanTerm);
          if (!isNumeric) return false;
          const numStr = String(card.itemNumber);
          return numStr === cleanTerm || numStr.padStart(3, '0') === cleanTerm;
        }
      }

      return true;
    });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedRarityId = null;
    this.statusFilter = 'ALL';
    this.applyFilters();
  }

  // --- OUVERTURE DU PAQUET : TAP UNIQUE, SÉQUENCE SCRIPTÉE ---
  // 1) tremblement d'anticipation qui monte en intensité
  // 2) explosion de lumière + particules
  // 3) le paquet disparaît, place au dos de carte suspense (déjà géré par flipRevealedCard)
  openPack(): void {
    if (!this.activeKeyToOpen?.blindBox?.id || this.isUnboxingRunning) return;
    this.isUnboxingRunning = true;
    this.isShaking = true;
    this.soundService.playKeyClick();
    this.hapticService.light();

    // Secousses haptiques croissantes pendant l'anticipation, comme un paquet qu'on serre de plus en plus fort
    setTimeout(() => this.hapticService.light(), 200);
    setTimeout(() => this.hapticService.medium(), 420);

    setTimeout(() => {
      this.isShaking = false;
      this.isBursting = true;
      this.soundService.playSealBreak();
      this.hapticService.heavy();

      // Flash blanc/or immédiat à l'ouverture, avant même de savoir ce qu'on a obtenu
      confetti({
        particleCount: 55,
        spread: 100,
        startVelocity: 42,
        ticks: 60,
        origin: { y: 0.45 },
        colors: ['#ffffff', '#ffd166', '#fff4d6']
      });

      this.blindBoxService.openBox(this.activeKeyToOpen!.blindBox.id!).subscribe({
        next: (res) => {
          this.revealResult = res;
          this.isUnboxingRunning = false;
          this.isBursting = false;
          this.loadInitialData();
          this.loadCollections();
          this.loadPokedex();

          // Laisse le temps au flash de retomber avant de montrer le dos de carte, puis déclenche le flip 3D
          setTimeout(() => {
            this.flipRevealedCard();
          }, 550);
        },
        error: (err) => {
          this.isUnboxingRunning = false;
          this.isBursting = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: err?.error?.message || "Impossible d'ouvrir le coffre"
          });
        }
      });
    }, 650);
  }

  flipRevealedCard(): void {
    if (this.isCardFlipped || !this.revealResult) return;
    this.isCardFlipped = true;
    this.soundService.playCardFlip();
    this.hapticService.medium();

    if (this.revealResult.item.rarity.defaultDropRate <= 10.0 || this.revealResult.item.rarity.effectType === 'LIGHTNING') {
      this.soundService.playRareChime();
    }

    confetti({
      particleCount: 180,
      spread: 90,
      origin: { y: 0.5 },
      colors: [this.revealResult.item.rarity.borderColor, '#ff4b3e', '#ffd166', '#38bdf8']
    });
  }

  openAnother(): void {
    this.revealResult = null;
    this.isCardFlipped = false;
    this.isShaking = false;
    this.isBursting = false;
  }

  // --- 1.B: OUVERTURE DE LA MODALE D'UNBOXING ---
  openUnboxingModal(key: BlindBoxKey): void {
    this.soundService.playKeyClick();
    this.hapticService.light();
    this.activeKeyToOpen = key;
    this.revealResult = null;
    this.isUnboxingRunning = false;
    this.isShaking = false;
    this.isBursting = false;
    this.isCardFlipped = false;
    this.showUnboxingDialog = true;
  }

  closeUnboxing(): void {
    this.showUnboxingDialog = false;
    this.revealResult = null;
    this.isCardFlipped = false;
  }

  inspectCard(card: PokedexCard): void {
    if (!card.unlocked) return;
    this.soundService.playCardFlip();
    this.hapticService.light();
    this.inspectedCard = card;
    this.showDetailDialog = true;
  }

  // --- 1.D: GESTION DE LA FORGE / RECYCLAGE ---
  openForge(): void {
    this.soundService.playKeyClick();
    this.hapticService.light();
    this.selectedDuplicateIds = [];
    this.forgeTargetKeyId = this.userKeys.length > 0 ? this.userKeys[0].key.id! : null;
    this.showForgeDialog = true;
  }

  toggleSelectDuplicate(card: PokedexCard): void {
    this.hapticService.light();
    const idx = this.selectedDuplicateIds.indexOf(card.id);
    if (idx > -1) {
      this.selectedDuplicateIds.splice(idx, 1);
    } else {
      if (this.selectedDuplicateIds.length < 3) {
        this.selectedDuplicateIds.push(card.id);
      }
    }
  }

  confirmRecycle(): void {
    if (this.selectedDuplicateIds.length !== 3 || !this.forgeTargetKeyId) return;
    this.isForging = true;
    this.soundService.playSealBreak();
    this.hapticService.heavy();

    this.blindBoxService.recycleDuplicates(this.selectedDuplicateIds, this.forgeTargetKeyId).subscribe({
      next: () => {
        this.isForging = false;
        this.showForgeDialog = false;
        this.loadInitialData();
        this.loadCollections();
        this.loadPokedex();
        this.soundService.playRareChime();
        this.messageService.add({
          severity: 'success',
          summary: 'Transmutation réussie !',
          detail: '3 doublons ont été forgés en 1 nouvelle clé !'
        });
      },
      error: (err) => {
        this.isForging = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: err?.error?.message || 'Échec de la transmutation.'
        });
      }
    });
  }
}