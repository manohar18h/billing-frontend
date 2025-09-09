import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Typography, IconButton } from "@mui/material";
import api from "@/services/api"; // ← import your api.ts

interface SelectedOrder {
  orderId: number;
  orderDate: string;
  metal: string;
  metalPrice: number;
  itemName: string;
  occasion: string;
  design: string;
  size: string;
}

interface Billing {
  billId: number;
  billNumber: string;
  customerId: number;
  name: string;
  village: string;
  phoneNumber: string;
  emailId: string;
  billTotalAmount: number;
  billDiscountAmount: number;
  exchangeAmount: number;
  billPaidAmount: number;
  billDueAmount: number;
  selectedOrderIds: string;
  billingDate: string | null;
  selectedOrders: SelectedOrder[];
}

const BillData: React.FC = () => {
  const [billingData, setBillingData] = useState<Billing[]>([]);
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate("/admin/customers");
  };

  useEffect(() => {
    const phnNumber = localStorage.getItem("bill-phnNumber");
    if (phnNumber) {
      api
        .get<Billing[]>(`/admin/by-phone/${phnNumber}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        .then((response) => {
          if (response.data.length === 0) {
            // ❌ No billing data → redirect to customers with error message
            navigate("/admin/customers", {
              replace: true,
              state: {
                errorMessage: "No billing data found for this phone number.",
              },
            });
          } else {
            setBillingData(response.data);
          }
        })
        .catch((error) => {
          console.error("Error fetching billing data:", error);
          navigate("/admin/customers", {
            replace: true,
            state: {
              errorMessage: "No billing data found for this phone number.",
            },
          });
        });
    } else {
      navigate("/admin/customers", {
        replace: true,
        state: { errorMessage: "Phone number is missing." },
      });
    }
  }, [navigate]);

  if (billingData.length === 0) {
    return <p className="p-4">No billing data found for this phone number.</p>;
  }

  const customer = billingData[0]; // all bills belong to the same customer

  return (
    <div>
      <div className="mt-10 flex flex-col items-center justify-center">
        <div
          className="w-full max-w-4xl rounded-2xl shadow-xl p-6"
          style={{
            background: "linear-gradient(135deg, #1e293b, #0f172a)", // dark gradient
            color: "#fff",
          }}
        >
          {/* Header */}
          <div className="flex items-center mb-6">
            <IconButton color="inherit" onClick={handleBackClick}>
              <ArrowBackIcon className="text-white" />
            </IconButton>
            <h2 className="text-2xl font-bold text-amber-300 ml-2">
              Customer Details
            </h2>
          </div>

          {/* Grid Info */}
          <div className="grid grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-4 pr-4 border-r border-white/20">
              <p className="flex justify-between">
                <span className="text-gray-300 font-medium">Name:</span>
                <span className="text-emerald-300 font-semibold">
                  {customer.name}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-300 font-medium">Village:</span>
                <span className="text-purple-300 font-semibold">
                  {customer.village}
                </span>
              </p>
            </div>

            {/* Right column */}
            <div className="space-y-4 pl-4">
              <p className="flex justify-between">
                <span className="text-gray-300 font-medium">Phone:</span>
                <span className="text-teal-300 font-semibold">
                  {customer.phoneNumber}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-300 font-medium">Email:</span>
                <span className="text-orange-300 font-semibold">
                  {customer.emailId || "—"}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Billing Table */}
      <div className="mt-10 p-3 flex flex-col items-center justify-center">
        <div className="p-6 rounded-3xl w-full max-w-6xl bg-white/75 backdrop-blur-lg border border-[#d0b3ff] shadow-[0_10px_30px_rgba(136,71,255,0.3)]">
          <h3 className=" text-3xl font-bold mb-10 text-blue-600">
            Billing History
          </h3>
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-200">
              <tr>
                <th className="border px-3 py-2">Billing Date</th>
                <th className="border px-3 py-2">Bill Number</th>
                <th className="border px-3 py-2">Total Amount</th>
                <th className="border px-3 py-2">Exchange</th>
                <th className="border px-3 py-2">Paid</th>
                <th className="border px-3 py-2">Due</th>
                <th className="border px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {billingData.map((bill) => (
                <tr key={bill.billId} className="text-center">
                  <td className="border px-3 py-2">
                    {bill.billingDate
                      ? new Date(bill.billingDate).toLocaleString()
                      : "N/A"}
                  </td>
                  <td className="border px-3 py-2">{bill.billNumber}</td>
                  <td className="border px-3 py-2">
                    {bill.billTotalAmount.toFixed(2)}
                  </td>
                  <td className="border px-3 py-2">
                    {bill.exchangeAmount.toFixed(2)}
                  </td>
                  <td className="border px-3 py-2">
                    {bill.billPaidAmount.toFixed(2)}
                  </td>
                  <td className="border px-3 py-2">
                    {bill.billDueAmount.toFixed(2)}
                  </td>
                  <td className="border px-3 py-2">
                    <button
                      className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
                      onClick={() => {
                        localStorage.setItem("billNumber", bill.billNumber);
                        navigate("/admin/bill-details");
                      }}
                    >
                      View More
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BillData;
