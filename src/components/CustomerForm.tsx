import { Input } from "@/components/ui/input";
import { Button } from "./ui/button";

export function CustomerForm() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
      <Input placeholder="Full Name" className="rounded-xl" />
      <Input placeholder="Village" className="rounded-xl" />
      <Input placeholder="Phone Number" className="rounded-xl" />
      <Input placeholder="Email ID" className="rounded-xl" />
      <Input placeholder="Total Amount" className="rounded-xl" />
      <Input placeholder="Total Due Amount" className="rounded-xl" />
      <div className="md:col-span-2 text-right">
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-xl shadow-md">
          + New Order
        </Button>
      </div>
    </div>
  );
}
