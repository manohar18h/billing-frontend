// src/pages/admin/WorkerDetails.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWorkers } from "@/contexts/WorkersContext";
import { TextField, Button, Box, Typography,  Dialog, DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import api from "@/services/api";


/** String-only normalizer: returns YYYY-MM-DD with NO timezone shifts */
function normalizeYMD(raw: unknown): string | null {
  if (raw == null) return null;

  if (typeof raw === "string") {
    const s = raw.trim();

    // 1) YYYY-MM-DD or starts with it (YYYY-MM-DDTHH..., YYYY-MM-DD HH...)
    const m1 = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m1) return `${m1[1]}-${m1[2]}-${m1[3]}`;

    // 2) MM/DD/YYYY (optionally with ", time")
    const first = s.split(",")[0]?.trim();
    const parts = first?.split("/");
    if (parts && parts.length === 3) {
      const mm = String(Number(parts[0])).padStart(2, "0");
      const dd = String(Number(parts[1])).padStart(2, "0");
      const yy = String(Number(parts[2]));
      if (
        !Number.isNaN(Number(mm)) &&
        !Number.isNaN(Number(dd)) &&
        yy.length === 4
      ) {
        return `${yy}-${mm}-${dd}`;
      }
    }
  }

  // 3) Last resort: Date parsing (we still only take y/m/d)
  const d = new Date(raw as any);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  return null;
}

/** Display as MM/DD/YYYY using the SAME normalized base */
function displayFromRaw(raw: unknown): string {
  const ymd = normalizeYMD(raw);
  if (!ymd) return "-";
  const [y, m, d] = ymd.split("-");
  return `${d}/${Number(m)}/${y}`;
}

/** Generic inRange (keeps your prior exact-match behavior for single date) */
function inRangeExact(
  rawDate: unknown,
  fromDate: string,
  toDate: string,
): boolean {
  const day = normalizeYMD(rawDate);
  if (!day) return false;
  const f = fromDate.trim();
  const t = toDate.trim();

  if (!f && !t) return true;
  if (f && t) return day >= f && day <= t;
  if (f && !t) return day === f; // exact single-day
  if (!f && t) return day === t; // exact single-day
  return true;
}

