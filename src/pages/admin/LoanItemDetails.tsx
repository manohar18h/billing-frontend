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

    itemStatus: string;

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

        const response = await api.get<LoanItem>(
          `/admin/getLoanItemByLoanId/${numericItemId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
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
    value: string | number | boolean | null | undefined,
  ) => (
    <div className="flex justify-between border-b py-1 text-sm">
      <span className="font-medium text-gray-600">{label}:</span>
      <span className="text-gray-800">{String(value)}</span>
    </div>
  );

  return (
  <div className="min-h-screen bg-[#f5f5f5] p-3 pb-24 md:flex md:items-center md:justify-center md:p-8 dark:bg-[#1a1b1f]">
    <div className="relative w-full rounded-3xl bg-gradient-to-r from-[#0f172a] via-[#1e1b4b] to-[#3b0764] p-4 pt-16 text-white shadow-2xl md:max-w-6xl md:p-10">
      <button
        onClick={() => {
          const from = localStorage.getItem("from");

          if (from === "LoanItems") {
            navigate("/admin/loanItems", {
              state: { showItemsList: true, loanCustomerId },
            });
          } else if (from === "BillLoanDetails") {
            const stored = sessionStorage.getItem("itemsState");
            const parsed = stored ? JSON.parse(stored) : null;
            const restoredItems = parsed?.items || [];

            navigate("/admin/bill-loan-details", {
              state: {
                showItemsList: true,
                loanCustomerId,
                items: restoredItems,
              },
            });
          } else {
            navigate("/admin");
          }
        }}
        className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-xs font-bold text-white md:rounded-lg md:py-1 md:text-sm"
      >
        ✕ Close
      </button>

      <h1 className="mb-6 text-[22px] font-extrabold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 md:mb-8 md:text-3xl">
        Loan Item Details (#{item.loanId})
      </h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-8 md:mb-10">
        <div className="rounded-2xl bg-white/10 p-4 md:border-r md:border-purple-300/40 md:bg-transparent md:pr-6">
          {[
            ["Loan Date", new Date(item.loanDate).toLocaleDateString("en-GB")],
            ["Item Name", item.itemName],
            ["Metal", item.metal],
            ["Gross Weight", item.gross_weight],
            ["Net Weight", item.net_weight],
            ["Rate of Interest", item.rate_of_interest],
            ["Total Amount", item.total_amount],
          ].map(([label, value]) => (
            <div
              key={label}
              className="mb-2 flex items-start justify-between gap-3 border-b border-white/10 pb-2 text-sm md:block md:border-0 md:pb-0 md:text-lg"
            >
              <span className="font-semibold text-purple-300">{label}:</span>
              <span className="text-right font-bold text-emerald-300 md:text-left">
                {value || "—"}
              </span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-white/10 p-4 md:bg-transparent md:pl-6">
          {[
            ["Paid Amount", item.paid_amount],
            ["Due Amount", item.due_amount],
            ["Paid Interest Amount", item.paid_interest_amount],
            ["Due Interest Amount", item.due_interest_amount],
            ["Active Month Count", item.active_month_count],
            ["Item Status", item.itemStatus || "Not Packed"],
            ["Delivery Status", item.deliveryStatus],
          ].map(([label, value]) => (
            <div
              key={label}
              className="mb-2 flex items-start justify-between gap-3 border-b border-white/10 pb-2 text-sm md:block md:border-0 md:pb-0 md:text-lg"
            >
              <span className="font-semibold text-pink-300">{label}:</span>
              <span className="text-right font-bold text-yellow-300 md:text-left">
                {value || "—"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {item.loanTotalAmtHistories?.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-4 text-xl font-bold text-purple-300 md:text-2xl">
            Transactions
          </h2>

          <div className="space-y-3 md:hidden">
            {item.loanTotalAmtHistories.map((tx) => (
              <div
                key={tx.amountHistoryId}
                className="rounded-2xl bg-white/10 p-4"
              >
                <div className="text-lg font-bold text-emerald-300">
                  ₹{tx.amount}
                </div>
                <div className="mt-1 text-sm text-red-300">
                  {tx.paymentMethod}
                </div>
                <div className="mt-1 text-sm text-yellow-300">
                  {tx.paymentType}
                </div>
                <div className="mt-1 text-xs text-gray-300">
                  {new Date(tx.paymentDate).toLocaleDateString("en-GB")}
                </div>
              </div>
            ))}
          </div>

          <ul className="mb-10 hidden list-disc space-y-2 pl-5 md:block">
            {item.loanTotalAmtHistories.map((tx) => (
              <li key={tx.amountHistoryId} className="text-emerald-300">
                ₹{tx.amount} -{" "}
                <span className="text-red-300">{tx.paymentMethod}</span> on{" "}
                {new Date(tx.paymentDate).toLocaleDateString("en-GB")} -{" "}
                <span className="text-yellow-300">{tx.paymentType}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  </div>
);
};
export default LoanItemDetails;
