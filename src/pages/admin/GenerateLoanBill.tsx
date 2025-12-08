import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "@/services/api";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import SignatureCanvas from "./SignatureCanvas";
import hjlogoo from "../../assets/hjlogoo.png";

const GenerateLoanBill: React.FC = () => {
  interface LoanTotalAmtHistory {
    amountHistoryId: number;
    paymentMethod: string;
    paymentType: string;
    amount: number;
    paymentDate: string;
    loanId: number;
  }

  interface LoanBillingSignature {
    id: number;
    loanBillId: number;
    loanBillNumber: string;
    signatureType: string;
    signatureData: string;
    signedAt: string;
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
    aadharCard: string;
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
  const printRef = useRef<HTMLDivElement>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [msgTitle, SetMsgTitle] = useState("");
  const openWhatsAppModal = () => setShowWhatsAppModal(true);
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [signType, setSignType] = useState(""); // start or end
  const [selectedBillNo, setSelectedBillNo] = useState("");
  const [showStartSign, setShowStartSign] = useState(true);

  const signPad = useRef<any>(null);
  // Updated getWhatsAppMessage to include all orders
  const getWhatsAppMessage = (bill: LoanBill, msgTitle: string) => {
    if (!bill.selectedItems || bill.selectedItems.length === 0) return "";

    const itemsLines = bill.selectedItems.map((item, idx) => {
      return `🛍️ Product Name ${idx + 1}: ${item.itemName}`;
    });

    return `
👋 Hello ${bill.name},

✨ Thank you, ${msgTitle} 🎁🥳
We appreciate your trust in Hambire Jewellery 💎

🧾 Invoice Bill No: ${bill.loanBillNumber}
📅 Date: ${bill.loanBillingDate}

${itemsLines.join("\n\n")}

💰 Total Bill Amount: ₹${bill.totalAmount.toFixed(2)}
✅ Paid: ₹${bill.paidAmount.toFixed(2)}
⚠️ Due: ₹${bill.dueAmount.toFixed(2)}
⚠️ I Due: ₹${bill.dueInterestAmount.toFixed(2)}
✅ I Paid: ₹${bill.paidInterestAmount.toFixed(2)}
🎯 Delivery Status: ${bill.deliveryStatus}

🎉Thank you for your purchase! 💎
We hope to serve you again soon!
-- Hambire Jewellery 💍
  `;
  };

  // Updated copyWhatsAppMessage function
  const copyWhatsAppMessage = () => {
    if (!loanData) return;

    const phone = loanData.phoneNumber?.replace(/\D/g, "");
    if (!phone) return alert("Customer phone number missing!");

    const msg = getWhatsAppMessage(loanData, msgTitle);

    navigator.clipboard.writeText(msg).then(() => {
      const url = `https://web.whatsapp.com/send?phone=91${phone}`;
      window.open(url, "_blank");

      alert(
        "Message copied to clipboard ✅ \nWhatsApp Web opened. You can paste and send manually."
      );
    });
  };

  useEffect(() => {
    checkSignatureExists();
  }, [loanData]);

  const checkSignatureExists = async () => {
    if (!loanData?.loanBillNumber) return;

    try {
      const token = localStorage.getItem("token");

      const res = await api.get<LoanBillingSignature[]>(
        `/admin/signatures/${loanData.loanBillNumber}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.status === 200 && res.data.length > 0) {
        setShowStartSign(false);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setShowStartSign(true);
      }
    }
  };

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
          SetMsgTitle(`Your Item Updated Successfully`);
        }
      } catch (error) {
        console.error("Error fetching bill summary/update:", error);
      }
    };

    fetchLoanBillSummary();
  }, [selectedItems, token]);

  if (!loanData) return <div>Loading...</div>;

  return (
    <div className="p-6 bg-white text-black">
      {/* PRINT CSS */}
      <style>
        {`
  @media print {
  body {
   -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    margin: 0;
    zoom: 0.75; /* Shrink content to fit horizontally */
            visibility: hidden;

  }


  .invoice-table {
    width: 100% !important;
    transform: scale(1) !important;
    table-layout: fixed;
    font-size: 10px; /* Slightly smaller text for fitting */
  }

  .invoice-header {
    margin: 0 !important;
  }

  .invoice-container {
    display: flex !important;
    justify-content: space-between !important;
    align-items: flex-start !important;
    flex-direction: row !important;
    width: 100% !important;
  }
      .invoice-container > div {
    width: 48% !important;
  }


  /* Avoid clipping large tables */
  .invoice-table-wrapper {
    width: 100%;
    overflow: visible !important;
  }

  /* Make print layout use full page height */
  body, html {
    width: 100%;
    height: 100%;
    -webkit-print-color-adjust: exact !important;
  }


             @page {
    size: A4 portrait;   /* Or A5 portrait */
    margin: 10mm;        /* Adjust as needed */
  }

  .no-print-scroll {
    overflow: visible !important;
  }

  #print-section, #print-section * {
        visibility: visible;
      }
          #print-section {
    zoom: 1 !important;
    transform: none !important;
  }
      #print-section {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        margin: 0;
        padding: 10;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }

 

  table {
  min-width: 100% !important;
  font-size: 13px !important; /* Bigger and clearer */
}



  th, td {
  padding: 6px 4px !important; /* more breathing space */
}
}



  `}
      </style>

      <style>
        {`
     .invoice-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  table-layout: fixed;
}

.invoice-table th,
.invoice-table td {
  padding: 4px 6px;
  word-wrap: break-word;
  white-space: normal;
  text-align: center;
  vertical-align: middle;
}

  .invoice-table th:nth-child(1),
.invoice-table td:nth-child(1) {
  width: 15%; 
}

 .invoice-table th:nth-child(2),
.invoice-table td:nth-child(2) {
  width: 7%; 
}
  .invoice-table th:nth-child(3),
.invoice-table td:nth-child(3) {
  width: 7%; 
}
  .invoice-table th:nth-child(4),
.invoice-table td:nth-child(4) {
  width: 7%; 
}
    .invoice-table th:nth-child(5),
.invoice-table td:nth-child(5) {
  width: 10%; 
}
     .invoice-table th:nth-child(6),
.invoice-table td:nth-child(6) {
  width: 10%; 
}
      .invoice-table th:nth-child(7),
.invoice-table td:nth-child(7) {
  width: 10%; 
}

    .invoice-table th:nth-child(8),
.invoice-table td:nth-child(8) {
  width: 8%; 
}
      .invoice-table th:nth-child(9),
.invoice-table td:nth-child(9) {
  width: 8%; 
}



      /* Auto-shrink on smaller screens */
      @media (max-width: 1400px) {
        .invoice-table {
          transform: scale(0.9);
        }
      }
      @media (max-width: 1200px) {
        .invoice-table {
          transform: scale(0.8);
        }
      }
      @media (max-width: 1000px) {
        .invoice-table {
          transform: scale(0.7);
        }
      }
      @media (max-width: 800px) {
        .invoice-table {
          transform: scale(0.6);
        }
      }
    `}
      </style>

      {/* PRINT SECTION */}
      <div
        id="print-section"
        ref={printRef}
        className="p-6 bg-white shadow-2xl rounded-md max-w-[800px] mx-auto mt-15 print:shadow-none print:rounded-none print:p-4 print:bg-white"
      >
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 pb-4 mb-4 mt-20">
          <div>
            <h1 className="text-2xl font-bold text-[#813801]">
              HAMBIRE JEWELLERY
            </h1>
            <strong className="text-[#374151]">Since 1977</strong>
            <p className=" text-[#1a1d23]">
              Ramayampet, Subhash Road, Medak, Telangana, 502101
            </p>
            <p className=" text-[#1a1d23]">
              Phone: 9703738824 | www.hambirejewellery.com
            </p>
          </div>
          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-md border border-gray-200 mr-10">
            <img
              src={hjlogoo}
              alt="HJ Logo"
              className="w-20 h-20 object-contain"
            />
          </div>
        </div>
        {/* Customer Info */}
        <div className="invoice-container flex justify-between items-start border-b-2 pb-4 mb-4">
          <div className="mb-4 invoice-header">
            <p>
              <strong className="text-[#B45309]">Name : </strong>
              <span className="text-[#111827] font-semibold">
                {loanData.name}
              </span>
            </p>
            <p>
              <strong className="text-[#B45309]">Village : </strong>
              <span className="text-[#000000] font-semibold">
                {loanData.village}
              </span>
            </p>
            <p>
              <strong className="text-[#B45309]">Phone : </strong>
              <span className="text-[#000000] font-semibold ">
                {loanData.phoneNumber}
              </span>
            </p>
            <p>
              <strong className="text-[#B45309]">Email : </strong>
              <span className="text-[#000000] font-semibold ">
                {loanData.emailId}
              </span>
            </p>
          </div>
          <div className="text-right text-[#000000]">
            <p>
              <strong className="text-[#B45309]">INVOICE : </strong>
              <span className="text-[#034c33] font-bold">
                {" "}
                {loanData.loanBillNumber}
              </span>
            </p>
            <p>
              <strong className="text-[#B45309]">DATE : </strong>{" "}
              <span className="font-bold text-[#000000]">
                {new Date().toLocaleString()}
              </span>
            </p>

            <p>
              <strong className="text-[#B45309]">Aadhar Card : </strong>
              <span className="text-[#000000] font-semibold">
                {loanData.aadharCard}
              </span>
            </p>
          </div>
        </div>
        {/* Table */}
        <div className="w-full flex justify-center invoice-table-wrapper">
          <table className="invoice-table border border-collapse text-sm mb-6 invoice-table">
            <thead>
              <tr className="bg-[#B45309] text-[#F9FAFB]">
                <th className="border px-2 py-1 text-white font-bold  text-center align-middle text-xs">
                  Name
                </th>
                <th className="border px-2 py-1 text-white font-bold  text-center align-middle text-xs">
                  Metal
                </th>
                <th className="border px-2 py-1 text-white font-bold  text-center align-middle text-xs">
                  G.Wt
                </th>
                <th className="border px-2 py-1 text-white font-bold  text-center align-middle text-xs">
                  RI
                </th>
                <th className="border px-2 py-1 text-white font-bold  text-center align-middle text-xs">
                  Total
                </th>
                <th className="border px-2 py-1 text-white font-bold  text-center align-middle text-xs">
                  Paid
                </th>
                <th className="border px-2 py-1 text-white font-bold  text-center align-middle text-xs">
                  Due
                </th>
                <th className="border px-2 py-1 text-white font-bold  text-center align-middle text-xs">
                  I.P
                </th>
                <th className="border px-2 py-1 text-white font-bold  text-center align-middle text-xs">
                  I.D
                </th>
              </tr>
            </thead>
            <tbody>
              {loanData.selectedItems.map((item: LoanItem, index: number) => (
                <tr
                  key={index}
                  className="border "
                  style={{
                    backgroundColor: "#e7d8e2",

                    color: "#fff",
                  }}
                >
                  {" "}
                  <td className="border px-2 py-1 text-[#361d1d] font-bold text-center align-middle text-[14px]">
                    {item.itemName}
                  </td>
                  <td className="border px-2 py-1 text-[#af0058] font-bold text-center align-middle text-[13px]">
                    {item.metal === "22 Gold"
                      ? "22k"
                      : item.metal === "24 Gold"
                      ? "24k"
                      : item.metal === "995 Silver"
                      ? "995"
                      : item.metal === "999 Silver"
                      ? "Kamal"
                      : item.metal}
                  </td>
                  <td className="border px-2 py-1 text-[#734d06] font-bold text-center align-middle text-[13px]">
                    {item.gross_weight}
                  </td>
                  <td className="border px-2 py-1 text-[#074949] font-bold text-center align-middle text-[13px]">
                    {item.rate_of_interest}
                  </td>
                  <td className="border px-2 py-1 text-[#073d6a] font-bold text-center align-middle text-[13px]">
                    {item.total_amount}
                  </td>
                  <td className="border px-2 py-1 text-[#4f0668] font-bold text-center align-middle text-[13px]">
                    {item.paid_amount}
                  </td>
                  <td className="border px-2 py-1 text-[#603606] font-bold text-center align-middle text-[13px]">
                    {item.due_amount}
                  </td>
                  <td className="border px-2 py-1 text-[#062a55] font-bold text-center align-middle text-[13px]">
                    {item.paid_interest_amount}
                  </td>
                  <td className="border px-2 py-1 text-[#082f5f] font-bold text-center align-middle text-[13px]">
                    {item.due_interest_amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end mt-10">
          <div className=" p-4 rounded-3xl border border-orange-900 mr-10">
            <table className="text-sm w-64 table-fixed">
              <tbody>
                <tr>
                  <td className="px-3 py-2 text-black  font-bold text-[15px]">
                    Total Items:
                  </td>
                  <td className="text-right font-bold px-3 py-2 text-[#B45309] text-[15px]">
                    {loanData.numberOfItems}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-black  font-bold text-[15px]">
                    Total Amount :
                  </td>
                  <td className="text-right px-3 py-2 font-bold  text-[#070065] text-[15px]">
                    ₹{loanData.totalAmount}
                  </td>
                </tr>

                <tr>
                  <td className="px-3 py-2 text-black  font-bold text-[15px]">
                    Interest Paid:
                  </td>
                  <td className="text-right font-bold text-[#0b4e06] px-3 py-2 text-[15px]">
                    ₹{loanData.paidInterestAmount}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-black  font-bold text-[15px]">
                    Interest Due:
                  </td>
                  <td className="text-right font-bold text-[#EC4899] px-3 py-2 text-[15px]">
                    ₹{loanData.dueInterestAmount}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-black  font-bold text-[15px]">
                    Total Paid :
                  </td>
                  <td className="text-right px-3 py-2 font-bold  text-[#0b4e06] text-[15px]">
                    ₹{loanData.paidAmount}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-black  font-bold text-[15px]">
                    Total Due :
                  </td>
                  <td className="text-right px-3 py-2 font-bold  text-[#EC4899] text-[15px]">
                    ₹{loanData.dueAmount}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-6 text-xs text-gray-900 text-[16px] ml-10">
          <div className="p-5 text-center inline-block border-b border-gray-500 pb-1 ">
            <h6 className="text-base">
              మా వద్ద చేయించిన 91.6 గోల్డ్ ఆభరణాలు తిరిగి 90% ఇవ్వబడును.
            </h6>
            <h6 className="text-base">
              మా వద్ద చెయించిన్న ☆ పట్టీలు 80% సోక్కం ఇవ్వబడును.
            </h6>
          </div>
          <h5 className="text-base mt-4">
            Thank you for your order! We appreciate your trust.
          </h5>
        </div>
      </div>

      <div className="text-center mt-12 print:hidden">
        {showStartSign && (
          <div className="text-center mt-12 print:hidden">
            <Button
              variant="contained"
              size="small"
              onClick={() => {
                setSelectedBillNo(loanData.loanBillNumber);
                setSignType("START");
                setSignDialogOpen(true);
              }}
            >
              Start Sign
            </Button>
          </div>
        )}
      </div>

      {/* PRINT BUTTON */}
      <div className="text-center  print:hidden">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-4"
        >
          🖨️ Print Invoice
        </button>
      </div>
      <div className="text-center mt-4 print:hidden">
        <button
          onClick={openWhatsAppModal} // Now defined
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          📲 Send WhatsApp Message
        </button>
      </div>

      {/* WhatsApp Modal */}
      {showWhatsAppModal && loanData && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4">WhatsApp Message Preview</h2>
            <pre className="whitespace-pre-wrap mb-4">
              {getWhatsAppMessage(loanData, msgTitle)}
            </pre>
            <div className="flex justify-end gap-2">
              <button
                className="bg-blue-500 text-white px-3 py-1 rounded"
                onClick={copyWhatsAppMessage}
              >
                Copy to Clipboard
              </button>
              <button
                className="bg-gray-300 px-3 py-1 rounded"
                onClick={() => setShowWhatsAppModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIGNATURE DIALOG */}
      <Dialog open={signDialogOpen} onClose={() => setSignDialogOpen(false)}>
        <DialogTitle>
          {signType === "START" ? "Start-Sign" : "End-Sign"}
        </DialogTitle>

        <DialogContent>
          <div
            style={{
              width: "400px",
              height: "200px",
              border: "2px solid black",
            }}
          >
            <SignatureCanvas ref={signPad} />
          </div>

          <Button
            variant="outlined"
            color="warning"
            sx={{ mt: 2 }}
            onClick={() => signPad.current?.clear()}
          >
            Clear
          </Button>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setSignDialogOpen(false)}>Cancel</Button>

          <Button
            variant="contained"
            onClick={async () => {
              const signatureBase64 = signPad.current?.toDataURL();

              if (!signatureBase64) return;

              const token = localStorage.getItem("token");

              const url =
                signType === "START"
                  ? `/admin/start-sign/${selectedBillNo}`
                  : `/admin/end-sign/${selectedBillNo}`;

              await api.post(
                url,
                { signature: signatureBase64 },
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              alert("Signature saved!");

              setSignDialogOpen(false);

              await checkSignatureExists();
            }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
export default GenerateLoanBill;
