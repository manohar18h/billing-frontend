import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "@/services/api";

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
             @page {
    size: A4 portrait;   /* Or A5 portrait */
    margin: 5mm;        /* Adjust as needed */
  }

  .no-print-scroll {
    overflow: visible !important;
  }

  #print-section, #print-section * {
        visibility: visible;
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

        {/* Customer Info */}
        <div className="mb-4">
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

        {/* Table */}
        <div className="overflow-x-auto no-print-scroll">
          <table className="w-full border border-collapse text-sm mb-6 min-w-[1000px] print:min-w-full">
            <thead>
              <tr className="bg-[#B45309] text-[#F9FAFB]">
                <th className="border px-2 py-1">Item Name</th>
                <th className="border px-2 py-1">Metal</th>
                <th className="border px-2 py-1">Rate (G-22k) (S-999)</th>
                <th className="border px-2 py-1">Gross Weight</th>
                <th className="border px-2 py-1">Item Weight</th>
                {activeWeightKeys.map((key) => (
                  <React.Fragment key={key}>
                    {!(key === "other") && (
                      <th className="border px-2 py-1 capitalize">
                        {key} Weight
                      </th>
                    )}
                    {key === "other" &&
                      bill.selectedOrders.some(
                        (item) => item.other_weight && item.other_weight > 0
                      ) && (
                        <th className="border px-2 py-1 capitalize">
                          {key} Weight
                        </th>
                      )}

                    <th className="border px-2 py-1 capitalize">
                      {key} Amount
                    </th>
                  </React.Fragment>
                ))}
                <th className="border px-2 py-1">Wastage</th>
                <th className="border px-2 py-1">Making Charges</th>
                <th className="border px-2 py-1">Paid</th>
                <th className="border px-2 py-1">Amount</th>
              </tr>
            </thead>
            <tbody>
              {bill.selectedOrders.map((item: Order, index: number) => (
                <tr
                  key={index}
                  className="border "
                  style={{
                    background: "linear-gradient(135deg, #0f172a, #1e293b)", // dark gradient
                    color: "#fff",
                  }}
                >
                  {" "}
                  <td className="border px-2 py-1 text-[#caaffa] font-bold text-center align-middle">
                    {item.itemName}
                  </td>
                  <td className="border px-2 py-1  text-[#EC4899] font-bold text-center align-middle">
                    {item.metal}
                  </td>
                  <td className="border px-2 py-1 text-[#008080] font-bold text-center align-middle">
                    {item.metalPrice}
                  </td>
                  <td className="border px-2 py-1 text-[#9CA3AF] font-bold text-center align-middle">
                    {item.gross_weight}
                  </td>
                  <td className="border px-2 py-1 text-[#7C3AED] font-bold text-center align-middle">
                    {item.metal_weight}
                  </td>
                  {activeWeightKeys.map((key) => (
                    <React.Fragment key={key}>
                      {/* ✅ Skip showing weight cell if key === "other" and its value is 0 or null */}
                      {!(
                        key === "other" &&
                        (!item.other_weight || item.other_weight === 0)
                      ) && (
                        <td className="border px-2 py-1 text-[#F9A8D4] font-bold text-center align-middle">
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
                        <td className="border px-2 py-1 text-[#FACC15] font-bold text-center align-middle">
                          {getNumericField(
                            item,
                            `${key}_amount` as keyof Order
                          ) ?? "-"}
                        </td>
                      )}
                    </React.Fragment>
                  ))}
                  <td className="border px-2 py-1 text-[#10B981] font-bold text-center align-middle">
                    {item.wastage}%
                  </td>
                  <td className="border px-2 py-1 text-[#D97706] font-bold text-center align-middle">
                    {item.making_charges}
                  </td>
                  <td className="border px-2 py-1 text-[#22C55E] ">
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
                              <span className="text-[#E5E7EB] font-bold text-center align-middle">
                                {" "}
                                {new Date(
                                  tx.paymentDate
                                ).toLocaleDateString()}{" "}
                              </span>{" "}
                              <span className="font-bold text-center align-middle">
                                <span className="text-[#22C55E]">
                                  ₹{tx.paidAmount}
                                </span>{" "}
                                <span className="text-[#A855F7]">
                                  {shortMethod}
                                </span>
                              </span>
                            </div>
                          );
                        })
                      : "-"}
                  </td>
                  <td className="border px-2 py-1 text-[#60A5FA] font-bold text-center align-middle">
                    ₹{item.total_item_amount}
                  </td>
                </tr>
              ))}

              {bill.selectedOrders.flatMap(
                (item: Order) =>
                  item.oldItems?.map((ex: OldItem, index: number) => (
                    <tr key={`ex-${index}`} className="border bg-gray-100">
                      <td className="border px-2 py-1  text-[#caaffa] ">
                        {ex.exchange_metal_name + "  ( Ex )"}
                      </td>
                      <td className="border px-2 py-1  text-[#EC4899] ">
                        {ex.exchange_metal}
                      </td>
                      <td className="border px-2 py-1 text-[#008080]">
                        {ex.exchange_metal_price}
                      </td>
                      <td className="border px-2 py-1  text-[#9CA3AF]">
                        {ex.exchange_metal_weight}
                      </td>

                      <td className="border px-2 py-1 text-[#7C3AED]">
                        {ex.exchange_purity_weight}
                      </td>
                      {Array.from({ length: nonZeroColCount }).map((_, i) => (
                        <td key={`empty-${i}`} className="border px-2 py-1">
                          -
                        </td>
                      ))}
                      <td className="border px-2 py-1">-</td>
                      <td className="border px-2 py-1">-</td>
                      <td className="border px-2 py-1">-</td>
                      <td className="border px-2 py-1 text-[#60A5FA] ">
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
                    <td className="text-right px-3 py-2">
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
