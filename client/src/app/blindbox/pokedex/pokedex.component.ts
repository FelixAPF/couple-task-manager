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

export interface CollectionBannerTheme {
  slug: string;
  accentColor: string;
  gradient: string;
  motifType: 'sharingan' | 'menos_grande' | 'straw_hat' | 'triforce' | 'default';
  rotationDuration: string;
}

export const COLLECTION_THEMES: Record<string, CollectionBannerTheme> = {
  naruto: {
    slug: 'naruto',
    accentColor: '#ff2a2a',
    gradient: 'radial-gradient(ellipse at 85% 50%, rgba(239, 68, 68, 0.35), rgba(185, 28, 28, 0.12) 45%, transparent 70%)',
    motifType: 'sharingan',
    rotationDuration: '28s'
  },
  bleach: {
    slug: 'bleach',
    accentColor: '#c084fc',
    gradient: 'radial-gradient(ellipse at 85% 50%, rgba(147, 51, 234, 0.38), rgba(255, 0, 85, 0.15) 45%, transparent 70%)',
    motifType: 'menos_grande',
    rotationDuration: '36s'
  },
  one_piece: {
    slug: 'one_piece',
    accentColor: '#f59e0b',
    gradient: 'radial-gradient(ellipse at 85% 50%, rgba(245, 158, 11, 0.32), rgba(220, 38, 38, 0.12) 45%, transparent 70%)',
    motifType: 'straw_hat',
    rotationDuration: '32s'
  },
  zelda: {
    slug: 'zelda',
    accentColor: '#eab308',
    gradient: 'radial-gradient(ellipse at 85% 50%, rgba(234, 179, 8, 0.30), rgba(161, 98, 7, 0.10) 45%, transparent 70%)',
    motifType: 'triforce',
    rotationDuration: '26s'
  },
  default: {
    slug: 'default',
    accentColor: '#ffd166',
    gradient: 'radial-gradient(ellipse at 85% 50%, rgba(255, 209, 102, 0.20), rgba(255, 209, 102, 0.05) 45%, transparent 70%)',
    motifType: 'default',
    rotationDuration: '32s'
  }
};

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

  // --- 1.B: UNBOXING ---
  showUnboxingDialog = false;
  activeKeyToOpen: BlindBoxKey | null = null;
  isUnboxingRunning = false;
  isShaking = false;
  isBursting = false;

  isCardFlipped = false;
  revealResult: UnboxResult | null = null;
  forgeKeyOptions: { label: string; value: number }[] = [];
  allAvailableKeys: BlindBoxKey[] = [];

  // --- 1.D: FORGE / RECYCLAGE DES DOUBLONS ---
  showForgeDialog = false;
  selectedDuplicateIds: number[] = [];
  forgeTargetKeyId: number | null = null;
  isForging = false;
  cardTiltX = 0;
  cardTiltY = 0;

  packStage: 'IDLE' | 'TEARING' | 'EXTRACTING' | 'SUSPENSE' | 'REVEALED' = 'IDLE';
  tearProgress = 0;
  isTearing = false;
  tearStartX = 0;

  // --- DETAIL MODAL ---
  showDetailDialog = false;
  inspectedCard: PokedexCard | null = null;

  get currentCollection(): CollectionProgress | undefined {
    return this.collections.find(c => c.id === this.selectedCollectionId);
  }

  get activeTheme(): CollectionBannerTheme {
    const rawName = (this.currentCollection?.name || '').toLowerCase();
    if (rawName.includes('naruto')) return COLLECTION_THEMES['naruto'];
    if (rawName.includes('bleach')) return COLLECTION_THEMES['bleach'];
    if (rawName.includes('piece')) return COLLECTION_THEMES['one_piece'];
    if (rawName.includes('zelda')) return COLLECTION_THEMES['zelda'];
    return COLLECTION_THEMES['default'];
  }

  get isCollectionCompleted(): boolean {
    const col = this.currentCollection;
    return !!col && col.totalItemsCount > 0 && col.ownedItemsCount >= col.totalItemsCount;
  }

  get unlockedCardsCount(): number {
    return this.cards.filter(c => c.unlocked).length;
  }

  get missingCardsCount(): number {
    return this.cards.filter(c => !c.unlocked).length;
  }

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
    this.blindBoxService.getMyKeys().subscribe(keys => {
      this.userKeys = keys;
      this.buildForgeKeyOptions();
    });

    this.blindBoxService.getKeys().subscribe({
      next: (allKeys) => {
        this.allAvailableKeys = allKeys || [];
        this.buildForgeKeyOptions();
      },
      error: () => this.buildForgeKeyOptions()
    });

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

  buildForgeKeyOptions(): void {
    const keyMap = new Map<number, string>();

    if (this.allAvailableKeys && this.allAvailableKeys.length > 0) {
      this.allAvailableKeys.forEach(k => {
        if (k.id) keyMap.set(k.id, k.name);
      });
    }

    if (this.userKeys && this.userKeys.length > 0) {
      this.userKeys.forEach(inv => {
        if (inv.key?.id) keyMap.set(inv.key.id, inv.key.name);
      });
    }

    this.forgeKeyOptions = Array.from(keyMap.entries()).map(([id, name]) => ({
      label: name,
      value: id
    }));

    if (!this.forgeTargetKeyId && this.forgeKeyOptions.length > 0) {
      this.forgeTargetKeyId = this.forgeKeyOptions[0].value;
    }
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
      if (this.statusFilter === 'UNLOCKED' && !card.unlocked) return false;
      if (this.statusFilter === 'LOCKED' && card.unlocked) return false;

      if (this.selectedRarityId !== null && card.rarity?.id !== this.selectedRarityId) {
        return false;
      }

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

  openPack(): void {
    if (!this.activeKeyToOpen?.blindBox?.id || this.isUnboxingRunning) return;
    this.isUnboxingRunning = true;
    this.isShaking = true;
    this.soundService.playKeyClick();
    this.hapticService.light();

    setTimeout(() => this.hapticService.light(), 200);
    setTimeout(() => this.hapticService.medium(), 420);

    setTimeout(() => {
      this.isShaking = false;
      this.isBursting = true;
      this.soundService.playSealBreak();
      this.hapticService.heavy();

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

  onCardMouseMove(event: MouseEvent, cardEl: HTMLElement): void {
    if (this.packStage !== 'SUSPENSE') return;
    const rect = cardEl.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    this.cardTiltX = ((y - centerY) / centerY) * -18;
    this.cardTiltY = ((x - centerX) / centerX) * 18;
  }

  onCardMouseLeave(): void {
    this.cardTiltX = 0;
    this.cardTiltY = 0;
  }

  flipRevealedCard(): void {
    if (this.packStage !== 'SUSPENSE' || !this.revealResult) return;
    this.packStage = 'REVEALED';
    this.isCardFlipped = true;

    this.hapticService.medium();
    this.soundService.playRevealSound(this.revealResult.item.rarity.effectType);

    confetti({
      particleCount: 160,
      spread: 90,
      origin: { y: 0.55 },
      colors: [this.revealResult.item.rarity.borderColor, '#ffd166', '#ff4b3e', '#ffffff']
    });
  }

  openAnother(): void {
    this.revealResult = null;
    this.packStage = 'IDLE';
    this.tearProgress = 0;
    this.isCardFlipped = false;
    this.cardTiltX = 0;
    this.cardTiltY = 0;
  }

  openUnboxingModal(key: BlindBoxKey): void {
    this.soundService.playKeyClick();
    this.hapticService.light();
    this.activeKeyToOpen = key;
    this.revealResult = null;
    this.packStage = 'IDLE';
    this.tearProgress = 0;
    this.isTearing = false;
    this.isCardFlipped = false;
    this.cardTiltX = 0;
    this.cardTiltY = 0;
    this.showUnboxingDialog = true;
  }

  closeUnboxing(): void {
    this.showUnboxingDialog = false;
    this.revealResult = null;
    this.packStage = 'IDLE';
    this.tearProgress = 0;
    this.isCardFlipped = false;
  }

  inspectCard(card: PokedexCard): void {
    if (!card.unlocked) return;
    this.soundService.playCardFlip();
    this.hapticService.light();
    this.inspectedCard = card;
    this.showDetailDialog = true;
  }

  startTear(event: MouseEvent | TouchEvent, packEl: HTMLElement): void {
    if (this.packStage !== 'IDLE') return;
    this.isTearing = true;
    this.packStage = 'TEARING';
    this.tearStartX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    this.soundService.playSealBreak();
    this.hapticService.light();
  }

  openForge(): void {
    this.soundService.playKeyClick();
    this.hapticService.light();
    this.selectedDuplicateIds = [];
    this.buildForgeKeyOptions();
    if (!this.forgeTargetKeyId && this.forgeKeyOptions.length > 0) {
      this.forgeTargetKeyId = this.forgeKeyOptions[0].value;
    }
    this.showForgeDialog = true;
  }

  moveTear(event: MouseEvent | TouchEvent, packEl: HTMLElement): void {
    if (!this.isTearing || this.packStage !== 'TEARING') return;
    const currentX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const rect = packEl.getBoundingClientRect();
    
    const distanceTorn = currentX - this.tearStartX;
    const tearWidth = rect.width * 0.85;
    const progress = Math.min(100, Math.max(0, (distanceTorn / tearWidth) * 100));
    
    this.tearProgress = progress;

    if (this.tearProgress >= 95) {
      this.isTearing = false;
      this.tearProgress = 100;
      this.finalizeRipping();
    }
  }

  endTear(): void {
    if (!this.isTearing) return;
    this.isTearing = false;
    if (this.tearProgress >= 70) {
      this.tearProgress = 100;
      this.finalizeRipping();
    } else {
      this.tearProgress = 0;
      this.packStage = 'IDLE';
    }
  }

  quickRip(): void {
    if (this.packStage !== 'IDLE' && this.packStage !== 'TEARING') return;
    this.isTearing = false;
    this.tearProgress = 100;
    this.finalizeRipping();
  }

  private finalizeRipping(): void {
    if (!this.activeKeyToOpen?.blindBox?.id) return;
    this.packStage = 'EXTRACTING';

    this.soundService.playSealBreak();
    this.hapticService.heavy();

    this.blindBoxService.openBox(this.activeKeyToOpen.blindBox.id).subscribe({
      next: (res) => {
        this.revealResult = res;

        setTimeout(() => {
          this.soundService.playBurstExplosion();
          this.hapticService.medium();
          
          confetti({
            particleCount: 50,
            spread: 100,
            origin: { y: 0.45 },
            colors: ['#ffd166', '#ffffff', '#ff4b3e']
          });

          this.packStage = 'SUSPENSE';
          this.loadInitialData();
          this.loadCollections();
          this.loadPokedex();
        }, 600);
      },
      error: (err) => {
        this.packStage = 'IDLE';
        this.tearProgress = 0;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: err?.error?.message || "Impossible d'ouvrir le coffre"
        });
      }
    });
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
    this.soundService.playForgeAudio();
    this.hapticService.heavy();

    this.blindBoxService.recycleDuplicates(this.selectedDuplicateIds, this.forgeTargetKeyId).subscribe({
      next: () => {
        this.isForging = false;
        this.showForgeDialog = false;
        this.loadInitialData();
        this.loadCollections();
        this.loadPokedex();
        this.soundService.playKeyAdded();
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