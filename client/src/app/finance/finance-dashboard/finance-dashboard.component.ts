import { Component, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FinanceService } from '../../service/finance.service';
import { TransferCompilation } from '../../model/finance.model';

@Component({
  selector: 'app-finance-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ChartModule, ButtonModule, DialogModule],
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
  personalTransfers: TransferCompilation[] = [];
  remainingAmount: number = 0;

  showSetupDialog: boolean = false;
  setupDialogMessage: string = '';
  setupConfirmLabel: string = '';
  setupConfirmRoute: string = '';
  currentSetupStepId: string = '';

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
      this.promptSetup('banks', 'Configurer les noms de comptes bancaires?', 'C\'est parti!', '/finance/bank-accounts');
      return;
    }
    
    if (!this.financeService.paycheckConfig() && !skipped.includes('paycheck')) {
      this.promptSetup('paycheck', 'Configurons vos détails de paie', 'C\'est parti!', '/finance/paycheck-config');
      return;
    }
    
    if (this.financeService.personalExpenses().length === 0 && !skipped.includes('personal')) {
      this.promptSetup('personal', 'Configurons vos dépenses personnelles', 'C\'est parti!', '/finance/personal-expenses');
      return;
    }
    
    if (!skipped.includes('household')) {
      const hasHousehold = this.financeService.commonExpenses().length > 0;
      if (hasHousehold) {
        this.promptSetup('household', 'Il semble que les dépenses conjointes ne sont pas configurées, devrait-on regarder cela?', 'Sure', '/finance/household-expenses');
      } else {
        this.promptSetup('household', 'Dernière étape, configurer vos dépenses conjointes, procéder?', 'C\'est parti!', '/finance/household-expenses');
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
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let pastPaycheckDate = new Date(config.referenceDate);
    pastPaycheckDate.setHours(0, 0, 0, 0);
    let nextPaycheckDate = new Date(pastPaycheckDate);

    // Fast-forward dates to match current period
    while (nextPaycheckDate <= today) {
      pastPaycheckDate = new Date(nextPaycheckDate);
      if (config.cycle === '14_DAYS') nextPaycheckDate.setDate(nextPaycheckDate.getDate() + 14);
      else if (config.cycle === 'TWICE_MONTHLY') nextPaycheckDate.setDate(nextPaycheckDate.getDate() + 15);
      else if (config.cycle === 'MONTHLY') nextPaycheckDate.setMonth(nextPaycheckDate.getMonth() + 1);
    }

    // Evaluate if the most recent past/current paycheck needs to be actioned
    let lastActioned = config.lastActionedDate ? new Date(config.lastActionedDate) : new Date(0);
    lastActioned.setHours(0, 0, 0, 0);

    this.pendingPaycheckDate = null;
    if (pastPaycheckDate.getTime() > lastActioned.getTime()) {
      this.pendingPaycheckDate = pastPaycheckDate;
    }

    // Days until the strictly *next* upcoming paycheck
    const diffTime = Math.abs(nextPaycheckDate.getTime() - today.getTime());
    this.daysUntilPaycheck = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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

    this.jointTransferAmount = 0;
    this.financeService.commonExpenses().forEach(exp => {
      if (exp.splitType === 'EQUAL') this.jointTransferAmount += exp.amount / 2;
      else this.jointTransferAmount += exp.amount * (members[0].proratedPercentage / 100);
    });

    const transferMap = new Map<string, TransferCompilation>();
    
    this.financeService.personalExpenses().forEach(exp => {
      const bank = banks.find(b => b.id === exp.targetBankAccountId);
      const sub = bank?.subAccounts.find(s => s.id === exp.targetSubAccountId);
      const key = `${exp.targetBankAccountId}-${exp.targetSubAccountId}`;
      
      if (transferMap.has(key)) {
        const existing = transferMap.get(key)!;
        existing.amount += exp.amount;
        existing.expenses.push(exp.name);
      } else {
        transferMap.set(key, {
          bankName: bank ? bank.name : 'Banque inconnue',
          subAccountName: sub ? sub.name : 'Compte inconnu',
          amount: exp.amount,
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
        this.showPaycheckWizard = false;
      });
    } else {
      this.showPaycheckWizard = false;
    }
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}