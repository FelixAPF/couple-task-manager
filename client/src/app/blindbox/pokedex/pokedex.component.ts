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

export interface HeroThemeConfig {
  eyebrow: string;
  title: string;
  lede: string;
  gradient: string;
  glow: string;
  emblem: 'shuriken' | 'bleach' | 'triforce' | 'pokeball' | 'star';
  emblemColor: string;
}

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

  collections: CollectionProgress[] = [];
  selectedCollectionId: number | null = null;
  cards: PokedexCard[] = [];
  filteredCards: PokedexCard[] = [];
  userKeys: UserKeyInventory[] = [];
  canInspectPartner = false;
  householdMembers: any[] = [];
  viewingUserId: number | null = null;
  memberSelectOptions: { label: string; value: number }[] = [];
  currentUserId: number | null = null;

  // --- Search & Rarity Filters ---
  searchQuery: string = '';
  selectedRarityId: number | null = null;
  availableRarities: RarityFilterOption[] = [];

  showUnboxingDialog = false;
  activeKeyToOpen: BlindBoxKey | null = null;
  isUnboxingRunning = false;
  revealResult: UnboxResult | null = null;

  showDetailDialog = false;
  inspectedCard: PokedexCard | null = null;

  // --- Dynamic Collection & Universe Theme Getter ---
  get currentCollection(): CollectionProgress | undefined {
    return this.collections.find(c => c.id === this.selectedCollectionId);
  }

  switchMemberView(userId: number): void {
    if (this.viewingUserId === userId) return;
    this.viewingUserId = userId;
    this.loadPokedex();
  }

  isCurrentMember(userId: number): boolean {
    return this.currentUserId === userId;
  }

  get heroTheme(): HeroThemeConfig {
    const col = this.currentCollection;
    const name = (col?.name || '').toLowerCase();

    if (name.includes('bleach')) {
      return {
        eyebrow: 'Soul Society • Seireitei',
        title: col?.name || 'Registre des Shinigami',
        lede: 'Purifiez les corvées quotidiennes, libérez le Bankai et consignez les capitaines du Gotei 13.',
        gradient: 'linear-gradient(135deg, #0d1322 0%, #1c0e35 45%, #090b14 100%)',
        glow: 'radial-gradient(circle, rgba(63, 217, 255, 0.4), transparent 70%)',
        emblem: 'bleach',
        emblemColor: 'rgba(63, 217, 255, 0.12)'
      };
    } else if (name.includes('zelda') || name.includes('hyrule')) {
      return {
        eyebrow: 'Royaume d’Hyrule',
        title: col?.name || 'Chroniques d’Hyrule',
        lede: 'Accomplissez vos quêtes, éveillez les sages et rassemblez les porteurs de la Triforce.',
        gradient: 'linear-gradient(135deg, #0e2a20 0%, #1d3319 45%, #09150f 100%)',
        glow: 'radial-gradient(circle, rgba(255, 209, 102, 0.4), transparent 70%)',
        emblem: 'triforce',
        emblemColor: 'rgba(255, 209, 102, 0.15)'
      };
    } else if (name.includes('poke') || name.includes('poké')) {
      return {
        eyebrow: 'Ligue Pokémon',
        title: col?.name || 'Pokédex National',
        lede: 'Attrapez-les tous au fil des tâches accomplies pour bâtir l’équipe ultime du foyer.',
        gradient: 'linear-gradient(135deg, #2b1114 0%, #381318 45%, #15090b 100%)',
        glow: 'radial-gradient(circle, rgba(239, 68, 68, 0.4), transparent 70%)',
        emblem: 'pokeball',
        emblemColor: 'rgba(239, 68, 68, 0.15)'
      };
    } else if (name.includes('naruto')) {
      return {
        eyebrow: 'Registre du village',
        title: col?.name || 'Registre des Ombres',
        lede: 'Accomplissez vos corvées, amassez des clés, et brisez les sceaux pour révéler qui rejoint le registre.',
        gradient: 'linear-gradient(135deg, #2a1650 0%, #3a1030 45%, #1a0f2e 100%)',
        glow: 'radial-gradient(circle, rgba(255, 75, 62, 0.35), transparent 70%)',
        emblem: 'shuriken',
        emblemColor: 'rgba(255, 255, 255, 0.08)'
      };
    } else {
      return {
        eyebrow: 'Archives du Foyer',
        title: col?.name || 'Registre des Collections',
        lede: col?.description || 'Accomplissez vos corvées quotidiennes pour déverrouiller de nouvelles cartes.',
        gradient: 'linear-gradient(135deg, #181938 0%, #2b1236 45%, #0d0f1c 100%)',
        glow: 'radial-gradient(circle, rgba(168, 85, 247, 0.35), transparent 70%)',
        emblem: 'star',
        emblemColor: 'rgba(255, 255, 255, 0.08)'
      };
    }
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
        this.memberSelectOptions = hh.members.map(m => ({
          label: m.id === hh.currentUser?.id ? 'Ma collection' : m.name,
          value: m.id
        }));
      }
    });

    this.blindBoxService.getCollections().subscribe(cols => {
      this.collections = cols;
      if (cols.length > 0 && !this.selectedCollectionId) {
        this.selectCollection(cols[0].id);
      }
    });
  }

  selectCollection(id: number): void {
    this.selectedCollectionId = id;
    this.selectedRarityId = null; // Réinitialise le filtre de rareté lors du changement de collection
    this.loadPokedex();
  }

  loadPokedex(): void {
    if (!this.selectedCollectionId) return;
    this.blindBoxService.getPokedex(this.selectedCollectionId, this.viewingUserId || undefined)
      .subscribe(cards => {
        this.cards = cards.map(c => ({
          ...c,
          unlocked: c.unlocked ?? (c as any).isUnlocked ?? (c.count > 0)
        }));
        this.updateAvailableRarities();
        this.applyFilters();
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

  selectRarity(rarityId: number | null): void {
    this.selectedRarityId = rarityId;
    this.applyFilters();
  }

applyFilters(): void {
    const term = this.searchQuery.trim().toLowerCase();

    this.filteredCards = this.cards.filter(card => {
      // 1. Filtre par type de rareté
      if (this.selectedRarityId !== null && card.rarity?.id !== this.selectedRarityId) {
        return false;
      }

      // 2. Filtre de recherche textuelle
      if (term) {
        if (card.unlocked) {
          // Pour les cartes DÉBLOQUÉES : recherche autorisée par nom, sous-titre, rareté ou numéro
          const matchesName = card.name && card.name.toLowerCase().includes(term);
          const matchesSubtitle = card.subtitle && card.subtitle.toLowerCase().includes(term);
          const numStr = String(card.itemNumber);
          const matchesNum = numStr.includes(term) || numStr.padStart(3, '0').includes(term);
          const matchesRarity = card.rarity?.name && card.rarity.name.toLowerCase().includes(term);

          return matchesName || matchesSubtitle || matchesNum || matchesRarity;
        } else {
          // Pour les cartes VERROUILLÉES : 
          // Interdiction absolue de chercher par nom/texte pour ne pas révéler son numéro !
          // Seule une recherche par numéro explicite (ex: "5", "005", "N°5") peut afficher le slot masqué.
          const cleanTerm = term.replace(/^n[°o\s#]*/i, '').trim();
          const isNumeric = /^\d+$/.test(cleanTerm);
          if (!isNumeric) {
            return false;
          }
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
    this.applyFilters();
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
    setTimeout(() => {
      this.blindBoxService.openBox(this.activeKeyToOpen!.blindBox.id!).subscribe({
        next: (res) => {
          this.revealResult = res;
          this.isUnboxingRunning = false;
          this.loadInitialData();
          this.loadPokedex();
          confetti({
            particleCount: 180,
            spread: 90,
            origin: { y: 0.5 },
            colors: [res.item.rarity.borderColor, '#ff4b3e', '#ffd166']
          });
        },
        error: (err) => {
          this.isUnboxingRunning = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: err?.error?.message || "Impossible d'ouvrir le sceau"
          });
        }
      });
    }, 1400);
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