export interface HouseholdMemberFinance {
  userId: string;
  name: string;
  iconUrl: string;
  proratedPercentage: number;
  isCurrentUser?: boolean;
}
export interface CommonExpense {
  id: string;
  householdId?: string;
  name: string;
  amount: number;
  splitType: string;
  targetFund?: 'GROCERY' | 'HOUSEHOLD' | 'ELECTRICITY' | 'NONE';
  isGrocery?: boolean;
  color?: string;
  orderIndex?: number;
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
  isGrocery?: boolean;
  color?: string;
  orderIndex?: number;
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

export interface GroceryFund {
  id?: string;
  householdId?: string;
  balance: number;
  cycleAnchorDate?: string;
  cycleLengthDays?: number;
}

export interface GroceryTransaction {
  id?: string;
  householdId?: string;
  userId: string;
  storeName: string;
  description: string;
  amount: number;
  transactionType: 'ADD' | 'SPEND';
  date: Date | string;
  userIconUrl?: string;
  userName?: string;
  targetCycleDate?: string;
}

export interface HouseholdFund {
  id?: string;
  householdId?: string;
  balance: number;
}

export interface HouseholdTransaction {
  id?: string;
  householdId?: string;
  userId: string;
  storeName: string;
  description: string;
  amount: number; 
  transactionType: 'ADD' | 'SPEND';
  date: Date | string;
  userIconUrl?: string;
  userName?: string;
}

export interface ElectricityFund {
  id?: string;
  householdId?: string;
  balance: number;
  cycleStartDate?: Date | string;
  cycleEndDate?: Date | string;
}

export interface ElectricityTransaction {
  id?: string;
  householdId?: string;
  userId: string;
  description: string;
  amount: number; 
  transactionType: 'ADD' | 'SPEND';
  date: Date | string;
  userIconUrl?: string;
  userName?: string;
}

// NEW: Hydro Bill Model
export interface HydroBill {
  id?: string;
  householdId?: string;
  periodStart: Date | string;
  periodEnd: Date | string;
  amount: number; 
  kwhConsumed?: number; 
}