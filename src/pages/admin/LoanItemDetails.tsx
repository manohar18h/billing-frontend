import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "@/services/api";

const LoanItemDetails: React.FC = () => {
  interface LoanTotalAmtHistory {
    amountHistoryId: number;
    paymentMethod: string;
    paymentType: string;
    amount: number;
    paymentDate: string; // ISO date string
    loanId: number;
  }

  // Main order interface
  interface LoanItem {
    loanId: number;
    loanDate: string; // ISO date string
    metal: string;
    itemName: string;

    gross_weight: number;
    net_weight: number;
    rate_of_interest: number;

    total_amount: number;
    paid_amount: number;

    due_amount: number;
    paid_interest_amount: number;

    due_interest_amount: number;
    active_month_count: number;

    deliveryStatus: number;
    lastInterestUpdateDate: number;

    enamel_weight: number;

    loanTotalAmtHistories: LoanTotalAmtHistory[];

    version: number;
  }

  const location = useLocation();
  const navigate = useNavigate();

  const { loanId } = useParams<{ loanId: string }>();
  const numericItemId = Number(loanId); // convert to number

  const { loanCustomerId, loanCustomer, items } = location.state || {};

  const [item, setItem] = useState<LoanItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Assuming you already have an Order interface
  // interface Order { ... }

  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        if (!numericItemId) return;

        const token = localStorage.getItem("token");

        const response = await api.get<LoanItem>( // 👈 tell Axios the response type
          `/admin/getLoanItemByLoanId/${numericItemId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setItem(response.data); // ✅ now TypeScript knows response.data is Order
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

    fetchItemDetails();
  }, [numericItemId]);

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (!item) return <div className="p-6 text-center">Item not found</div>;

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

            if (loanCustomer && items && from === "LoanCustomerDetails") {
              navigate("/admin/loan-customer-details", {
                state: { loanCustomer, items },
              });
            } else if (loanCustomerId) {
              navigate("/admin/loanItems", {
                state: { showItemsList: true, loanCustomerId },
              });
            } else if (from === "BillDetails") {
              const stored = sessionStorage.getItem("itemsState");
              const parsed = stored ? JSON.parse(stored) : null;
              const restoredOrders = parsed?.orders || [];

              navigate("/admin/bill-details", {
                state: {
                  showOrdersList: true,
                  loanCustomerId,
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
          Loan Item Details (#{item.loanId})
        </h1>

        {/* Order Info Grid */}
        <div className="grid grid-cols-2 gap-8 mb-10">
          <div className="pr-6 border-r border-purple-300/40">
            {[
              ["Loan Date", new Date(item.loanDate).toLocaleString()],
              ["Item Name", item.itemName],
              ["Metal", item.metal],
              ["Gross Weight", item.gross_weight],
              ["Net Weight", item.net_weight],
              ["Rate of Interest", item.rate_of_interest],
              ["Total Amount", item.total_amount],
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
              ["Paid Amount", item.paid_amount],
              ["Due Weight", item.due_amount],
              ["Paid Interest Amount", item.paid_interest_amount],
              ["Due Interest Amount", item.due_interest_amount],
              ["Active Month Count", item.active_month_count],
              ["Delivery Status", item.deliveryStatus],
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

        {/* Transactions */}
        {item.loanTotalAmtHistories?.length > 0 && (
          <>
            <h2 className="text-2xl font-bold text-purple-300 mb-4">
              Transactions
            </h2>
            <ul className="mb-10 pl-5 list-disc space-y-2">
              {item.loanTotalAmtHistories.map((tx: LoanTotalAmtHistory) => (
                <li key={tx.amountHistoryId} className="text-emerald-300">
                  ₹{tx.amount} -{}
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
export default LoanItemDetails;
