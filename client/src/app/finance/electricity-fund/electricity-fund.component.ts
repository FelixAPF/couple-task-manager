import { Component, inject, computed, OnInit, effect, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { SelectButtonModule } from 'primeng/selectbutton';
import { AvatarModule } from 'primeng/avatar';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { ChartModule } from 'primeng/chart';
import { TooltipModule } from 'primeng/tooltip';
import { FinanceService } from '../../service/finance.service';
import { ElectricityTransaction, HydroBill, ElectricityFund } from '../../model/finance.model';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-electricity-fund',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, 
    ButtonModule, DialogModule, InputTextModule, 
    InputNumberModule, CalendarModule, SelectButtonModule, 
    AvatarModule, TableModule, TabViewModule, ChartModule, RouterModule, TooltipModule
  ],
  templateUrl: './electricity-fund.component.html'
})
export class ElectricityFundComponent implements OnInit {
  public financeService = inject(FinanceService);
  private fb = inject(FormBuilder);
  Math = Math; 

  showTransactionDialog = false;
  showBillDialog = false;
  showCycleDialog = false;
  isSaving = false;
  
  // Wizard variables
  forceCycleSetup = false;
  private hasCheckedCycleValidity = false;

  selectedYear = new Date().getFullYear();
  availableYears: number[] = [];

  // --- Gestion du Cycle Hydro via Base de Données ---
  tempCycleDate: Date | null = null;
  tempCycleEndDate: Date | null = null;

  cycleStartDate = computed(() => {
    const fund = this.financeService.electricityFund();
    if (fund && fund.cycleStartDate) {
      return new Date(fund.cycleStartDate);
    }
    return new Date('2025-07-12T00:00:00');
  });

  cycleEndDate = computed(() => {
    const fund = this.financeService.electricityFund();
    if (fund && fund.cycleEndDate) {
      return new Date(fund.cycleEndDate);
    }
    // Par défaut, 1 an après la date de début si non configuré
    const d = new Date(this.cycleStartDate());
    d.setFullYear(d.getFullYear() + 1);
    return d;
  });

  // Formulaires
  transactionTypes = [
    { label: 'Paiement (Sortie)', value: 'SPEND' },
    { label: 'Dépôt (Entrée)', value: 'ADD' }
  ];

  transactionForm = this.fb.group({
    transactionType: ['SPEND', Validators.required],
    description: [''],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    date: [new Date(), Validators.required]
  });

