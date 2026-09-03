import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environment';
import { 
  HouseholdMemberFinance, CommonExpense, BankAccount, PaycheckConfig, 
  PersonalExpense, SubAccount, GroceryFund, GroceryTransaction,
  HouseholdFund, ElectricityFund, ElectricityTransaction, HouseholdTransaction, HydroBill
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
  
  public groceryFund = signal<GroceryFund | null>(null);
  public groceryTransactions = signal<GroceryTransaction[]>([]);
  
  public householdFund = signal<HouseholdFund | null>(null);
  public householdTransactions = signal<HouseholdTransaction[]>([]);
  
  public electricityFund = signal<ElectricityFund | null>(null);
  public electricityTransactions = signal<ElectricityTransaction[]>([]);

  public hydroBills = signal<HydroBill[]>([]);

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
    
    this.http.get<GroceryFund>(`${this.apiUrl}/grocery-fund`).subscribe(res => this.groceryFund.set(res));
    this.http.get<GroceryTransaction[]>(`${this.apiUrl}/grocery-transactions`).subscribe(res => this.groceryTransactions.set(res));

    this.http.get<HouseholdFund>(`${this.apiUrl}/household-fund`).subscribe(res => this.householdFund.set(res));
    this.http.get<HouseholdTransaction[]>(`${this.apiUrl}/household-transactions`).subscribe(res => this.householdTransactions.set(res));
    
    this.http.get<ElectricityFund>(`${this.apiUrl}/electricity-fund`).subscribe(res => this.electricityFund.set(res));
    this.http.get<ElectricityTransaction[]>(`${this.apiUrl}/electricity-transactions`).subscribe(res => this.electricityTransactions.set(res));

    // NEW: Load Hydro Bills
    this.http.get<HydroBill[]>(`${this.apiUrl}/hydro-bills`).subscribe(res => this.hydroBills.set(res));
  }

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

  
  updateElectricityFund(updatedFund: ElectricityFund) {
    return this.http.put<ElectricityFund>(`${this.apiUrl}/electricity-fund`, updatedFund).pipe(
      tap(saved => this.electricityFund.set(saved))
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
    // Intercept and fix the timezone shift before it hits the backend
    if (config.referenceDate && config.referenceDate instanceof Date) {
        const offset = config.referenceDate.getTimezoneOffset() * 60000;
        config.referenceDate = new Date(config.referenceDate.getTime() - offset).toISOString().split('T')[0];
    }

    return this.http.post<PaycheckConfig>(`${this.apiUrl}/paycheck-config`, config).pipe(
      tap(saved => this.paycheckConfig.set(saved))
    );
  }
  
  markPaycheckActioned(date: Date | string): Observable<PaycheckConfig | null> {
    const config = this.paycheckConfig();
    if (config) {
      let localDateString: string;
      
      if (typeof date === 'string') {
        localDateString = date.split('T')[0];
      } else {
        const offset = date.getTimezoneOffset() * 60000;
        localDateString = new Date(date.getTime() - offset).toISOString().split('T')[0];
      }
      
      const updatedConfig = { ...config, lastActionedDate: localDateString };
      return this.savePaycheckConfig(updatedConfig);
    }
    return of(null);
  }

  updateGroceryFund(updatedFund: GroceryFund) {
    return this.http.put<GroceryFund>(`${this.apiUrl}/grocery-fund`, updatedFund).pipe(
      tap(saved => this.groceryFund.set(saved))
    );
  }
  addGroceryTransaction(transaction: GroceryTransaction) {
    return this.http.post<{ fund: GroceryFund, transaction: GroceryTransaction }>(`${this.apiUrl}/grocery-transactions`, transaction).pipe(
      tap(res => {
        this.groceryFund.set(res.fund);
        this.groceryTransactions.update(txs => [res.transaction, ...txs]);
      })
    );
  }

  reorderPersonalExpenses(orderedIds: string[]): Observable<PersonalExpense[]> {
    return this.http.put<PersonalExpense[]>(`${this.apiUrl}/personal-expenses/reorder`, orderedIds).pipe(
      tap(updated => this.personalExpenses.set(updated))
    );
  }

  reorderCommonExpenses(orderedIds: string[]): Observable<CommonExpense[]> {
    return this.http.put<CommonExpense[]>(`${this.apiUrl}/common-expenses/reorder`, orderedIds).pipe(
      tap(updated => this.commonExpenses.set(updated))
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

  addElectricityTransaction(transaction: ElectricityTransaction) {
    return this.http.post<{ fund: ElectricityFund, transaction: ElectricityTransaction }>(`${this.apiUrl}/electricity-transactions`, transaction).pipe(
      tap(res => {
        this.electricityFund.set(res.fund);
        this.electricityTransactions.update(txs => [res.transaction, ...txs]);
      })
    );
  }

  deleteElectricityTransaction(id: string) {
    return this.http.delete<{ fund: ElectricityFund }>(`${this.apiUrl}/electricity-transactions/${id}`).pipe(
      tap(res => {
        this.electricityFund.set(res.fund);
        this.electricityTransactions.update(txs => txs.filter(tx => tx.id !== id));
      })
    );
  }

  addHouseholdTransaction(transaction: HouseholdTransaction) {
    return this.http.post<{ fund: HouseholdFund, transaction: HouseholdTransaction }>(`${this.apiUrl}/household-transactions`, transaction).pipe(
      tap(res => {
        this.householdFund.set(res.fund);
        this.householdTransactions.update(txs => [res.transaction, ...txs]);
      })
    );
  }

  deleteHouseholdTransaction(id: string) {
    return this.http.delete<{ fund: HouseholdFund }>(`${this.apiUrl}/household-transactions/${id}`).pipe(
      tap(res => {
        this.householdFund.set(res.fund);
        this.householdTransactions.update(txs => txs.filter(tx => tx.id !== id));
      })
    );
  }

  // --- NEW: Hydro Bills API ---
  addHydroBill(bill: HydroBill) {
    return this.http.post<HydroBill>(`${this.apiUrl}/hydro-bills`, bill).pipe(
      tap(res => this.hydroBills.update(bills => [res, ...bills]))
    );
  }

  deleteHydroBill(id: string) {
    return this.http.delete(`${this.apiUrl}/hydro-bills/${id}`).pipe(
      tap(() => this.hydroBills.update(bills => bills.filter(b => b.id !== id)))
    );
  }
}