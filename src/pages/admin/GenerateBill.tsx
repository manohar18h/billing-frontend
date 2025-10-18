import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "@/services/api";
import logo2 from "../../assets/logo2.png";

const GenerateBill: React.FC = () => {
  const printRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const selectedOrders = location.state?.selectedOrders || [];
  const token = localStorage.getItem("token");
  const billNumber =
    location.state?.billNumber || localStorage.getItem("billNumber");

  // Transaction model
  interface Transaction {
    transactionId: number;
    paymentMethod: string;
    paymentType: string;
    paidAmount: number;
    paymentDate: string;
    orderId: number;
  }

  // Old item model
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

  interface Order {
    orderId: number;
    orderDate: string;
    metal: string;
    metalPrice: number;
    itemName: string;
    catalogue: string | null;
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
    paidAmount: number;
    dueAmount: number;
    receivedAmount: number | null;
    deliveryStatus: string;
    workerPay: number | null;
    transactions: Transaction[];
    oldItems: OldItem[];
    version: number;
    [key: string]:
      | string
      | number
      | number[]
      | null
      | Transaction[]
      | OldItem[];
  }

  interface Bill {
    billId: number;
    billNumber: string;
    customerId: number;
    name: string;
    village: string;
    phoneNumber: string;
    emailId: string;
    deliveryStatus: string;
    numberOfOrders: number;
    billTotalAmount: number;
    billDiscountAmount: number;
    exchangeAmount: number;
    billPaidAmount: number;
    billResAmount: number;
    billDueAmount: number;
    selectedOrderIds: string;
    billingDate: string;
    selectedOrders: Order[]; // keep string since it’s coming in this format
  }

  const [bill, setBill] = useState<Bill | null>(null);

  const dynamicWeightKeys = [
    "stone",
    "wax",
    "diamond",
    "bits",
    "enamel",
    "pearls",
    "other",
  ];

  useEffect(() => {
    if (selectedOrders.length === 0) return;

    const fetchBillSummary = async () => {
      const checkEdit = localStorage.getItem("checkEditBill");

      try {
        console.log("checkEditBill : ", checkEdit);

        if (checkEdit === "YesEdit") {
          console.log("Updating existing bill with billNumber:", billNumber);

          const res = await api.put<Bill>(
            `/admin/bill-updateData/${billNumber}`,
            { orderId: selectedOrders }, // send array of orderIds
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          setBill(res.data);
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
        }
      } catch (error) {
        console.error("Error fetching bill summary/update:", error);
      }
    };

    fetchBillSummary();
  }, [selectedOrders, token]);

  function getNumericField(item: Order, field: keyof Order): number | null {
    return (item[field] as number | null) ?? null;
  }

  const shortLabels: Record<string, { weight: string; amount: string }> = {
    stone: { weight: "S.Wt", amount: "S.Amt" },
    wax: { weight: "W.Wt", amount: "W.Amt" },
    diamond: { weight: "D.Wt", amount: "D.Amt" },
    bits: { weight: "B.Wt", amount: "B.Amt" },
    enamel: { weight: "E.Wt", amount: "E.Amt" },
    pearls: { weight: "P.Wt", amount: "P.Amt" },
    other: { weight: "O.Wt", amount: "O.Amt" },
  };

  const activeWeightKeys = React.useMemo(() => {
    if (!bill || !bill.selectedOrders) return [];

    // Custom logic for each key
    return dynamicWeightKeys.filter((key) => {
      // if this is "other", we handle it specially
      if (key === "other") {
        // show column only if either weight > 0 or amount > 0
        return bill.selectedOrders.some(
          (item) =>
            (item[`${key}_weight`] as number) > 0 ||
            (item[`${key}_amount`] as number) > 0
        );
      }
      // normal logic for others
      return bill.selectedOrders.some(
        (item) =>
          (item[`${key}_weight`] as number) > 0 ||
          (item[`${key}_amount`] as number) > 0
      );
    });
  }, [bill]);

  const nonZeroColCount = activeWeightKeys.length * 2;

  if (!bill) return <p className="p-6">Loading Bill Summary...</p>;

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

/* Adjust specific columns (optional fine-tuning) */
.invoice-table th:nth-child(3),
.invoice-table td:nth-child(3) {
  width: 7%; /* Item Name */
}
.invoice-table th:nth-child(4),
.invoice-table td:nth-child(4) {
  width: 8%; /* Metal */
}
  .invoice-table th:nth-child(5),
.invoice-table td:nth-child(5) {
  width: 8%; /* Metal */
}
    .invoice-table th:nth-child(2),
.invoice-table td:nth-child(2) {
  width: 8%; /* Metal */
}
     .invoice-table th:nth-child(6),
.invoice-table td:nth-child(6) {
  width: 8%; /* Metal */
}   .invoice-table th:nth-child(7),
.invoice-table td:nth-child(7) {
  width: 8%; /* Metal */
}
.invoice-table th:last-child,
.invoice-table td:last-child {
  width: 8%; /* Amount */
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

      {/* Printable Content */}
      <div
        id="print-section"
        ref={printRef}
        className="p-6 bg-gray-100 shadow-2xl rounded-md max-w-[800px] mx-auto mt-10 print:shadow-none print:rounded-none print:p-4 print:bg-white"
      >
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 pb-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#B45309]">
              HAMBIRE JEWELLERY
            </h1>
            <strong className="text-[#374151]">Since 1977</strong>
            <p className=" text-[#374151]">
              Ramayampet, Subhash Road, Medak, Telangana, 502101
            </p>
            <p className=" text-[#374151]">
              Phone: 9703738824 | www.hambirejewellery.com
            </p>
          </div>
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-md border border-gray-200">
            <img
              src={logo2}
              alt="HJ Logo"
              className="w-12 h-12 object-contain"
            />
          </div>
        </div>

        {/* Customer Info */}
        <div className="invoice-container flex justify-between items-start border-b-2 pb-4 mb-4">
          <div className="mb-4 invoice-header">
            <p>
              <strong className="text-[#B45309]">Name : </strong>
              <span className="text-[#111827] ">{bill.name}</span>
            </p>
            <p>
              <strong className="text-[#B45309]">Village : </strong>
              <span className="text-[#111827] ">{bill.village}</span>
            </p>
            <p>
              <strong className="text-[#B45309]">Phone : </strong>
              <span className="text-[#111827] ">{bill.phoneNumber}</span>
            </p>
            <p>
              <strong className="text-[#B45309]">Email : </strong>
              <span className="text-[#111827] ">{bill.emailId}</span>
            </p>
          </div>
          <div className="text-right text-[#111827]">
            <p>
              <strong>DATE : </strong> {new Date().toLocaleString()}
            </p>
            <p>
              <strong>INVOICE : </strong>
              <span className="text-[#10B981] font-bold">
                {" "}
                {bill.billNumber}
              </span>
            </p>
            <p>
              <strong>Customer ID : </strong> {bill.customerId}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="w-full flex justify-center invoice-table-wrapper">
          <table className="invoice-table border border-collapse text-sm mb-6 invoice-table">
            <thead>
              <tr className="bg-[#B45309] text-[#F9FAFB]">
                <th className="border px-2 py-1">Name</th>
                <th className="border px-2 py-1">Metal</th>
                <th className="border px-2 py-1">RT</th>
                <th className="border px-2 py-1">G.Wt</th>
                <th className="border px-2 py-1">N.Wt</th>
                {activeWeightKeys.map((key) => (
                  <React.Fragment key={key}>
                    {/* Weight Header */}
                    {!(key === "other") && (
                      <th className="border px-2 py-1 capitalize">
                        {shortLabels[key]?.weight ||
                          `${key[0].toUpperCase()}.Wt`}
                      </th>
                    )}

                    {key === "other" &&
                      bill.selectedOrders.some(
                        (item) => item.other_weight && item.other_weight > 0
                      ) && (
                        <th className="border px-2 py-1 capitalize">
                          {shortLabels[key]?.weight || "O.Wt"}
                        </th>
                      )}

                    {/* Amount Header */}
                    <th className="border px-2 py-1 capitalize">
                      {shortLabels[key]?.amount ||
                        `${key[0].toUpperCase()}.Amt`}
                    </th>
                  </React.Fragment>
                ))}

                <th className="border px-2 py-1">WST</th>
                <th className="border px-2 py-1">MC</th>
                <th className="border px-2 py-1">Paid</th>
                <th className="border px-2 py-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {bill.selectedOrders.map((item: Order, index: number) => (
                <tr
                  key={index}
                  className="border "
                  style={{
                    backgroundColor: "#e7d8e2",

                    color: "#fff",
                  }}
                >
                  {" "}
                  <td className="border px-2 py-1 text-[#361d1d] font-bold text-center align-middle">
                    {item.itemName}
                  </td>
                  <td className="border px-2 py-1 text-[#d81275] font-bold text-center align-middle">
                    {item.metal === "22 Gold"
                      ? "22k G"
                      : item.metal === "24 Gold"
                      ? "24k G"
                      : item.metal === "995 Silver"
                      ? "995 S"
                      : item.metal === "999 Silver"
                      ? "Kamal S"
                      : item.metal}
                  </td>
                  <td className="border px-2 py-1 text-[#146363] font-bold text-center align-middle">
                    {item.metalPrice}
                  </td>
                  <td className="border px-2 py-1 text-[#81745c] font-bold text-center align-middle">
                    {item.gross_weight}
                  </td>
                  <td className="border px-2 py-1 text-[#4682b4] font-bold text-center align-middle">
                    {item.metal_weight}
                  </td>
                  {activeWeightKeys.map((key) => (
                    <React.Fragment key={key}>
                      {/* ✅ Skip showing weight cell if key === "other" and its value is 0 or null */}
                      {!(
                        key === "other" &&
                        (!item.other_weight || item.other_weight === 0)
                      ) && (
                        <td className="border px-2 py-1 text-[#333333] font-bold text-center align-middle">
                          {getNumericField(
                            item,
                            `${key}_weight` as keyof Order
                          ) ?? "-"}
                        </td>
                      )}

                      {/* ✅ Skip showing amount cell if both weight and amount are 0 or null */}
                      {!(
                        key === "other" &&
                        (!item.other_amount || item.other_amount === 0)
                      ) && (
                        <td className="border px-2 py-1 text-[#333333] font-bold text-center align-middle">
                          {getNumericField(
                            item,
                            `${key}_amount` as keyof Order
                          ) ?? "-"}
                        </td>
                      )}
                    </React.Fragment>
                  ))}
                  <td className="border px-2 py-1 text-[#c000fe] font-bold text-center align-middle">
                    {item.wastage}%
                  </td>
                  <td className="border px-2 py-1 text-[#D97706] font-bold text-center align-middle">
                    {item.making_charges}
                  </td>
                  <td className="border px-2 py-1 text-[#22C55E] font-bold text-center align-middle ">
                    {item.transactions?.length > 0
                      ? item.transactions.map((tx: Transaction, i: number) => {
                          const shortMethod =
                            tx.paymentMethod === "Phone Pay"
                              ? "(O)"
                              : tx.paymentMethod === "Cash"
                              ? "(C)"
                              : `(${tx.paymentMethod})`; // fallback for other methods

                          return (
                            <div
                              key={i}
                              className={`pb-1 ${
                                i !== item.transactions.length - 1
                                  ? "border-b border-dotted border-gray-400"
                                  : ""
                              }`}
                            >
                              <span className="text-[#333333] font-bold text-center align-middle">
                                {(() => {
                                  const d = new Date(tx.paymentDate);
                                  const day = String(d.getDate()).padStart(
                                    2,
                                    "0"
                                  );
                                  const month = String(
                                    d.getMonth() + 1
                                  ).padStart(2, "0");
                                  const year = String(d.getFullYear()).slice(
                                    -2
                                  ); // ✅ last 2 digits
                                  return `${day}/${month}/${year}`;
                                })()}
                              </span>
                              <span className="font-bold text-center align-middle">
                                <span className="text-[#22C55E]">
                                  ₹{tx.paidAmount}
                                </span>{" "}
                                <span className="text-[#f1699f]">
                                  {shortMethod}
                                </span>
                              </span>
                            </div>
                          );
                        })
                      : "-"}
                  </td>
                  <td className="border px-2 py-1 text-[#2c83ed] font-bold text-center align-middle">
                    ₹{item.total_item_amount}
                  </td>
                </tr>
              ))}

              {bill.selectedOrders.flatMap(
                (item: Order) =>
                  item.oldItems?.map((ex: OldItem, index: number) => (
                    <tr
                      key={`ex-${index}`}
                      className="border"
                      style={{
                        backgroundColor: "#f1e8ed",
                      }}
                    >
                      <td className="border px-2 py-1 text-[#361d1d] font-bold text-center align-middle">
                        {ex.exchange_metal_name + "  ( Ex )"}
                      </td>

                      <td className="border px-2 py-1 text-[#d81275]  font-bold text-center align-middle">
                        {ex.exchange_metal}
                      </td>

                      <td className="border px-2 py-1 text-[#146363] font-bold text-center align-middle">
                        {ex.exchange_metal_price}
                      </td>

                      <td className="border px-2 py-1 text-[#81745c] font-bold text-center align-middle">
                        {ex.exchange_metal_weight}
                      </td>

                      <td className="border px-2 py-1  text-[#4682b4] font-bold text-center align-middle">
                        {ex.exchange_purity_weight}
                      </td>

                      {/* ✅ Dynamic dash cells based on parent order */}
                      {(() => {
                        const showOtherWeight =
                          item.other_weight && item.other_weight > 0;
                        const showOtherAmount =
                          item.other_amount && item.other_amount > 0;

                        let dashCount = 0;

                        if (showOtherWeight && showOtherAmount) dashCount = 2;
                        else if (!showOtherWeight && showOtherAmount)
                          dashCount = 1;
                        else dashCount = 0;

                        return Array.from({
                          length: nonZeroColCount - dashCount,
                        }).map((_, i) => (
                          <td
                            key={`dash-${index}-${i}`}
                            className="border px-2 py-1 text-center align-middle"
                          >
                            -
                          </td>
                        ));
                      })()}
                      <td className="border px-2 py-1 text-center align-middle">
                        -
                      </td>
                      <td className="border px-2 py-1 text-center align-middle">
                        -
                      </td>
                      <td className="border px-2 py-1 text-center align-middle">
                        -
                      </td>
                      <td className="border px-2 py-1  text-[#2c83ed] font-bold text-center align-middle">
                        ₹{ex.exchange_item_amount}
                      </td>
                    </tr>
                  )) || []
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mt-10">
          <div className=" p-4 rounded-md border border-orange-800">
            <table className="text-sm w-64 table-fixed">
              <tbody>
                <tr>
                  <td className="px-3 py-2 text-[#1F2937] font-bold">
                    Bill Total :
                  </td>
                  <td className="text-right font-extrabold px-3 py-2 text-[#B45309]">
                    ₹{bill.billTotalAmount}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-[#1F2937] font-bold">
                    Exchange Amount :
                  </td>
                  <td className="text-right px-3 py-2 font-extrabold  text-[#60A5FA]">
                    ₹{bill.exchangeAmount}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-[#1F2937] font-bold">
                    Discount :
                  </td>
                  <td className="text-right px-3 py-2 font-extrabold  text-[#EC4899]">
                    ₹{bill.billDiscountAmount}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-[#1F2937] font-bold">Paid :</td>
                  <td className="text-right px-3 py-2 font-extrabold  text-[#10B981]">
                    ₹{bill.billPaidAmount}
                  </td>
                </tr>
                {/* ✅ Conditionally render Received row */}
                {bill.billResAmount > 0 && (
                  <tr>
                    <td className="px-3 py-2 text-[#1F2937] font-bold">
                      Received :
                    </td>
                    <td className="text-right px-3 py-2 font-bold text-[#49505b]">
                      ₹{bill.billResAmount}
                    </td>
                  </tr>
                )}
                <tr className="border-t border-[#D97706]">
                  <td className="px-3 py-2 text-[#1F2937] font-bold">Due:</td>
                  <td className="text-right font-extrabold text-[#DC2626] px-3 py-2">
                    ₹{bill.billDueAmount}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-xs text-gray-800">
          <p>Thank you for your Order!</p>
        </div>
      </div>

      {/* Print Button (Hidden during print) */}
      <div className="text-center mt-6 print:hidden">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-4"
        >
          🖨️ Print Invoice
        </button>
      </div>
    </div>
  );
};

export default GenerateBill;
