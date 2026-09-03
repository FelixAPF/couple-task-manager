import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { RadioButtonModule } from 'primeng/radiobutton';
import { AvatarModule } from 'primeng/avatar';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { FinanceService } from '../../service/finance.service';
import { CommonExpense, HouseholdMemberFinance } from '../../model/finance.model';

@Component({
  selector: 'app-household-expenses',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule, ButtonModule,
    InputTextModule, InputNumberModule, RadioButtonModule,
    AvatarModule, DropdownModule, TooltipModule, TranslateModule, DragDropModule
  ],
  templateUrl: './household-expenses.component.html'
})
export class HouseholdExpensesComponent {
  public financeService = inject(FinanceService);

  searchTerm = signal<string>('');
  selectedFundFilter = signal<string>('ALL');

  quickPalette = [
    '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f43f5e', '#64748b'
  ];

  fundOptions = [
    { label: 'Aucun (Défaut)', value: 'NONE' },
    { label: 'Fonds d\'épicerie', value: 'GROCERY' },
    { label: 'Fonds Commun (Ménage)', value: 'HOUSEHOLD' },
    { label: 'Fonds Électricité', value: 'ELECTRICITY' }
  ];

  get members() { return this.financeService.householdMembers(); }

  filteredExpenses = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const fund = this.selectedFundFilter();
    const list = this.financeService.commonExpenses();

    return list.filter(exp => {
      const matchSearch = !term || (exp.name && exp.name.toLowerCase().includes(term));
      const matchFund = fund === 'ALL' || exp.targetFund === fund;
      return matchSearch && matchFund;
    });
  });
  

  totalHouseholdMonthly = computed(() => {
    return this.financeService.commonExpenses().reduce((sum, exp) => sum + (exp.amount || 0), 0);
  });

  yourShareMonthly = computed(() => {
    const members = this.financeService.householdMembers();
    const me = members.find(m => m.isCurrentUser) || members[0];
    const myPercentage = me ? me.proratedPercentage : 50;

    return this.financeService.commonExpenses().reduce((sum, exp) => {
      if (exp.splitType === 'EQUAL') {
        return sum + ((exp.amount || 0) / 2);
      } else {
        return sum + ((exp.amount || 0) * (myPercentage / 100));
      }
    }, 0);
  });

  yourSharePerPaycheck = computed(() => {
    const config = this.financeService.paycheckConfig();
    const monthly = this.yourShareMonthly();
    if (!config) return monthly / 2;
    if (config.cycle === '14_DAYS' || config.cycle === 'TWICE_MONTHLY') {
      return (monthly * 12) / 24;
    }
    return monthly;
  });

  getWeight(expense: CommonExpense): number {
    const total = this.totalHouseholdMonthly();
    if (total <= 0) return 0;
    return Math.round(((expense.amount || 0) / total) * 100);
  }

  addExpense() {
    const newExp: CommonExpense = {
      id: '',
      name: 'Nouvelle dépense',
      amount: 0,
      splitType: 'EQUAL',
      targetFund: 'NONE',
      color: this.quickPalette[Math.floor(Math.random() * this.quickPalette.length)],
      orderIndex: this.financeService.commonExpenses().length
    };
    this.financeService.addCommonExpense(newExp).subscribe();
  }

  saveExpense(expense: CommonExpense) {
    if (expense.id) {
      this.financeService.updateCommonExpense(expense).subscribe();
    }
  }

  setColor(expense: CommonExpense, color: string) {
    expense.color = color;
    this.saveExpense(expense);
  }

  removeExpense(id: string) {
    if (id) {
      this.financeService.deleteCommonExpense(id).subscribe();
    }
  }

  updateMemberRatio(member: HouseholdMemberFinance) {
    this.financeService.updateMemberRatio(member.userId, member.proratedPercentage).subscribe();
  }

  moveUp(index: number, event?: Event) {
    if (event) event.stopPropagation();
    if (index <= 0) return;
    const currentList = [...this.financeService.commonExpenses()];
    const temp = currentList[index];
    currentList[index] = currentList[index - 1];
    currentList[index - 1] = temp;
    this.persistOrder(currentList.map(e => e.id));
  }

  moveDown(index: number, event?: Event) {
    if (event) event.stopPropagation();
    const currentList = [...this.financeService.commonExpenses()];
    if (index >= currentList.length - 1) return;
    const temp = currentList[index];
    currentList[index] = currentList[index + 1];
    currentList[index + 1] = temp;
    this.persistOrder(currentList.map(e => e.id));
  }

  onDrop(event: CdkDragDrop<CommonExpense[]>) {
    const currentList = [...this.financeService.commonExpenses()];
    moveItemInArray(currentList, event.previousIndex, event.currentIndex);
    this.persistOrder(currentList.map(e => e.id));
  }

  private persistOrder(orderedIds: string[]) {
    const map = new Map(this.financeService.commonExpenses().map(e => [e.id, e]));
    const reordered = orderedIds.map(id => map.get(id)!).filter(Boolean);
    this.financeService.commonExpenses.set(reordered);

    // Save to Database
    this.financeService.reorderCommonExpenses(orderedIds).subscribe();
  }

  trackById(index: number, item: CommonExpense): string {
    return item.id;
  }
}