export interface WorkerProfileSummary {
  workerId: number;
  fullName: string;
  phnNumber: string;
  village: string;
  userName: string;

  earnedWastage: number;
  receivedWastage: number;
  pendingWastage: number;

  earnedAmount: number;
  receivedAmount: number;
  pendingAmount: number;

  total24GoldStock: number;
  total999SilverStock: number;
  total22GoldStock: number;
  total995SilverStock: number;
}

export interface WorkerStockData {
  stockId: number;
  metal: string;
  metalWeight: number;
  todaysDate: string;
}

export interface LotWorkData {
  lotId: number;
  metal: string;
  itemName: string;
  itemWeight: number;
  pieces: number;
  wastage: number | null;
  amount: number | null;
  deliveryDate: string;
}

export interface RepairWorkData {
  repairWorkId: number;
  metal: string;
  itemName: string;
  metalWeight: number;
  paymentMethod?: string | null;
  customerPay?: number | null;
  customerPaymentDate?: string | null;
  workerPay: number | null;
  deliveryDate: string;
}

export interface SpecialWorkData {
  speclWorkId: number;
  itemName: string;
  metal: string;
  workerMetalWeight: number;
  otherMetalName: string | null;
  otherWeight: number | null;
  amount: number | null;
  wastage: number | null;
  itemLinkCode: string | null;
  deliveryDate: string;
}

export interface WorkerPayData {
  wpid?: number;
  wPid?: number;
  orderId: number | null;
  metal_weight: number;
  fullName?: string;
  metal: string | null;
  workPay: number | null;
  wastage: number | null;
  date: string;
}

export interface WorkerTransactionData {
  wtid?: number;
  WTid?: number;
  wTid?: number;
  methodType: string;
  paymentMethod: string | null;
  paid: number;
  reason: string;
  paymentDate: string;
}

export interface PageResponse<T> {
  content: T[];

  number: number;
  size: number;
  numberOfElements: number;

  totalElements: number;
  totalPages: number;

  first: boolean;
  last: boolean;
  empty: boolean;
}