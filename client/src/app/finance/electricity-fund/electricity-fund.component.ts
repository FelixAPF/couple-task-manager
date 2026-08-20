import { Component, inject, computed, OnInit, effect, signal } from '@angular/core';
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
import { TagModule } from 'primeng/tag';
import { FinanceService } from '../../service/finance.service';
import { ElectricityTransaction, HydroBill, ElectricityFund } from '../../model/finance.model';
import { RouterModule } from '@angular/router';

export interface MonthlySummaryRow {
  month: string;       // display label, e.g. "Sep 25"
  monthIndex: number;  // 0-11
  year: number;         // calendar year this slot falls in
  actualCost: number | null;
  kwh: number | null;
  paid: number;
  displayCost: number | null;
  isProjected: boolean;
  diff: number;
}

interface CycleMonthSlot {
  year: number;
  monthIndex: number;
  label: string;
}

/** A slice of a (possibly multi-month) bill's cost attributed to one specific calendar month, prorated by day overlap. */
interface BillMonthSegment {
  year: number;
  monthIndex: number;
  amount: number;
}

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

/** Assumed annual inflation applied to historical monthly-attributed amounts when projecting forward to the target cycle's year. */
const PROJECTION_INFLATION_RATE = 0.02;

/**
 * Splits a bill's amount across every calendar month its billing period touches,
 * prorated by how many days of the period fall in each month (using a flat $/day rate
 * derived from the bill's own total period length).
 *
 * Needed because multi-month billing periods (e.g. Hydro-Québec's bimonthly cycle) would
 * otherwise attribute their entire cost to a single month, leaving every other month in the
 * cycle with zero historical data to project from.
 */
function distributeBillAcrossMonths(periodStart: Date, periodEnd: Date, amount: number): BillMonthSegment[] {
  const totalDays = Math.max(1, (periodEnd.getTime() - periodStart.getTime()) / 86400000);
  const ratePerDay = amount / totalDays;
  const segments: BillMonthSegment[] = [];

  let cursor = new Date(periodStart.getFullYear(), periodStart.getMonth(), periodStart.getDate());

  while (cursor.getTime() < periodEnd.getTime()) {
    const nextMonthStart = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    const segmentEnd = nextMonthStart.getTime() < periodEnd.getTime() ? nextMonthStart : periodEnd;
    const overlapDays = Math.max(0, (segmentEnd.getTime() - cursor.getTime()) / 86400000);

    if (overlapDays > 0) {
      segments.push({
        year: cursor.getFullYear(),
        monthIndex: cursor.getMonth(),
        amount: ratePerDay * overlapDays
      });
    }

    cursor = nextMonthStart;
  }

  return segments;
}

@Component({
  selector: 'app-electricity-fund',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    ButtonModule, DialogModule, InputTextModule,
    InputNumberModule, CalendarModule, SelectButtonModule,
    AvatarModule, TableModule, TabViewModule, ChartModule, RouterModule, TooltipModule, TagModule
  ],
  templateUrl: './electricity-fund.component.html',
  styleUrl: './electricity-fund.component.css'
})
export class ElectricityFundComponent implements OnInit {
  public financeService = inject(FinanceService);
  private fb = inject(FormBuilder);
  Math = Math;

  showTransactionDialog = false;
  showBillDialog = false;
  showCycleDialog = false;
  isSaving = false;
  isProjecting = false;

  forceCycleSetup = false;
  private hasCheckedCycleValidity = false;

  // How many cycles forward (+) or back (-) from the fund's configured reference cycle
  // the "Sommaire Annuel" table is currently browsing. This is purely a browsing cursor —
  // it never touches the fund's actual configured cycleStartDate/cycleEndDate.
  selectedCycleOffset = signal(0);

  // month index within the CURRENTLY BROWSED cycle -> projected cost
  projectedByMonth = signal<(number | null)[]>([]);

  tempCycleDate: Date | null = null;
  tempCycleEndDate: Date | null = null;

