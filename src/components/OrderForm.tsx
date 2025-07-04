// components/OrderForm.tsx
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Order } from "@/models/Order";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  onAddOrder: (order: Order) => void;
}

export function OrderForm({ onAddOrder }: Props) {
  const [formData, setFormData] = useState({
    itemName: "",
    metal: "",
    metalPrice: 0,
    metalWeight: 0,
    itemDesign: "",
    makingCharges: 0,
    stoneWeight: 0,
    itemPrice: 0,
    paidAmount: 0,
    dueAmount: 0,
    orderDate: new Date().toISOString().slice(0, 10),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]:
        name.includes("Weight") ||
        name.includes("Price") ||
        name.includes("Amount")
          ? parseFloat(value)
          : value,
    });
  };

  const handleSubmit = () => {
    const newOrder: Order = {
      id: crypto.randomUUID(),
      customerId: "101", // Placeholder customer ID
      ...formData,
    };
    onAddOrder(newOrder);
    setFormData({
      itemName: "",
      metal: "",
      metalPrice: 0,
      metalWeight: 0,
      itemDesign: "",
      makingCharges: 0,
      stoneWeight: 0,
      itemPrice: 0,
      paidAmount: 0,
      dueAmount: 0,
      orderDate: new Date().toISOString().slice(0, 10),
    });
  };

  return (
    <div className="max-w-4xl mx-auto mt-6 p-6 bg-white rounded-[28px] shadow-[8px_8px_20px_rgba(0,0,0,0.05),_-8px_-8px_20px_rgba(255,255,255,0.7)]">
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
        <Input
          placeholder="Item Name"
          name="itemName"
          value={formData.itemName}
          onChange={handleChange}
        />
        <Input
          placeholder="Metal"
          name="metal"
          value={formData.metal}
          onChange={handleChange}
        />
        <Input
          placeholder="Metal Price"
          name="metalPrice"
          type="number"
          value={formData.metalPrice}
          onChange={handleChange}
        />
        <Input
          placeholder="Metal Weight"
          name="metalWeight"
          type="number"
          value={formData.metalWeight}
          onChange={handleChange}
        />
        <Input
          placeholder="Item Design"
          name="itemDesign"
          value={formData.itemDesign}
          onChange={handleChange}
        />
        <Input
          placeholder="Making Charges"
          name="makingCharges"
          type="number"
          value={formData.makingCharges}
          onChange={handleChange}
        />
        <Input
          placeholder="Stone Weight"
          name="stoneWeight"
          type="number"
          value={formData.stoneWeight}
          onChange={handleChange}
        />
        <Input
          placeholder="Item Price"
          name="itemPrice"
          type="number"
          value={formData.itemPrice}
          onChange={handleChange}
        />
        <Input
          placeholder="Paid Amount"
          name="paidAmount"
          type="number"
          value={formData.paidAmount}
          onChange={handleChange}
        />
        <Input
          placeholder="Due Amount"
          name="dueAmount"
          type="number"
          value={formData.dueAmount}
          onChange={handleChange}
        />
        <Input
          placeholder="Order Date"
          name="orderDate"
          type="date"
          value={formData.orderDate}
          onChange={handleChange}
        />
        <div className="md:col-span-2 text-right">
          <Button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-xl shadow-md"
          >
            Add Order
          </Button>
        </div>
      </CardContent>
    </div>
  );
}
