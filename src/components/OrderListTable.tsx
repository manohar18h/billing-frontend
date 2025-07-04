// components/OrderListTable.tsx
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Order } from "@/models/Order";

interface Props {
  orders: Order[];
  onPay: (id: string) => void;
  onSelect: (id: string, selected: boolean) => void;
  selectedIds: string[];
}

export function OrderListTable({
  orders,
  onPay,
  onSelect,
  selectedIds,
}: Props) {
  return (
    <div className="mt-6 shadow-xl rounded-2xl overflow-hidden border border-gray-200">
      <table className="w-full text-sm text-left bg-white">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2">
              <Checkbox disabled />
            </th>
            <th className="px-4 py-2">Item Name</th>
            <th className="px-4 py-2">Order Date</th>
            <th className="px-4 py-2">Metal Weight (g)</th>
            <th className="px-4 py-2">Total Amount (₹)</th>
            <th className="px-4 py-2">Due Amount (₹)</th>
            <th className="px-4 py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-2">
                <Checkbox
                  checked={selectedIds.includes(order.id)}
                  onCheckedChange={(checked) => onSelect(order.id, !!checked)}
                />
              </td>
              <td className="px-4 py-2">{order.itemName}</td>
              <td className="px-4 py-2">{order.orderDate}</td>
              <td className="px-4 py-2">{order.metalWeight.toFixed(2)}</td>
              <td className="px-4 py-2">{order.itemPrice.toFixed(2)}</td>
              <td className="px-4 py-2">{order.dueAmount.toFixed(2)}</td>
              <td className="px-4 py-2">
                <Button
                  variant="secondary"
                  className="bg-green-500 text-white hover:bg-green-600"
                  onClick={() => onPay(order.id)}
                >
                  Pay
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
