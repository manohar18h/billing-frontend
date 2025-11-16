import React, { useEffect, useState } from "react";
import axios from "axios";

const GenerateLoanBill: React.FC = () => {
  const [loanData, setLoanData] = useState<any>(null);

  const token = localStorage.getItem("token");

  const loanIdList = history.state?.usr?.selectedOrders || []; // loanId array
  const loanId = loanIdList[0]; // always single loan item

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
