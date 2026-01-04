// @charset "UTF-8";
import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "@/services/api";
import hjlogoo from "../../assets/hjlogoo.png";

const GenerateBill: React.FC = () => {
  const printRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const selectedOrders = location.state?.selectedOrders || [];
  const token = localStorage.getItem("token");
  const billNumber =
    location.state?.billNumber || localStorage.getItem("billNumber");
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [msgTitle, SetMsgTitle] = useState("");
  const openWhatsAppModal = () => setShowWhatsAppModal(true);

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
    itemCode: string;
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
    orderDate: string;
    selectedOrders: Order[]; // keep string since it’s coming in this format
  }

  interface Bill {
    name: string;
    phoneNumber: string;
    billNumber: string;
    billingDate: string;
    billTotalAmount: number;
    billPaidAmount: number;
    billDueAmount: number;
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

  // Updated getWhatsAppMessage to include all orders
  const getWhatsAppMessage = (bill: Bill, msgTitle: string) => {
    if (!bill.selectedOrders || bill.selectedOrders.length === 0) return "";

    const orderLines = bill.selectedOrders.map((order, idx) => {
      return `🛍️ Product Name ${idx + 1}: ${order.itemName}`;
    });

    return `
👋 Hello ${bill.name},

✨ Thank you, ${msgTitle} 🎁🥳
We appreciate your trust in Hambire Jewellery 💎

🧾 Invoice Bill No: ${bill.billNumber}
📅 Date: ${bill.billingDate}

${orderLines.join("\n\n")}

💰 Total Bill Amount: ₹${bill.billTotalAmount.toFixed(2)}
💰 Exchange Amount: ₹${bill.exchangeAmount.toFixed(2)}
✅ Paid: ₹${bill.billPaidAmount.toFixed(2)}
🎉 Discount: ₹${bill.billDiscountAmount.toFixed(2)}
⚠️ Due: ₹${bill.billDueAmount.toFixed(2)}
🎯 Delivery Status: ${bill.deliveryStatus}

Thank you for your purchase! 💎
We hope to serve you again soon!
-- Hambire Jewellery 💍
  `;
  };

  // Updated copyWhatsAppMessage function
  const copyWhatsAppMessage = () => {
    if (!bill) return;

    const phone = bill.phoneNumber?.replace(/\D/g, "");
    if (!phone) return alert("Customer phone number missing!");

    const msg = getWhatsAppMessage(bill, msgTitle);

    navigator.clipboard.writeText(msg).then(() => {
      const url = `https://web.whatsapp.com/send?phone=91${phone}`;
      window.open(url, "_blank");

      alert(
        "Message copied to clipboard ✅ \nWhatsApp Web opened. You can paste and send manually."
      );
    });
  };

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

    fetchBillSummary();
  }, [selectedOrders, token]);

  function getNumericField(item: Order, field: keyof Order): number | null {
    return (item[field] as number | null) ?? null;
  }

  const shortLabels: Record<string, { weight: string; amount: string }> = {
    stone: { weight: "S.W", amount: "S.A" },
    wax: { weight: "W.W", amount: "W.A" },
    diamond: { weight: "D.W", amount: "D.A" },
    bits: { weight: "B.W", amount: "B.A" },
    enamel: { weight: "E.W", amount: "E.A" },
    pearls: { weight: "P.W", amount: "P.A" },
    other: { weight: "O.W", amount: "O.A" },
  };

  const isValidItemCode = (code?: string) =>
    code && code.trim() !== "" && code.trim() !== "0";

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

  // 🔹 Open WhatsApp with message

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
.invoice-table th:nth-child(1),
.invoice-table td:nth-child(1) {
  width: 15%; 
}

.invoice-table th:nth-child(2),
.invoice-table td:nth-child(2) {
  width: 6%; 
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
  width: 7%; 
}
   
     .invoice-table th:nth-child(6),
.invoice-table td:nth-child(6) {
  width: 7%;
}   .invoice-table th:nth-child(7),
.invoice-table td:nth-child(7) {
  width: 8%; 
}

  .invoice-table th:nth-last-child(3),
.invoice-table td:nth-last-child(3) {
  width: 8%;
}
    .invoice-table th:nth-last-child(4),
.invoice-table td:nth-last-child(4) {
  width: 8%;
}
  .invoice-table th:nth-last-child(2),
