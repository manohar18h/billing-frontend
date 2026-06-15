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
    deliveryDate: string;
    deliveryStatus: string;
    workStatus: string;
    itemCode: string;

    workerPay: WorkerPay;

    transactions: Transaction[];
    oldItems: OldItem[];

    version: number;
  }

  interface SpclWork {
    speclWorkId: number;
    worker?: {
      workerId: number;
      fullName: string;
    } | null;
    itemName: string;
    metal: string;
    workerMetalWeight: number | null;
    otherMetalName: string | null;
    otherWeight: number | null;
    amount: number | null;
    wastage: number | null;
    itemLinkCode: string;
    deliveryDate: string | null;
  }

  const location = useLocation();
  const navigate = useNavigate();

  const { orderId } = useParams<{ orderId: string }>();
  const numericOrderId = Number(orderId); // convert to number

  const { customerId, customer, orders } = location.state || {};

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const [spclWorks, setSpclWorks] = useState<SpclWork[]>([]);
  const [spclLoading, setSpclLoading] = useState(false);

  // Assuming you already have an Order interface
  // interface Order { ... }

  useEffect(() => {
    const fetchSpclWork = async () => {
      if (
        !order?.itemCode ||
        order.itemCode.trim() === "" ||
        order.itemCode === "0"
      ) {
        setSpclWorks([]);
        return;
      }

      try {
        setSpclLoading(true);

        const token = localStorage.getItem("token");

        const response = await api.get<SpclWork[]>(
          `/admin/spcl-work/${order.itemCode}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        setSpclWorks(response.data || []);
      } catch (err) {
        console.error("Error fetching spcl work:", err);
        setSpclWorks([]);
      } finally {
        setSpclLoading(false);
      }
    };

    fetchSpclWork();
  }, [order?.itemCode]);

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
          },
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
    value: string | number | boolean | null | undefined,
  ) => (
    <div className="flex justify-between border-b py-1 text-sm">
      <span className="font-medium text-gray-600">{label}:</span>
      <span className="text-gray-800">{String(value)}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-3 pb-[90px] dark:bg-[#1a1b1f] md:flex md:items-center md:justify-center md:p-8 md:pb-8">
<div className="relative w-full rounded-2xl bg-gradient-to-r from-[#0f172a] via-[#1e1b4b] to-[#3b0764] p-4 text-white shadow-2xl md:max-w-6xl md:rounded-3xl md:p-10">
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
className="absolute right-3 top-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1 text-xs text-white hover:opacity-90 md:right-5 md:top-5 md:px-4 md:text-sm"
        >
          ✕ Close
        </button>

        {/* Title */}
      <h1 className="mb-6 pr-20 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-2xl font-extrabold text-transparent md:mb-8 md:pr-0 md:text-3xl">
  Order Details (#{order.orderId})
</h1>

        {/* Order Info Grid */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:mb-10 md:grid-cols-2 md:gap-8">
          <div className="border-purple-300/40 md:border-r md:pr-6">
            {[
              [
                "Order Date",
                new Date(order.orderDate).toLocaleDateString("en-GB"),
              ],
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
              ["Bits Weight", order.bits_weight],
              ["Bits Amount", order.bits_amount],
            ].map(([label, value]) => (
              <p key={label} className="mb-2 text-lg">
                <span className="text-purple-300 font-semibold">{label}:</span>{" "}
                <span className="text-emerald-300 font-bold">
                  {value || "—"}
                </span>
              </p>
            ))}
          </div>

          <div className="md:pl-6">
            {[
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
              ["Item Link Worker Code", order.itemCode],
              [
                "Delivery Date",
                order.deliveryDate
                  ? new Date(order.deliveryDate).toLocaleDateString("en-GB")
                  : "",
              ],
              ["Delivery Status", order.deliveryStatus],
              ["Work Status", order.workStatus],
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
              <div key={index} className="mb-6 grid grid-cols-1 gap-3 rounded-2xl bg-white/5 p-4 md:mb-10 md:grid-cols-2 md:gap-6 md:bg-transparent md:p-0">
               <div className="border-purple-300/40 md:border-r md:pr-6">
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
                <div className="md:pl-6">
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
            <div className="mb-6 grid grid-cols-1 gap-3 rounded-2xl bg-white/5 p-4 md:mb-10 md:grid-cols-2 md:gap-6 md:bg-transparent md:p-0">
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
            <ul className="mb-8 space-y-2 md:mb-10 md:list-disc md:pl-5">
              {order.transactions.map((tx: Transaction) => (
                <li key={tx.transactionId} className="rounded-xl bg-white/5 p-3 text-sm text-emerald-300 md:bg-transparent md:p-0 md:text-base">
                  ₹{tx.paidAmount} -{}
                  <span className="text-red-300">
                    {tx.paymentMethod}
                  </span> on{" "}
                  {new Date(tx.paymentDate).toLocaleDateString("en-GB")} -{" "}
                  <span className="text-yellow-300">{tx.paymentType}</span>
                </li>
              ))}
            </ul>
          </>
        )}
        {(spclLoading || spclWorks.length > 0) && (
          <>
            <h2 className="text-2xl font-bold text-purple-300 mb-4">
              Spcl Work
            </h2>

            {spclLoading ? (
              <p className="text-emerald-300 mb-8">Loading spcl work...</p>
            ) : (
              spclWorks.map((work, index) => (
                <div
                  key={work.speclWorkId ?? index}
                  className="grid grid-cols-2 gap-6 mb-10"
                >
                  <div className="pr-6 border-r border-purple-300/40">
                    <p>
                      <span className="text-purple-200">Worker Name:</span>{" "}
                      <span className="text-emerald-300">
                        {work.worker?.fullName || "—"}
                      </span>
                    </p>
                    <p>
                      <span className="text-purple-200">Metal:</span>{" "}
                      <span className="text-emerald-300">
                        {work.metal || "—"}
                      </span>
                    </p>
                    <p>
                      <span className="text-purple-200">
                        Worker Metal Weight:
                      </span>{" "}
                      <span className="text-emerald-300">
                        {work.workerMetalWeight ?? "—"}
                      </span>
                    </p>
                    <p>
                      <span className="text-purple-200">Other Metal Name:</span>{" "}
                      <span className="text-emerald-300">
                        {work.otherMetalName || "—"}
                      </span>
                    </p>
                  </div>

                  <div className="pl-6">
                    <p>
                      <span className="text-pink-200">Other Weight:</span>{" "}
                      <span className="text-yellow-300">
                        {work.otherWeight ?? "—"}
                      </span>
                    </p>
                    <p>
                      <span className="text-pink-200">Amount:</span>{" "}
                      <span className="text-yellow-300">
                        {work.amount ?? "—"}
                      </span>
                    </p>
                    <p>
                      <span className="text-pink-200">Wastage:</span>{" "}
                      <span className="text-yellow-300">
                        {work.wastage ?? "—"}
                      </span>
                    </p>
                    <p>
                      <span className="text-pink-200">Item Link Code:</span>{" "}
                      <span className="text-yellow-300">
                        {work.itemLinkCode || "—"}
                      </span>
                    </p>
                    <p>
                      <span className="text-pink-200">
                        Worker Delivery Date:
                      </span>{" "}
                      <span className="text-yellow-300">
                        {work.deliveryDate
                          ? new Date(work.deliveryDate).toLocaleDateString(
                              "en-GB",
                            )
                          : "—"}
                      </span>
                    </p>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};
export default OrderDetails;
