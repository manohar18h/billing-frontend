export interface Worker {
  workerId: number;
  fullName: string;
  userName: string;
  phnNumber: string;
  village: string;

  earnedAmount: number;
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
  localStorage.removeItem(LS_KEY);
  if (!force) {
    const cached = localStorage.getItem(LS_KEY);
    if (cached) return JSON.parse(cached) as Worker[];
  }

  const token = localStorage.getItem("token");
  console.log("[fetchWorkers] token →", token);
  const res = await fetch("http://15.207.98.116:8081/admin/getAllWorkers", {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log("[fetchWorkers] HTTP status →", res.status);

  if (!res.ok) throw new Error("Failed to fetch workers");
  const data = (await res.json()) as Worker[];
  localStorage.removeItem(LS_KEY);
  localStorage.setItem(LS_KEY, JSON.stringify(data));
  return data;
}

export function invalidateWorkersCache() {
  localStorage.removeItem(LS_KEY);
}
