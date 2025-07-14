import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

const OrderDetails: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { orderId } = useParams<{ orderId: string }>();
  const numericOrderId = Number(orderId); // convert to number

  const { customerId, customer, orders } = location.state || {};

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        if (!numericOrderId) return;
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://15.207.98.116:8081/admin/getOrderByOrdId/${numericOrderId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        setOrder(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [numericOrderId]);

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (!order) return <div className="p-6 text-center">Order not found</div>;

  const displayField = (label: string, value: any) => (
    <div className="flex justify-between border-b py-1 text-sm">
      <span className="font-medium text-gray-600">{label}:</span>
      <span className="text-gray-800">{String(value)}</span>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#f5f5f5] dark:bg-[#1a1b1f]">
      <div className="w-full max-w-5xl bg-white/90 dark:bg-[#222] backdrop-blur-lg border border-purple-300/50 rounded-3xl shadow-2xl p-8 relative">
        <button
          onClick={() => {
            if (customer && orders) {
              navigate("/admin/customer-details", {
                state: { customer, orders },
              });
            } else if (customerId) {
              navigate("/admin/orders", {
                state: { showOrdersList: true, customerId },
              });
            } else {
              navigate("/admin");
            }
          }}
          className="absolute top-4 right-4 bg-purple-600 text-white px-4 py-1 rounded-lg text-sm hover:bg-purple-700"
        >
          Close
        </button>

        <h1 className="text-2xl font-bold text-purple-700 dark:text-purple-300 mb-6">
          Order Details (#{order.orderId})
        </h1>

        <div className="grid grid-cols-2 gap-4 mb-8 relative">
          <div className="pr-4 border-r border-gray-300 dark:border-gray-600">
            {[
              ["Order Date", new Date(order.orderDate).toLocaleString()],
              ["Delivery Date", order.deliveryDate],
              ["Item Name", order.itemName],
              ["Occasion", order.occasion],
              ["Design", order.design],
              ["Size", order.size],
              ["Metal", order.metal],
              ["Metal Price", order.metalPrice],
              ["Metal Weight", order.metal_weight],
              ["Wastage", order.wastage],
            ].map(([label, value]) => displayField(label, value))}
          </div>

          <div className="pl-4">
            {[
              ["Making Charges", order.making_charges],
              ["Stone Weight", order.stone_weight],
              ["Diamond Weight", order.diamond_weight],
              ["Bits Weight", order.bits_weight],
              ["Enamel Weight", order.enamel_weight],
              ["Pearls Weight", order.pearls_weight],
              ["Other Weight", order.other_weight],
              ["Stock Box", order.stock_box],
              ["Gross Weight", order.gross_weight],
              ["Total Item Amount", order.total_item_amount],
              ["Discount", order.discount],
              ["Old Exchange Item Price", order.oldExItemPrice],
              ["Paid Amount", order.paidAmount],
              ["Due Amount", order.dueAmount],
              ["Delivery Status", order.delivery_status],
            ].map(([label, value]) => displayField(label, value))}
          </div>
        </div>

        {order.oldItems?.length > 0 && (
          <>
            <h2 className="text-xl font-semibold text-purple-600 dark:text-purple-300 mb-2">
              Old Exchanged Items
            </h2>

            {order.oldItems.map((item: any) => (
              <div className="grid grid-cols-2 gap-4 mb-8 relative">
                <div className="pr-4 border-r border-gray-300 dark:border-gray-600">
                  {displayField("Metal Name", item.exchange_metal_name)}
                  {displayField("Item Name", item.exchange_metal)}
                </div>
                <div className="pl-4">
                  {displayField("Weight", item.exchange_metal_weight)}
                  {displayField(
                    "Total Amount",
                    item.exchange_item_amount + "₹"
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {order.workerPay && (
          <>
            <h2 className="text-xl font-semibold text-purple-600 dark:text-purple-300 mb-2">
              Worker Details
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-8 relative">
              <div className="pr-4 border-r border-gray-300 dark:border-gray-600">
                {displayField("Name", order.workerPay.fullName)}
                {displayField("Work Pay", order.workerPay.workPay)}
                {displayField("Metal", order.workerPay.metal)}
              </div>
              <div className="pl-4">
                {displayField("Metal Weight", order.workerPay.metal_weight)}
                {displayField("Worker ID", order.workerPay.workerId)}
                {displayField("WP ID", order.workerPay.wpid)}
              </div>
            </div>
          </>
        )}

        {order.transactions?.length > 0 && (
          <>
            <h2 className="text-xl font-semibold text-purple-600 dark:text-purple-300 mb-2">
              Transactions
            </h2>
            <ul className="mb-8 pl-5 list-disc">
              {order.transactions.map((tx: any) => (
                <li key={tx.transactionId}>
                  ₹{tx.paidAmount} on{" "}
                  {new Date(tx.paymentDate).toLocaleString()}
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
