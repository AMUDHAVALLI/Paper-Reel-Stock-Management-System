export type ItemType = 'KRAFT_REEL' | 'SHADE_REEL' | 'WHITE_REEL' | 'CUT_SHEET';

export type ReelStatus = 'IN_STOCK' | 'PARTIAL' | 'EXHAUSTED';

export type UserRole = 'ADMIN' | 'ACCOUNTANT' | 'STOREKEEPER' | 'OPERATOR' | (string & {});

export interface Reel {
  id: string;
  reelNo: string;
  itemType: ItemType;
  category: string; // e.g. "100 GSM", "120 GSM", "180 GSM RUBY", "200 GSM WHITE", "CUT SHEET 230 GSM"
  sizeDesc: string; // e.g. "90.5 CM", "132 CM", "62 X 77"
  sizeValue?: number; // e.g. 90.5
  sizeUnit: 'CM' | 'INCH' | 'MM';
  gsm: number;
  bf?: number;
  weight: number; // Original inward weight in KG
  usedWeight: number; // Weight consumed in KG
  balanceWeight: number; // Remaining weight in KG
  pricePerKg: number; // INR per KG
  reelAmount: number; // weight * pricePerKg
  consumedAmount: number; // usedWeight * pricePerKg
  balanceAmount: number; // balanceWeight * pricePerKg
  millName: string;
  bayLocation?: string;
  status: ReelStatus;
  inwardDate: string; // ISO date string or YYYY-MM-DD
  usedDate?: string;
  financialYear: string; // e.g. "2026-2027"
  isSheet: boolean;
  sheetCount?: number;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConsumptionLog {
  id: string;
  reelId: string;
  reelNo: string;
  consumedWeight: number;
  balanceAfter: number;
  pricePerKg: number;
  amount: number;
  consumedDate: string;
  machineId?: string; // e.g. "Corrugator Line 1", "Sheet Cutter"
  jobOrderNo?: string;
  recordedBy: string;
  remarks?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: 'INWARD' | 'CONSUME' | 'UPDATE' | 'DELETE' | 'IMPORT' | 'RESTORE';
  entityName: string;
  entityId: string;
  details: string;
  user: string;
  oldValues?: any;
  newValues?: any;
}

export interface StockSummary {
  totalReels: number;
  activeReels: number;
  partialReels: number;
  exhaustedReels: number;
  totalWeight: number;
  usedWeight: number;
  balanceWeight: number;
  totalAmount: number;
  consumedAmount: number;
  balanceAmount: number;
  byGsm: Record<string, {
    count: number;
    totalWeight: number;
    usedWeight: number;
    balanceWeight: number;
    totalAmount: number;
    balanceAmount: number;
  }>;
  byMill: Record<string, {
    count: number;
    totalWeight: number;
    balanceWeight: number;
    totalAmount: number;
  }>;
}