const WorkerDetails: React.FC = () => {
  const { workerId } = useParams<{ workerId: string }>();
  const navigate = useNavigate();
  const { workers, refresh } = useWorkers();

  useEffect(() => {
    refresh(); // pulls newest list on mount
  }, [refresh]);

const worker = workers.find(
      (w) => w.workerId === Number(workerId),
  );

  // Date filter state (YYYY-MM-DD)
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const [showWorkerStock, setShowWorkerStock] = useState(false);
  const [showLotWorks, setShowLotWorks] = useState(false);
  const [showSpclWork, setShowSpclWork] = useState(false);
  const [showRepairs, setShowRepairs] = useState(false);
  const [showPays, setShowPays] = useState(false);

  const [openStockEdit, setOpenStockEdit] = useState(false);
const [selectedStock, setSelectedStock] = useState<any>(null);
const [editStockMetal, setEditStockMetal] = useState("");
const [editStockWeight, setEditStockWeight] = useState("");
  const [showTxs, setShowTxs] = useState(false);

  const [openLotEdit, setOpenLotEdit] = useState(false);
const [selectedLot, setSelectedLot] = useState<any>(null);

const [editLotMetal, setEditLotMetal] = useState("");
const [editLotItemName, setEditLotItemName] = useState("");
const [editLotWeight, setEditLotWeight] = useState("");
const [editLotPieces, setEditLotPieces] = useState("");
const [editLotWastage, setEditLotWastage] = useState("");
const [editLotAmount, setEditLotAmount] = useState("");

const [openRepairEdit, setOpenRepairEdit] = useState(false);
const [selectedRepair, setSelectedRepair] = useState<any>(null);

const [editRepairMetal, setEditRepairMetal] = useState("");
const [editRepairItemName, setEditRepairItemName] = useState("");
const [editRepairWeight, setEditRepairWeight] = useState("");
const [editCustomerPay, setEditCustomerPay] = useState("");
const [editWorkerPay, setEditWorkerPay] = useState("");


const [openPayEdit, setOpenPayEdit] = useState(false);
const [selectedPay, setSelectedPay] = useState<any>(null);

const [editWorkPay, setEditWorkPay] = useState("");
const [editPayWastage, setEditPayWastage] = useState("");

const [openTxEdit, setOpenTxEdit] = useState(false);
const [selectedTx, setSelectedTx] = useState<any>(null);

const [editTxMethodType, setEditTxMethodType] = useState("");
const [editTxPaid, setEditTxPaid] = useState("");
const [editTxReason, setEditTxReason] = useState("");



  const role = localStorage.getItem("role");
const isAdmin = role === "ADMIN";

  // Filtered views
  const filteredStocks = useMemo(
    () =>
      fromDate || toDate
        ? (worker?.workerStocks ?? []).filter((s) =>
            inRangeExact(s.todaysDate as any, fromDate, toDate),
          )
        : (worker?.workerStocks ?? []),
    [worker?.workerStocks, fromDate, toDate],
  );

  const filteredLots = useMemo(
    () =>
      fromDate || toDate
        ? (worker?.lotWorks ?? []).filter((l) =>
            inRangeExact(l.deliveryDate as any, fromDate, toDate),
          )
        : (worker?.lotWorks ?? []),
    [worker?.lotWorks, fromDate, toDate],
  );

  const filteredSpcl = useMemo(
    () =>
      fromDate || toDate
        ? (worker?.speclWorks ?? []).filter((l) =>
            inRangeExact(l.deliveryDate as any, fromDate, toDate),
          )
        : (worker?.speclWorks ?? []),
    [worker?.speclWorks, fromDate, toDate],
  );

  const filteredRepairs = useMemo(
    () =>
      fromDate || toDate
        ? (worker?.repairWorks ?? []).filter((r) =>
            inRangeExact(r.deliveryDate as any, fromDate, toDate),
          )
        : (worker?.repairWorks ?? []),
    [worker?.repairWorks, fromDate, toDate],
  );

  const filteredPays = useMemo(
    () =>
      fromDate || toDate
        ? (worker?.workerPays ?? []).filter((p) =>
            inRangeExact(p.date as any, fromDate, toDate),
          )
        : (worker?.workerPays ?? []),
    [worker?.workerPays, fromDate, toDate],
  );

  const filteredTxs = useMemo(
    () =>
      fromDate || toDate
        ? (worker?.workerTransactionHistories ?? []).filter((t) =>
            inRangeExact(t.paymentDate as any, fromDate, toDate),
          )
        : (worker?.workerTransactionHistories ?? []),
    [worker?.workerTransactionHistories, fromDate, toDate],
  );

  if (!worker)
    return (
      <div className="p-10 text-center text-xl">
        Worker not found. <button onClick={() => navigate(-1)}>Go back</button>
      </div>
    );

  const line = (label: string, value: string | number | null | undefined) => (
    <div className="flex justify-between border-b py-1 text-sm">
      <span className="font-medium text-gray-600">{label}:</span>
      <span className="text-gray-800">{value ?? "-"}</span>
    </div>
  );

  const clearDates = () => {
    setFromDate("");
    setToDate("");
  };

  // State to control expand/collapse

  // Only show 4 rows initially
  const visibleWorkerStockResult = showWorkerStock
    ? filteredStocks
    : filteredStocks.slice(0, 4);

  // Decide how many lots to show
  const visibleLotWorks = showLotWorks
    ? filteredLots
    : filteredLots.slice(0, 4);

  const visibleSpclWork = showSpclWork
    ? filteredSpcl
    : filteredSpcl.slice(0, 4);

  // Decide how many repairs to show
  const visibleRepairs = showRepairs
    ? filteredRepairs
    : filteredRepairs.slice(0, 4);

  // Decide how many payments to show
  const visiblePays = showPays ? filteredPays : filteredPays.slice(0, 4);

  // Decide how many transactions to show
  const visibleTxs = showTxs ? filteredTxs : filteredTxs.slice(0, 4);


  const updateApi = async (url: string, body: any) => {
  try {
    await api.put(url, body, {
      headers: authHeaders,
    });

    alert("Updated Successfully");
    refresh();
  } catch (error) {
    console.error(error);
    alert("Update Failed");
  }
};

const handleEditWorkerStock = (s: any) => {
  setSelectedStock(s);
  setEditStockMetal(s.metal || "");
  setEditStockWeight(String(s.metalWeight || ""));
  setOpenStockEdit(true);
};
const handleSaveWorkerStock = async () => {
  if (!selectedStock) return;


  console.log("workerId : ",   workerId);
  console.log("stockId : ",   selectedStock.stockId);


  const ok = window.confirm(
    `Are you sure want to update Worker Stock?\n\n` +
    `Old Metal: ${selectedStock.metal}\n` +
    `Old Weight: ${selectedStock.metalWeight} g\n\n` +
    `New Metal: ${editStockMetal}\n` +
    `New Weight: ${editStockWeight} g`
  );

  if (!ok) return;

  try {
    await api.put(
      `/admin/worker-stock/update/${selectedStock.stockId}`,
      {
        metal: editStockMetal,
        metalWeight: Number(editStockWeight),
           },
      {
        headers: authHeaders,
      }
    );

    alert("Worker Stock Updated Successfully");
    setOpenStockEdit(false);
    setSelectedStock(null);
    refresh();
 } catch (error: any) {
  console.error(error);

  alert(
    error?.response?.data?.message ||
    error?.response?.data ||
    error?.message ||
    "Update Failed"
  );
}
};

const handleEditLotWork = (l: any) => {

  setSelectedLot(l);

  setEditLotMetal(l.metal || "");
  setEditLotItemName(l.itemName || "");
  setEditLotWeight(String(l.itemWeight || ""));
  setEditLotPieces(String(l.pieces || ""));
  setEditLotWastage(String(l.wastage || ""));
  setEditLotAmount(String(l.amount || ""));

  setOpenLotEdit(true);
};

const handleSaveLotWork = async () => {

  if (!selectedLot) return;

const ok = window.confirm(
  `Are you sure want to update Lot Work?\n\n` +

  `Item: ${selectedLot.itemName}\n` +

  `Old Metal: ${selectedLot.metal}\n` +
  `Old Weight: ${selectedLot.itemWeight} g\n` +
  `Old Pieces: ${selectedLot.pieces}\n` +
  `Old Wastage: ${selectedLot.wastage}\n` +
  `Old Amount: ₹${selectedLot.amount}\n\n` +

  `New Metal: ${editLotMetal}\n` +
  `New Weight: ${editLotWeight} g\n` +
  `New Pieces: ${editLotPieces}\n` +
  `New Wastage: ${editLotWastage}\n` +
  `New Amount: ₹${editLotAmount}`
);

  if (!ok) return;

  try {

    await api.put(
      `/admin/lot-work/update/${selectedLot.lotId}`,
      {
        metal: editLotMetal,
        itemName: editLotItemName,
        itemWeight: Number(editLotWeight),
        pieces: Number(editLotPieces),
        wastage: Number(editLotWastage),
        amount: Number(editLotAmount),
      },
      {
        headers: authHeaders,
      }
    );

    alert("Lot Work Updated Successfully");

    setOpenLotEdit(false);
    setSelectedLot(null);

    refresh();

  } catch (error: any) {

    console.error(error);

    alert(
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "Update Failed"
    );
  }
};

const handleEditRepairWork = (r: any) => {

  setSelectedRepair(r);

  setEditRepairMetal(r.metal || "");
  setEditRepairItemName(r.itemName || "");
  setEditRepairWeight(String(r.metalWeight || ""));
  setEditCustomerPay(String(r.customerPay || ""));
  setEditWorkerPay(String(r.workerPay || ""));

  setOpenRepairEdit(true);
};

const handleSaveRepairWork = async () => {

  if (!selectedRepair) return;

const ok = window.confirm(
  `Are you sure want to update Repair Work?\n\n` +
  `Item: ${selectedRepair.itemName}\n` +
  `Old Metal: ${selectedRepair.metal}\n` +
  `Old Weight: ${selectedRepair.metalWeight} g\n` +
  `Old Customer Pay: ₹${selectedRepair.customerPay}\n` +
  `Old Worker Pay: ₹${selectedRepair.workerPay}\n\n` +
  `New Metal: ${editRepairMetal}\n` +
  `New Weight: ${editRepairWeight} g\n` +
  `New Customer Pay: ₹${editCustomerPay}\n` +
  `New Worker Pay: ₹${editWorkerPay}`
);

  if (!ok) return;

  try {

    await api.put(
      `/admin/repair-work/update/${selectedRepair.repairWorkId}`,
      {
        metal: editRepairMetal,
        itemName: editRepairItemName,
        metalWeight: Number(editRepairWeight),
        customerPay: Number(editCustomerPay),
        workerPay: Number(editWorkerPay),
      },
      {
        headers: authHeaders,
      }
    );

    alert("Repair Work Updated Successfully");

    setOpenRepairEdit(false);
    setSelectedRepair(null);

    refresh();

  } catch (error: any) {

    console.error(error);

    alert(
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "Update Failed"
    );
  }
};

const handleEditWorkerPay = (p: any) => {
  setSelectedPay(p);

  setEditWorkPay(String(p.workPay || ""));
  setEditPayWastage(String(p.wastage || ""));

  setOpenPayEdit(true);
};

const handleSaveWorkerPay = async () => {
  if (!selectedPay) return;

  const ok = window.confirm(
    `Are you sure want to update Work Payment?\n\n` +
    `Order ID: ${selectedPay.orderId}\n` +
    `Old Pay: ₹${selectedPay.workPay}\n` +
    `Old Wastage: ${selectedPay.wastage}\n\n` +
    `New Pay: ₹${editWorkPay}\n` +
    `New Wastage: ${editPayWastage}`
  );

  if (!ok) return;

  try {
    await api.put(
      `/admin/worker-pay/update/${selectedPay.wpid}`,
      {
        workPay: Number(editWorkPay),
        wastage: Number(editPayWastage),
      },
      {
        headers: authHeaders,
      }
    );

    alert("Work Payment Updated Successfully");

    setOpenPayEdit(false);
    setSelectedPay(null);

    refresh();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "Update Failed"
    );
  }
};

