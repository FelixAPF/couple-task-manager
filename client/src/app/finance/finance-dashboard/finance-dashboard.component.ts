import { Component, inject, OnInit, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { FinanceService } from '../../service/finance.service';
import { TransferCompilation } from '../../model/finance.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-finance-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ChartModule, ButtonModule, DialogModule, TooltipModule],
  templateUrl: './finance-dashboard.component.html'
})
export class FinanceDashboardComponent implements OnInit {
  public financeService = inject(FinanceService);
  private router = inject(Router);

  chartData: any;
  chartOptions: any;

  daysUntilPaycheck: number = -1;
  pendingPaycheckDate: Date | null = null;
  
  showPaycheckWizard: boolean = false;
  wizardStep: number = 1;
  
  jointTransferAmount: number = 0;
  groceryTransferAmount: number = 0;
  electricityTransferAmount: number = 0;
  householdTransferAmount: number = 0;
  personalTransfers: TransferCompilation[] = [];
  remainingAmount: number = 0;

  showSetupDialog: boolean = false;
  setupDialogMessage: string = '';
  setupConfirmLabel: string = '';
  setupConfirmRoute: string = '';
  currentSetupStepId: string = '';

  get userCarBrand(){ return 'tesla';}
  get userCarModel(){ return 'model 3'; }
  get userCarYear(){ return '2023'; }

  get carModelSlug(): string {
    return this.userCarModel ? this.userCarModel.toLowerCase().trim().replace(/[-\s]+/g, '') : 'model3';
  }

  get carBrandSlug(): string {
    return this.userCarBrand ? this.userCarBrand.toLowerCase().trim().replace(/[-\s]+/g, '') : 'tesla';
  }

  currentGroceryBalance = computed(() => this.financeService.groceryFund()?.balance || 0);

  grocerySpentThisMonth = computed(() => {
    const txs = this.financeService.groceryTransactions();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return txs
      .filter(tx => {
        const txDate = new Date(tx.date);
        return tx.transactionType === 'SPEND' &&
               txDate.getMonth() === currentMonth &&
               txDate.getFullYear() === currentYear;
      })
      .reduce((sum, tx) => sum + tx.amount, 0);
  });

  constructor() {
    effect(() => {
      this.updateChart();
      this.calculateNextPaycheck();
    });
  }

  ngOnInit(): void {
    this.financeService.loadFinanceData();
    setTimeout(() => this.evaluateSetupWizard(), 600);
  }

  evaluateSetupWizard() {
    const skipped = this.financeService.skippedSetupSteps();
    
    if (this.financeService.bankAccounts().length === 0 && !skipped.includes('banks')) {
      this.promptSetup('banks', 'Let\'s configure your bank accounts?', 'Let\'s do it', '/finance/bank-accounts');
      return;
    }
    
    if (!this.financeService.paycheckConfig() && !skipped.includes('paycheck')) {
      this.promptSetup('paycheck', 'We need to setup your paycheck amount', 'Let\'s do it', '/finance/paycheck-config');
      return;
    }
    
    if (this.financeService.personalExpenses().length === 0 && !skipped.includes('personal')) {
      this.promptSetup('personal', 'Let\'s setup your personal expenses', 'Let\'s do it', '/finance/personal-expenses');
      return;
    }
    
    if (!skipped.includes('household')) {
      const hasHousehold = this.financeService.commonExpenses().length > 0;
      if (hasHousehold) {
        this.promptSetup('household', 'It appears that the household expenses have already been setup, should we take a look?', 'Sure', '/finance/household-expenses');
      } else {
        this.promptSetup('household', 'The last step is configuring your household expenses, should we go ahead?', 'Let\'s do it', '/finance/household-expenses');
      }
      return;
    }
  }

  promptSetup(stepId: string, message: string, confirmLabel: string, route: string) {
    this.currentSetupStepId = stepId;
    this.setupDialogMessage = message;
    this.setupConfirmLabel = confirmLabel;
    this.setupConfirmRoute = route;
    this.showSetupDialog = true;
  }

  onSetupLater() {
    this.financeService.markWizardStepCompleted(this.currentSetupStepId);
    this.showSetupDialog = false;
    setTimeout(() => this.evaluateSetupWizard(), 300);
  }

  onSetupConfirm() {
    this.financeService.markWizardStepCompleted(this.currentSetupStepId);
    this.showSetupDialog = false;
    this.router.navigate([this.setupConfirmRoute]);
  }

