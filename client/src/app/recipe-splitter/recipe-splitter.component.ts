import { Component, NgZone, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { Receipt, ReceiptItem } from '../model/receipt';
import { HouseholdMember, Household } from '../model/household';
import { HouseholdService } from '../service/household.service';
import { ReceiptService } from '../service/receipt.service';
import { FinanceService } from '../service/finance.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';

export interface Splitter {
  id: number;
  name: string;
  imageUrl?: string;
  isExtra?: boolean;
}

@Component({
  selector: 'app-receipt-splitter',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, ToastModule, TooltipModule, DialogModule, InputTextModule],
  templateUrl: './recipe-splitter.component.html',
  providers: [MessageService]
})
export class ReceiptSplitterComponent implements OnInit, OnDestroy {
  step: number = 1;
  members: HouseholdMember[] = [];
  activeSplitters: Splitter[] = [];
 
  currentReceipt: Receipt = this.getEmptyReceipt();
  splitPercentages: Record<number, number> = {};
  groceryTotal: number = 0;
  memberTotals: Record<number, number> = {};
  loading: boolean = false;
  pastReceipts: Receipt[] = [];
  receiptTax: number = 0;

  showAddPersonDialog: boolean = false;
  newPersonName: string = '';

  // --- Browser History Trap Variables ---
  private trapActive: boolean = false;
  private isSkippingPop: boolean = false;
  isViewingPastReceipt: boolean = false;

  constructor(
    private householdService: HouseholdService,
    private receiptService: ReceiptService,
    private financeService: FinanceService,
    private messageService: MessageService,
    private location: Location,
    private zone: NgZone
  ) {}

  ngOnInit() {
    this.householdService.retrieveHousehold().subscribe((h: Household | null) => {
      if (h) {
        this.loadSavedReceipts();
        this.financeService.loadFinanceData();
        if (h.members && h.members.length > 0) {
          this.members = h.members;
          this.resetToHouseholdSplitters();
        }
      }
    });
  }

  ngOnDestroy() {
    // Crucial: Clear the browser trap if the user uses the navigation bar to leave the page
    if (this.trapActive) {
      this.isSkippingPop = true;
      history.back();
    }
  }

  // --- BROWSER HISTORY TRAP LOGIC --- //

  // Pushes a dummy state to browser history to catch swipes/back buttons
  private trapBrowserBackButton(): void {
    if (!this.trapActive) {
      history.pushState({ wizardTrap: true }, '', location.href);
      this.trapActive = true;
    }
  }

  // Silently removes the dummy state when we are done saving
  private releaseTrap(): void {
    if (this.trapActive) {
      this.isSkippingPop = true;
      history.back();
      this.trapActive = false;
    }
  }

  // Listens to Swipes, Chrome Back Arrow, and Android Hardware Back
  @HostListener('window:popstate', ['$event'])
  onPopState(event: Event): void {
    if (this.isSkippingPop) {
      this.isSkippingPop = false; // Ignore our own manual silent pop
      return;
    }

    if (this.trapActive) {
      this.trapActive = false; // Browser popped it for us
      
      this.zone.run(() => {
        if (this.isViewingPastReceipt) {
           // If they were just looking at an old receipt, exit straight to step 1
           this.step = 1;
           this.isViewingPastReceipt = false;
        } else if (this.step > 1) {
           // If in wizard, go back 1 step
           this.step--;
           if (this.step > 1) {
              this.trapBrowserBackButton(); // Re-arm the trap for the next back swipe
           }
        }
      });
    }
  }

  // --- UI NAVIGATION METHODS --- //

  goBack(): void {
    if (this.trapActive) {
      // Trigger the native back event which executes onPopState flawlessly
      history.back();
    } else {
      this.location.back();
    }
  }

  goBackToEditing(): void {
    this.step = 2;
    // Notice we do NOT release the trap here. The user is still in the wizard,
    // so if they swipe back from step 2, they correctly go to step 1!
  }

  // --- EXISTING LOGIC --- //

  getEmptyReceipt(): Receipt {
    return {
      date: new Date().toISOString(),
      storeName: '',
      items: [],
      totals: {},
      status: 'DRAFT'
    };
  }

  resetToHouseholdSplitters(): void {
    this.activeSplitters = this.members.map(m => ({
      id: m.id!,
      name: m.name,
      imageUrl: m.imageUrl,
      isExtra: false
    }));
    this.recalculateEvenSplits();
  }