const handleEditTransaction = (t: any) => {
  setSelectedTx(t);

  setEditTxMethodType(t.methodType || "");
  setEditTxPaid(String(t.paid || ""));
  setEditTxReason(t.reason || "");

  setOpenTxEdit(true);
};

const handleSaveTransaction = async () => {
  if (!selectedTx) return;

  const ok = window.confirm(
    `Are you sure want to update Transaction?\n\n` +
    `Old Type: ${selectedTx.methodType}\n` +
    `Old Paid: ₹${selectedTx.paid}\n` +
    `Old Reason: ${selectedTx.reason}\n\n` +
    `New Type: ${editTxMethodType}\n` +
    `New Paid: ₹${editTxPaid}\n` +
    `New Reason: ${editTxReason}`
  );

  if (!ok) return;

  try {
    await api.put(
      `/admin/worker-transaction/update/${selectedTx.wtid}`,
      {
        methodType: editTxMethodType,
        paid: Number(editTxPaid),
        reason: editTxReason,
      },
      {
        headers: authHeaders,
      }
    );

    alert("Transaction Updated Successfully");

    setOpenTxEdit(false);
    setSelectedTx(null);

    refresh();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "Update Failed"
    );
  }
};




const authHeaders = {
  Authorization: `Bearer ${localStorage.getItem("token")}`,
};

