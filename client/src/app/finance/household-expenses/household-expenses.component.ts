import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { RadioButtonModule } from 'primeng/radiobutton';
import { AvatarModule } from 'primeng/avatar';
import { DropdownModule } from 'primeng/dropdown';
import { FinanceService } from '../../service/finance.service';
import { CommonExpense, HouseholdMemberFinance } from '../../model/finance.model';

@Component({
  selector: 'app-household-expenses',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule, ButtonModule, 
    InputTextModule, InputNumberModule, RadioButtonModule, 
    AvatarModule, DropdownModule
  ],
  templateUrl: './household-expenses.component.html'
})
export class HouseholdExpensesComponent {
  public financeService = inject(FinanceService);

  fundOptions = [
    { label: 'Aucun (Défaut)', value: 'NONE' },
    { label: 'Fonds d\'Épicerie', value: 'GROCERY' },
    { label: 'Fonds Commun (Ménage)', value: 'HOUSEHOLD' },
    { label: 'Fonds Électricité', value: 'ELECTRICITY' }
  ];

  get expenses() { return this.financeService.commonExpenses(); }
  get members() { return this.financeService.householdMembers(); }

  updateMemberRatio(member: HouseholdMemberFinance) {
    this.financeService.updateMemberRatio(member.userId, member.proratedPercentage).subscribe();
  }

  addExpense() {
    const newExp: CommonExpense = { 
        id: '', 
        name: 'Nouvelle dépense', 
        amount: 0, 
        splitType: 'EQUAL',
        targetFund: 'NONE'
    };
    this.financeService.addCommonExpense(newExp).subscribe();
  }

  saveExpense(expense: CommonExpense) {
    if (expense.id) {
      this.financeService.updateCommonExpense(expense).subscribe();
    }
  }

  removeExpense(id: string) {
    if (id) {
      this.financeService.deleteCommonExpense(id).subscribe();
    }
  }
}