  recalculateEvenSplits(): void {
    const defaultSplit: number = 100 / this.activeSplitters.length;
    this.activeSplitters.forEach(s => {
        this.splitPercentages[s.id] = defaultSplit;
        this.memberTotals[s.id] = 0;
    });
  }

  loadSavedReceipts(): void {
    this.receiptService.getAllReceipts().subscribe({
      next: (receipts) => {
        this.pastReceipts = receipts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      },
      error: (err) => console.error("Error loading receipts:", err)
    });
  }

  onFileUpload(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file: File | null | undefined = target.files?.[0];
    if (file) {
      this.loading = true;
      this.receiptService.analyzeReceipt(file).subscribe({
        next: (res: any) => {
          this.currentReceipt.storeName = res.storeName || 'Magasin Inconnu';
          this.receiptTax = res.totalReceiptTaxes || 0.0;
          this.currentReceipt.items = res.items.map((item: any) => ({
            ...item,
            assignmentType: 'grocery'
          }));
          this.step = 2;
          this.isViewingPastReceipt = false;
          this.trapBrowserBackButton(); // Arm trap
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          if (err.status === 429) {
            this.messageService.add({severity:'warn', summary:'Limite atteinte', detail:'L\'IA doit faire une pause. Réessayez dans une minute.'});
          } else {
            this.messageService.add({severity:'error', summary:'Erreur', detail:'Impossible d\'analyser le reçu.'});
          }
        }
      });
    }
  }

  deleteItem(index: number): void {
    this.currentReceipt.items.splice(index, 1);
  }

  nextToCategorization(): void {
    this.step = 3;
    this.trapBrowserBackButton();
  }

  markAllAsGrocery(): void {
    this.currentReceipt.items.forEach((item: ReceiptItem) => item.assignmentType = 'grocery');
  }

  setAssignment(item: ReceiptItem, type: 'individual' | 'grocery' | 'split', assigneeId?: number): void {
    item.assignmentType = type;
    if (assigneeId !== undefined) {
      item.assigneeId = assigneeId;
    }
  }

  onSplitChange(changedId: number, newValue: number): void {
    if (newValue === null || newValue === undefined) return;
    this.splitPercentages[changedId] = newValue;
    
    if (this.activeSplitters.length === 2) {
      const otherPerson = this.activeSplitters.find(s => s.id !== changedId);
      if (otherPerson) {
        this.splitPercentages[otherPerson.id] = parseFloat((100 - newValue).toFixed(2));
      }
    }
  }

  openAddPerson(): void {
    this.newPersonName = '';
    this.showAddPersonDialog = true;
  }

  confirmAddPerson(): void {
    if (this.newPersonName.trim()) {
      const newId = -1 * (Math.floor(Math.random() * 100000) + 1);
      this.activeSplitters.push({
        id: newId,
        name: this.newPersonName.trim(),
        isExtra: true
      });
      this.recalculateEvenSplits();
      this.showAddPersonDialog = false;
    }
  }

  calculateTotals(): void {
    this.groceryTotal = 0;
    this.activeSplitters.forEach(s => {
        this.memberTotals[s.id] = 0;
    });

    const totalTaxableAmount = this.currentReceipt.items
      .filter(item => item.taxable)
      .reduce((sum, item) => sum + item.price, 0);

    this.currentReceipt.items.forEach((item: ReceiptItem) => {
      let finalPrice = item.price;

      if (item.taxable && totalTaxableAmount > 0) {
        finalPrice += (item.price / totalTaxableAmount) * (this.receiptTax || 0);
      }

      if (item.assignmentType === 'grocery') {
        this.groceryTotal += finalPrice;
      } else if (item.assignmentType === 'individual' && item.assigneeId !== undefined) {
        if (this.memberTotals[item.assigneeId] !== undefined) {
            this.memberTotals[item.assigneeId] += finalPrice;
        }
      } else if (item.assignmentType === 'split') {
        this.activeSplitters.forEach(s => {
            const splitAmount: number = finalPrice * ((this.splitPercentages[s.id] || 0) / 100);
            this.memberTotals[s.id] += splitAmount;
        });
      }
    });

    this.currentReceipt.totals = { grocery: this.groceryTotal };

    this.activeSplitters.forEach(s => {
      if (s.isExtra) {
         this.currentReceipt.totals[`EXTRA_${s.id}_${s.name}`] = this.memberTotals[s.id];
      } else {
         this.currentReceipt.totals[s.id.toString()] = this.memberTotals[s.id];
      }
      this.currentReceipt.totals[`SPLIT_PCT_${s.id}`] = this.splitPercentages[s.id];
    });

    this.step = 4;
    this.trapBrowserBackButton();
  }

