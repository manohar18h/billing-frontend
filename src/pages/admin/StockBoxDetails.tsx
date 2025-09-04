// src/pages/admin/StockBoxDetails.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

type StockBoxDataEntry = {
  stockBoxDataId: number;
  pieces: number;
  methodType: string;
  metalWeight: number;
  date: string;
};

type StockDataBox = {
  stockBoxId: number;
  stockBoxName: string;
  totalStockBoxCount: number;
  totalStockBoxWeight: number;
  stockBoxData: StockBoxDataEntry[];
};

const StockBoxDetails: React.FC = () => {
  const navigate = useNavigate();

  const stored = localStorage.getItem("selectedStockBox");
  const stockBox: StockDataBox | null = stored ? JSON.parse(stored) : null;

  if (!stockBox) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">No stock box selected</p>
        <button
          onClick={() => navigate("/admin/all-billing-orders")}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#f5f5f5] dark:bg-[#1a1b1f]">
      <div className="w-full max-w-5xl bg-white/90 dark:bg-[#222] backdrop-blur-lg border border-purple-300/50 rounded-3xl shadow-2xl p-8 relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 right-4 bg-purple-600 text-white px-4 py-1 rounded-lg text-sm hover:bg-purple-700"
        >
          Close
        </button>

        <h1 className="text-2xl font-bold text-purple-700 dark:text-purple-300 mb-6">
          Stock Box Data ({stockBox.stockBoxName})
        </h1>

        {stockBox.stockBoxData && stockBox.stockBoxData.length > 0 ? (
          <table className="w-full border-collapse border border-gray-300 rounded-xl overflow-hidden">
            <thead className="bg-gray-200">
              <tr>
                <th className="border px-3 py-2 text-left">ID</th>
                <th className="border px-3 py-2 text-left">Pieces</th>
                <th className="border px-3 py-2 text-left">Method</th>
                <th className="border px-3 py-2 text-left">Metal Weight</th>
                <th className="border px-3 py-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {stockBox.stockBoxData.map((entry) => (
                <tr key={entry.stockBoxDataId} className="bg-white/90">
                  <td className="border px-3 py-2">{entry.stockBoxDataId}</td>
                  <td className="border px-3 py-2">{entry.pieces}</td>
                  <td
                    className={`border px-3 py-2 font-semibold ${
                      entry.methodType === "ADDED"
                        ? "text-green-600"
                        : entry.methodType === "SELL"
                        ? "text-red-600"
                        : "text-gray-800"
                    }`}
                  >
                    {entry.methodType}
                  </td>
                  <td className="border px-3 py-2">{entry.metalWeight}</td>
                  <td className="border px-3 py-2">{entry.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No stock box data available</p>
        )}
      </div>
    </div>
  );
};

export default StockBoxDetails;
