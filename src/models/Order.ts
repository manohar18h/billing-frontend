export interface Order {
  id: string;
  customerId: string;
  orderDate: string;
  metal: string;
  metalPrice: number;
  itemName: string;
  catalogue: string;
  design: string;
  size: string;
  metal_weight: number;
  wastage: number;
  making_charges: number;
  stone_weight: number;
  stone_amount: number;
  wax_weight: number;
  wax_amount: number;
  diamond_weight: number;
  diamond_amount: number;
  bits_weight: number;
  bits_amount: number;
  enamel_weight: number;
  enamel_amount: number;
  pearls_weight: number;
  pearls_amount: number;
  other_weight: number;
  other_amount: number;
  stock_box: number;
  gross_weight: number;
  total_item_amount: number;
  discount: number;
  oldExItemPrice: number;
  paidAmount: number;
  dueAmount: number;
  receivedAmount: number | null;
  deliveryStatus: string;
  workerPay?: WorkerPay | null;
  transactions: Transaction[];
  oldItems?: OldItem[];
  version: number;
}

interface WorkerPay {
  workPay: number;
  date: string;
  wpid: number;
  workerId: number;
  fullName: string;
  orderId: number;
  metal: string;
  metal_weight: number;
}

interface Transaction {
  transactionId: number;
  paymentMethod: string | null;
  paymentType: string | null;
  paidAmount: number;
  paymentDate: string;
  orderId: number;
}

interface OldItem {
  oldItemId: number;
  exchange_metal: string;
  exchange_metal_name: string;
  exchange_metal_weight: string;
  exchange_purity_weight: string;
  exchange_metal_price: number;
  exchange_item_amount: number;
  orderId: number;
}
