import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { Receipt, ReceiptItem } from '../model/receipt';
import { HouseholdMember, Household } from '../model/household';
import { HouseholdService } from '../service/household.service';
import { ReceiptService } from '../service/receipt.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-receipt-splitter',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, ToastModule, TooltipModule],
  templateUrl: './recipe-splitter.component.html',
  providers: [MessageService]
})
export class ReceiptSplitterComponent implements OnInit {
  step: number = 1;
  householdId: number | undefined;
  members: HouseholdMember[] = [];
  currentReceipt: Receipt = this.getEmptyReceipt();
  splitPercentages: Record<number, number> = {};
  groceryTotal: number = 0;
  memberTotals: Record<number, number> = {};
  loading: boolean = false;
  pastReceipts: Receipt[] = [];
  receiptTax: number = 0;

  constructor(
    private householdService: HouseholdService,
    private receiptService: ReceiptService,
    private messageService: MessageService
  ) {}

ngOnInit(): void {
    this.householdService.retrieveHousehold().subscribe((h: Household | null) => {
      // 1. Check if the household AND its ID exist
      console.log("Household is ", h);
      if(h === null) return;
      
        
      // BOOM: Fetch the receipts immediately now that we have the ID!
      this.loadSavedReceipts();

      // 2. Handle the members completely separately
      if (h.members && h.members.length > 0) {
        this.members = h.members;
        const defaultSplit: number = 100 / this.members.length;
        
        this.members.forEach((m: HouseholdMember) => {
          if (m.id !== undefined) {
              this.splitPercentages[m.id] = defaultSplit;
              this.memberTotals[m.id] = 0;
          }
        });
      }
      
    });
  }

getEmptyReceipt(): Receipt {
    return { 
      date: new Date().toISOString(), 
      storeName: '', 
      items: [], 
      totals: {}, 
      status: 'DRAFT',
      householdId: this.householdId // <--- Ensure new receipts get the ID
    };
  }

  loadSavedReceipts(): void {
      // Just ask the backend for "my" receipts. The backend handles the security!
      this.receiptService.getAllReceipts().subscribe({
        next: (receipts) => {
          this.pastReceipts = receipts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        },
        error: (err) => {
          console.error("Error loading receipts:", err);
        }
      });
  }

  onFileUpload(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file: File | null | undefined = target.files?.[0];
    if (file) {
      this.loading = true;
      this.receiptService.analyzeReceipt(file).subscribe({
        next: (items: ReceiptItem[]) => {
          this.currentReceipt.items = items.map(item => ({
            ...item,
            assignmentType: 'grocery'
          }));
          this.step = 2;
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

  calculateTotals(): void {
    this.groceryTotal = 0;
    this.members.forEach((m: HouseholdMember) => {
        if (m.id !== undefined) {
            this.memberTotals[m.id] = 0;
        }
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
        this.memberTotals[item.assigneeId] += finalPrice;
      } else if (item.assignmentType === 'split') {
        this.members.forEach((m: HouseholdMember) => {
          if (m.id !== undefined) {
              const splitAmount: number = finalPrice * (this.splitPercentages[m.id] / 100);
              this.memberTotals[m.id] += splitAmount;
          }
        });
      }
    });

    this.currentReceipt.totals = {
      grocery: this.groceryTotal,
      ...this.memberTotals
    };
    this.step = 4;
  }

  getGrandTotal(): number {
    let total = this.groceryTotal;
    Object.values(this.memberTotals).forEach(val => total += val);
    return total;
  }

resumeReceipt(receipt: Receipt): void {
    // Deep copy to prevent mutating the array directly before saving
    this.currentReceipt = JSON.parse(JSON.stringify(receipt));
    this.step = 3; 
  }

  viewReceipt(receipt: Receipt): void {
    this.currentReceipt = JSON.parse(JSON.stringify(receipt));
    
    // Restore the grocery total from the database
    this.groceryTotal = this.currentReceipt.totals['grocery'] || 0;

    // Restore each member's total from the database
    this.members.forEach((m: HouseholdMember) => {
      if (m.id !== undefined) {
        // The database stores map keys as strings, so we check both number and string forms
        this.memberTotals[m.id] = this.currentReceipt.totals[m.id] || this.currentReceipt.totals[m.id.toString()] || 0;
      }
    });

    // Jump straight to the Summary screen
    this.step = 4; 
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
    
    // <--- CRITICAL FIX: Force the household ID right before saving
    this.currentReceipt.householdId = this.householdId; 

    const request = this.currentReceipt.id 
      ? this.receiptService.updateReceipt(this.currentReceipt.id, this.currentReceipt)
      : this.receiptService.saveReceipt(this.currentReceipt);

    request.subscribe({
      next: () => {
        this.messageService.add({severity:'success', summary:'Succès', detail: successMessage});
        this.step = 1;
        this.receiptTax = 0;
        this.currentReceipt = this.getEmptyReceipt();
        this.loadSavedReceipts();
        this.loading = false;
      },
      error: () => {
         this.messageService.add({severity:'error', summary:'Erreur', detail:'Impossible de sauvegarder.'});
         this.loading = false;
      }
    });
  }
}