  getGrandTotal(): number {
    let total = this.groceryTotal;
    this.activeSplitters.forEach(s => total += (this.memberTotals[s.id] || 0));
    return total;
  }

  reconstructExtrasFromReceipt(receipt: Receipt): void {
    this.resetToHouseholdSplitters();
    if (receipt.totals) {
      Object.keys(receipt.totals).forEach(key => {
        if (key.startsWith('EXTRA_')) {
          const parts = key.split('_');
          const id = parseInt(parts[1], 10);
          const name = parts.slice(2).join('_');
          if (!this.activeSplitters.find(s => s.id === id)) {
            this.activeSplitters.push({ id, name, isExtra: true });
          }
        }
      });

      let hasSavedPcts = false;
      this.activeSplitters.forEach(s => {
        const savedPct = receipt.totals[`SPLIT_PCT_${s.id}`];
        if (savedPct !== undefined) {
           this.splitPercentages[s.id] = savedPct;
           hasSavedPcts = true;
        }
      });

      if (!hasSavedPcts) {
        this.recalculateEvenSplits();
      }
    }
  }

  resumeReceipt(receipt: Receipt): void {
    this.currentReceipt = JSON.parse(JSON.stringify(receipt));
    this.reconstructExtrasFromReceipt(this.currentReceipt);
    this.step = 3;
    this.isViewingPastReceipt = false;
    this.trapBrowserBackButton();
  }

  viewReceipt(receipt: Receipt): void {
    this.currentReceipt = JSON.parse(JSON.stringify(receipt));
    this.reconstructExtrasFromReceipt(this.currentReceipt);
    
    this.groceryTotal = this.currentReceipt.totals['grocery'] || 0;
    this.activeSplitters.forEach(s => {
      if (s.isExtra) {
        this.memberTotals[s.id] = this.currentReceipt.totals[`EXTRA_${s.id}_${s.name}`] || 0;
      } else {
        this.memberTotals[s.id] = this.currentReceipt.totals[s.id.toString()] || 0;
      }
    });

    this.step = 4;
    this.isViewingPastReceipt = true;
    this.trapBrowserBackButton();
  }

  saveDraft(): void {
    this.currentReceipt.status = 'DRAFT';
    this.processSaveRequest('Brouillon sauvegardé avec succès.');
  }

  saveReceipt(): void {
    this.currentReceipt.status = 'COMPLETED';
    this.processSaveRequest('Facture finalisée et assignée!');
  }

  private processSaveRequest(successMessage: string): void {
    this.loading = true;

    const request = this.currentReceipt.id
      ? this.receiptService.updateReceipt(this.currentReceipt.id, this.currentReceipt)
      : this.receiptService.saveReceipt(this.currentReceipt);

    request.subscribe({
      next: () => {
        if (this.currentReceipt.status === 'COMPLETED' && this.groceryTotal > 0) {
          const currentUser = this.financeService.householdMembers().find(m => m.isCurrentUser);
          if (currentUser) {
            this.financeService.addGroceryTransaction({
              userId: currentUser.userId,
              storeName: this.currentReceipt.storeName || 'Épicerie',
              description: 'Facture scannée',
              amount: this.groceryTotal,
              transactionType: 'SPEND',
              date: new Date().toISOString()
            }).subscribe();
          }
        }

        this.releaseTrap(); 
        this.step = 1;
        this.isViewingPastReceipt = false;
        this.receiptTax = 0;
        this.currentReceipt = this.getEmptyReceipt();
        this.resetToHouseholdSplitters();
        this.loadSavedReceipts();
        this.messageService.add({severity:'success', summary:'Succès', detail: successMessage});
        this.loading = false;
      },
      error: () => {
         this.messageService.add({severity:'error', summary:'Erreur', detail:'Impossible de sauvegarder.'});
         this.loading = false;
      }
    });
  }
}