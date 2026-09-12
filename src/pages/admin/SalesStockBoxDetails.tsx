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

  checked?: boolean;
  description?: string;
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

const canEditCheck = role === "ADMIN" || role === "SALES";

const basePath = role === "ADMIN" ? "/admin" : "/sales";

  const stored = localStorage.getItem("selectedStockBox");
  const stockBox: StockDataBox | null = stored ? JSON.parse(stored) : null;


const secreat_code = "HambireJ@1977";

const [passwordDialog, setPasswordDialog] = useState(false);
const [passwordInput, setPasswordInput] = useState("");
const [selectedIds, setSelectedIds] = useState<number[]>([]);

const [checkValues, setCheckValues] = useState<
  Record<number, { checked: boolean; description: string }>
>({});

const [savingId, setSavingId] = useState<number | null>(null);






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

const getRowValues = (entry: StockBoxDataEntry) => {
  return (
    checkValues[entry.stockBoxDataId] ?? {
      checked: entry.checked ?? false,
      description: entry.description ?? "",
    }
  );
};

const handleVerifiedChange = (
  entry: StockBoxDataEntry,
  checked: boolean
) => {
  const current = getRowValues(entry);

  setCheckValues((prev) => ({
    ...prev,
    [entry.stockBoxDataId]: {
      ...current,
      checked,
    },
  }));
};

const handleDescriptionChange = (
  entry: StockBoxDataEntry,
  description: string
) => {
  const current = getRowValues(entry);

  setCheckValues((prev) => ({
    ...prev,
    [entry.stockBoxDataId]: {
      ...current,
      description,
    },
  }));
};