const deleteApi = async (url: string, message: string) => {
  const ok = window.confirm(message);
  if (!ok) return;

  try {
    await api.delete(url, {
      headers: authHeaders,
    });

    alert("Deleted Successfully");
    refresh();
  } catch (error) {
    console.error(error);
    alert("Delete Failed");
  }
};

const handleDeleteWorkerStock = (s: any) => {
  deleteApi(
    `/admin/worker-stock/delete/${s.stockId}`,
    `Delete Worker Stock?\n\nMetal: ${s.metal}\nWeight: ${s.metalWeight} g`
  );
};

const handleDeleteLotWork = (l: any) => {
  deleteApi(
    `/admin/lot-work/delete/${l.lotId}`,
    `Delete Lot Work?\n\nItem: ${l.itemName}\nMetal: ${l.metal}\nWeight: ${l.itemWeight} g`
  );
};

const handleDeleteRepairWork = (r: any) => {
  deleteApi(
    `/admin/repair-work/delete/${r.repairWorkId}`,
    `Delete Repair Work?\n\nItem: ${r.itemName}\nMetal: ${r.metal}\nWeight: ${r.metalWeight} g`
  );
};

const handleDeleteWorkerPay = (p: any) => {
  deleteApi(
    `/admin/worker-pay/delete/${p.wpid}`,
    `Delete Work Payment?\n\nOrder ID: ${p.orderId}\nPay: ₹${p.workPay}\nWastage: ${p.wastage}`
  );
};

