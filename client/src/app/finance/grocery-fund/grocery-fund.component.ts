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
import { GroceryTransaction } from '../../model/finance.model';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-grocery-fund',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, 
    ButtonModule, CardModule, DialogModule, 
    InputTextModule, InputNumberModule, CalendarModule, 
    SelectButtonModule, AvatarModule, ChartModule, RouterModule
  ],
  templateUrl: './grocery-fund.component.html'
})
export class GroceryFundComponent implements OnInit {
  public financeService = inject(FinanceService);
  private fb = inject(FormBuilder);

  showTransactionDialog = false;
  showConfigDialog = false;
  configAnchorDate: Date = new Date();
  configCycleLength: number = 14;
  
  // Chart variables
  chartData: any;
  chartOptions: any;
  isSaving: boolean = false;
  budgetTarget: number = parseInt(localStorage.getItem('groceryBudgetTarget') || '800', 10);
  
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
    const user = members.find(m => String(m.userId) === String(tx.userId));
    return {
      ...tx,
      userIconUrl: user?.iconUrl, // undefined instead of '' when not found yet
      userName: user?.name || 'Inconnu'
    };
  });
});

parseLocalDate(dateString: string | Date | null | undefined): Date {
    if (!dateString) return new Date();
    // If it's already a Date object, return it
    if (dateString instanceof Date) return dateString;
    
    // Split the string and force it into local time at midnight
    const [year, month, day] = dateString.split('T')[0].split('-');
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  constructor() {
    effect(() => {
      this.updateChartData();
    });
  }

  ngOnInit(): void {
    if (!this.financeService.groceryFund()) {
      this.financeService.loadFinanceData();
    }
  }
openConfig() {
    const currentFund = this.financeService.groceryFund();
    if (currentFund) {
      if (currentFund.cycleAnchorDate) {
        // Split the YYYY-MM-DD string and build a local date to prevent timezone shifting
        const [year, month, day] = currentFund.cycleAnchorDate.split('-');
        this.configAnchorDate = new Date(Number(year), Number(month) - 1, Number(day));
      } else {
        this.configAnchorDate = new Date();
      }
      
      this.configCycleLength = currentFund.cycleLengthDays || 14;
    }
    this.showConfigDialog = true;
  }
saveConfig() {
    console.log("Sauvegarder clicked! Preparing to send to backend...");

    // 1. Calculate date string (YYYY-MM-DD) safely
    const offset = this.configAnchorDate.getTimezoneOffset() * 60000;
    const localDateString = new Date(this.configAnchorDate.getTime() - offset).toISOString().split('T')[0];

    // 2. Build the payload (fallback to empty object if currentFund is missing)
    const currentFund = this.financeService.groceryFund() || {};
    const updatedFund: any = {
      ...currentFund,
      cycleAnchorDate: localDateString,
      cycleLengthDays: this.configCycleLength
    };

    console.log("Sending payload:", updatedFund);

    // 3. Send and handle errors
    this.financeService.updateGroceryFund(updatedFund).subscribe({
      next: (res) => {
        console.log("Success! Backend responded with:", res);
        this.showConfigDialog = false;
        // Force reload transactions to reflect the new cycle
        this.financeService.loadFinanceData();
      },
      error: (err) => {
        console.error("Backend Error:", err);
        alert("Erreur lors de la sauvegarde. Vérifiez la console (F12) pour les détails.");
      }
    });
  }

  updateBudgetTarget() {
    if (this.budgetTarget) {
      localStorage.setItem('groceryBudgetTarget', this.budgetTarget.toString());
      this.updateChartData(); // Refresh the chart to adjust the line
    }
  }

  updateChartData() {
    const txs = this.financeService.groceryTransactions();
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

    const newTx: GroceryTransaction = {
      userId: currentUser.userId,
      storeName: formValue.storeName!,
      description: formValue.description || '',
      amount: formValue.amount!,
      transactionType: formValue.transactionType as 'ADD' | 'SPEND',
      date: formValue.date!.toISOString()
    };

    this.financeService.addGroceryTransaction(newTx).subscribe({
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
  deleteTransaction(tx: GroceryTransaction) {
    if (tx.id && confirm('Êtes-vous sûr de vouloir supprimer cette transaction ? Le solde sera ajusté.')) {
      this.financeService.deleteGroceryTransaction(tx.id).subscribe();
    }
  }
}