  updateChart() {
    let userShare = 0;
    let partnerShare = 0;
    const members = this.financeService.householdMembers();
    if (members.length < 2) return;

    this.financeService.commonExpenses().forEach(exp => {
      if (exp.splitType === 'EQUAL') {
        userShare += exp.amount / 2;
        partnerShare += exp.amount / 2;
      } else {
        userShare += exp.amount * (members[0].proratedPercentage / 100);
        partnerShare += exp.amount * (members[1].proratedPercentage / 100);
      }
    });

    this.chartData = {
      labels: [members[0].name, members[1].name],
      datasets: [{
        data: [userShare, partnerShare],
        backgroundColor: ['#42A5F5', '#66BB6A'],
        hoverBackgroundColor: ['#64B5F6', '#81C784']
      }]
    };

    this.chartOptions = { plugins: { legend: { position: 'bottom' } } };
  }

  calculateNextPaycheck() {
    const config = this.financeService.paycheckConfig();
    if (!config || !config.referenceDate) return;
    
    let pastPaycheckDate: Date;

    if (typeof config.referenceDate === 'string') {
      const refDateString = config.referenceDate.includes('T') 
        ? config.referenceDate 
        : `${config.referenceDate}T00:00:00`;
      pastPaycheckDate = new Date(refDateString);
    } else {
      pastPaycheckDate = new Date(config.referenceDate);
    }

    pastPaycheckDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let nextPaycheckDate = new Date(pastPaycheckDate);

    while (nextPaycheckDate < today) {
      pastPaycheckDate = new Date(nextPaycheckDate);
      if (config.cycle === '14_DAYS') nextPaycheckDate.setDate(nextPaycheckDate.getDate() + 14);
      else if (config.cycle === 'TWICE_MONTHLY') nextPaycheckDate.setDate(nextPaycheckDate.getDate() + 15);
      else if (config.cycle === 'MONTHLY') nextPaycheckDate.setMonth(nextPaycheckDate.getMonth() + 1);
    }

    let lastActioned = config.lastActionedDate ? new Date(config.lastActionedDate) : new Date(0);
    lastActioned.setHours(0, 0, 0, 0);

    this.pendingPaycheckDate = null;
    if (pastPaycheckDate.getTime() > lastActioned.getTime() && pastPaycheckDate <= today) {
      this.pendingPaycheckDate = pastPaycheckDate;
    }

    const diffTime = nextPaycheckDate.getTime() - today.getTime();
    this.daysUntilPaycheck = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    this.compileTransfers();
  }

  initiatePaycheck() {
    this.showPaycheckWizard = true;
    this.wizardStep = 1;
    this.compileTransfers();
  }