const handleDeleteTransaction = (t: any) => {
  deleteApi(
    `/admin/worker-transaction/delete/${t.wtid}`,
    `Delete Transaction?\n\nAmount: ₹${t.paid}\nReason: ${t.reason}`
  );
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

        <h1 className="text-2xl font-bold text-purple-700 dark:text-purple-300 mb-6">
          Worker Details #{worker.workerId}
        </h1>

        <div className="mb-20 flex justify-center">
          <div
            className="w-full max-w-3xl rounded-2xl shadow-xl p-6"
            style={{
              background: "linear-gradient(135deg, #0f172a, #334155)", // dark gradient
              color: "#fff",
            }}
          >
            {/* Title */}
            <h2 className="text-2xl font-bold text-center mb-6 text-amber-300">
              Worker Basic Information
            </h2>

            {/* Grid */}
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-3 pr-4 border-r border-white/20">
                {[
                  ["Full Name", worker.fullName, "text-amber-200"],
                  ["Phone", worker.phnNumber, "text-teal-300"],
                  ["Village", worker.village, "text-green-300"],
                  ["Username", worker.userName, "text-purple-300"],
                  [
                    "Earned Amount",
                    `₹${worker.earnedAmount}`,
                    "text-emerald-400 font-bold",
                  ],
                  [
                    "Received Amount",
                    `₹${worker.receivedAmount}`,
                    "text-emerald-300 font-bold",
                  ],
                  [
                    "Pending Amount",
                    `₹${worker.pendingAmount}`,
                    "text-red-400 font-bold",
                  ],
                ].map(([label, value, color], i) => (
                  <p key={i} className="flex justify-between">
                    <span className="text-gray-300 font-medium">{label}:</span>
                    <span className={`${color}`}>{value}</span>
                  </p>
                ))}
              </div>

              {/* Right Column */}
              <div className="space-y-3 pl-4">
                {[
                  [
                    "Earned Wastage",
                    `${worker.earnedWastage}`,
                    "text-pink-300 font-semibold",
                  ],

                  [
                    "Received Wastage",
                    `${worker.receivedWastage}`,
                    "text-emerald-300 font-bold",
                  ],
                  [
                    "Pending Wastage",
                    `${worker.pendingWastage}`,
                    "text-red-400 font-bold",
                  ],
                  [
                    "24 Gold Stock",
                    `${worker.total24GoldStock} g`,
                    "text-yellow-300 font-bold",
                  ],
                  [
                    "999 Silver Stock",
                    `${worker.total999SilverStock} g`,
                    "text-slate-200 font-bold",
                  ],
                  [
                    "22 Gold Stock",
                    `${worker.total22GoldStock} g`,
                    "text-yellow-300 font-bold",
                  ],
                  [
                    "995 Silver Stock",
                    `${worker.total995SilverStock} g`,
                    "text-slate-200 font-bold",
                  ],
                ].map(([label, value, color], i) => (
                  <p key={i} className="flex justify-between">
                    <span className="text-gray-300 font-medium">{label}:</span>
                    <span className={`${color}`}>{value}</span>
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Date Filters (above sections) */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
            mt: 1,
            mb: 3,
          }}
        >
          <TextField
            label="From"
            type="date"
            size="small"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 180, "& .MuiOutlinedInput-input": { py: 0.75 } }}
          />
          <TextField
            label="To"
            type="date"
            size="small"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 180, "& .MuiOutlinedInput-input": { py: 0.75 } }}
          />
          <Button
            variant="outlined"
            size="small"
            onClick={clearDates}
            sx={{ whiteSpace: "nowrap" }}
          >
            CLEAR
          </Button>
        </Box>

        {/* Worker Stocks */}
        {filteredStocks?.length > 0 && (
          <>
            <h2 className="text-xl font-semibold text-purple-600 dark:text-purple-300 mb-2">
              Worker Stocks
            </h2>

            {visibleWorkerStockResult.map((s) => (
              <div
                key={s.stockId}
                className="mb-4 rounded-lg border-2 border-gray-400 p-3 grid grid-cols-2 gap-4 divide-x divide-gray-300 dark:divide-gray-600"
              >
                <div className="pr-4">
                  {line("Metal", s.metal)}
                  {line("Weight", `${s.metalWeight} g`)}
                </div>
                <div className="pl-4">
                  {line("Date", displayFromRaw(s.todaysDate))}
                  {line("Stock ID", s.stockId)}
                </div>
                {isAdmin && (
  <div className="col-span-2 flex justify-end gap-2 pt-2 border-t border-gray-300 dark:border-gray-600">

    <IconButton
      color="warning"
      onClick={() => handleEditWorkerStock(s)}
    >
      <EditIcon />
    </IconButton>

    <IconButton
      color="error"
      onClick={() => handleDeleteWorkerStock(s)}
    >
      <DeleteIcon />
    </IconButton>

  </div>
  
)}
              </div>
            ))}

            <Dialog
  open={openStockEdit}
  onClose={() => setOpenStockEdit(false)}
  maxWidth="sm"
  fullWidth
>
  <DialogTitle>Edit Worker Stock</DialogTitle>

  <DialogContent>
    <TextField
      select
      margin="dense"
      label="Metal"
      fullWidth
      value={editStockMetal}
      onChange={(e) => setEditStockMetal(e.target.value)}
    >
      <MenuItem value="24 Gold">24 Gold</MenuItem>
      <MenuItem value="999 Silver">999 Silver</MenuItem>
      <MenuItem value="22 Gold">22 Gold</MenuItem>
      <MenuItem value="995 Silver">995 Silver</MenuItem>
    </TextField>

    <TextField
      margin="dense"
      label="Metal Weight"
      type="number"
      fullWidth
      value={editStockWeight}
      onChange={(e) => setEditStockWeight(e.target.value)}
    />
  </DialogContent>

  <DialogActions>
    <Button onClick={() => setOpenStockEdit(false)}>
      Cancel
    </Button>

    <Button variant="contained" onClick={handleSaveWorkerStock}>
      Save
    </Button>
  </DialogActions>
</Dialog>
            
            

            {/* Toggle Button */}
            {filteredStocks.length > 4 && (
              <Typography
                onClick={() => setShowWorkerStock((prev) => !prev)}
                sx={{
                  cursor: "pointer",
                  textAlign: "center",
                  mt: 2,
                  color: "#8847FF",
                  fontWeight: 600,
                  textDecoration: "underline",
                  "&:hover": { color: "#6b21a8" },
                }}
              >
                {showWorkerStock ? "View Less" : "View More"}
              </Typography>
            )}
          </>
        )}

        {filteredLots?.length > 0 && (
          <>
            <h2 className="text-xl font-semibold text-purple-600 dark:text-purple-300 mb-2">
              Lot Works
            </h2>

            {visibleLotWorks.map((l) => (
              <div
                key={l.lotId}
                className="mb-4 rounded-lg border-2 border-gray-400 p-3 grid grid-cols-2 gap-4 divide-x divide-gray-300 dark:divide-gray-600"
              >
                <div className="pr-4">
                  {line("Metal", l.metal)}
                  {line("Item", l.itemName)}
                  {line("Weight", `${l.itemWeight} g`)}
                  {line("Pieces", l.pieces)}
                </div>
                <div className="pl-4">
                  {line("Date", displayFromRaw(l.deliveryDate))}
                  {line("Wastage", `${l.wastage} %`)}
                  {line("Amount", `₹${l.amount}`)}
                  {line("Lot ID", l.lotId)}
                </div>
                {isAdmin && (
  <div className="col-span-2 flex justify-end gap-2 pt-2 border-t border-gray-300 dark:border-gray-600">

    <IconButton
      color="warning"
      onClick={() => handleEditLotWork(l)}
    >
      <EditIcon />
    </IconButton>

    <IconButton
      color="error"
      onClick={() => handleDeleteLotWork(l)}
    >
      <DeleteIcon />
    </IconButton>

  </div>
)}
              </div>
            ))}

            <Dialog
  open={openLotEdit}
  onClose={() => setOpenLotEdit(false)}
  maxWidth="sm"
  fullWidth
>
  <DialogTitle>Edit Lot Work</DialogTitle>

  <DialogContent>

    <TextField
      select
      margin="dense"
      label="Metal"
      fullWidth
      value={editLotMetal}
      onChange={(e) => setEditLotMetal(e.target.value)}
    >
      <MenuItem value="24 Gold">24 Gold</MenuItem>
      <MenuItem value="999 Silver">999 Silver</MenuItem>
      <MenuItem value="22 Gold">22 Gold</MenuItem>
      <MenuItem value="995 Silver">995 Silver</MenuItem>
    </TextField>

    <TextField
      margin="dense"
      label="Item Name"
      fullWidth
      value={editLotItemName}
      onChange={(e) => setEditLotItemName(e.target.value)}
    />

    <TextField
      margin="dense"
      label="Weight"
      type="number"
      fullWidth
      value={editLotWeight}
      onChange={(e) => setEditLotWeight(e.target.value)}
    />

    <TextField
      margin="dense"
      label="Pieces"
      type="number"
      fullWidth
      value={editLotPieces}
      onChange={(e) => setEditLotPieces(e.target.value)}
    />

    <TextField
      margin="dense"
      label="Wastage"
      type="number"
      fullWidth
      value={editLotWastage}
      onChange={(e) => setEditLotWastage(e.target.value)}
    />

    <TextField
      margin="dense"
      label="Amount"
      type="number"
      fullWidth
      value={editLotAmount}
      onChange={(e) => setEditLotAmount(e.target.value)}
    />

  </DialogContent>

  <DialogActions>

    <Button onClick={() => setOpenLotEdit(false)}>
      Cancel
    </Button>

    <Button
      variant="contained"
      onClick={handleSaveLotWork}
    >
      Save
    </Button>

  </DialogActions>
</Dialog>

            {/* Toggle Button */}
            {filteredLots.length > 4 && (
              <Typography
                onClick={() => setShowLotWorks((prev) => !prev)}
                sx={{
                  cursor: "pointer",
                  textAlign: "center",
                  mt: 2,
                  color: "#8847FF",
                  fontWeight: 600,
                  textDecoration: "underline",
                  "&:hover": { color: "#6b21a8" },
                }}
              >
                {showLotWorks ? "View Less" : "View More"}
              </Typography>
            )}
          </>
        )}

        {filteredSpcl?.length > 0 && (
          <>
            <h2 className="text-xl font-semibold text-purple-600 dark:text-purple-300 mb-2">
              Spcl Works
            </h2>

            {visibleSpclWork.map((s, i) => (
              <div
                key={i}
                className="mb-4 rounded-lg border-2 border-gray-400 p-3 grid grid-cols-2 gap-4 divide-x divide-gray-300 dark:divide-gray-600"
              >
                <div className="pr-4">
                  {line("Metal", s.metal)}
                  {line("Item", s.itemName)}
                  {line("Weight", `${s.workerMetalWeight} g`)}
                  {line("Other Metal", s.otherMetalName)}
                  {line("Other Weight", `${s.otherWeight} g`)}
                </div>
                <div className="pl-4">
                  {line("Amount", `₹${s.amount}`)}
                  {line("Wastage", s.wastage)}
                  {line("Date", displayFromRaw(s.deliveryDate))}
                  {line("Item Link Code", s.itemLinkCode)}
                </div>
              </div>
            ))}

            {/* Toggle Button */}
            {filteredSpcl.length > 4 && (
              <Typography
                onClick={() => setShowSpclWork((prev) => !prev)}
                sx={{
                  cursor: "pointer",
                  textAlign: "center",
                  mt: 2,
                  color: "#8847FF",
                  fontWeight: 600,
                  textDecoration: "underline",
                  "&:hover": { color: "#6b21a8" },
                }}
              >
                {showSpclWork ? "View Less" : "View More"}
              </Typography>
            )}
          </>
        )}

        {/* Repair Works */}
        {filteredRepairs?.length > 0 && (
          <>
            <h2 className="text-xl font-semibold text-purple-600 dark:text-purple-300 mb-2">
              Repair Works
            </h2>

            {visibleRepairs.map((r, i) => (
              <div
                key={i}
                className="mb-4 rounded-lg border-2 border-gray-400 p-3 grid grid-cols-2 gap-4 divide-x divide-gray-300 dark:divide-gray-600"
              >
                <div className="pr-4">
                  {line("Metal", r.metal)}
                  {line("Item", r.itemName)}
                  {line("Weight", `${r.metalWeight} g`)}
                </div>
                <div className="pl-4">
                  {line("Customer Pay", `₹${r.customerPay}`)}
                  {line("Worker Pay", `₹${r.workerPay}`)}
                  {line("Date", displayFromRaw(r.deliveryDate))}
                </div>
                {isAdmin && (
  <div className="col-span-2 flex justify-end gap-2 pt-2 border-t border-gray-300 dark:border-gray-600">

    <IconButton
      color="warning"
      onClick={() => handleEditRepairWork(r)}
    >
      <EditIcon />
    </IconButton>

    <IconButton
      color="error"
      onClick={() => handleDeleteRepairWork(r)}
    >
      <DeleteIcon />
    </IconButton>

  </div>
)}
              </div>
            ))}

            <Dialog
  open={openRepairEdit}
  onClose={() => setOpenRepairEdit(false)}
  maxWidth="sm"
  fullWidth
>
  <DialogTitle>Edit Repair Work</DialogTitle>

  <DialogContent>

    <TextField
      select
      margin="dense"
      label="Metal"
      fullWidth
      value={editRepairMetal}
      onChange={(e) => setEditRepairMetal(e.target.value)}
    >
      <MenuItem value="24 Gold">24 Gold</MenuItem>
      <MenuItem value="999 Silver">999 Silver</MenuItem>
      <MenuItem value="22 Gold">22 Gold</MenuItem>
      <MenuItem value="995 Silver">995 Silver</MenuItem>
    </TextField>

    <TextField
      margin="dense"
      label="Item Name"
      fullWidth
      value={editRepairItemName}
      onChange={(e) => setEditRepairItemName(e.target.value)}
    />

    <TextField
      margin="dense"
      label="Metal Weight"
      type="number"
      fullWidth
      value={editRepairWeight}
      onChange={(e) => setEditRepairWeight(e.target.value)}
    />

    <TextField
      margin="dense"
      label="Customer Pay"
      type="number"
      fullWidth
      value={editCustomerPay}
      onChange={(e) => setEditCustomerPay(e.target.value)}
    />

    <TextField
      margin="dense"
      label="Worker Pay"
      type="number"
      fullWidth
      value={editWorkerPay}
      onChange={(e) => setEditWorkerPay(e.target.value)}
    />

  </DialogContent>

  <DialogActions>

    <Button onClick={() => setOpenRepairEdit(false)}>
      Cancel
    </Button>

    <Button
      variant="contained"
      onClick={handleSaveRepairWork}
    >
      Save
    </Button>

  </DialogActions>
</Dialog>

            {/* Toggle Button */}
            {filteredRepairs.length > 4 && (
              <Typography
                onClick={() => setShowRepairs((prev) => !prev)}
                sx={{
                  cursor: "pointer",
                  textAlign: "center",
                  mt: 2,
                  color: "#8847FF",
                  fontWeight: 600,
                  textDecoration: "underline",
                  "&:hover": { color: "#6b21a8" },
                }}
              >
                {showRepairs ? "View Less" : "View More"}
              </Typography>
            )}
          </>
        )}

        {/* Work Payments */}
        {filteredPays?.length > 0 && (
          <>
            <h2 className="text-xl font-semibold text-purple-600 dark:text-purple-300 mb-2">
              Work Payments
            </h2>

            {visiblePays.map((p) => (
              <div
                key={p.wpid}
                className="mb-4 rounded-lg border-2 border-gray-400 p-3 grid grid-cols-2 gap-4 divide-x divide-gray-300 dark:divide-gray-600"
              >
                <div className="pr-4">
                  {line("Order ID", p.orderId)}
                  {line("Metal", p.metal)}
                  {line("Weight", `${p.metal_weight} g`)}
                </div>
                <div className="pl-4">
                  {line("Date", displayFromRaw(p.date))}
                  {line("Pay", `₹${p.workPay}`)}
                  {line("Wastage", p.wastage)}
                </div>
                {isAdmin && (
  <div className="col-span-2 flex justify-end gap-2 pt-2 border-t border-gray-300 dark:border-gray-600">

    <IconButton
      color="warning"
      onClick={() => handleEditWorkerPay(p)}
    >
      <EditIcon />
    </IconButton>

    <IconButton
      color="error"
      onClick={() => handleDeleteWorkerPay(p)}
    >
      <DeleteIcon />
    </IconButton>

  </div>
)}
              </div>
            ))}

            <Dialog
  open={openPayEdit}
  onClose={() => setOpenPayEdit(false)}
  maxWidth="sm"
  fullWidth
>
  <DialogTitle>Edit Work Payment</DialogTitle>

  <DialogContent>
    <TextField
      margin="dense"
      label="Work Pay"
      type="number"
      fullWidth
      value={editWorkPay}
      onChange={(e) => setEditWorkPay(e.target.value)}
    />

    <TextField
      margin="dense"
      label="Wastage"
      type="number"
      fullWidth
      value={editPayWastage}
      onChange={(e) => setEditPayWastage(e.target.value)}
    />
  </DialogContent>

  <DialogActions>
    <Button onClick={() => setOpenPayEdit(false)}>
      Cancel
    </Button>

    <Button variant="contained" onClick={handleSaveWorkerPay}>
      Save
    </Button>
  </DialogActions>
</Dialog>

            {/* Toggle Button */}
            {filteredPays.length > 4 && (
              <Typography
                onClick={() => setShowPays((prev) => !prev)}
                sx={{
                  cursor: "pointer",
                  textAlign: "center",
                  mt: 2,
                  color: "#8847FF",
                  fontWeight: 600,
                  textDecoration: "underline",
                  "&:hover": { color: "#6b21a8" },
                }}
              >
                {showPays ? "View Less" : "View More"}
              </Typography>
            )}
          </>
        )}

        {/* Transactions */}
        {filteredTxs?.length > 0 && (
          <>
            <h2 className="text-xl font-semibold text-purple-600 dark:text-purple-300 mb-2">
              Transactions
            </h2>

            <ul className="mb-8 pl-5 list-disc">
              {visibleTxs.map((t) => (
           <li
  key={t.wtid}
  className="mb-3 rounded-lg border-2 border-gray-300 dark:border-gray-700 p-3 flex justify-between items-center"
>
  <div className="text-[18px] text-gray-800 dark:text-gray-200">
    ₹{t.paid} on {displayFromRaw(t.paymentDate)}, {t.reason ?? "-"}
  </div>

  {isAdmin && (
    <div className="flex items-center gap-2 border-l pl-4 border-gray-300 dark:border-gray-600">

      <IconButton
        color="warning"
        onClick={() => handleEditTransaction(t)}
      >
        <EditIcon />
      </IconButton>

      <IconButton
        color="error"
        onClick={() => handleDeleteTransaction(t)}
      >
        <DeleteIcon />
      </IconButton>

    </div>
  )}
</li>
                
              ))}
              
            </ul>

            <Dialog
  open={openTxEdit}
  onClose={() => setOpenTxEdit(false)}
  maxWidth="sm"
  fullWidth
>
  <DialogTitle>Edit Transaction</DialogTitle>

  <DialogContent>
    <TextField
      select
      margin="dense"
      label="Method Type"
      fullWidth
      value={editTxMethodType}
      onChange={(e) => setEditTxMethodType(e.target.value)}
    >
      <MenuItem value="Amount">Amount</MenuItem>
      <MenuItem value="Wastage">Wastage</MenuItem>
    </TextField>

    <TextField
      margin="dense"
      label="Paid"
      type="number"
      fullWidth
      value={editTxPaid}
      onChange={(e) => setEditTxPaid(e.target.value)}
    />

    <TextField
      margin="dense"
      label="Reason"
      fullWidth
      value={editTxReason}
      onChange={(e) => setEditTxReason(e.target.value)}
    />
  </DialogContent>

  <DialogActions>
    <Button onClick={() => setOpenTxEdit(false)}>
      Cancel
    </Button>

    <Button variant="contained" onClick={handleSaveTransaction}>
      Save
    </Button>
  </DialogActions>
</Dialog>
            {/* Toggle Button */}
            {filteredTxs.length > 4 && (
              <Typography
                onClick={() => setShowTxs((prev) => !prev)}
                sx={{
                  cursor: "pointer",
                  textAlign: "center",
                  mt: 2,
                  color: "#8847FF",
                  fontWeight: 600,
                  textDecoration: "underline",
                  "&:hover": { color: "#6b21a8" },
                }}
              >
                {showTxs ? "View Less" : "View More"}
              </Typography>
            )}
          </>
        )}

        {/* If filters selected but nothing matched */}
        {fromDate || toDate
          ? (filteredStocks?.length ?? 0) === 0 &&
            (filteredLots?.length ?? 0) === 0 &&
            (filteredSpcl?.length ?? 0) === 0 &&
            (filteredRepairs?.length ?? 0) === 0 &&
            (filteredPays?.length ?? 0) === 0 &&
            (filteredTxs?.length ?? 0) === 0 && (
              <p className="text-center text-sm text-gray-600">
                No records found for the selected date range.
              </p>
            )
          : null}
      </div>
    </div>
  );
};

export default WorkerDetails;
