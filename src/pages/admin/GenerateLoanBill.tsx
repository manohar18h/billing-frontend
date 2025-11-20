import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
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

  const [loanData, setLoanData] = useState<LoanBill | null>(null);
  const location = useLocation();
  const selectedItems = location.state?.selectedItems || [];
  const billLoanNumber =
    location.state?.billLoanNumber || localStorage.getItem("billLoanNumber");
  const token = localStorage.getItem("token");
  // const [msgTitle, SetMsgTitle] = useState("");

  useEffect(() => {
    console.log("check ids selected ids :", selectedItems);
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
            `/admin/loan-bill-update/${billLoanNumber}`,
            { loanId: selectedItems }, // send array of orderIds
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          setLoanData(res.data);
          // SetMsgTitle(`Your order updated Successfully`);
        } else if (checkEdit === "NoEdit") {
          console.log("Creating new bill...");

          const response = await api.post<LoanBill>(
            "/admin/loan-bill-summary",
            { loanId: selectedItems },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          setLoanData(response.data);
          // SetMsgTitle(`Your order placed Successfully`);
        }
      } catch (error) {
        console.error("Error fetching bill summary/update:", error);
      }
    };

    fetchLoanBillSummary();
  }, [selectedItems, token]);

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
        <span>{loanData.loanBillNumber}</span>
        <div style={{ textAlign: "center", marginBottom: "4px" }}>
          {new Date().toLocaleString()}
        </div>

        <div className="solid-line"></div>
        <h3 style={{ textAlign: "center" }}>ITEMS</h3>

        {loanData.selectedItems.map((item: LoanItem, index: number) => (
          <div key={index}>
            <div className="line"></div>

            {/* Item Header */}
            <div className="row">
              <span>Item #{index + 1}</span>
              <span>ID: {item.loanId}</span>
            </div>

            <div className="row">
              <span>Metal</span>
              <span>{item.metal}</span>
            </div>

            <div className="row">
              <span>Item</span>
              <span>{item.itemName}</span>
            </div>

            <div className="row">
              <span>Gross Wt</span>
              <span>{item.gross_weight} gm</span>
            </div>

            <div className="row">
              <span>Net Wt</span>
              <span>{item.net_weight} gm</span>
            </div>

            <div className="row">
              <span>Total Amount</span>
              <span>₹ {item.total_amount}</span>
            </div>

            <div className="row">
              <span>Paid</span>
              <span>₹ {item.paid_amount ?? 0}</span>
            </div>

            <div className="row">
              <span>Due</span>
              <span>₹ {item.due_amount}</span>
            </div>

            <div className="row">
              <span>Interest Paid</span>
              <span>₹ {item.paid_interest_amount ?? 0}</span>
            </div>

            <div className="row">
              <span>Interest Due</span>
              <span>₹ {item.due_interest_amount}</span>
            </div>

            {/* Item Payment History */}
            {item.loanTotalAmtHistories.length > 0 && (
              <>
                <div className="line"></div>
                <h4 style={{ textAlign: "center", fontSize: "15px" }}>
                  Payment History
                </h4>

                {item.loanTotalAmtHistories.map((pay, i) => (
                  <div key={i}>
                    <div className="row">
                      <span>Amount</span>
                      <span>₹ {pay.amount}</span>
                    </div>

                    <div className="row">
                      <span>Type</span>
                      <span>{pay.paymentType}</span>
                    </div>

                    <div className="row">
                      <span>Method</span>
                      <span>{pay.paymentMethod}</span>
                    </div>

                    <div className="row">
                      <span>Date</span>
                      <span>{pay.paymentDate}</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        ))}
        <div className="solid-line"></div>
        <h3 style={{ textAlign: "center" }}>TOTAL SUMMARY</h3>

        <div className="row">
          <span>Total Items</span>
          <span>{loanData.numberOfItems}</span>
        </div>

        <div className="row">
          <span>Total Amount</span>
          <span>₹ {loanData.totalAmount}</span>
        </div>

        <div className="row">
          <span>Total Paid</span>
          <span>₹ {loanData.paidAmount}</span>
        </div>

        <div className="row">
          <span>Total Due</span>
          <span>₹ {loanData.dueAmount}</span>
        </div>

        <div className="row">
          <span>Total Interest Paid</span>
          <span>₹ {loanData.paidInterestAmount}</span>
        </div>

        <div className="row">
          <span>Total Interest Due</span>
          <span>₹ {loanData.dueInterestAmount}</span>
        </div>

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
