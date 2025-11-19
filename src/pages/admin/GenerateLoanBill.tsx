import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import api from "@/services/api";

const GenerateLoanBill: React.FC = () => {
  interface LoanTotalAmtHistory {
    amountHistoryId: number;
    paymentMethod: string;
    paymentType: string;
    amount: number;
    paymentDate: string;
    loanId: number;
  }

  interface LoanItem {
    loanId: number;
    loanDate: string;
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

    deliveryStatus: string;
    loanTotalAmtHistories: LoanTotalAmtHistory[];
    version: number;
    [key: string]: string | number | number[] | null | LoanTotalAmtHistory[];
  }

  interface LoanBill {
    loanBillId: number;
    loanBillNumber: string;
    customerLoanId: number;
    name: string;
    village: string;
    phoneNumber: string;
    emailId: string;
    deliveryStatus: string;
    numberOfItems: number;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    paidInterestAmount: number;
    dueInterestAmount: number;
    selectedItemsIds: string;
    loanBillingDate: string;
    selectedItems: LoanItem[]; // keep string since it’s coming in this format
  }

  const [loanData, setLoanData] = useState<any>(null);
  const location = useLocation();
  const selectedItems = location.state?.selectedItems || [];
  const billLoanNumber =
    location.state?.billLoanNumber || localStorage.getItem("billLoanNumber");
  const token = localStorage.getItem("token");
  const [msgTitle, SetMsgTitle] = useState("");

  const loanIdList = history.state?.usr?.selectedOrders || []; // loanId array
  const loanId = loanIdList[0]; // always single loan item

  const [loanBill, setLoanBill] = useState<LoanBill | null>(null);

  useEffect(() => {
    if (selectedItems.length === 0) return;

    const fetchLoanBillSummary = async () => {
      const checkEdit = localStorage.getItem("checkEditLoanBill");

      try {
        console.log("checkEditLoanBill : ", checkEdit);

        if (checkEdit === "YesEdit") {
          console.log(
            "Updating existing Loan bill with billNumber:",
            billLoanNumber
          );

          const res = await api.put<LoanBill>(
            `/admin/bill-updateData/${loanBillNumber}`,
            { loanId: selectedItems }, // send array of orderIds
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          setLoanBill(res.data);
          SetMsgTitle(`Your order updated Successfully`);
        } else if (checkEdit === "NoEdit") {
          console.log("Creating new bill...");

          const response = await api.post<Bill>(
            "/admin/bill-summary",
            { orderId: selectedOrders },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          setBill(response.data);
          SetMsgTitle(`Your order placed Successfully`);
        }
      } catch (error) {
        console.error("Error fetching bill summary/update:", error);
      }
    };

    fetchLoanBillSummary();
  }, [selectedOrders, token]);

  useEffect(() => {
    if (!loanId) return;

    axios
      .get(
        `https://api.hambirejewellery.com/admin/getLoanItemByLoanId/${loanId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => {
        setLoanData(res.data);
      })
      .catch((err) => console.error(err));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (!loanData) return <div>Loading...</div>;

  return (
    <div className="p-6 bg-white text-black">
      {/* PRINT CSS */}
      <style>
        {`
        @media print {
          @page { size: 79mm auto; margin: 0; }

          body {
            margin: 0; padding: 0;
            background: white;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body * { visibility: hidden; }
          #print-section, #print-section * { visibility: visible; }

          #print-section {
            position: absolute; top: 0; left: 0;
            width: 79mm;
            font-family: Arial, sans-serif;
            padding: 4px 6px;
            font-size: 16px;
            font-weight: 600;
            line-height: 1.45;
          }

          .line      { border-top: 1px dashed #000; margin: 6px 0; }
          .solid-line{ border-top: 1px solid #000; margin: 6px 0; }
          .row       { display: flex; justify-content: space-between; margin: 4px 0; }
          .footer    { text-align: center; font-size: 12px; margin-top: 10px; }
        }
        `}
      </style>

      {/* PRINT SECTION */}
      <div id="print-section">
        <h2 style={{ textAlign: "center" }}>LOAN BILL</h2>
        <div style={{ textAlign: "center", marginBottom: "4px" }}>
          {new Date().toLocaleString()}
        </div>

        <div className="solid-line"></div>

        {/* Basic Details */}
        <div className="row">
          <span>Loan ID</span>
          <span>{loanData.loanId}</span>
        </div>

        <div className="row">
          <span>Date</span>
          <span>{new Date(loanData.loanDate).toLocaleDateString()}</span>
        </div>

        <div className="row">
          <span>Metal</span>
          <span>{loanData.metal}</span>
        </div>

        <div className="row">
          <span>Item</span>
          <span>{loanData.itemName}</span>
        </div>

        <div className="line"></div>

        {/* Weights */}
        <div className="row">
          <span>Gross Wt</span>
          <span>{loanData.gross_weight} gm</span>
        </div>

        <div className="row">
          <span>Net Wt</span>
          <span>{loanData.net_weight} gm</span>
        </div>

        <div className="line"></div>

        {/* Amounts */}
        <div className="row">
          <span>Total Loan Amt</span>
          <span>₹ {loanData.total_amount}</span>
        </div>

        <div className="row">
          <span>Paid</span>
          <span>₹ {loanData.paid_amount}</span>
        </div>

        <div className="row">
          <span>Due</span>
          <span>₹ {loanData.due_amount}</span>
        </div>

        <div className="line"></div>

        {/* Interest */}
        <div className="row">
          <span>Interest Rate</span>
          <span>{loanData.rate_of_interest}%</span>
        </div>

        <div className="row">
          <span>Paid Interest</span>
          <span>₹ {loanData.paid_interest_amount}</span>
        </div>

        <div className="row">
          <span>Due Interest</span>
          <span>₹ {loanData.due_interest_amount}</span>
        </div>

        {/* PAYMENT HISTORY SECTION */}
        <div className="solid-line"></div>

        <h3 style={{ textAlign: "center", fontSize: "16px" }}>
          PAYMENT HISTORY
        </h3>

        {/* If no history */}
        {(!loanData.loanTotalAmtHistories ||
          loanData.loanTotalAmtHistories.length === 0) && (
          <div
            style={{ textAlign: "center", margin: "6px 0", fontSize: "14px" }}
          >
            No payment history
          </div>
        )}

        {/* Only ONE loop */}
        {loanData.loanTotalAmtHistories &&
          loanData.loanTotalAmtHistories.map((item: any, index: number) => (
            <div key={index}>
              <div className="line"></div>

              <div className="row">
                <span>Amount</span>
                <span>₹ {item.amount ?? "0"}</span>
              </div>

              <div className="row">
                <span>Payment Type</span>
                <span>{item.paymentType ?? "N/A"}</span>
              </div>

              <div className="row">
                <span>Payment Method</span>
                <span>{item.paymentMethod ?? "N/A"}</span>
              </div>

              <div className="row">
                <span>Payment Date</span>
                <span>
                  {item.paymentDate
                    ? new Date(item.paymentDate).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            </div>
          ))}
        <div className="solid-line"></div>

        <div className="footer">
          <div>Thank you!</div>
          <div>Hambire Jewellery</div>
        </div>
      </div>

      {/* PRINT BUTTON */}
      <div className="text-center mt-6 print:hidden">
        <button
          onClick={handlePrint}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          🖨️ Print
        </button>
      </div>
    </div>
  );
};

export default GenerateLoanBill;
