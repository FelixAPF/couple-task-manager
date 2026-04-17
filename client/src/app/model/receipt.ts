export interface ReceiptItem {
  id?: number;
  name: string;
  price: number;
  taxable: boolean;
  assignmentType?: 'grocery' | 'individual' | 'split';
  assigneeId?: number;
}

export interface Receipt {
  id?: number;
  date: string;
  storeName: string;
  items: ReceiptItem[];
  totals: Record<string, number>;
  status?: 'DRAFT' | 'COMPLETED';
  householdId?: number; // <--- ADD THIS LINE
}