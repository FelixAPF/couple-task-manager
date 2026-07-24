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
      this.config = { ...existing, referenceDate: new Date(existing.referenceDate!) };
    }
  }

  saveConfig() {
    this.financeService.savePaycheckConfig(this.config).subscribe(() => {
      this.router.navigate(['/finance/dashboard']);
    });
  }
}