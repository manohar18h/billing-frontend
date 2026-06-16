// src/pages/admin/StockBoxDetails.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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


const secreat_code = "HambireJ@1977";

const [passwordDialog, setPasswordDialog] = useState(false);
const [passwordInput, setPasswordInput] = useState("");
const [selectedIds, setSelectedIds] = useState<number[]>([]);






const verifyPasswordAndDelete = async () => {
  if (passwordInput !== secreat_code) {
    alert("Incorrect Password");
    return;
  }

  setPasswordDialog(false);
  setPasswordInput("");

  await handleBulkDelete();
};

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

 

const handleCheckOne = (id: number) => {
  setSelectedIds((prev) =>
    prev.includes(id)
      ? prev.filter((x) => x !== id)
      : [...prev, id]
  );
};

const handleSelectAllSell = () => {
  const sellIds = stockBox.stockBoxData
    .filter((x) => x.methodType2?.toUpperCase() === "SELL")
    .map((x) => x.stockBoxDataId);

  setSelectedIds(sellIds);
};

const handleBulkDelete = async () => {
  if (selectedIds.length === 0) {
    alert("Please select at least one row");
    return;
  }

  const confirmDelete = window.confirm(
    `Are you sure want to delete ${selectedIds.length} selected rows?`
  );

  if (!confirmDelete) return;

  try {
   await api.request({
  method: "DELETE",
  url: `${basePath}/stock-box-data/delete`,
  data: selectedIds,
  headers: token
    ? { Authorization: `Bearer ${token}` }
    : undefined,
});

    alert("Deleted Successfully");

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

    setSelectedIds([]);
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
        {Number(stockBox.totalStockBoxWeight || 0).toFixed(3)}
      </span>
    </div>
  </div>
</div>

{isAdmin && (
  <div className="flex gap-3 mb-4">
    <button
      onClick={handleSelectAllSell}
      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
    >
      Select All SELL
    </button>

   <button
  onClick={() => {
    if (selectedIds.length === 0) {
      alert("Please select at least one row");
      return;
    }

    setPasswordInput("");
    setPasswordDialog(true);
  }}
  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
>
  Delete Selected
</button>
  </div>
)}

       {stockBox.stockBoxData && stockBox.stockBoxData.length > 0 ? (
  <>
    {/* Mobile card view */}
    <div className="space-y-3 md:hidden">
      {stockBox.stockBoxData.map((entry) => (
        <div
          key={entry.stockBoxDataId}
          className="rounded-2xl border border-purple-100 bg-white p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs text-gray-500">ID</div>
              <div className="font-bold text-purple-700">
                #{entry.stockBoxDataId}
              </div>
            </div>

            {isAdmin && (
              <input
                type="checkbox"
                checked={selectedIds.includes(entry.stockBoxDataId)}
                onChange={() => handleCheckOne(entry.stockBoxDataId)}
                className="h-5 w-5"
              />
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-purple-50 p-2">
              <div className="text-[11px] text-gray-500">Pieces</div>
              <div className="font-bold">{entry.pieces}</div>
            </div>

            <div className="rounded-xl bg-purple-50 p-2">
              <div className="text-[11px] text-gray-500">Weight</div>
              <div className="font-bold">
                {Number(entry.metalWeight || 0).toFixed(3)}
              </div>
            </div>

            <div className="rounded-xl bg-purple-50 p-2">
              <div className="text-[11px] text-gray-500">Method</div>
              <div
                className={`font-bold ${
                  entry.methodType === "ADDED"
                    ? "text-green-600"
                    : entry.methodType === "SELL"
                      ? "text-red-600"
                      : "text-gray-800"
                }`}
              >
                {entry.methodType || "-"}
              </div>
            </div>

            <div className="rounded-xl bg-purple-50 p-2">
              <div className="text-[11px] text-gray-500">Method2</div>
              <div
                className={`font-bold ${
                  entry.methodType2 === "SELL"
                    ? "text-red-600"
                    : "text-gray-800"
                }`}
              >
                {entry.methodType2 || "-"}
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-1 text-sm">
            <div>
              <span className="font-semibold text-gray-500">Date: </span>
              {formatDMY(entry.date) || "-"}
            </div>
            <div>
              <span className="font-semibold text-gray-500">Selling Date: </span>
              {formatDMY(entry.sellingDate) || "-"}
            </div>
            <div>
              <span className="font-semibold text-gray-500">Barcode: </span>
              {entry.barcodeValue || "-"}
            </div>
            <div className="break-all">
              <span className="font-semibold text-gray-500">EPC: </span>
              {entry.epcNumber || "-"}
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Desktop table view */}
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full border-collapse border border-gray-300 rounded-xl overflow-hidden">   <thead className="bg-gray-200">
              <tr>
  {isAdmin && (
  <th className="border px-3 py-2 text-center">Select</th>
)}
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
      <div className="flex justify-center items-center">
        EPC
      </div>
    </th>
  </tr>
</thead>
            <tbody>
              {stockBox.stockBoxData.map((entry) => (
                <tr key={entry.stockBoxDataId} className="bg-white/90">
                 {isAdmin && (
  <td className="border px-3 py-2 text-center">
    <input
      type="checkbox"
      checked={selectedIds.includes(entry.stockBoxDataId)}
      onChange={() => handleCheckOne(entry.stockBoxDataId)}
      className="w-4 h-4"
    />
  </td>
)}

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
                   {Number(entry.metalWeight || 0).toFixed(3)}
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
            
                </tr>
              ))}
            </tbody>
               </table>
    </div>
  </>
        ) : (
          <p>No stock box data available</p>
        )}
      </div>

{passwordDialog && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-xl w-[400px] shadow-xl">
      <h2 className="text-xl font-bold mb-4">Enter Admin Password</h2>

      <input
        type="password"
        value={passwordInput}
        onChange={(e) => setPasswordInput(e.target.value)}
        placeholder="Enter password"
        className="w-full border rounded-lg px-3 py-2 mb-4"
      />

      <div className="flex justify-end gap-2">
        <button
          onClick={() => {
            setPasswordDialog(false);
            setPasswordInput("");
          }}
          className="px-4 py-2 border rounded-lg"
        >
          Cancel
        </button>

        <button
          onClick={verifyPasswordAndDelete}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg"
        >
          Verify
        </button>
      </div>
    </div>
  </div>
)}

    </div>
    
  );
};

export default SalesStockBoxDetails;
