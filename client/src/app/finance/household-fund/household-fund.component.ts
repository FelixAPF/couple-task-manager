import { Component, inject, computed, OnInit, effect } from '@angular/core';
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
import { ChartModule } from 'primeng/chart';
import { FinanceService } from '../../service/finance.service';
import { GroceryTransaction, HouseholdTransaction } from '../../model/finance.model';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-household-fund',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, 
    ButtonModule, CardModule, DialogModule, 
    InputTextModule, InputNumberModule, CalendarModule, 
    SelectButtonModule, AvatarModule, ChartModule, RouterModule
  ],
  templateUrl: './household-fund.component.html'
})
export class HouseholdFundComponent implements OnInit {
  public financeService = inject(FinanceService);
  private fb = inject(FormBuilder);

  showTransactionDialog = false;
  
  // Chart variables
  chartData: any;
  chartOptions: any;
  isSaving: boolean = false;
  budgetTarget: number = parseInt(localStorage.getItem('householdBudgetTarget') || '800', 10);
  
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
  const txs = this.financeService.householdTransactions();
  const members = this.financeService.householdMembers();

  return txs.map(tx => {
    const user = members.find(m => String(m.userId) === String(tx.userId));
    return {
      ...tx,
      userIconUrl: user?.iconUrl, // undefined instead of '' when not found yet
      userName: user?.name || 'Inconnu'
    };
  });
});

  constructor() {
    effect(() => {
      this.updateChartData();
    });
  }

  ngOnInit(): void {
    if (!this.financeService.householdFund()) {
      this.financeService.loadFinanceData();
    }
  }

  updateBudgetTarget() {
    if (this.budgetTarget) {
      localStorage.setItem('householdBudgetTarget', this.budgetTarget.toString());
      this.updateChartData(); // Refresh the chart to adjust the line
    }
  }

  updateChartData() {
    const txs = this.financeService.householdTransactions();
    const spendingByMonth = new Map<string, number>();
    
    // Sort oldest to newest for chronological chart order
    const sortedTxs = [...txs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedTxs.forEach(tx => {
      if (tx.transactionType === 'SPEND') {
        const d = new Date(tx.date);
        const monthYear = d.toLocaleString('fr-CA', { month: 'short', year: 'numeric' });
        const current = spendingByMonth.get(monthYear) || 0;
        spendingByMonth.set(monthYear, current + tx.amount);
      }
    });

    const labels = Array.from(spendingByMonth.keys());
    const data = Array.from(spendingByMonth.values());

    this.chartData = {
      labels: labels,
      datasets: [
        {
          type: 'line',
          label: 'Budget Mensuel',
          data: labels.map(() => this.budgetTarget),
          borderColor: '#f59e0b', // Amber color for the target line
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
          tension: 0.4
        },
        {
          type: 'bar',
          label: 'Dépenses',
          data: data,
          backgroundColor: '#10b981', // Emerald green
          borderRadius: 6
        }
      ]
    };

    this.chartOptions = {
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value: any) {
              return value + ' $';
            }
          }
        }
      }
    };
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
    if (this.transactionForm.invalid || this.isSaving) return;

    this.isSaving = true; // Lock the button

    const formValue = this.transactionForm.value;
    const currentUser = this.financeService.householdMembers().find(m => m.isCurrentUser);

    if (!currentUser) {
      this.isSaving = false;
      return;
    }

    const newTx: HouseholdTransaction = {
      userId: currentUser.userId,
      storeName: formValue.storeName!,
      description: formValue.description || '',
      amount: formValue.amount!,
      transactionType: formValue.transactionType as 'ADD' | 'SPEND',
      date: formValue.date!.toISOString()
    };

    this.financeService.addHouseholdTransaction(newTx).subscribe({
      next: () => {
        this.showTransactionDialog = false;
        this.isSaving = false; // Unlock on success
      },
      error: (err) => {
        console.error('Error saving transaction', err);
        this.isSaving = false; // Unlock on error
      }
    });
  }
  deleteTransaction(tx: HouseholdTransaction) {
    if (tx.id && confirm('Êtes-vous sûr de vouloir supprimer cette transaction ? Le solde sera ajusté.')) {
      this.financeService.deleteHouseholdTransaction(tx.id).subscribe();
    }
  }
}