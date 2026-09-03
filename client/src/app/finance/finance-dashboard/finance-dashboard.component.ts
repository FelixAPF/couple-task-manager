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
import { TranslateModule } from '@ngx-translate/core';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-finance-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ChartModule, ButtonModule, DialogModule, TooltipModule, TranslateModule, CheckboxModule],
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
  isGroceryIncluded: boolean = true;

  showSetupDialog: boolean = false;
  setupDialogMessage: string = '';
  setupConfirmLabel: string = '';
  setupConfirmRoute: string = '';
  currentSetupStepId: string = '';

  get userCarBrand() { return 'tesla'; }
  get userCarModel() { return 'model 3'; }
  get userCarYear() { return '2023'; }

  get carModelSlug(): string {
    return this.userCarModel ? this.userCarModel.toLowerCase().trim().replace(/[-\s]+/g, '') : 'model3';
  }

  get carBrandSlug(): string {
    return this.userCarBrand ? this.userCarBrand.toLowerCase().trim().replace(/[-\s]+/g, '') : 'tesla';
  }

donutOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 12,
          font: { size: 11 }
        }
      },
      tooltip: {
        callbacks: {
          // Formats tooltip values to 2 decimal places with no $ sign
          label: (context: any) => {
            const val = (Math.round(Number(context.raw || 0) * 100) / 100).toFixed(2);
            return ` ${context.label}: ${val}`;
          }
        }
      }
    },
    cutout: '68%',
    responsive: true,
    maintainAspectRatio: false
  };

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

  // --- Personal Expenses Donut & Totals ---
  personalTotalMonthly = computed(() => {
    return this.financeService.personalExpenses().reduce((sum, exp) => {
      return sum + this.normalizeToMonthly(exp.amount || 0, exp.frequency);
    }, 0);
  });

  personalTotalPerPaycheck = computed(() => {
    const config = this.financeService.paycheckConfig();
    return this.financeService.personalExpenses().reduce((sum, exp) => {
      return sum + this.calculatePaycheckAmount(exp.amount || 0, exp.frequency, config?.cycle);
    }, 0);
  });

personalDonutData = computed(() => {
    const exps = this.financeService.personalExpenses();
    if (!exps.length) return null;

    // 1. Calculate monthly amounts rounded to cents and sort descending
    const normalized = exps.map(e => ({
      name: e.name,
      amount: Math.round(this.normalizeToMonthly(e.amount || 0, e.frequency) * 100) / 100,
      color: e.color
    })).sort((a, b) => b.amount - a.amount);

    const total = normalized.reduce((sum, e) => sum + e.amount, 0);
    if (total <= 0) return null;

    // 2. Top 4 expenses + "Autres"
    const topCount = 4;
    const topItems = normalized.slice(0, topCount);
    const remainingItems = normalized.slice(topCount);
    const otherSum = Math.round(remainingItems.reduce((sum, e) => sum + e.amount, 0) * 100) / 100;

    const labels: string[] = [];
    const data: number[] = [];
    const colors: string[] = [];
    const palette = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];

    topItems.forEach((item, i) => {
      const pct = Math.round((item.amount / total) * 100);
      labels.push(`${item.name} — ${item.amount.toFixed(2)} (${pct}%)`);
      data.push(item.amount);
      colors.push(item.color || palette[i]);
    });

    if (otherSum > 0) {
      const otherPct = Math.round((otherSum / total) * 100);
      labels.push(`Autres (${remainingItems.length}) — ${otherSum.toFixed(2)} (${otherPct}%)`);
      data.push(otherSum);
      colors.push('#94a3b8');
    }

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderWidth: 2
      }]
    };
  });

  // --- Household Expenses Donut & Totals ---
  householdTotalMonthly = computed(() => {
    return this.financeService.commonExpenses().reduce((sum, exp) => sum + (exp.amount || 0), 0);
  });

