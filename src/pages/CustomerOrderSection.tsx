// pages/CustomerOrderSection.tsx
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { OrderForm } from "@/components/OrderForm";
import { OrderListTable } from "@/components/OrderListTable";
import { Order } from "@/models/Order";

export default function CustomerOrderSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  const handleAddOrder = (order: Order) => {
    setOrders((prev) => [...prev, order]);
  };

  const handleSelectOrder = (id: string, selected: boolean) => {
    setSelectedOrderIds((prev) =>
      selected ? [...prev, id] : prev.filter((itemId) => itemId !== id)
    );
  };

  const handlePay = (id: string) => {
    alert(`Paying due amount for order ID: ${id}`);
  };

  const handleGenerateBill = () => {
    alert(`Generating bill for order IDs: ${selectedOrderIds.join(", ")}`);
  };

  return (
    <div className="min-h-screen flex justify-center items-start bg-[#f0f0f3] py-10 px-4">
      <div className="w-full max-w-5xl bg-white rounded-[32px] shadow-[8px_8px_20px_rgba(0,0,0,0.05),_-8px_-8px_20px_rgba(255,255,255,0.7)] p-6 md:p-10 space-y-8">
        {/* Search Bar */}
        <div>
          <Input
            placeholder="Search for customer"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl shadow-inner border border-gray-200 px-4 py-3"
          />
        </div>

        {/* Customer Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Name"
            className="rounded-xl shadow-inner border border-gray-200"
          />
          <Input
            placeholder="Village"
            className="rounded-xl shadow-inner border border-gray-200"
          />
          <Input
            placeholder="Phone"
            className="rounded-xl shadow-inner border border-gray-200"
          />
          <Input
            placeholder="Email"
            className="rounded-xl shadow-inner border border-gray-200"
          />
          <div className="md:col-span-2 text-right">
            <Button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-full shadow-md">
              New Order
            </Button>
          </div>
        </div>

        {/* Order Form */}
        <div className="p-6 bg-white rounded-[28px] shadow-[inset_4px_4px_10px_rgba(0,0,0,0.05),_inset_-4px_-4px_10px_rgba(255,255,255,0.8)]">
          <h2 className="text-lg font-semibold mb-4">Order Form</h2>
          <OrderForm onAddOrder={handleAddOrder} />
        </div>

        {/* Orders Section */}
        {orders.length > 0 && (
          <div className="p-6 bg-white rounded-[28px] shadow-[inset_4px_4px_10px_rgba(0,0,0,0.05),_inset_-4px_-4px_10px_rgba(255,255,255,0.8)]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Orders</h2>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-4 py-2">
                Generate Bill
              </Button>
            </div>
            <OrderListTable
              orders={orders}
              onPay={handlePay}
              onSelect={handleSelectOrder}
              selectedIds={selectedOrderIds}
            />
          </div>
        )}
      </div>
    </div>
  );
}
