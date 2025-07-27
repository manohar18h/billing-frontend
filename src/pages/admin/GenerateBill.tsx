import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";

const GenerateBill: React.FC = () => {
  const printRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const selectedOrders = location.state?.selectedOrders || [];
  const token = localStorage.getItem("token");

  const [bill, setBill] = useState<any>(null);

  useEffect(() => {
    if (selectedOrders.length === 0) return;

    const fetchBillSummary = async () => {
      try {
        const response = await axios.post(
          "http://15.207.98.116:8081/admin/bill-summary",
          { orderId: selectedOrders },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        setBill(response.data);
      } catch (error) {
        console.error("Error fetching bill summary:", error);
      }
    };

    fetchBillSummary();
  }, [selectedOrders, token]);

  const handlePrint = () => {
    window.print();
  };

  if (!bill) return <p className="p-6">Loading Bill Summary...</p>;

  return (
    <div className="p-6 bg-white text-black">
      {/* PRINT CSS */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
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
              padding: 6;
            }
          }
        `}
      </style>

      {/* Printable Content */}
      <div
        id="print-section"
        ref={printRef}
        className="border-2 border-orange-500 p-6 max-w-5xl mx-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 pb-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-orange-600">
              HAMBIRE JEWELLERY
            </h1>
            <p>Since 1977</p>
            <p>Ramayampet, Subhash Road, Medak, Telangana, 502101</p>
            <p>Phone: 9703738824 | www.hambirejewellery.com</p>
          </div>
          <div className="text-right">
            <p>
              <strong>DATE:</strong> {new Date().toLocaleString()}
            </p>
            <p>
              <strong>INVOICE:</strong> {bill.billNumber}
            </p>
            <p>
              <strong>Customer ID:</strong> {bill.customerId}
            </p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-4">
          <p>
            <strong>Name:</strong> {bill.name}
          </p>
          <p>
            <strong>Village:</strong> {bill.village}
          </p>
          <p>
            <strong>Phone:</strong> {bill.phoneNumber}
          </p>
          <p>
            <strong>Email:</strong> {bill.emailId}
          </p>
        </div>

        {/* Table */}
        <table className="w-full border border-collapse text-sm mb-6">
          <thead>
            <tr className="bg-orange-500 text-white">
              <th className="border px-2 py-1">Item Name</th>
              <th className="border px-2 py-1">Gross Weight</th>
              <th className="border px-2 py-1">Stone Weight</th>
              <th className="border px-2 py-1">Item Weight</th>
              <th className="border px-2 py-1">Wastage</th>
              <th className="border px-2 py-1">Paid</th>
              <th className="border px-2 py-1">Amount</th>
            </tr>
          </thead>
          <tbody>
            {bill.selectedOrders.map((item: any, index: number) => (
              <tr key={index} className="border">
                <td className="border px-2 py-1">{item.itemName}</td>
                <td className="border px-2 py-1">{item.gross_weight}</td>
                <td className="border px-2 py-1">{item.stone_weight}</td>
                <td className="border px-2 py-1">{item.metal_weight}</td>
                <td className="border px-2 py-1">{item.wastage}%</td>
                <td className="border px-2 py-1">
                  {item.transactions?.length > 0
                    ? item.transactions.map((tx: any, i: number) => (
                        <div key={i}>
                          ₹{tx.paidAmount} on{" "}
                          {new Date(tx.paymentDate).toLocaleDateString()}
                        </div>
                      ))
                    : "-"}
                </td>
                <td className="border px-2 py-1">₹{item.total_item_amount}</td>
              </tr>
            ))}

            {bill.selectedOrders.flatMap(
              (item: any) =>
                item.oldItems?.map((ex: any, index: number) => (
                  <tr key={`ex-${index}`} className="border bg-gray-100">
                    <td className="border px-2 py-1">
                      {ex.exchange_metal_name + "  ( Ex )"}
                    </td>
                    <td className="border px-2 py-1">
                      {ex.exchange_metal_weight}
                    </td>
                    <td className="border px-2 py-1">-</td>
                    <td className="border px-2 py-1">
                      {ex.exchange_purity_weight}
                    </td>
                    <td className="border px-2 py-1">-</td>
                    <td className="border px-2 py-1">-</td>
                    <td className="border px-2 py-1">
                      ₹{ex.exchange_item_amount}
                    </td>
                  </tr>
                )) || []
            )}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <table className="text-sm w-64">
            <tbody>
              <tr>
                <td className="px-2 py-1">Bill Total:</td>
                <td className="text-right font-semibold">
                  ₹{bill.billTotalAmount}
                </td>
              </tr>
              <tr>
                <td className="px-2 py-1">Exchange Amount:</td>
                <td className="text-right">₹{bill.exchangeAmount}</td>
              </tr>
              <tr>
                <td className="px-2 py-1">Discount:</td>
                <td className="text-right">₹{bill.billDiscountAmount}</td>
              </tr>
              <tr className="border-t border-black">
                <td className="px-2 py-1 font-bold">Paid:</td>
                <td className="text-right font-bold">₹{bill.billPaidAmount}</td>
              </tr>
              <tr>
                <td className="px-2 py-1 font-bold text-red-600">Due:</td>
                <td className="text-right font-bold text-red-600">
                  ₹{bill.billDueAmount}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-6 text-xs text-gray-600">
          <p>Thank you for your Order!</p>
        </div>
      </div>

      {/* Print Button (Hidden during print) */}
      <div className="text-center mt-6 print:hidden">
        <button
          onClick={handlePrint}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded"
        >
          Print Invoice
        </button>
      </div>
    </div>
  );
};

export default GenerateBill;