householdDonutData = computed(() => {
    const exps = this.financeService.commonExpenses();
    if (!exps.length) return null;

    const normalized = exps.map(e => ({
      name: e.name,
      amount: Math.round((e.amount || 0) * 100) / 100,
      color: e.color
    })).sort((a, b) => b.amount - a.amount);

    const total = normalized.reduce((sum, e) => sum + e.amount, 0);
    if (total <= 0) return null;

    const topCount = 4;
    const topItems = normalized.slice(0, topCount);
    const remainingItems = normalized.slice(topCount);
    const otherSum = Math.round(remainingItems.reduce((sum, e) => sum + e.amount, 0) * 100) / 100;

    const labels: string[] = [];
    const data: number[] = [];
    const colors: string[] = [];
    const palette = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

    topItems.forEach((item, i) => {
      const pct = Math.round((item.amount / total) * 100);
      labels.push(`${item.name} — ${item.amount.toFixed(2)} (${pct}%)`);
      data.push(item.amount);
      colors.push(item.color || palette[i]);
    });

    if (otherSum > 0) {
      const otherPct = Math.round((otherSum / total) * 100);
      labels.push(`Autres (${remainingItems.length}) — ${otherSum.toFixed(2)} (${otherPct}%)`);
      data.push(otherSum);
      colors.push('#94a3b8');
    }

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderWidth: 2
      }]
    };
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

  // --- Calculations ---
  public calculatePaycheckAmount(amount: number, frequency: string, cycle?: string): number {
    const configCycle = cycle || this.financeService.paycheckConfig()?.cycle || '14_DAYS';
    let multiplier = 1;
    const freq = (frequency || '').toLowerCase().trim();

    if (configCycle === '14_DAYS' || configCycle === 'TWICE_MONTHLY') {
      if (freq.includes('hebdo') || (freq.includes('week') && !freq.includes('2') && !freq.includes('bi'))) {
        multiplier = 2; // Weekly
      } else if (freq.includes('2 semaines') || freq.includes('bi-week') || freq.includes('biweek')) {
        multiplier = 1; // Bi-weekly
      } else if (freq.includes('annuel') || freq.includes('year')) {
        multiplier = 1 / 24; // Yearly
      } else {
        multiplier = 1 / 2; // Monthly
      }
    } else if (configCycle === 'MONTHLY') {
      if (freq.includes('hebdo') || (freq.includes('week') && !freq.includes('2') && !freq.includes('bi'))) {
        multiplier = 4; // Weekly
      } else if (freq.includes('2 semaines') || freq.includes('bi-week') || freq.includes('biweek')) {
        multiplier = 2; // Bi-weekly
      } else if (freq.includes('annuel') || freq.includes('year')) {
        multiplier = 1 / 12; // Yearly
      } else {
        multiplier = 1; // Monthly
      }
    }

    return (amount || 0) * multiplier;
  }

  remainingPaycheckAmount = computed(() => {
    const config = this.financeService.paycheckConfig();
    if (!config || !config.amount) return 0;
    const remaining = config.amount - this.householdYourSharePerPaycheck() - this.personalTotalPerPaycheck();
    return Math.round(remaining * 100) / 100;
  });

  // Your monthly household share
  householdYourShareMonthly = computed(() => {
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

  // Your per-paycheck household share (24 pays/year = exactly / 2)
  householdYourSharePerPaycheck = computed(() => {
    return this.householdYourShareMonthly() / 2;
  });

 public normalizeToMonthly(amount: number, frequency: string): number {
    const f = (frequency || '').toLowerCase().trim();
    if (f.includes('hebdo') || (f.includes('week') && !f.includes('2') && !f.includes('bi'))) {
      return (amount || 0) * 4;
    }
    // 2 payments per month
    if (f.includes('2 semaines') || f.includes('deux fois') || f.includes('twice') || f.includes('bi')) {
      return (amount || 0) * 2;
    }
    if (f.includes('annuel') || f.includes('year')) {
      return (amount || 0) / 12;
    }
    return amount || 0; // Mensuel
  }

  private roundUpToCents(amount: number): number {
    return Math.ceil(amount * 100) / 100;
  }

  // --- Setup Wizard ---
  evaluateSetupWizard() {
    const skipped = this.financeService.skippedSetupSteps();

    if (this.financeService.bankAccounts().length === 0 && !skipped.includes('banks')) {
      this.promptSetup('banks', "Let's configure your bank accounts?", "Let's do it", '/finance/bank-accounts');
      return;
    }

    if (!this.financeService.paycheckConfig() && !skipped.includes('paycheck')) {
      this.promptSetup('paycheck', 'We need to setup your paycheck amount', "Let's do it", '/finance/paycheck-config');
      return;
    }

    if (this.financeService.personalExpenses().length === 0 && !skipped.includes('personal')) {
      this.promptSetup('personal', "Let's setup your personal expenses", "Let's do it", '/finance/personal-expenses');
      return;
    }

    if (!skipped.includes('household')) {
      const hasHousehold = this.financeService.commonExpenses().length > 0;
      if (hasHousehold) {
        this.promptSetup('household', 'It appears that the household expenses have already been setup, should we take a look?', 'Sure', '/finance/household-expenses');
      } else {
        this.promptSetup('household', 'The last step is configuring your household expenses, should we go ahead?', "Let's do it", '/finance/household-expenses');
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

  onCheck(value:any){
    this.updateChart();
  }

  // --- Partner Ratio Chart ---
updateChart() {
    let userShare = 0;
    let partnerShare = 0;
    const members = this.financeService.householdMembers();
    if (members.length < 2) return;

    // Destructure the two members from the list
    const [user, partner] = members;

    this.financeService.commonExpenses().forEach(exp => {
      if((exp.isGrocery||exp.targetFund === 'GROCERY') && !this.isGroceryIncluded) return;
      if (exp.splitType === 'EQUAL') {
        userShare += exp.amount / 2;
        partnerShare += exp.amount / 2;
      } else {
        userShare += exp.amount * (user.proratedPercentage / 100);
        partnerShare += exp.amount * (partner.proratedPercentage / 100);
      }
    });

    this.chartData = {
      labels: [`${user.name} ${userShare.toFixed(2)}$ (${(userShare/(userShare+partnerShare)*100).toFixed(2)}%) `, `${partner.name} ${partnerShare.toFixed(2)}$ (${(partnerShare/(userShare+partnerShare)*100).toFixed(2)}%) `],
      datasets: [{
        data: [userShare, partnerShare],
        backgroundColor: ['#42A5F5', '#66BB6A'],
        hoverBackgroundColor: ['#64B5F6', '#81C784']
      }]
    };

    this.chartOptions = { plugins: { legend: { position: 'bottom' } } };
  }

  // --- Paycheck Calculation & Transfer Compilation ---
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

    while (nextPaycheckDate <= today) {
      pastPaycheckDate = new Date(nextPaycheckDate);
      if (config.cycle === '14_DAYS') nextPaycheckDate.setDate(nextPaycheckDate.getDate() + 14);
      else if (config.cycle === 'TWICE_MONTHLY') nextPaycheckDate.setDate(nextPaycheckDate.getDate() + 15);
      else if (config.cycle === 'MONTHLY') nextPaycheckDate.setMonth(nextPaycheckDate.getMonth() + 1);
    }

    let lastActioned: Date;
    if (config.lastActionedDate) {
      const lastActionedStr = typeof config.lastActionedDate === 'string'
        ? config.lastActionedDate
        : (config.lastActionedDate as Date).toISOString();
      const laDateString = lastActionedStr.includes('T')
        ? lastActionedStr
        : `${lastActionedStr}T00:00:00`;
      lastActioned = new Date(laDateString);
    } else {
      lastActioned = new Date(0);
    }
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

    this.jointTransferAmount = 0;
    this.groceryTransferAmount = 0;
    this.electricityTransferAmount = 0;
    this.householdTransferAmount = 0;

    this.financeService.commonExpenses().forEach(exp => {
      const paycheckAmount = this.calculatePaycheckAmount(exp.amount, 'Mensuel', config.cycle);
      let myShare = 0;
      if (exp.splitType === 'EQUAL') {
        myShare = paycheckAmount / 2;
      } else {
        myShare = paycheckAmount * (myPercentage / 100);
      }
      myShare = this.roundUpToCents(myShare);
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
    this.groceryTransferAmount += this.financeService.personalExpenses()
      .filter(p => p.isGrocery)
      .reduce((prev, curr) => prev + curr.amount, 0);

    this.financeService.personalExpenses().forEach(exp => {
      const paycheckAmount = this.calculatePaycheckAmount(exp.amount, exp.frequency, config.cycle);
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
    this.remainingAmount = this.remainingPaycheckAmount();
  }

  completePaycheckWizard() {
    if (this.pendingPaycheckDate) {
      this.financeService.markPaycheckActioned(this.pendingPaycheckDate).subscribe({
        next: () => this.processFundTransfersAndClose(),
        error: (err) => {
          console.error('Échec de la confirmation de paie', err);
          alert('Erreur lors de la confirmation de paie. Vérifiez la console (F12) pour les détails.');
        }
      });
    } else {
      this.processFundTransfersAndClose();
    }
  }

  processFundTransfersAndClose() {
    const currentUser = this.financeService.householdMembers().find(m => m.isCurrentUser);
    if (!currentUser) {
      this.showPaycheckWizard = false;
      return;
    }

    const txDate = new Date().toISOString();
    const observables = [];

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