const handleSaveCheck = async (entry: StockBoxDataEntry) => {
  const values = getRowValues(entry);

  try {
    setSavingId(entry.stockBoxDataId);

    await api.patch(
  `${basePath}/stock-box-data/${entry.stockBoxDataId}/check`,
      {
        checked: values.checked,
        description: values.description,
      },
      {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : undefined,
      }
    );

    // Update local object with saved values
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

setCheckValues((prev) => {
  const updated = { ...prev };
  delete updated[entry.stockBoxDataId];
  return updated;
});
 alert("Saved Successfully");
window.location.reload();
  } catch (error) {
    console.error(error);
    alert("Failed to save");
  } finally {
    setSavingId(null);
  }
};

  return (
<div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#f5f5f5] dark:bg-[#1a1b1f]">
  <div className="w-full max-w-[96vw] bg-white/90 dark:bg-[#222] backdrop-blur-lg border border-purple-300/50 rounded-3xl shadow-2xl p-6 relative">
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
      {stockBox.stockBoxData.map((entry, index) => (
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
          {canEditCheck && (
  <div className="mt-4 border-t border-gray-200 pt-4">
    <div className="flex items-center gap-3">
      <input
        type="checkbox"
        checked={getRowValues(entry).checked}
        onChange={(e) =>
          handleVerifiedChange(entry, e.target.checked)
        }
        className="w-5 h-5 cursor-pointer accent-green-600"
      />

      <span className="font-semibold text-gray-700">
        Checked
      </span>
    </div>

    <div className="mt-3">
      <label className="text-xs font-semibold text-gray-500">
        Description
      </label>

      <textarea
        value={getRowValues(entry).description}
        onChange={(e) =>
          handleDescriptionChange(entry, e.target.value)
        }
        placeholder="Enter description"
        rows={2}
        className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
      />
    </div>

    <button
      type="button"
      onClick={() => handleSaveCheck(entry)}
      disabled={savingId === entry.stockBoxDataId}
      className="mt-3 w-full bg-green-600 text-white rounded-xl py-2 font-semibold hover:bg-green-700 disabled:opacity-50"
    >
      {savingId === entry.stockBoxDataId
        ? "Saving..."
        : "Save"}
    </button>
  </div>
)}
        </div>

        
      ))}

      
    </div>
    

    {/* Desktop table view */}
    {/* Desktop table view */}
<div className="hidden w-full overflow-x-auto md:block">
  <table className="w-full table-auto border-collapse border border-gray-300 rounded-xl overflow-hidden text-sm">

    <thead className="bg-gray-200">
      <tr>

        <th className="border px-3 py-2 text-center">
          S.No
        </th>

        {canEditCheck && (
  <th className="border px-3 py-2 text-center">
    Checked
  </th>
)}

        <th className="border px-3 py-2 text-center">
          ID
        </th>

        <th className="border px-3 py-2 text-center">
          Pieces
        </th>

        <th className="border px-3 py-2 text-center">
          Method
        </th>

        <th className="border px-3 py-2 text-center">
          Metal Weight
        </th>

        <th className="border px-3 py-2 text-center">
          Date
        </th>

        <th className="border px-3 py-2 text-center">
          Barcode
        </th>

        <th className="border px-3 py-2 text-center">
          Method2
        </th>

        <th className="border px-3 py-2 text-center">
          Selling Date
        </th>

        <th className="border px-3 py-2 text-center">
          EPC
        </th>

        {canEditCheck && (
  <>
    <th className="border px-3 py-2 text-center min-w-[170px]">
      Description
    </th>

    <th className="border px-3 py-2 text-center">
      Action
    </th>
  </>
)}

{isAdmin && (
  <th className="border px-3 py-2 text-center">
    Select
  </th>
)}

      </tr>
    </thead>

    <tbody>
      {stockBox.stockBoxData.map((entry, index) => (
        <tr
          key={entry.stockBoxDataId}
          className="bg-white/90"
        >

          {/* S.No */}
          <td className="border px-3 py-2 text-center font-semibold">
            {index + 1}
          </td>

          {/* Checked */}
          {canEditCheck && (
            <td className="border px-3 py-2 text-center">
              <input
                type="checkbox"
                checked={getRowValues(entry).checked}
                onChange={(e) =>
                  handleVerifiedChange(
                    entry,
                    e.target.checked
                  )
                }
                className="w-5 h-5 cursor-pointer accent-green-600"
              />
            </td>
          )}

          {/* ID */}
          <td className="border px-3 py-2 text-center">
            {entry.stockBoxDataId}
          </td>

          {/* Pieces */}
          <td className="border px-3 py-2 text-center">
            {entry.pieces}
          </td>

          {/* Method */}
          <td
            className={`border px-3 py-2 font-semibold text-center ${
              entry.methodType === "ADDED"
                ? "text-green-600"
                : entry.methodType === "SELL"
                  ? "text-red-600"
                  : "text-gray-800"
            }`}
          >
            {entry.methodType}
          </td>

          {/* Metal Weight */}
          <td className="border px-3 py-2 text-center">
            {Number(entry.metalWeight || 0).toFixed(3)}
          </td>

          {/* Date */}
          <td className="border px-3 py-2 text-center">
            {formatDMY(entry.date)}
          </td>

          {/* Barcode */}
          <td className="border px-3 py-2">
            {entry.barcodeValue}
          </td>

          {/* Method2 */}
          <td
            className={`border px-3 py-2 font-semibold text-center ${
              entry.methodType2 === "SELL"
                ? "text-red-600"
                : "text-gray-800"
            }`}
          >
            {entry.methodType2}
          </td>

          {/* Selling Date */}
          <td className="border px-3 py-2 text-center">
            {formatDMY(entry.sellingDate)}
          </td>

          {/* EPC */}
          <td className="border px-3 py-2">
            {entry.epcNumber}
          </td>

         {canEditCheck && (
  <>
    {/* Description */}
    <td className="border px-3 py-2">
      <input
        type="text"
        value={getRowValues(entry).description}
        onChange={(e) =>
          handleDescriptionChange(
            entry,
            e.target.value
          )
        }
        placeholder="Enter description"
        className="w-full min-w-[160px] border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
      />
    </td>

    {/* Action */}
    <td className="border px-3 py-2 text-center">
      <button
        type="button"
        onClick={() => handleSaveCheck(entry)}
        disabled={
          savingId === entry.stockBoxDataId
        }
        className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
      >
        {savingId === entry.stockBoxDataId
          ? "Saving..."
          : "Save"}
      </button>
    </td>
  </>
)}

{/* ADMIN ONLY - Select for Delete */}
{isAdmin && (
  <td className="border px-3 py-2 text-center">
    <input
      type="checkbox"
      checked={selectedIds.includes(
        entry.stockBoxDataId
      )}
      onChange={() =>
        handleCheckOne(entry.stockBoxDataId)
      }
      className="w-4 h-4 cursor-pointer"
    />
  </td>
)}

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
