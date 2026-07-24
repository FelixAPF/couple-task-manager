export interface HouseholdMemberFinance {
  userId: string;
  name: string;
  iconUrl: string;
  proratedPercentage: number;
}

export interface CommonExpense {
  id: string;
  householdId?: string;
  name: string;
  amount: number;
  splitType: string;
}

export interface SubAccount {
  id: string;
  name: string;
}

export interface BankAccount {
  id: string;
  userId?: string;
  name: string;
  subAccounts: SubAccount[];
}

export interface PersonalExpense {
  id: string;
  userId?: string;
  name: string;
  amount: number;
  frequency: string;
  targetBankAccountId: string;
  targetSubAccountId: string;
}

export interface PaycheckConfig {
  id?: string;
  userId?: string;
  cycle: string;
  referenceDate: Date | string | null;
  amount: number;
  defaultBankAccountId: string;
  lastActionedDate?: Date | string | null;
}

export interface TransferCompilation {
  bankName: string;
  subAccountName: string;
  amount: number;
  expenses: string[];
}