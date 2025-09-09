export interface WorkerData {
  workerId: number;
  fullName: string;
  userName: string;
  phnNumber: string;
  village: string;

  earnedAmount: number;
  earnedWastage: number;
  receivedAmount: number;
  pendingAmount: number;

  total24GoldStock: number;
  total999SilverStock: number;
  total22GoldStock: number;
  total995SilverStock: number;

  workerStocks: {
    metal: string;
    metalWeight: number;
    todaysDate: string;
    wstockId: number;
  }[];

  lotWorks: {
    lotId: number;
    metal: string;
    itemName: string;
    itemWeight: number;
    pieces: number;
    wastage: number;
    amount: number;
    deliveryDate: string | null;
  }[];

  repairWorks: {
    metal: string;
    itemName: string;
    metalWeight: number;
    customerPay: number;
    workerPay: number;
    deliveryDate: string | null;
  }[];

  workerPays: {
    workPay: number;
    wpid: number;
    date?: string | null; // ← optional now
    workerId: number;
    fullName: string;
    orderId: number;
    metal: string;
    metal_weight: number;
  }[];

  workerTransactionHistories: {
    paidAmount: number;
    paymentDate: string;
    wtid: number;
  }[];
}
