import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { FinanceService } from '../../service/finance.service';
import { PersonalExpense } from '../../model/finance.model';

@Component({
  selector: 'app-personal-expenses',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule, ButtonModule,
    InputTextModule, InputNumberModule, DropdownModule, CheckboxModule,
    TooltipModule, TranslateModule, DragDropModule
  ],
  templateUrl: './personal-expenses.component.html'
})
export class PersonalExpensesComponent {
  public financeService = inject(FinanceService);

  searchTerm = signal<string>('');
  selectedFrequency = signal<string>('ALL');

  quickPalette = [
    '#3b82f6', '#10b981', '#f59e0b', '#ec4899',
    '#8b5cf6', '#06b6d4', '#f97316', '#64748b'
  ];
  frequencies = [
    { label: 'Deux fois par mois', value: 'Deux fois par mois' },
    { label: 'Mensuel', value: 'Mensuel' },
    { label: 'Aux 2 semaines', value: 'Aux 2 semaines' },
    { label: 'Hebdomadaire', value: 'Hebdomadaire' },
    { label: 'Annuel', value: 'Annuel' }
  ];

  filteredExpenses = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const freq = this.selectedFrequency();
    const list = this.financeService.personalExpenses();

    return list.filter(exp => {
      const matchSearch = !term || (exp.name && exp.name.toLowerCase().includes(term));
      const matchFreq = freq === 'ALL' || exp.frequency === freq;
      return matchSearch && matchFreq;
    });
  });

  totalMonthly = computed(() => {
    return this.financeService.personalExpenses().reduce((sum, exp) => {
      return sum + this.normalizeToMonthly(exp.amount || 0, exp.frequency);
    }, 0);
  });

  totalPerPaycheck = computed(() => {
    const config = this.financeService.paycheckConfig();
    const monthly = this.totalMonthly();
    if (!config) return monthly / 2;
    if (config.cycle === '14_DAYS' || config.cycle === 'TWICE_MONTHLY') {
      return (monthly * 12) / 24;
    }
    return monthly;
  });

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

normalizeToMonthly(amount: number, frequency: string): number {
    const f = (frequency || '').toLowerCase().trim();
    if (f.includes('hebdo')) return (amount || 0) * 4;
    if (f.includes('2 semaines') || f.includes('deux fois') || f.includes('bi')) return (amount || 0) * 2;
    if (f.includes('annuel') || f.includes('year')) return (amount || 0) / 12;
    return amount || 0;
  }

  getWeight(expense: PersonalExpense): number {
    const total = this.totalMonthly();
    if (total <= 0) return 0;
    const monthlyAmount = this.normalizeToMonthly(expense.amount || 0, expense.frequency);
    return Math.round((monthlyAmount / total) * 100);
  }

  addExpense() {
    const newExp: PersonalExpense = {
      id: '',
      name: 'Nouvelle dépense',
      amount: 0,
      frequency: 'Mensuel',
      targetBankAccountId: 'JOINT_ACCOUNT',
      targetSubAccountId: 'JOINT_ACCOUNT_SUB',
      isGrocery: false,
      color: this.quickPalette[Math.floor(Math.random() * this.quickPalette.length)],
      orderIndex: this.financeService.personalExpenses().length
    };
    this.financeService.addPersonalExpense(newExp).subscribe();
  }

  saveExpense(expense: PersonalExpense) {
    if (expense.id) {
      this.financeService.updatePersonalExpense(expense).subscribe();
    }
  }

  setColor(expense: PersonalExpense, color: string) {
    expense.color = color;
    this.saveExpense(expense);
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

  removeExpense(id: string) {
    if (id) {
      this.financeService.deletePersonalExpense(id).subscribe();
    }
  }

  moveUp(index: number, event?: Event) {
    if (event) event.stopPropagation();
    if (index <= 0) return;
    const currentList = [...this.financeService.personalExpenses()];
    const temp = currentList[index];
    currentList[index] = currentList[index - 1];
    currentList[index - 1] = temp;
    this.persistOrder(currentList.map(e => e.id));
  }

  moveDown(index: number, event?: Event) {
    if (event) event.stopPropagation();
    const currentList = [...this.financeService.personalExpenses()];
    if (index >= currentList.length - 1) return;
    const temp = currentList[index];
    currentList[index] = currentList[index + 1];
    currentList[index + 1] = temp;
    this.persistOrder(currentList.map(e => e.id));
  }

  onDrop(event: CdkDragDrop<PersonalExpense[]>) {
    const currentList = [...this.financeService.personalExpenses()];
    moveItemInArray(currentList, event.previousIndex, event.currentIndex);
    this.persistOrder(currentList.map(e => e.id));
  }

  private persistOrder(orderedIds: string[]) {
    // Optimistic local update so UI reflects immediately
    const map = new Map(this.financeService.personalExpenses().map(e => [e.id, e]));
    const reordered = orderedIds.map(id => map.get(id)!).filter(Boolean);
    this.financeService.personalExpenses.set(reordered);

    // Save to Database
    this.financeService.reorderPersonalExpenses(orderedIds).subscribe();
  }

  trackById(index: number, item: PersonalExpense): string {
    return item.id;
  }
}