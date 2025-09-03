// src/pages/admin/WorkerDetails.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWorkers } from "@/contexts/WorkersContext";
import { WorkerData } from "@/pages/admin/WorkerData";
import { TextField, Button, Box } from "@mui/material";

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
      if (!Number.isNaN(Number(mm)) && !Number.isNaN(Number(dd)) && yy.length === 4) {
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
  return `${m}/${d}/${y}`;
}

/** Generic inRange (keeps your prior exact-match behavior for single date) */
function inRangeExact(rawDate: unknown, fromDate: string, toDate: string): boolean {
  const day = normalizeYMD(rawDate);
  if (!day) return false;
  const f = fromDate.trim();
  const t = toDate.trim();

  if (!f && !t) return true;
  if (f && t)   return day >= f && day <= t;
  if (f && !t)  return day === f; // exact single-day
  if (!f && t)  return day === t; // exact single-day
  return true;
}

/** For Worker Stocks only: single “From” means ≥ From; single “To” means ≤ To */
function inRangeOpenStart(rawDate: unknown, fromDate: string, toDate: string): boolean {
  const day = normalizeYMD(rawDate);
  if (!day) return false;
  const f = fromDate.trim();
  const t = toDate.trim();

  if (!f && !t) return true;
  if (f && t)   return day >= f && day <= t;
  if (f && !t)  return day >= f;   // OPEN-ENDED START
  if (!f && t)  return day <= t;   // OPEN-ENDED END
  return true;
}

const WorkerDetails: React.FC = () => {
  const { workerId } = useParams<{ workerId: string }>();
  const navigate = useNavigate();
  const { workers, refresh } = useWorkers();

  useEffect(() => {
    refresh(); // pulls newest list on mount
  }, [refresh]);

  const worker: WorkerData | undefined = workers.find(
    (w) => w.workerId === Number(workerId)
  );

  // Date filter state (YYYY-MM-DD)
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

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

  // Filtered views
const filteredStocks = useMemo(
  () =>
    fromDate || toDate
      ? (worker.workerStocks ?? []).filter((s) =>
          inRangeExact(s.todaysDate as any, fromDate, toDate)
        )
      : worker.workerStocks ?? [],
  [worker.workerStocks, fromDate, toDate]
);

  const filteredLots = useMemo(
    () =>
      fromDate || toDate
        ? (worker.lotWorks ?? []).filter((l) =>
            inRangeExact(l.deliveryDate as any, fromDate, toDate)
          )
        : worker.lotWorks ?? [],
    [worker.lotWorks, fromDate, toDate]
  );

  const filteredRepairs = useMemo(
    () =>
      fromDate || toDate
        ? (worker.repairWorks ?? []).filter((r) =>
            inRangeExact(r.deliveryDate as any, fromDate, toDate)
          )
        : worker.repairWorks ?? [],
    [worker.repairWorks, fromDate, toDate]
  );

  const filteredPays = useMemo(
    () =>
      fromDate || toDate
        ? (worker.workerPays ?? []).filter((p) =>
            inRangeExact(p.date as any, fromDate, toDate)
          )
        : worker.workerPays ?? [],
    [worker.workerPays, fromDate, toDate]
  );

  const filteredTxs = useMemo(
    () =>
      fromDate || toDate
        ? (worker.workerTransactionHistories ?? []).filter((t) =>
            inRangeExact(t.paymentDate as any, fromDate, toDate)
          )
        : worker.workerTransactionHistories ?? [],
    [worker.workerTransactionHistories, fromDate, toDate]
  );

  const clearDates = () => {
    setFromDate("");
    setToDate("");
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

        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4 mb-4 border-2 border-gray-400 p-3 rounded-lg">
          <div className="pr-4 border-r border-gray-300 dark:border-gray-600">
            {line("Full Name", worker.fullName)}
            {line("Phone", worker.phnNumber)}
            {line("Village", worker.village)}
            {line("Username", worker.userName)}
            {line("Earned Amount", `₹${worker.earnedAmount}`)}
          </div>
          <div className="pl-4">
            {line("Earned Wastage", `${worker.earnedWastage}%`)}
            {line("Received Amount", `₹${worker.receivedAmount}`)}
            {line("Pending Amount", `₹${worker.pendingAmount}`)}
            {line("Gold Stock", `${worker.goldStock} g`)}
            {line("Silver Stock", `${worker.silverStock} g`)}
          </div>
        </div>

        {/* Worker Stocks */}
        {filteredStocks?.length > 0 && (
          <>
            <h2 className="text-xl font-semibold text-purple-600 dark:text-purple-300 mb-2">
              Worker Stocks
            </h2>
            {filteredStocks.map((s) => (
              <div
                key={s.wstockId}
                className="mb-4 rounded-lg border-2 border-gray-400 p-3 grid grid-cols-2 gap-4 divide-x divide-gray-300 dark:divide-gray-600"
              >
                <div className="pr-4">
                  {line("Metal", s.metal)}
                  {line("Weight", `${s.metalWeight} g`)}
                </div>
                <div className="pl-4">
                  {line("Date", displayFromRaw(s.todaysDate))}
                  {line("Stock ID", s.wstockId)}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Lot Works */}
        {filteredLots?.length > 0 && (
          <>
            <h2 className="text-xl font-semibold text-purple-600 dark:text-purple-300 mb-2">
              Lot Works
            </h2>
            {filteredLots.map((l) => (
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
              </div>
            ))}
          </>
        )}

        {/* Repair Works */}
        {filteredRepairs?.length > 0 && (
          <>
            <h2 className="text-xl font-semibold text-purple-600 dark:text-purple-300 mb-2">
              Repair Works
            </h2>
            {filteredRepairs.map((r, i) => (
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
              </div>
            ))}
          </>
        )}

        {/* Work Payments */}
        {filteredPays?.length > 0 && (
          <>
            <h2 className="text-xl font-semibold text-purple-600 dark:text-purple-300 mb-2">
              Work Payments
            </h2>
            {filteredPays.map((p) => (
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
                  {line("WP ID", p.wpid)}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Transactions */}
        {filteredTxs?.length > 0 && (
          <>
            <h2 className="text-xl font-semibold text-purple-600 dark:text-purple-300 mb-2">
              Transactions
            </h2>
            <ul className="mb-8 pl-5 list-disc">
              {filteredTxs.map((t) => (
                <li key={t.wtid}>
                  ₹{t.paidAmount} on {displayFromRaw(t.paymentDate)}
                </li>
              ))}
            </ul>
          </>
        )}

        {/* If filters selected but nothing matched */}
        {fromDate || toDate ? (
          (filteredStocks?.length ?? 0) === 0 &&
          (filteredLots?.length ?? 0) === 0 &&
          (filteredRepairs?.length ?? 0) === 0 &&
          (filteredPays?.length ?? 0) === 0 &&
          (filteredTxs?.length ?? 0) === 0 && (
            <p className="text-center text-sm text-gray-600">
              No records found for the selected date range.
            </p>
          )
        ) : null}
      </div>
    </div>
  );
};

export default WorkerDetails;