  billForm = this.fb.group({
    periodStart: [null as Date | null, Validators.required],
    periodEnd: [null as Date | null, Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0)]],
    kwhConsumed: [null as number | null]
  });

  // --- Calculs de Données ---
  enrichedTransactions = computed(() => {
    const txs = this.financeService.electricityTransactions();
    const members = this.financeService.householdMembers();
    return txs.map(tx => {
      const user = members.find(m => String(m.userId) === String(tx.userId));
      return { ...tx, userIconUrl: user?.iconUrl, userName: user?.name || 'Système' };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  billsForSelectedYear = computed(() => {
    return this.financeService.hydroBills()
      .filter(b => new Date(b.periodEnd).getFullYear() === this.selectedYear)
      .sort((a, b) => new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime());
  });

  // --- Métriques Ajustées au Cycle ---
  totalPaidToHydro = computed(() => {
    const start = this.cycleStartDate().getTime();
    const end = this.cycleEndDate().getTime();
    
    return this.financeService.electricityTransactions()
      .filter(tx => {
        const txDate = new Date(tx.date).getTime();
        return tx.transactionType === 'SPEND' && txDate >= start && txDate <= end;
      })
      .reduce((sum, tx) => sum + tx.amount, 0);
  });

  totalActualConsumption = computed(() => {
    const start = this.cycleStartDate().getTime();
    const end = this.cycleEndDate().getTime();

    return this.financeService.hydroBills()
      .filter(bill => {
        const billDate = new Date(bill.periodEnd).getTime();
        return billDate >= start && billDate <= end;
      })
      .reduce((sum, bill) => sum + bill.amount, 0);
  });

  amountOwedToHydro = computed(() => {
    return this.totalActualConsumption() - this.totalPaidToHydro();
  });

  fixedMonthlyPayment = computed(() => {
    const exp = this.financeService.commonExpenses().find(e => e.targetFund === 'ELECTRICITY');
    return exp ? exp.amount : 0;
  });

  projectionData: any;

  constructor() {
    // Vérifier la validité du cycle dès que les données du fonds sont chargées
    effect(() => {
      const fund = this.financeService.electricityFund();
      if (fund && !this.hasCheckedCycleValidity) {
        this.hasCheckedCycleValidity = true;
        this.verifyCurrentDateInCycle();
      }
    });
  }

  ngOnInit(): void {
    if (!this.financeService.electricityFund()) {
      this.financeService.loadFinanceData();
    }
    this.generateAvailableYears();
    setTimeout(() => this.calculateProjections(), 500); 
  }

  verifyCurrentDateInCycle() {
    const now = new Date().getTime();
    const start = this.cycleStartDate().getTime();
    const end = this.cycleEndDate().getTime();

    // Si aujourd'hui n'est pas dans le cycle, forcer le wizard
    if (now < start || now > end) {
      this.forceCycleSetup = true;
      this.openCycleDialog();
    }
  }

  generateAvailableYears() {
    const currentYear = new Date().getFullYear();
    this.availableYears = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
  }

  changeYear(offset: number) {
    this.selectedYear += offset;
    this.calculateProjections();
  }

  // --- Sauvegarde API du Cycle ---
  openCycleDialog() {
    this.tempCycleDate = new Date(this.cycleStartDate());
    this.tempCycleEndDate = new Date(this.cycleEndDate());
    this.showCycleDialog = true;
  }

  saveCycle() {
    const currentFund = this.financeService.electricityFund();
    if (this.tempCycleDate && this.tempCycleEndDate && currentFund) {
      
      // Validation basique
      if (this.tempCycleDate.getTime() >= this.tempCycleEndDate.getTime()) {
        alert("La date de fin doit être ultérieure à la date de début.");
        return;
      }

      this.isSaving = true;
      
      const updatedFund: ElectricityFund = {
        ...currentFund,
        cycleStartDate: this.tempCycleDate.toISOString(),
        cycleEndDate: this.tempCycleEndDate.toISOString()
      };

      this.financeService.updateElectricityFund(updatedFund).subscribe({
        next: () => {
          this.showCycleDialog = false;
          this.forceCycleSetup = false;
          this.isSaving = false;
        },
        error: (err:any) => {
          console.error('Erreur lors de la sauvegarde du cycle', err);
          this.isSaving = false;
        }
      });
    }
  }


  // --- Transactions ---
  openTransactionDialog() {
    this.transactionForm.reset({
      transactionType: 'ADD',
      description: '',
      amount: null,
      date: new Date()
    });
    this.showTransactionDialog = true;
  }

  processAutoPayment() {
    const amount = this.fixedMonthlyPayment();
    if (amount <= 0) {
      alert("Aucun montant fixe configuré dans les Dépenses Communes pour l'Électricité.");
      return;
    }
    
    this.transactionForm.reset({
      transactionType: 'SPEND',
      description: `Paiement mensuel automatisé`,
      amount: amount,
      date: new Date()
    });
    this.showTransactionDialog = true;
  }

  saveTransaction() {
    if (this.transactionForm.invalid || this.isSaving) return;
    this.isSaving = true;

    const formValue = this.transactionForm.value;
    const currentUser = this.financeService.householdMembers().find(m => m.isCurrentUser);

    const newTx: ElectricityTransaction = {
      userId: currentUser?.userId || 'SYSTEM',
      description: formValue.description || 'Transaction',
      amount: formValue.amount!,
      transactionType: formValue.transactionType as 'ADD' | 'SPEND',
      date: formValue.date!.toISOString()
    };

    this.financeService.addElectricityTransaction(newTx).subscribe({
      next: () => {
        this.showTransactionDialog = false;
        this.isSaving = false;
      },
      error: () => this.isSaving = false
    });
  }

  deleteTransaction(tx: ElectricityTransaction) {
    if (tx.id && confirm('Supprimer cette transaction ?')) {
      this.financeService.deleteElectricityTransaction(tx.id).subscribe();
    }
  }

  // --- Factures (Bills) ---
  openBillDialog() {
    this.billForm.reset();
    this.showBillDialog = true;
  }

  saveBill() {
    if (this.billForm.invalid || this.isSaving) return;
    this.isSaving = true;

    const formValue = this.billForm.value;
    const newBill: HydroBill = {
      periodStart: formValue.periodStart!.toISOString(),
      periodEnd: formValue.periodEnd!.toISOString(),
      amount: formValue.amount!,
      kwhConsumed: formValue.kwhConsumed || undefined
    };

    this.financeService.addHydroBill(newBill).subscribe({
      next: () => {
        this.showBillDialog = false;
        this.isSaving = false;
        this.calculateProjections();
      },
      error: () => this.isSaving = false
    });
  }

  deleteBill(id?: string) {
    if (id && confirm('Supprimer cette facture de consommation ?')) {
      this.financeService.deleteHydroBill(id).subscribe(() => this.calculateProjections());
    }
  }

  // --- Projections ---
  calculateProjections() {
    const allBills = this.financeService.hydroBills();
    const monthlyAverages = new Map<number, number[]>();

    allBills.forEach(bill => {
      const month = new Date(bill.periodEnd).getMonth();
      if (!monthlyAverages.has(month)) monthlyAverages.set(month, []);
      monthlyAverages.get(month)!.push(bill.amount);
    });

    const labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const actualData: (number | null)[] = new Array(12).fill(null);
    const projectedData: (number | null)[] = new Array(12).fill(null);

    this.billsForSelectedYear().forEach(bill => {
      const month = new Date(bill.periodEnd).getMonth();
      actualData[month] = bill.amount;
    });

    for (let i = 0; i < 12; i++) {
      if (actualData[i] === null) {
        const history = monthlyAverages.get(i);
        if (history && history.length > 0) {
          const avg = history.reduce((a, b) => a + b, 0) / history.length;
          projectedData[i] = Math.round(avg * 100) / 100;
        }
      }
    }

    this.projectionData = {
      labels: labels,
      datasets: [
        {
          label: 'Consommation Réelle',
          data: actualData,
          backgroundColor: '#3b82f6', 
          borderRadius: 4
        },
        {
          label: 'Projection Estimée',
          data: projectedData,
          backgroundColor: '#9ca3af', 
          borderDash: [5, 5],
          borderRadius: 4
        }
      ]
    };
  }
}