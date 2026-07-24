import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { FinanceService } from '../../service/finance.service';
import { PersonalExpense } from '../../model/finance.model';

@Component({
  selector: 'app-personal-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ButtonModule, InputTextModule, InputNumberModule, DropdownModule],
  templateUrl: './personal-expenses.component.html'
})
export class PersonalExpensesComponent {
  public financeService = inject(FinanceService);

  get expenses() { return this.financeService.personalExpenses(); }

  bankAccountOptions = computed(() => {
    return this.financeService.bankAccounts().map(bank => ({
      label: bank.name,
      value: bank.id,
      items: bank.subAccounts.map(sub => ({ label: sub.name, value: sub.id }))
    }));
  });

  frequencies = ['Hebdomadaire', 'Aux 2 semaines', 'Mensuel', 'Annuel'];

  addExpense() {
    const newExp: PersonalExpense = { id: '', name: 'Nouveau', amount: 0, frequency: 'Mensuel', targetBankAccountId: '', targetSubAccountId: '' };
    this.financeService.addPersonalExpense(newExp).subscribe();
  }

  saveExpense(expense: PersonalExpense) {
    if (expense.id) {
      this.financeService.updatePersonalExpense(expense).subscribe();
    }
  }

  removeExpense(id: string) {
    if (id) {
      this.financeService.deletePersonalExpense(id).subscribe();
    }
  }

  onSubAccountChange(expense: PersonalExpense, subAccountId: string) {
    const banks = this.financeService.bankAccounts();
    for (const bank of banks) {
      if (bank.subAccounts.some(s => s.id === subAccountId)) {
        expense.targetBankAccountId = bank.id;
        this.saveExpense(expense);
        break;
      }
    }
  }
}