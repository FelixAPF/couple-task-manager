import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// PrimeNG Modules
import { SharedModule } from '../../shared.module';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { ColorPickerModule } from 'primeng/colorpicker';
import { InputSwitchModule } from 'primeng/inputswitch';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';

// Services & Models
import { BlindBoxService } from '../../service/blind-box.service';
import { FileService } from '../../service/file-upload.service';
import { HouseholdService } from '../../service/household.service';
import {
  BlindBoxRarity,
  BlindBoxItem,
  BlindBoxKey,
  BlindBoxCollection,
  CardEffectType
} from '../../model/blind-box.model';
import { HouseholdMember } from '../../model/household';

export type AdminTab = 'rarities' | 'collections' | 'keys' | 'settings';

@Component({
  selector: 'app-blind-box-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SharedModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    ColorPickerModule,
    InputSwitchModule,
    ToastModule,
    ConfirmDialogModule
  ],
  templateUrl: './blind-box-admin.component.html',
  styleUrls: ['./blind-box-admin.component.css'],
  providers: [MessageService, ConfirmationService]
})
export class BlindBoxAdminComponent implements OnInit {
  private blindBoxService = inject(BlindBoxService);
  private fileService = inject(FileService);
  private householdService = inject(HouseholdService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // Active View Tab
  activeTab: AdminTab = 'collections';

  // State Data
  rarities: BlindBoxRarity[] = [];
  collections: BlindBoxCollection[] = [];
  keys: BlindBoxKey[] = [];
  householdMembers: HouseholdMember[] = [];
  partnerInspectionEnabled = false;

  // Collection Drill-down
  activeCollection: BlindBoxCollection | null = null;
  itemSearchTerm: string = '';

  // Effect Options
  effectOptions: { label: string; value: CardEffectType }[] = [
    { label: 'Standard (Neutre)', value: 'STANDARD' },
    { label: 'Foil (Brillant)', value: 'FOIL' },
    { label: 'Holographique (Arc-en-ciel)', value: 'HOLOGRAPHIC' },
    { label: 'Rainbow Shimmer (Paillettes)', value: 'RAINBOW_SHIMMER' }
  ];

  // Quick Palette for 1-tap color selection
  colorPalette = ['#94a3b8', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444', '#ffd166'];

  // Modals
  showRarityDialog = false;
  showCollectionDialog = false;
  showItemDialog = false;
  showKeyDialog = false;
  showGrantKeyDialog = false;

  // Editing Forms
  editingRarity: BlindBoxRarity = this.getEmptyRarity();
  editingCollection: BlindBoxCollection = this.getEmptyCollection();
  editingItem: BlindBoxItem = this.getEmptyItem();
  editingKey: any = this.getEmptyKey();

  // Key Granting
  grantTargetUserId: number | null = null;
  grantTargetKeyId: number | null = null;
  grantQuantity = 1;

  isUploadingImage = false;

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.blindBoxService.getRarities().subscribe(data => this.rarities = data || []);
    this.blindBoxService.getKeys().subscribe(data => this.keys = data || []);
    this.blindBoxService.isInspectionEnabled().subscribe(enabled => this.partnerInspectionEnabled = enabled);
    this.loadCollections();

    this.householdService.retrieveHousehold().subscribe(hh => {
      if (hh?.members) {
        this.householdMembers = hh.members;
      }
    });
  }

  loadCollections(): void {
    this.blindBoxService.getAdminCollections().subscribe(data => {
      this.collections = data || [];
      if (this.activeCollection) {
        this.activeCollection = this.collections.find(c => c.id === this.activeCollection!.id) || null;
      }
    });
  }

  // --- FILTERED ITEMS IN ACTIVE COLLECTION ---
  get filteredActiveItems(): BlindBoxItem[] {
    if (!this.activeCollection?.items) return [];
    const term = this.itemSearchTerm.trim().toLowerCase();
    if (!term) return this.activeCollection.items;
    return this.activeCollection.items.filter(i =>
      i.name.toLowerCase().includes(term) ||
      (i.subtitle && i.subtitle.toLowerCase().includes(term)) ||
      (i.rarity?.name && i.rarity.name.toLowerCase().includes(term))
    );
  }

  // =========================================================
  // 1. RARITIES MANAGEMENT
  // =========================================================
  getEmptyRarity(): BlindBoxRarity {
    return {
      name: '',
      borderColor: '#3b82f6',
      badgeColor: '#1d4ed8',
      effectType: 'STANDARD',
      defaultDropRate: 15.0,
      displayOrder: (this.rarities?.length || 0) + 1
    };
  }

  openCreateRarity(): void {
    this.editingRarity = this.getEmptyRarity();
    this.showRarityDialog = true;
  }

  openEditRarity(rarity: BlindBoxRarity): void {
    this.editingRarity = { ...rarity };
    this.showRarityDialog = true;
  }

  saveRarity(): void {
    if (!this.editingRarity.name.trim()) return;

    if (!this.editingRarity.borderColor.startsWith('#')) {
      this.editingRarity.borderColor = '#' + this.editingRarity.borderColor;
    }
    if (!this.editingRarity.badgeColor.startsWith('#')) {
      this.editingRarity.badgeColor = '#' + this.editingRarity.badgeColor;
    }

    this.blindBoxService.saveRarity(this.editingRarity).subscribe({
      next: () => {
        this.showRarityDialog = false;
        this.loadAllData();
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Rareté enregistrée.' });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de la sauvegarde.' })
    });
  }

