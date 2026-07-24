import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FinanceService } from '../../service/finance.service';
import { BankAccount } from '../../model/finance.model';

@Component({
  selector: 'app-bank-accounts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ButtonModule, InputTextModule],
  templateUrl: './bank-accounts.component.html'
})
export class BankAccountsComponent {
  public financeService = inject(FinanceService);

  get banks() { return this.financeService.bankAccounts(); }

  addBank() {
    this.financeService.addBankAccount({ id: '', name: 'Nouvelle Banque', subAccounts: [] }).subscribe();
  }

  updateBank(bank: BankAccount) {
    if (bank.id) {
      this.financeService.updateBankAccount(bank).subscribe();
    }
  }

  removeBank(id: string) {
    if (id) this.financeService.deleteBankAccount(id).subscribe();
  }

  addSubAccount(bankId: string) {
    this.financeService.addSubAccount(bankId, { id: '', name: 'Nouveau sous-compte' }).subscribe();
  }

  updateSubAccount(bank: BankAccount) {
    if (bank.id) {
      this.financeService.updateBankAccount(bank).subscribe();
    }
  }

  removeSubAccount(bankId: string, subId: string) {
    if (bankId && subId) {
      this.financeService.deleteSubAccount(bankId, subId).subscribe();
    }
  }
}