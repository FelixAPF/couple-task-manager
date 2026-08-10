import { Component, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { SelectButtonModule } from 'primeng/selectbutton';
import { AvatarModule } from 'primeng/avatar';
import { FinanceService } from '../../service/finance.service';
import { GroceryTransaction } from '../../model/finance.model';

@Component({
  selector: 'app-grocery-fund',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, 
    ButtonModule, CardModule, DialogModule, 
    InputTextModule, InputNumberModule, CalendarModule, 
    SelectButtonModule, AvatarModule
  ],
  templateUrl: './grocery-fund.component.html'
})
export class GroceryFundComponent implements OnInit {
  public financeService = inject(FinanceService);
  private fb = inject(FormBuilder);

  showTransactionDialog = false;
  
  transactionTypes = [
    { label: 'Dépense', value: 'SPEND' },
    { label: 'Ajout', value: 'ADD' }
  ];

  transactionForm = this.fb.group({
    transactionType: ['SPEND', Validators.required],
    storeName: ['', Validators.required],
    description: [''],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    date: [new Date(), Validators.required]
  });

enrichedTransactions = computed(() => {
    const txs = this.financeService.groceryTransactions();
    const members = this.financeService.householdMembers();
    
    return txs.map(tx => {
      // FIX: Use String() to prevent strict equality mismatch between numbers and strings
      const user = members.find(m => String(m.userId) === String(tx.userId));
      return {
        ...tx,
        userIconUrl: user?.iconUrl || '',
        userName: user?.name || 'Inconnu'
      };
    });
  });

  deleteTransaction(tx: GroceryTransaction) {
    if (tx.id && confirm('Êtes-vous sûr de vouloir supprimer cette transaction ? Le solde sera ajusté.')) {
      this.financeService.deleteGroceryTransaction(tx.id).subscribe();
    }
  }

  ngOnInit(): void {
    // If arriving directly, ensure data is loaded
    if (!this.financeService.groceryFund()) {
      this.financeService.loadFinanceData();
    }
  }

  openTransactionDialog() {
    this.transactionForm.reset({
      transactionType: 'SPEND',
      storeName: '',
      description: '',
      amount: null,
      date: new Date()
    });
    this.showTransactionDialog = true;
  }

  saveTransaction() {
    if (this.transactionForm.invalid) return;

    const formValue = this.transactionForm.value;
    const currentUser = this.financeService.householdMembers().find(m => m.isCurrentUser);

    if (!currentUser) return; // Add proper error handling in your environment

    const newTx: GroceryTransaction = {
      userId: currentUser.userId,
      storeName: formValue.storeName!,
      description: formValue.description || '',
      amount: formValue.amount!,
      transactionType: formValue.transactionType as 'ADD' | 'SPEND',
      date: formValue.date!.toISOString()
    };

    this.financeService.addGroceryTransaction(newTx).subscribe(() => {
      this.showTransactionDialog = false;
    });
  }
}