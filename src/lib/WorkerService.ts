import api from "@/services/api";
export interface Worker {
  workerId: number;
  fullName: string;
  userName: string;
  phnNumber: string;
  village: string;

  earnedAmount: number;
  earnedWastage: number;
  receivedAmount: number;
  pendingAmount: number;

  goldStock: number;
  silverStock: number;
  copperStock: number;

  /* --- nested collections --- */
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
    date: string | null;
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

const LS_KEY = "allWorkers";

export async function fetchWorkers(force = false): Promise<Worker[]> {
  if (!force) {
    const cached = localStorage.getItem(LS_KEY);
    if (cached) return JSON.parse(cached) as Worker[];
  }

  const token = localStorage.getItem("token");
  console.log("[fetchWorkers] token →", token);

  const res = await api.get<Worker[]>("/admin/getAllWorkers", {
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log("[fetchWorkers] HTTP status →", res.status);

  const data = res.data;

  localStorage.removeItem(LS_KEY);
  localStorage.setItem(LS_KEY, JSON.stringify(data));
  return data;
}

export function invalidateWorkersCache() {
  localStorage.removeItem(LS_KEY);
}