  // --- The fund's actual configured cycle (used for the top metric cards, unaffected by browsing) ---
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
    const d = new Date(this.cycleStartDate());
    d.setFullYear(d.getFullYear() + 1);
    return d;
  });

  // --- The cycle currently being browsed in the "Sommaire Annuel" table (offset from the reference cycle) ---
  selectedCycleStart = computed(() => {
    const d = new Date(this.cycleStartDate());
    d.setFullYear(d.getFullYear() + this.selectedCycleOffset());
    return d;
  });

  selectedCycleEnd = computed(() => {
    const d = new Date(this.cycleEndDate());
    d.setFullYear(d.getFullYear() + this.selectedCycleOffset());
    return d;
  });

  /** e.g. "2025-2026", or just "2026" if the cycle happens to sit within a single calendar year. */
  cycleLabel = computed(() => {
    const startY = this.selectedCycleStart().getFullYear();
    const endY = this.selectedCycleEnd().getFullYear();
    return startY === endY ? `${startY}` : `${startY}-${endY}`;
  });

  /** The ordered list of (year, month) slots that make up the currently browsed cycle. */
  cycleMonthSlots = computed<CycleMonthSlot[]>(() => {
    const start = this.selectedCycleStart();
    const end = this.selectedCycleEnd();

    // Calculate the exact month span without adding '+ 1' at the end.
    // For a cycle from Sept 2025 to Sept 2026, this gives exactly 12 months.
    const count = Math.max(
      1,
      (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
    );

    const slots: CycleMonthSlot[] = [];
    for (let i = 0; i < count; i++) {
      // Offset the month by +1 to skip the starting month (e.g., skip Sep 25, start at Oct 25)
      const d = new Date(start.getFullYear(), start.getMonth() + 1 + i, 1);
      slots.push({
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
        label: `${MONTH_LABELS[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`
      });
    }
    return slots;
  });

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

  enrichedTransactions = computed(() => {
    const txs = this.financeService.electricityTransactions();
    const members = this.financeService.householdMembers();
    return txs.map(tx => {
      const user = members.find(m => String(m.userId) === String(tx.userId));
      return { ...tx, userIconUrl: user?.iconUrl, userName: user?.name || 'Système' };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  /** Bills whose periodEnd falls inside the currently browsed cycle window. */
  billsForSelectedCycle = computed(() => {
    const start = this.selectedCycleStart().getTime();
    const end = this.selectedCycleEnd().getTime();
    return this.financeService.hydroBills()
      .filter(b => {
        const t = new Date(b.periodEnd).getTime();
        return t >= start && t <= end;
      })
      .sort((a, b) => new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime());
  });

  /** Month-by-month breakdown for the currently browsed cycle: real bill cost (or projected estimate), kWh, amount paid, and the diff. */
  monthlySummary = computed<MonthlySummaryRow[]>(() => {
    const slots = this.cycleMonthSlots();
    const start = this.selectedCycleStart().getTime();
    const end = this.selectedCycleEnd().getTime();

    const bills = this.financeService.hydroBills().filter(b => {
      const t = new Date(b.periodEnd).getTime();
      return t >= start && t <= end;
    });
    const paidTxs = this.financeService.electricityTransactions().filter(tx => {
      if (tx.transactionType !== 'SPEND') return false;
      const t = new Date(tx.date).getTime();
      return t >= start && t <= end;
    });
    const projected = this.projectedByMonth();

    return slots.map((slot, i) => {
      const bill = bills.find(b => {
        const d = new Date(b.periodEnd);
        return d.getFullYear() === slot.year && d.getMonth() === slot.monthIndex;
      });
      const paid = paidTxs
        .filter(tx => {
          const d = new Date(tx.date);
          return d.getFullYear() === slot.year && d.getMonth() === slot.monthIndex;
        })
        .reduce((sum, tx) => sum + tx.amount, 0);

      const actualCost = bill ? bill.amount : null;
      const projectedCost = actualCost === null ? (projected[i] ?? null) : null;
      const displayCost = actualCost ?? projectedCost;

      return {
        month: slot.label,
        monthIndex: slot.monthIndex,
        year: slot.year,
        actualCost,
        kwh: bill?.kwhConsumed ?? null,
        paid,
        displayCost,
        isProjected: actualCost === null && projectedCost !== null,
        diff: (displayCost ?? 0) - paid
      };
    });
  });

  yearTotals = computed(() => {
    const rows = this.monthlySummary();
    return {
      totalCost: rows.reduce((s, r) => s + (r.displayCost || 0), 0),
      totalPaid: rows.reduce((s, r) => s + r.paid, 0),
      totalDiff: rows.reduce((s, r) => s + r.diff, 0),
      hasProjection: rows.some(r => r.isProjected)
    };
  });

  // --- Métriques Ajustées au Cycle (the fund's ACTUAL configured cycle, not the browsing cursor) ---
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

  projectionChartData: any;

  constructor() {
    effect(() => {
      const fund = this.financeService.electricityFund();
      if (fund && !this.hasCheckedCycleValidity) {
        this.hasCheckedCycleValidity = true;
        this.verifyCurrentDateInCycle();
      }
    });

    effect(() => {
      this.buildProjectionChart(this.monthlySummary());
    });
  }

  ngOnInit(): void {
    if (!this.financeService.electricityFund()) {
      this.financeService.loadFinanceData();
    }
    this.resetProjection();
  }

  verifyCurrentDateInCycle() {
    const now = new Date().getTime();
    const start = this.cycleStartDate().getTime();
    const end = this.cycleEndDate().getTime();

    if (now < start || now > end) {
      this.forceCycleSetup = true;
      this.openCycleDialog();
    }
  }

  /** Move the "Sommaire Annuel" browsing cursor by whole cycles (e.g. -1 = previous year's cycle). */
  changeCycle(offset: number) {
    this.selectedCycleOffset.update(v => v + offset);
    this.resetProjection();
  }

  private resetProjection() {
    this.projectedByMonth.set(new Array(this.cycleMonthSlots().length).fill(null));
  }

  // --- Cycle (billing period) configuration ---
  openCycleDialog() {
    this.tempCycleDate = new Date(this.cycleStartDate());
    this.tempCycleEndDate = new Date(this.cycleEndDate());
    this.showCycleDialog = true;
  }

  saveCycle() {
    const currentFund = this.financeService.electricityFund();
    if (this.tempCycleDate && this.tempCycleEndDate && currentFund) {

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
          this.selectedCycleOffset.set(0); // reconfigured reference cycle becomes the new offset-0
          this.resetProjection();
        },
        error: (err: any) => {
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

  // --- Bills ---
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
        this.resetProjection(); // stale projections after new real data
      },
      error: () => this.isSaving = false
    });
  }

  deleteBill(id?: string) {
    if (id && confirm('Supprimer cette facture de consommation ?')) {
      this.financeService.deleteHydroBill(id).subscribe();
    }
  }

  // --- Projection: estimate the remainder of the browsed cycle from inflation-adjusted, month-prorated historical bills ---
  canProject(): boolean {
    const now = new Date();
    const currentSlotStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return this.selectedCycleEnd().getTime() >= currentSlotStart;
  }

  projectRemainderOfYear() {
    this.isProjecting = true;

    const now = new Date();
    const nowYearMonth = now.getFullYear() * 12 + now.getMonth();

    const cycleStart = this.selectedCycleStart().getTime();
    const cycleEnd = this.selectedCycleEnd().getTime();

    // History = every OTHER cycle's bills, prorated across every calendar month each bill's
    // period actually spans (not just the month it happened to end in). This matters for
    // multi-month billing periods (e.g. Hydro-Québec's bimonthly cycle): without prorating,
    // only the months a bill happens to END in would ever accumulate history, leaving the
    // alternating months with nothing to project from.
    //
    // monthIndex -> year -> summed prorated amount attributed to that (year, month)
    const historyByMonth = new Map<number, Map<number, number>>();

    this.financeService.hydroBills().forEach(bill => {
      const periodEndDate = new Date(bill.periodEnd);
      const t = periodEndDate.getTime();
      if (t >= cycleStart && t <= cycleEnd) return; // exclude the cycle being projected

      const periodStartDate = new Date(bill.periodStart);
      const segments = distributeBillAcrossMonths(periodStartDate, periodEndDate, bill.amount);

      segments.forEach(seg => {
        if (!historyByMonth.has(seg.monthIndex)) historyByMonth.set(seg.monthIndex, new Map());
        const yearMap = historyByMonth.get(seg.monthIndex)!;
        yearMap.set(seg.year, (yearMap.get(seg.year) || 0) + seg.amount);
      });
    });

    const slots = this.cycleMonthSlots();
    const rows = this.monthlySummary();
    const result: (number | null)[] = new Array(slots.length).fill(null);

    slots.forEach((slot, i) => {
      const hasActual = rows[i].actualCost !== null;
      if (hasActual) return;

      const slotYearMonth = slot.year * 12 + slot.monthIndex;
      if (slotYearMonth < nowYearMonth) return; // don't fabricate months that already passed with no bill entered

      const yearMap = historyByMonth.get(slot.monthIndex);
      if (yearMap && yearMap.size > 0) {
        // Inflate each historical year's prorated amount forward (or back) to the target
        // slot's year at 2%/yr, compounded over the number of years of difference.
        const inflatedAmounts: number[] = [];
        yearMap.forEach((amount, year) => {
          inflatedAmounts.push(amount * Math.pow(1 + PROJECTION_INFLATION_RATE, slot.year - year));
        });
        const avgAdjustedAmount = inflatedAmounts.reduce((a, b) => a + b, 0) / inflatedAmounts.length;
        result[i] = Math.round(avgAdjustedAmount * 100) / 100;
      }
    });

    this.projectedByMonth.set(result);
    this.isProjecting = false;
  }

  clearProjection() {
    this.resetProjection();
  }

  private buildProjectionChart(rows: MonthlySummaryRow[]) {
    this.projectionChartData = {
      labels: rows.map(r => r.month),
      datasets: [
        {
          label: 'Consommation Réelle',
          data: rows.map(r => r.actualCost),
          backgroundColor: '#3b82f6',
          borderRadius: 4
        },
        {
          label: 'Projection Estimée',
          data: rows.map(r => r.isProjected ? r.displayCost : null),
          backgroundColor: '#9ca3af',
          borderRadius: 4
        }
      ]
    };
  }
}