.invoice-table td:nth-last-child(2) {
  width: 8%;
}
.invoice-table th:last-child,
.invoice-table td:last-child {
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

      {/* Printable Content */}
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
            <p className=" text-[#1a1d23]">
              Date: {new Date().toLocaleString()}
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
              <strong className="text-[#B45309] ">Name : </strong>
              <span className="text-[#111827] font-semibold ">{bill.name}</span>
            </p>
            <p>
              <strong className="text-[#B45309]">Village : </strong>
              <span className="text-[#000000]  font-semibold ">
                {bill.village}
              </span>
            </p>
            <p>
              <strong className="text-[#B45309]">Phone : </strong>
              <span className="text-[#000000] font-semibold ">
                {bill.phoneNumber}
              </span>
            </p>
            <p>
              <strong className="text-[#B45309]">Email : </strong>
              <span className="text-[#000000] font-semibold  ">
                {bill.emailId}
              </span>
            </p>
          </div>
          <div className="text-right text-[#000000]">
            <p>
              <strong className="text-[#B45309]">INVOICE : </strong>
              <span className="text-[#034c33] font-bold">
                {" "}
                {bill.billNumber}
              </span>
            </p>
            <p>
              <strong className="text-[#B45309]">Order DATE : </strong>{" "}
              <span className="font-bold text-[#000000]">{bill.orderDate}</span>
            </p>

            {Array.isArray(bill.selectedOrders) &&
              bill.selectedOrders.some((order) =>
                isValidItemCode(order.itemCode)
              ) && (
                <div className="mt-1">
                  {bill.selectedOrders
                    .filter((order) => isValidItemCode(order.itemCode))
                    .map((order: Order, index: number) => (
                      <p
                        key={index}
                        className="text-[#361d1d] font-bold text-[14px]"
                      >
                        {bill.selectedOrders.length > 1
                          ? `Item ${index + 1} code : ${order.itemCode}`
                          : `Item code : ${order.itemCode}`}
                      </p>
                    ))}
                </div>
              )}
          </div>
        </div>

        {/* Table */}
        <div className="w-full flex justify-center invoice-table-wrapper">
          <table className="invoice-table border border-collapse text-sm mb-6 invoice-table">
            <thead>
              <tr className="bg-[#B45309] text-[#ffffff]">
                <th className="border px-2 py-1 text-white font-bold  text-center align-middle text-xs">
                  Name
                </th>
                <th className="border px-2 py-1 text-white font-bold  text-center align-middle text-xs">
                  Metal
                </th>
                <th className="border px-2 py-1 text-white font-bold  text-center align-middle text-xs">
                  RT
                </th>
                <th className="border px-2 py-1 text-white font-bold  text-center align-middle text-xs">
                  G.Wt
                </th>
                <th className="border px-2 py-1 text-white font-bold  text-center align-middle text-xs">
                  N.Wt
                </th>
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

                <th className="border px-2 py-1 text-white font-bold  text-center align-middle text-xs">
                  WST
                </th>
                <th className="border px-2 py-1 text-white font-bold  text-center align-middle text-xs">
                  MC
                </th>
                <th className="border px-2 py-1 text-white font-bold  text-center align-middle text-xs">
                  Paid
                </th>
                <th className="border px-2 py-1 text-white font-bold  text-center align-middle text-xs">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {bill.selectedOrders.map((item: Order, index: number) => (
                <tr
                  key={index}
                  className="border "
                  style={{
                    backgroundColor: "#d3c0cc",

                    color: "#fff",
                  }}
                >
                  {" "}
                  <td className="border px-2 py-1 text-[#361d1d] font-bold  text-center align-middle text-[14px]">
                    {item.itemName}
                  </td>
                  <td className="border px-2 py-1 text-[#af0058] font-bold  text-center align-middle text-[11px]">
                    {item.metal === "22 Gold"
                      ? "22k-916"
                      : item.metal === "24 Gold"
                      ? "24k"
                      : item.metal === "995 Silver"
                      ? "995"
                      : item.metal === "999 Silver"
                      ? "Kamal"
                      : item.metal}
                  </td>
                  <td className="border px-2 py-1 text-[#004848] font-bold text-center align-middle text-[13px]">
                    {item.metalPrice}
                  </td>
                  <td className="border px-2 py-1 text-[#070065] font-bold text-center align-middle text-[13px]">
                    {item.gross_weight}
                  </td>
                  <td className="border px-2 py-1 text-[#00457d] font-bold text-center align-middle text-[13px]">
                    {item.metal_weight}
                  </td>
                  {activeWeightKeys.map((key) => (
                    <React.Fragment key={key}>
                      {/* ✅ Skip showing weight cell if key === "other" and its value is 0 or null */}
                      {!(
                        key === "other" &&
                        (!item.other_weight || item.other_weight === 0)
                      ) && (
                        <td className="border px-2 py-1 text-[#1f1f1f] font-bold text-center align-middle">
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
                        <td className="border px-2 py-1 text-[#1f1f1f]  font-bold text-center align-middle">
                          {getNumericField(
                            item,
                            `${key}_amount` as keyof Order
                          ) ?? "-"}
                        </td>
                      )}
                    </React.Fragment>
                  ))}
                  <td className="border px-2 py-1 text-[#51016c] font-bold text-center align-middle text-[13px]">
                    {item.wastage}%
                  </td>
                  <td className="border px-2 py-1 text-[#965205] font-bold text-center align-middle text-[13px]">
                    {item.making_charges}
                  </td>
                  <td className="border px-2 py-1 text-[#005a21] font-bold text-center align-middle text-[13px]">
                    ₹{item.paidAmount}
                  </td>
                  <td className="border px-2 py-1 text-[#00479f] font-bold text-center align-middle text-[13px]">
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
                        backgroundColor: "#e7d8e2",
                      }}
                    >
                      <td className="border px-2 py-1 text-[#361d1d] font-bold text-center align-middle text-[14px]">
                        {ex.exchange_metal_name + "  ( Ex )"}
                      </td>

                      <td className="border px-2 py-1 text-[#af0058]  font-bold text-center align-middle text-[11px]">
                        {ex.exchange_metal === "22 Gold"
                          ? "22k"
                          : ex.exchange_metal === "24 Gold"
                          ? "24k"
                          : ex.exchange_metal === "995 Silver"
                          ? "999 S"
                          : ex.exchange_metal === "999 Silver"
                          ? "999 K"
                          : ex.exchange_metal}
                      </td>

                      <td className="border px-2 py-1 text-[#004848] font-bold text-center align-middle text-[13px]">
                        {ex.exchange_metal_price}
                      </td>

                      <td className="border px-2 py-1 text-[#070065] font-bold text-center align-middle text-[13px]">
                        {ex.exchange_metal_weight}
                      </td>

                      <td className="border px-2 py-1  text-[#00457d] font-bold text-center align-middle text-[13px]">
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
                      <td className="border px-2 py-1  text-[#00479f] font-bold text-center align-middle text-[13px]">
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
          <div className=" p-4 rounded-3xl border border-orange-900 mr-10">
            <table className="text-sm w-64 table-fixed">
              <tbody>
                <tr>
                  <td className="px-3 py-2 text-black  font-bold text-[15px]">
                    Bill Total :
                  </td>
                  <td className="text-right font-bold px-3 py-2 text-[#5e2a03] text-[15px] ">
                    ₹{bill.billTotalAmount}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-black  font-bold text-[15px]">
                    Exchange Amount :
                  </td>
                  <td className="text-right px-3 py-2 font-bold  text-[#022754] text-[15px]">
                    ₹{bill.exchangeAmount}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-black  font-bold text-[15px]">
                    Discount :
                  </td>
                  <td className="text-right px-3 py-2 font-bold  text-[#93094e] text-[15px]">
                    ₹{bill.billDiscountAmount}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-black  font-bold text-[15px]">
                    Total Paid :
                  </td>
                  <td className="text-right px-3 py-2 font-bold  text-[#0b4e06] text-[15px]">
                    ₹{bill.billPaidAmount}
                  </td>
                </tr>
                {/* ✅ Conditionally render Received row */}
                {bill.billResAmount > 0 && (
                  <tr>
                    <td className="px-3 py-2 text-black  font-bold text-[15px]">
                      Received :
                    </td>
                    <td className="text-right px-3 py-2 font-bold text-[#5f034e] text-[15px]">
                      ₹{bill.billResAmount}
                    </td>
                  </tr>
                )}
                <tr className="border-t border-[#D97706] mt-5">
                  <td className="px-3 py-2 text-black  font-bold mt-5 text-[15px]">
                    Due:
                  </td>
                  <td className="text-right font-bold text-[#ff0000] px-3 py-2 text-[15px]">
                    ₹{bill.billDueAmount}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-xs text-gray-900 text-[16px] ml-10">
          <div className="p-5 text-center inline-block border-b border-gray-500 pb-1 ">
            <h6 className="text-base">
              మా వద్ద చేయించిన 91.6 గోల్డ్ ఆభరణాలు తిరిగి 90% ఇవ్వబడును.
            </h6>
            <h6 className="text-base">
              మా వద్ద చెయించిన్న ☆ పట్టీలు 80% సోక్కం ఇవ్వబడును.
            </h6>
          </div>
          <h5 className="text-base mt-4 ml-14">
            Thank you for your order! We appreciate your trust.
          </h5>
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
      <div className="text-center mt-4 print:hidden">
        <button
          onClick={openWhatsAppModal} // Now defined
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          📲 Send WhatsApp Message
        </button>
      </div>

      {/* WhatsApp Modal */}
      {showWhatsAppModal && bill && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4">WhatsApp Message Preview</h2>
            <pre className="whitespace-pre-wrap mb-4">
              {getWhatsAppMessage(bill, msgTitle)}
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
    </div>
  );
};

export default GenerateBill;
