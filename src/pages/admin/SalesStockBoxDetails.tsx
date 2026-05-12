// src/pages/admin/StockBoxDetails.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import api from "@/services/api";

type StockBoxDataEntry = {
  stockBoxDataId: number;
  pieces: number;
  methodType: string;
  metalWeight: number;
  date: string;
  methodType2?: string;
  sellingDate?: string;
  barcodeValue?: string;
  epcNumber?: string;
};

type StockDataBox = {
  stockBoxId: number;
  stockBoxName: string;
  totalStockBoxCount: number;
  totalStockBoxWeight: number;
  stockBoxData: StockBoxDataEntry[];
};

const SalesStockBoxDetails: React.FC = () => {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

const isAdmin = role === "ADMIN";

const basePath = role === "ADMIN" ? "/admin" : "/sales";

  const stored = localStorage.getItem("selectedStockBox");
  const stockBox: StockDataBox | null = stored ? JSON.parse(stored) : null;

  if (!stockBox) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">No stock box selected</p>
        <button
          onClick={() => navigate("/sales")}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg"
        >
          Back
        </button>
      </div>
    );
  }

  const formatDMY = (date?: string) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const handleDeleteStockBoxData = async (
  stockBoxDataId: number
) => {

const entry = stockBox.stockBoxData.find(
  (x) => x.stockBoxDataId === stockBoxDataId
);

const confirmDelete = window.confirm(
  `Are you sure want to delete?\n\n` +
  `ID: ${entry?.stockBoxDataId}\n` +
  `Metal Weight: ${entry?.metalWeight}\n` +
  `Barcode Value: ${entry?.barcodeValue}`
);

  if (!confirmDelete) return;

  try {

    await api.delete(
      `${basePath}/stock-box-data/delete/${stockBoxDataId}`,
      {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : undefined,
      }
    );

    alert("Deleted Successfully");

    // remove deleted row locally
    const updatedResponse = await api.get(
  `${basePath}/stock-box/${stockBox.stockBoxId}`,
  {
    headers: token
      ? { Authorization: `Bearer ${token}` }
      : undefined,
  }
);

localStorage.setItem(
  "selectedStockBox",
  JSON.stringify(updatedResponse.data)
);

window.location.reload();

  } catch (error) {

    console.error(error);

    alert("Delete Failed");
  }
};

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#f5f5f5] dark:bg-[#1a1b1f]">
      <div className="w-full max-w-5xl bg-white/90 dark:bg-[#222] backdrop-blur-lg border border-purple-300/50 rounded-3xl shadow-2xl p-8 relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 right-4 bg-purple-600 text-white px-4 py-1 rounded-lg text-sm hover:bg-purple-700"
        >
          Close
        </button>

        <div className="mb-6">
  <h1 className="text-2xl font-bold text-purple-700 dark:text-purple-300">
    Stock Box Data ({stockBox.stockBoxName})
  </h1>

  <div className="flex gap-6 mt-3 text-lg font-semibold text-gray-700">
    <div>
      Total Count:
      <span className="text-purple-700 ml-2">
        {stockBox.totalStockBoxCount}
      </span>
    </div>

    <div>
      Total Weight:
      <span className="text-purple-700 ml-2">
        {stockBox.totalStockBoxWeight}
      </span>
    </div>
  </div>
</div>

        {stockBox.stockBoxData && stockBox.stockBoxData.length > 0 ? (
          <table className="w-full border-collapse border border-gray-300 rounded-xl overflow-hidden">
            <thead className="bg-gray-200">
              <tr>
                <th className="border px-3 py-2 text-center">
                  <div className="flex justify-center items-center">ID</div>
                </th>
                <th className="border px-3 py-2 text-center">
                  <div className="flex justify-center items-center">Pieces</div>
                </th>
                <th className="border px-3 py-2 text-center">
                  <div className="flex justify-center items-center">Method</div>
                </th>
                <th className="border px-3 py-2 text-center">
                  <div className="flex justify-center items-center">
                    Metal Weight
                  </div>
                </th>
                <th className="border px-3 py-2 text-center">
                  <div className="flex justify-center items-center">Date</div>
                </th>
                <th className="border px-3 py-2 text-center">
                  <div className="flex justify-center items-center">
                    Barcode
                  </div>
                </th>
                <th className="border px-3 py-2 text-center">
                  <div className="flex justify-center items-center">
                    Method2
                  </div>
                </th>
                <th className="border px-3 py-2 text-center">
                  <div className="flex justify-center items-center">
                    Selling Date
                  </div>
                </th>
                <th className="border px-3 py-2 text-center">
                  <div className="flex justify-center items-center">EPC</div>
                </th>
          {isAdmin && (
  <th className="border px-3 py-2 text-center">
    <div className="flex justify-center items-center">
      Action
    </div>
  </th>
)}
              </tr>
            </thead>
            <tbody>
              {stockBox.stockBoxData.map((entry) => (
                <tr key={entry.stockBoxDataId} className="bg-white/90">
                  <td className="border px-3 py-2 text-center">
                    {entry.stockBoxDataId}
                  </td>
                  <td className="border px-3 py-2 text-center">
                    {entry.pieces}
                  </td>
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
                  <td className="border px-3 py-2 text-center align-middle">
                    {entry.metalWeight}
                  </td>
                  <td className="border px-3 py-2">{formatDMY(entry.date)}</td>
                  <td className="border px-3 py-2">{entry.barcodeValue}</td>
                  <td
                    className={`border px-3 py-2 font-semibold text-center align-middle ${
                      entry.methodType2 === "SELL"
                        ? "text-red-600"
                        : "text-gray-800"
                    }`}
                  >
                    {entry.methodType2}
                  </td>
                  <td className="border px-3 py-2">
                    {formatDMY(entry.sellingDate)}
                  </td>
                  <td className="border px-3 py-2">{entry.epcNumber}</td>
                <td className="border px-3 py-2 text-center">

  {isAdmin && (
    <IconButton
      color="error"
      onClick={() =>
        handleDeleteStockBoxData(entry.stockBoxDataId)
      }
    >
      <DeleteIcon />
    </IconButton>
  )}

</td>
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

export default SalesStockBoxDetails;
