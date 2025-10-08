import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "@/services/api";

const OrderDetails: React.FC = () => {
  // Transaction model
  // Transaction details
  interface Transaction {
    transactionId: number;
    paymentMethod: string;
    paymentType: string;
    paidAmount: number;
    paymentDate: string; // ISO date string
    orderId: number;
  }

  // Old exchanged items
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

  interface WorkerPay {
    workPay: number;
    wastage: number;
    date: string; // you can make this `Date` if you parse it
    wpid: number;
    workerId: number;
    fullName: string;
    orderId: number;
    metal: string;
    metal_weight: number;
  }

  // Main order interface
  interface Order {
    orderId: number;
    orderDate: string; // ISO date string
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
    paidAmount: number | null;
    dueAmount: number;
    receivedAmount: number;
    deliveryStatus: string;

    workerPay: WorkerPay;

    transactions: Transaction[];
    oldItems: OldItem[];

    version: number;
  }

  const location = useLocation();
  const navigate = useNavigate();

  const { orderId } = useParams<{ orderId: string }>();
  const numericOrderId = Number(orderId); // convert to number

  const { customerId, customer, orders } = location.state || {};

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Assuming you already have an Order interface
  // interface Order { ... }

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        if (!numericOrderId) return;

        const token = localStorage.getItem("token");

        const response = await api.get<Order>( // 👈 tell Axios the response type
          `/admin/getOrderByOrdId/${numericOrderId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setOrder(response.data); // ✅ now TypeScript knows response.data is Order
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error("Error fetching order details:", err.message);
        } else {
          console.error("Unexpected error:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [numericOrderId]);

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (!order) return <div className="p-6 text-center">Order not found</div>;

  const displayField = (
    label: string,
    value: string | number | boolean | null | undefined
  ) => (
    <div className="flex justify-between border-b py-1 text-sm">
      <span className="font-medium text-gray-600">{label}:</span>
      <span className="text-gray-800">{String(value)}</span>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#f5f5f5] dark:bg-[#1a1b1f]">
      <div className="w-full max-w-6xl bg-gradient-to-r  from-[#0f172a] via-[#1e1b4b] to-[#3b0764] text-white rounded-3xl shadow-2xl p-10 relative">
        {/* Close button */}
        <button
          onClick={() => {
            const from = sessionStorage.getItem("from");

            if (customer && orders && from === "CustomerDetails") {
              navigate("/admin/customer-details", {
                state: { customer, orders },
              });
            } else if (customerId) {
              navigate("/admin/orders", {
                state: { showOrdersList: true, customerId },
              });
            } else if (from === "BillDetails") {
              const stored = sessionStorage.getItem("ordersState");
              const parsed = stored ? JSON.parse(stored) : null;
              const restoredOrders = parsed?.orders || [];

              navigate("/admin/bill-details", {
                state: {
                  showOrdersList: true,
                  customerId,
                  orders: restoredOrders,
                },
              });
            } else {
              navigate("/admin");
            }
          }}
          className="absolute top-5 right-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-lg text-sm hover:opacity-90"
        >
          ✕ Close
        </button>

        {/* Title */}
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-8">
          Order Details (#{order.orderId})
        </h1>

        {/* Order Info Grid */}
        <div className="grid grid-cols-2 gap-8 mb-10">
          <div className="pr-6 border-r border-purple-300/40">
            {[
              ["Order Date", new Date(order.orderDate).toLocaleString()],
              ["Item Name", order.itemName],
              ["Catalogue", order.catalogue],
              ["Design", order.design],
              ["Size", order.size],
              ["Metal", order.metal],
              ["Metal Price", order.metalPrice],
              ["Metal Weight", order.metal_weight],
              ["Wastage", order.wastage],
              ["Making Charges", order.making_charges],
              ["Stone Weight", order.stone_weight],
              ["Stone Amount", order.stone_amount],
              ["Wax Weight", order.wax_weight],
              ["Wax Amount", order.wax_amount],
              ["Diamond Weight", order.diamond_weight],
              ["Diamond Amount", order.diamond_amount],
            ].map(([label, value]) => (
              <p key={label} className="mb-2 text-lg">
                <span className="text-purple-300 font-semibold">{label}:</span>{" "}
                <span className="text-emerald-300 font-bold">
                  {value || "—"}
                </span>
              </p>
            ))}
          </div>

          <div className="pl-6">
            {[
              ["Bits Weight", order.bits_weight],
              ["Bits Amount", order.bits_amount],
              ["Enamel Weight", order.enamel_weight],
              ["Enamel Amount", order.enamel_amount],
              ["Pearls Weight", order.pearls_weight],
              ["Pearls Amount", order.pearls_amount],
              ["Other Weight", order.other_weight],
              ["Other Amount", order.other_amount],
              ["Stock Box", order.stock_box],
              ["Gross Weight", order.gross_weight],
              ["Total Item Amount", order.total_item_amount],
              ["Discount", order.discount],
              ["Old Exchange Item Price", order.oldExItemPrice],
              ["Paid Amount", order.paidAmount],
              ["Due Amount", order.dueAmount],
              ["Received Amount", order.receivedAmount],
              ["Delivery Status", order.deliveryStatus],
            ].map(([label, value]) => (
              <p key={label} className="mb-2 text-lg">
                <span className="text-pink-300 font-semibold">{label}:</span>{" "}
                <span className="text-yellow-300 font-bold">
                  {value || "—"}
                </span>
              </p>
            ))}
          </div>
        </div>

        {/* Old Exchanged Items */}
        {order.oldItems?.length > 0 && (
          <>
            <h2 className="text-2xl font-bold text-purple-300 mb-4">
              Old Exchanged Items
            </h2>
            {order.oldItems.map((item: OldItem, index: number) => (
              <div key={index} className="grid grid-cols-2 gap-6 mb-10">
                <div className="pr-6 border-r border-purple-300/40">
                  <p>
                    <span className="text-purple-200">Metal Name:</span>{" "}
                    <span className="text-emerald-300">
                      {item.exchange_metal_name}
                    </span>
                  </p>
                  <p>
                    <span className="text-purple-200">Item Name:</span>{" "}
                    <span className="text-emerald-300">
                      {item.exchange_metal}
                    </span>
                  </p>
                  <p>
                    <span className="text-purple-200">Weight:</span>{" "}
                    <span className="text-emerald-300">
                      {item.exchange_metal_weight}
                    </span>
                  </p>
                </div>
                <div className="pl-6">
                  <p>
                    <span className="text-pink-200">Metal Purity:</span>{" "}
                    <span className="text-yellow-300">
                      {item.exchange_purity_weight}
                    </span>
                  </p>
                  <p>
                    <span className="text-pink-200">Metal Price:</span>{" "}
                    <span className="text-yellow-300">
                      {item.exchange_metal_price}
                    </span>
                  </p>
                  <p>
                    <span className="text-pink-200">Total Amount:</span>{" "}
                    <span className="text-yellow-300">
                      {item.exchange_item_amount} ₹
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Worker Details */}
        {order.workerPay && (
          <>
            <h2 className="text-2xl font-bold text-purple-300 mb-4">
              Worker Details
            </h2>
            <div className="grid grid-cols-2 gap-6 mb-10">
              <div className="pr-6 border-r border-purple-300/40">
                <p>
                  <span className="text-purple-200">Name:</span>{" "}
                  <span className="text-emerald-300">
                    {order.workerPay.fullName}
                  </span>
                </p>
                <p>
                  <span className="text-purple-200">Work Pay:</span>{" "}
                  <span className="text-emerald-300">
                    {order.workerPay.workPay}
                  </span>
                </p>

                <p>
                  <span className="text-purple-200">Metal:</span>{" "}
                  <span className="text-emerald-300">
                    {order.workerPay.metal}
                  </span>
                </p>
              </div>
              <div className="pl-6">
                <p>
                  <span className="text-pink-200">Wastage:</span>{" "}
                  <span className="text-yellow-300">
                    {order.workerPay.wastage}
                  </span>
                </p>
                <p>
                  <span className="text-pink-200">Metal Weight:</span>{" "}
                  <span className="text-yellow-300">
                    {order.workerPay.metal_weight}
                  </span>
                </p>
                <p>
                  <span className="text-pink-200">Worker ID:</span>{" "}
                  <span className="text-yellow-300">
                    {order.workerPay.workerId}
                  </span>
                </p>
              </div>
            </div>
          </>
        )}

        {/* Transactions */}
        {order.transactions?.length > 0 && (
          <>
            <h2 className="text-2xl font-bold text-purple-300 mb-4">
              Transactions
            </h2>
            <ul className="mb-10 pl-5 list-disc space-y-2">
              {order.transactions.map((tx: Transaction) => (
                <li key={tx.transactionId} className="text-emerald-300">
                  ₹{tx.paidAmount} -{}
                  <span className="text-red-300">
                    {tx.paymentMethod}
                  </span> on {new Date(tx.paymentDate).toLocaleString()} -{" "}
                  <span className="text-yellow-300">{tx.paymentType}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};
export default OrderDetails;
