import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environment';
import { 
  HouseholdMemberFinance, 
  CommonExpense, 
  BankAccount, 
  PaycheckConfig, 
  PersonalExpense,
  SubAccount,
  GroceryFund,
  GroceryTransaction
} from '../model/finance.model';
import { tap } from 'rxjs/operators';
import { of, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}finance`;

  public householdMembers = signal<HouseholdMemberFinance[]>([]);
  public commonExpenses = signal<CommonExpense[]>([]);
  public bankAccounts = signal<BankAccount[]>([]);
  public personalExpenses = signal<PersonalExpense[]>([]);
  public paycheckConfig = signal<PaycheckConfig | null>(null);
  
  // NEW: Grocery signals
  public groceryFund = signal<GroceryFund | null>(null);
  public groceryTransactions = signal<GroceryTransaction[]>([]);

  public skippedSetupSteps = signal<string[]>(JSON.parse(localStorage.getItem('financeWizardSkipped') || '[]'));

  constructor() {}

  markWizardStepCompleted(stepId: string) {
    if (!this.skippedSetupSteps().includes(stepId)) {
      const updated = [...this.skippedSetupSteps(), stepId];
      this.skippedSetupSteps.set(updated);
      localStorage.setItem('financeWizardSkipped', JSON.stringify(updated));
    }
  }

  loadFinanceData() {
    this.http.get<HouseholdMemberFinance[]>(`${this.apiUrl}/members`).subscribe(res => this.householdMembers.set(res));
    this.http.get<CommonExpense[]>(`${this.apiUrl}/common-expenses`).subscribe(res => this.commonExpenses.set(res));
    this.http.get<BankAccount[]>(`${this.apiUrl}/bank-accounts`).subscribe(res => this.bankAccounts.set(res));
    this.http.get<PersonalExpense[]>(`${this.apiUrl}/personal-expenses`).subscribe(res => this.personalExpenses.set(res));
    this.http.get<PaycheckConfig>(`${this.apiUrl}/paycheck-config`).subscribe(res => this.paycheckConfig.set(res));
    
    // NEW: Load grocery data
    this.http.get<GroceryFund>(`${this.apiUrl}/grocery-fund`).subscribe(res => this.groceryFund.set(res));
    this.http.get<GroceryTransaction[]>(`${this.apiUrl}/grocery-transactions`).subscribe(res => this.groceryTransactions.set(res));
  }

  // --- Existing Methods ---

  updateMemberRatio(userId: string, proratedPercentage: number) {
    return this.http.put<HouseholdMemberFinance>(`${this.apiUrl}/members/${userId}`, { proratedPercentage }).pipe(
      tap(updated => this.householdMembers.update(members => members.map(m => m.userId === updated.userId ? updated : m)))
    );
  }

  addCommonExpense(expense: CommonExpense) {
    return this.http.post<CommonExpense>(`${this.apiUrl}/common-expenses`, expense).pipe(
      tap(added => this.commonExpenses.update(exps => [...exps, added]))
    );
  }

  updateCommonExpense(expense: CommonExpense) {
    return this.http.put<CommonExpense>(`${this.apiUrl}/common-expenses/${expense.id}`, expense).pipe(
      tap(updated => this.commonExpenses.update(exps => exps.map(e => e.id === updated.id ? updated : e)))
    );
  }

  deleteCommonExpense(id: string) {
    return this.http.delete(`${this.apiUrl}/common-expenses/${id}`).pipe(
      tap(() => this.commonExpenses.update(exps => exps.filter(e => e.id !== id)))
    );
  }

  addBankAccount(bank: BankAccount) {
    return this.http.post<BankAccount>(`${this.apiUrl}/bank-accounts`, bank).pipe(
      tap(added => this.bankAccounts.update(banks => [...banks, added]))
    );
  }

  updateBankAccount(bank: BankAccount) {
    return this.http.put<BankAccount>(`${this.apiUrl}/bank-accounts/${bank.id}`, bank).pipe(
      tap(updated => this.bankAccounts.update(banks => banks.map(b => b.id === updated.id ? updated : b)))
    );
  }

  deleteBankAccount(id: string) {
    return this.http.delete(`${this.apiUrl}/bank-accounts/${id}`).pipe(
      tap(() => this.bankAccounts.update(banks => banks.filter(b => b.id !== id)))
    );
  }

  addSubAccount(bankId: string, sub: SubAccount) {
    return this.http.post<BankAccount>(`${this.apiUrl}/bank-accounts/${bankId}/sub-accounts`, sub).pipe(
      tap(updatedBank => this.bankAccounts.update(banks => banks.map(b => b.id === updatedBank.id ? updatedBank : b)))
    );
  }

  deleteSubAccount(bankId: string, subId: string) {
    return this.http.delete<BankAccount>(`${this.apiUrl}/bank-accounts/${bankId}/sub-accounts/${subId}`).pipe(
      tap(updatedBank => this.bankAccounts.update(banks => banks.map(b => b.id === updatedBank.id ? updatedBank : b)))
    );
  }

  addPersonalExpense(expense: PersonalExpense) {
    return this.http.post<PersonalExpense>(`${this.apiUrl}/personal-expenses`, expense).pipe(
      tap(added => this.personalExpenses.update(exps => [...exps, added]))
    );
  }

  updatePersonalExpense(expense: PersonalExpense) {
    return this.http.put<PersonalExpense>(`${this.apiUrl}/personal-expenses/${expense.id}`, expense).pipe(
      tap(updated => this.personalExpenses.update(exps => exps.map(e => e.id === updated.id ? updated : e)))
    );
  }

  deletePersonalExpense(id: string) {
    return this.http.delete(`${this.apiUrl}/personal-expenses/${id}`).pipe(
      tap(() => this.personalExpenses.update(exps => exps.filter(e => e.id !== id)))
    );
  }

  savePaycheckConfig(config: PaycheckConfig) {
    return this.http.post<PaycheckConfig>(`${this.apiUrl}/paycheck-config`, config).pipe(
      tap(saved => this.paycheckConfig.set(saved))
    );
  }

  markPaycheckActioned(date: Date): Observable<PaycheckConfig | null> {
    const config = this.paycheckConfig();
    if (config) {
      const updatedConfig = { ...config, lastActionedDate: date };
      return this.savePaycheckConfig(updatedConfig);
    }
    return of(null);
  }

  // --- NEW: Grocery Methods ---

  addGroceryTransaction(transaction: GroceryTransaction) {
    return this.http.post<{ fund: GroceryFund, transaction: GroceryTransaction }>(`${this.apiUrl}/grocery-transactions`, transaction).pipe(
      tap(res => {
        this.groceryFund.set(res.fund);
        // Prepend so the newest shows up first
        this.groceryTransactions.update(txs => [res.transaction, ...txs]);
      })
    );
  }

  deleteGroceryTransaction(id: string) {
    return this.http.delete<{ fund: GroceryFund }>(`${this.apiUrl}/grocery-transactions/${id}`).pipe(
      tap(res => {
        this.groceryFund.set(res.fund);
        this.groceryTransactions.update(txs => txs.filter(tx => tx.id !== id));
      })
    );
  }
}