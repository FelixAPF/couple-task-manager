import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { FinanceService } from '../../service/finance.service';
import { PaycheckConfig } from '../../model/finance.model';

@Component({
  selector: 'app-paycheck-config',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ButtonModule, InputNumberModule, DropdownModule, CalendarModule],
  templateUrl: './paycheck-config.component.html'
})
export class PaycheckConfigComponent implements OnInit {
  public financeService = inject(FinanceService);
  private router = inject(Router);

  config: PaycheckConfig = { cycle: '14_DAYS', referenceDate: null, amount: 0, defaultBankAccountId: '' };

  cycleOptions = [
    { label: 'Tous les 14 jours', value: '14_DAYS' },
    { label: 'Deux fois par mois', value: 'TWICE_MONTHLY' },
    { label: 'Mensuel', value: 'MONTHLY' }
  ];

  ngOnInit() {
    const existing = this.financeService.paycheckConfig();
    if (existing) {
      this.config = {
        ...existing,
        referenceDate: existing.referenceDate ? this.parseAsLocalDate(existing.referenceDate) : null
      };
    }
  }

  /**
   * Parses a date coming from the backend without shifting days due to timezone conversion.
   *
   * The backend returns referenceDate either as a date-only string ("2026-08-25", a
   * java.time.LocalDate) or as a full ISO datetime. A bare "yyyy-MM-dd" string is parsed
   * by `new Date(...)` as UTC midnight, which then gets displayed in the browser's local
   * timezone (Montreal, UTC-4/-5) and rolls back to the previous day. Splitting the
   * date-only string manually and building the Date with the local constructor avoids
   * the UTC conversion entirely.
   */
  private parseAsLocalDate(value: Date | string): Date {
    if (value instanceof Date) {
      return value;
    }

    if (value.includes('T')) {
      // Already a full datetime string, safe to parse directly.
      return new Date(value);
    }

    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  saveConfig() {
    const original = this.financeService.paycheckConfig();

    // If referenceDate is being changed, the previously-actioned paycheck no
    // longer corresponds to the new schedule — clear lastActionedDate so the
    // dashboard doesn't treat a stale action as covering the new date.
    const newReferenceDateString = this.config.referenceDate
      ? this.toDateOnlyString(this.config.referenceDate as Date)
      : null;
    const originalReferenceDateString = original?.referenceDate
      ? this.toDateOnlyStringFromExisting(original.referenceDate)
      : null;
    const referenceDateChanged = newReferenceDateString !== originalReferenceDateString;

    // Send the date as a plain yyyy-MM-dd string rather than letting HttpClient
    // JSON.stringify the Date object (which calls toISOString() and serializes
    // in UTC). This keeps what's saved unambiguous and matches what the backend
    // expects to read back as a LocalDate.
    const payload: PaycheckConfig = {
      ...this.config,
      referenceDate: newReferenceDateString,
      lastActionedDate: referenceDateChanged ? null : this.config.lastActionedDate
    };

    this.financeService.savePaycheckConfig(payload).subscribe({
      next: () => this.router.navigate(['/finance/dashboard']),
      error: (err) => console.error('Erreur lors de la sauvegarde de la configuration', err)
    });
  }

  private toDateOnlyString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Same normalization as toDateOnlyString, but for the value as it comes back
   * from FinanceService.paycheckConfig() — which may be a Date or a raw
   * "yyyy-MM-dd"/ISO string depending on how it was last set. Used only to
   * compare against the new value the user picked, so we can detect whether
   * referenceDate actually changed.
   */
  private toDateOnlyStringFromExisting(value: Date | string): string {
    if (value instanceof Date) {
      return this.toDateOnlyString(value);
    }
    return value.includes('T') ? value.split('T')[0] : value;
  }
}