  confirmDeleteRarity(event: Event, rarity: BlindBoxRarity): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Supprimer la rareté "${rarity.name}" ?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-danger p-button-sm font-bold',
      accept: () => {
        if (!rarity.id) return;
        this.blindBoxService.deleteRarity(rarity.id).subscribe({
          next: () => {
            this.loadAllData();
            this.messageService.add({ severity: 'success', summary: 'Supprimée', detail: 'Rareté retirée.' });
          }
        });
      }
    });
  }

  // =========================================================
  // 2. COLLECTIONS MANAGEMENT
  // =========================================================
  getEmptyCollection(): BlindBoxCollection {
    return {
      name: '',
      description: '',
      bannerUrl: '',
      active: true,
      displayOrder: (this.collections?.length || 0) + 1
    };
  }

  openCreateCollection(): void {
    this.editingCollection = this.getEmptyCollection();
    this.showCollectionDialog = true;
  }

  openEditCollection(col: BlindBoxCollection, event?: Event): void {
    if (event) event.stopPropagation();
    this.editingCollection = { ...col };
    this.showCollectionDialog = true;
  }

  saveCollection(): void {
    if (!this.editingCollection.name.trim()) return;

    this.blindBoxService.saveCollection(this.editingCollection).subscribe({
      next: () => {
        this.showCollectionDialog = false;
        this.loadCollections();
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Collection enregistrée.' });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de la sauvegarde.' })
    });
  }

  confirmDeleteCollection(event: Event, col: BlindBoxCollection): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Supprimer la collection "${col.name}" et toutes ses cartes ?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-danger p-button-sm font-bold',
      accept: () => {
        if (!col.id) return;
        this.blindBoxService.deleteCollection(col.id).subscribe({
          next: () => {
            if (this.activeCollection?.id === col.id) {
              this.activeCollection = null;
            }
            this.loadCollections();
            this.messageService.add({ severity: 'success', summary: 'Supprimée', detail: 'Collection supprimée.' });
          }
        });
      }
    });
  }

  onUploadCollectionBanner(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.isUploadingImage = true;
    this.fileService.postFile(file).subscribe({
      next: (res: any) => {
        this.isUploadingImage = false;
        this.editingCollection.bannerUrl = res.url || `${res.fileName}`;
        this.messageService.add({ severity: 'success', summary: 'Bannière téléversée', detail: 'Image prête.' });
      },
      error: () => {
        this.isUploadingImage = false;
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec du téléversement.' });
      }
    });
  }

  // =========================================================
  // 3. ITEMS / CARDS MANAGEMENT
  // =========================================================
  getEmptyItem(): BlindBoxItem {
    return {
      collectionId: this.activeCollection?.id,
      itemNumber: (this.activeCollection?.items?.length || 0) + 1,
      name: '',
      subtitle: '',
      description: '',
      imageUrl: '',
      rarity: this.rarities[0] || null!
    };
  }

  openCreateItem(): void {
    if (!this.activeCollection) return;
    this.editingItem = this.getEmptyItem();
    this.showItemDialog = true;
  }

  openEditItem(item: BlindBoxItem, event?: Event): void {
    if (event) event.stopPropagation();
    this.editingItem = { ...item, collectionId: this.activeCollection?.id };
    this.showItemDialog = true;
  }

  saveItem(): void {
    if (!this.editingItem.name.trim() || !this.editingItem.rarity) return;

    const payload: any = {
      ...this.editingItem,
      collection: this.activeCollection
    };

    this.blindBoxService.saveItem(payload).subscribe({
      next: () => {
        this.showItemDialog = false;
        this.loadCollections();
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Personnage sauvegardé.' });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de la sauvegarde.' })
    });
  }

  confirmDeleteItem(event: Event, item: BlindBoxItem): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Supprimer la carte "${item.name}" ?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-danger p-button-sm font-bold',
      accept: () => {
        if (!item.id) return;
        this.blindBoxService.deleteItem(item.id).subscribe({
          next: () => {
            this.loadCollections();
            this.messageService.add({ severity: 'success', summary: 'Supprimée', detail: 'Carte retirée.' });
          }
        });
      }
    });
  }

  onUploadItemArtwork(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.isUploadingImage = true;
    this.fileService.postFile(file).subscribe({
      next: (res: any) => {
        this.isUploadingImage = false;
        this.editingItem.imageUrl = res.url || res.fileName;
        this.messageService.add({ severity: 'success', summary: 'Artwork téléversé', detail: 'Image prête.' });
      },
      error: () => {
        this.isUploadingImage = false;
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec du téléversement.' });
      }
    });
  }

  // =========================================================
  // 4. KEYS & BOXES MANAGEMENT
  // =========================================================
  getEmptyKey(): any {
    return {
      name: '',
      description: '',
      icon: 'pi pi-key',
      color: '#f97316',
      blindBox: {
        name: '',
        description: '',
        collection: this.collections[0] || null
      }
    };
  }

  openCreateKey(): void {
    if (this.collections.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Attention',
        detail: 'Créez d\'abord une collection avant de configurer une clé.'
      });
      return;
    }
    this.editingKey = this.getEmptyKey();
    this.showKeyDialog = true;
  }

  saveKey(): void {
    if (!this.editingKey.name?.trim() || !this.editingKey.blindBox?.name?.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Nom de la clé et du coffre requis.' });
      return;
    }

    if (!this.editingKey.blindBox?.collection?.id) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Sélectionnez une collection cible.' });
      return;
    }

    if (!this.editingKey.color.startsWith('#')) {
      this.editingKey.color = '#' + this.editingKey.color;
    }

    this.blindBoxService.saveKey(this.editingKey).subscribe({
      next: () => {
        this.showKeyDialog = false;
        this.loadAllData();
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Clé et coffre configurés.' });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de la sauvegarde.' })
    });
  }

  openGrantKeyDialog(keyId?: number): void {
    this.grantTargetUserId = this.householdMembers[0]?.id || null;
    this.grantTargetKeyId = keyId || this.keys[0]?.id || null;
    this.grantQuantity = 1;
    this.showGrantKeyDialog = true;
  }

  submitGrantKey(): void {
    if (!this.grantTargetUserId || !this.grantTargetKeyId || this.grantQuantity < 1) return;

    this.blindBoxService.grantKey(this.grantTargetUserId, this.grantTargetKeyId, this.grantQuantity).subscribe({
      next: () => {
        this.showGrantKeyDialog = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Clés envoyées',
          detail: `${this.grantQuantity} clé(s) attribuée(s) avec succès.`
        });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de l\'envoi des clés.' })
    });
  }

  onToggleInspection(event: any): void {
    this.blindBoxService.toggleInspection(event.checked).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Paramètre mis à jour',
          detail: `Inspection ${event.checked ? 'activée' : 'désactivée'}.`
        });
      },
      error: () => {
        this.partnerInspectionEnabled = !event.checked;
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de mettre à jour le paramètre.' });
      }
    });
  }
}