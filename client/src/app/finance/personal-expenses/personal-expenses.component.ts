import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { FinanceService } from '../../service/finance.service';
import { PersonalExpense } from '../../model/finance.model';

@Component({
  selector: 'app-personal-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ButtonModule, InputTextModule, InputNumberModule, DropdownModule, CheckboxModule],
  templateUrl: './personal-expenses.component.html'
})
export class PersonalExpensesComponent {
  public financeService = inject(FinanceService);

  frequencies = [
    { label: 'Hebdomadaire', value: 'Hebdomadaire' },
    { label: 'Aux 2 semaines', value: 'Aux 2 semaines' },
    { label: 'Mensuel', value: 'Mensuel' },
    { label: 'Annuel', value: 'Annuel' }
  ];

  get expenses() { return this.financeService.personalExpenses(); }

  get bankOptions() {
    const options = this.financeService.bankAccounts().map(b => ({ label: b.name, value: b.id }));
    return [{ label: 'Compte Conjoint', value: 'JOINT_ACCOUNT' }, ...options];
  }

  getSubAccountOptions(bankId: string) {
    if (bankId === 'JOINT_ACCOUNT') {
        return [{ label: 'Transfert Direct', value: 'JOINT_ACCOUNT_SUB' }];
    }
    const bank = this.financeService.bankAccounts().find(b => b.id === bankId);
    return bank ? bank.subAccounts.map(s => ({ label: s.name, value: s.id })) : [];
  }

  addExpense() {
    const newExp: PersonalExpense = { 
        id: '', 
        name: 'Nouvelle dépense', 
        amount: 0, 
        frequency: 'Mensuel', 
        targetBankAccountId: 'JOINT_ACCOUNT', 
        targetSubAccountId: 'JOINT_ACCOUNT_SUB',
        isGrocery: false
    };
    this.financeService.addPersonalExpense(newExp).subscribe();
  }

  onBankChange(expense: PersonalExpense) {
    if (expense.targetBankAccountId === 'JOINT_ACCOUNT') {
        expense.targetSubAccountId = 'JOINT_ACCOUNT_SUB';
    } else {
        const subOptions = this.getSubAccountOptions(expense.targetBankAccountId);
        expense.targetSubAccountId = subOptions.length > 0 ? subOptions[0].value : '';
    }
    this.saveExpense(expense);
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
}