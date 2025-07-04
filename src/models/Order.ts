export interface Order {
  id: string;
  customerId: string;
  itemName: string;
  metal: string;
  metalPrice: number;
  metalWeight: number;
  itemDesign: string;
  makingCharges: number;
  stoneWeight: number;
  itemPrice: number;
  paidAmount: number;
  dueAmount: number;
  orderDate: string;
}