  compileTransfers() {
    const config = this.financeService.paycheckConfig();
    if (!config) return;

    const members = this.financeService.householdMembers();
    const banks = this.financeService.bankAccounts();

    let myPercentage = 50;
    const me = members.find(m => m.isCurrentUser === true);
    
    if (me) {
      myPercentage = me.proratedPercentage;
    } else if (members.length > 0) {
      myPercentage = members[0].proratedPercentage;
    }

    const calculatePaycheckAmount = (amount: number, frequency: string): number => {
      let multiplier = 1;
      const freq = (frequency || '').toLowerCase().trim();
      
      if (config.cycle === '14_DAYS' || config.cycle === 'TWICE_MONTHLY') {
        if (freq.includes('hebdo') || (freq.includes('week') && !freq.includes('2') && !freq.includes('bi'))) {
          multiplier = 2; // Weekly
        } else if (freq.includes('2 semaines') || freq.includes('bi-week') || freq.includes('biweek')) {
          multiplier = 1; // Bi-weekly
        } else if (freq.includes('annuel') || freq.includes('year')) {
          multiplier = 1 / 24; // Yearly
        } else {
          multiplier = 1 / 2; // Monthly / Mensuel / Default
        }
      } else if (config.cycle === 'MONTHLY') {
        if (freq.includes('hebdo') || (freq.includes('week') && !freq.includes('2') && !freq.includes('bi'))) {
          multiplier = 4; // Weekly
        } else if (freq.includes('2 semaines') || freq.includes('bi-week') || freq.includes('biweek')) {
          multiplier = 2; // Bi-weekly
        } else if (freq.includes('annuel') || freq.includes('year')) {
          multiplier = 1 / 12; // Yearly
        } else {
          multiplier = 1; // Monthly / Mensuel / Default
        }
      }

      return amount * multiplier;
    };

    this.jointTransferAmount = 0;
    this.groceryTransferAmount = 0; 
    this.electricityTransferAmount = 0;
    this.householdTransferAmount = 0;

        this.financeService.commonExpenses().forEach(exp => {
      const paycheckAmount = calculatePaycheckAmount(exp.amount, 'Mensuel');
      let myShare = 0;

      if (exp.splitType === 'EQUAL') {
        myShare = paycheckAmount / 2;
      } else {
        myShare = paycheckAmount * (myPercentage / 100);
      }

      myShare = this.roundUpToCents(myShare); // <-- added

      this.jointTransferAmount += myShare;

      if (exp.targetFund === 'GROCERY') {
        this.groceryTransferAmount += myShare;
      } else if (exp.targetFund === 'ELECTRICITY') {
        this.electricityTransferAmount += myShare;
      } else if (exp.targetFund === 'HOUSEHOLD') {
        this.householdTransferAmount += myShare;
      }
    });

    const transferMap = new Map<string, TransferCompilation>();
    
    this.financeService.personalExpenses().forEach(exp => {
      const paycheckAmount = calculatePaycheckAmount(exp.amount, exp.frequency);
      
      if (exp.targetBankAccountId === 'JOINT_ACCOUNT') {
        this.jointTransferAmount += paycheckAmount;
        return;
      }

      const bank = banks.find(b => b.id === exp.targetBankAccountId);
      const sub = bank?.subAccounts.find(s => s.id === exp.targetSubAccountId);
      const key = `${exp.targetBankAccountId}-${exp.targetSubAccountId}`;
      
      if (transferMap.has(key)) {
        const existing = transferMap.get(key)!;
        existing.amount += paycheckAmount;
        existing.expenses.push(exp.name);
      } else {
        transferMap.set(key, {
          bankName: bank ? bank.name : 'Banque inconnue',
          subAccountName: sub ? sub.name : 'Compte inconnu',
          amount: paycheckAmount,
          expenses: [exp.name]
        });
      }
    });

    this.personalTransfers = Array.from(transferMap.values());
    const totalPersonal = this.personalTransfers.reduce((acc, curr) => acc + curr.amount, 0);
    this.remainingAmount = config.amount - this.jointTransferAmount - totalPersonal;
  }

  completePaycheckWizard() {
    if (this.pendingPaycheckDate) {
      this.financeService.markPaycheckActioned(this.pendingPaycheckDate).subscribe(() => {
        this.processFundTransfersAndClose();
      });
    } else {
      this.processFundTransfersAndClose();
    }
  }

  private roundUpToCents(amount: number): number {
  return Math.ceil(amount * 100) / 100;
}

  processFundTransfersAndClose() {
    const currentUser = this.financeService.householdMembers().find(m => m.isCurrentUser);
    
    if (!currentUser) {
      this.showPaycheckWizard = false;
      return;
    }

    const txDate = new Date().toISOString();
    const observables = [];

    // Push automated deposits to the specific fund arrays if amounts exist
    if (this.groceryTransferAmount > 0) {
      observables.push(this.financeService.addGroceryTransaction({
        userId: currentUser.userId,
        storeName: 'Dépôt de Paie',
        description: 'Transfert de paie automatisé',
        amount: this.groceryTransferAmount,
        transactionType: 'ADD',
        date: txDate
      }));
    }

    if (this.electricityTransferAmount > 0) {
      observables.push(this.financeService.addElectricityTransaction({
        userId: currentUser.userId,
        description: 'Transfert de paie automatisé',
        amount: this.electricityTransferAmount,
        transactionType: 'ADD',
        date: txDate
      }));
    }

    if (this.householdTransferAmount > 0) {
      observables.push(this.financeService.addHouseholdTransaction({
        userId: currentUser.userId,
        storeName: 'Dépôt de Paie',
        description: 'Transfert de paie automatisé',
        amount: this.householdTransferAmount,
        transactionType: 'ADD',
        date: txDate
      }));
    }

    // Use forkJoin to wait for all API calls to resolve before closing
    if (observables.length > 0) {
      forkJoin(observables).subscribe({
        next: () => this.showPaycheckWizard = false,
        error: (err) => {
          console.error('Erreur lors du transfert automatique', err);
          this.showPaycheckWizard = false;
        }
      });
    } else {
      this.showPaycheckWizard = false;
    }
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}