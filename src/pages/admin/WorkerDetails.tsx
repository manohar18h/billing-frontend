import React from "react";
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWorkers } from "@/contexts/WorkersContext";
import { WorkerData } from "@/pages/admin/WorkerData";

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "-";
  const [y, m, d] = dateStr.split("T")[0].split("-");
  return `${m}/${d}/${y}`;
};

const WorkerDetails: React.FC = () => {
  const { workerId } = useParams<{ workerId: string }>();
  const navigate = useNavigate();
  const { workers, refresh } = useWorkers();

  useEffect(() => {
    refresh(); // pulls newest list on mount
  }, []);

  // Explicitly type worker
  const worker: WorkerData | undefined = workers.find(
    (w) => w.workerId === Number(workerId)
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

        {/* ─── Basic Info ─── */}
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

        {/* ─── Worker Stocks ─── */}
        {worker.workerStocks?.length > 0 && (
          <>
            <h2 className="text-xl font-semibold text-purple-600 dark:text-purple-300 mb-2">
              Worker Stocks
            </h2>
            {worker.workerStocks.map((s) => (
              <div
                key={s.wstockId}
                className="mb-4 rounded-lg border-2 border-gray-400 p-3 grid grid-cols-2 gap-4
                           divide-x divide-gray-300 dark:divide-gray-600 "
              >
                <div className="pr-4">
                  {line("Metal", s.metal)}
                  {line("Weight", `${s.metalWeight} g`)}
                </div>
                <div className="pl-4">
                  {line("Date", formatDate(s.todaysDate))}
                  {line("Stock ID", s.wstockId)}
                </div>
              </div>
            ))}
          </>
        )}

        {/* ─── Lot Works ─── */}
        {worker.lotWorks?.length > 0 && (
          <>
            <h2 className="text-xl font-semibold text-purple-600 dark:text-purple-300 mb-2">
              Lot Works
            </h2>
            {worker.lotWorks.map((l) => (
              <div
                key={l.lotId}
                className="mb-4 rounded-lg border-2 border-gray-400 p-3 grid grid-cols-2 gap-4
                           divide-x divide-gray-300 dark:divide-gray-600"
              >
                <div className="pr-4">
                  {line("Metal", l.metal)}
                  {line("Item", l.itemName)}
                  {line("Weight", `${l.itemWeight} g`)}
                  {line("Pieces", l.pieces)}
                </div>

                <div className="pl-4">
                  {line("Date", l.deliveryDate)}
                  {line("Wastage", `${l.wastage} %`)}
                  {line("Amount", `₹${l.amount}`)}
                  {line("Lot ID", l.lotId)}
                </div>
              </div>
            ))}
          </>
        )}

        {/* ─── Repair Works ─── */}
        {worker.repairWorks?.length > 0 && (
          <>
            <h2 className="text-xl font-semibold text-purple-600 dark:text-purple-300 mb-2">
              Repair Works
            </h2>
            {worker.repairWorks.map((r, i) => (
              <div
                key={i}
                className="mb-4 rounded-lg border-2 border-gray-400 p-3 grid grid-cols-2 gap-4
                           divide-x divide-gray-300 dark:divide-gray-600"
              >
                <div className="pr-4">
                  {line("Metal", r.metal)}
                  {line("Item", r.itemName)}
                  {line("Weight", `${r.metalWeight} g`)}
                </div>
                <div className="pl-4">
                  {line("Customer Pay", `₹${r.customerPay}`)}
                  {line("Worker Pay", `₹${r.workerPay}`)}
                  {line("Date", r.deliveryDate)}
                </div>
              </div>
            ))}
          </>
        )}

        {/* ─── Worker Pays (WorkPay) ─── */}
        {worker.workerPays?.length > 0 && (
          <>
            <h2 className="text-xl font-semibold text-purple-600 dark:text-purple-300 mb-2">
              Work Payments
            </h2>
            {worker.workerPays.map((p) => (
              <div
                key={p.wpid}
                className="mb-4 rounded-lg border-2 border-gray-400 p-3 grid grid-cols-2 gap-4
                           divide-x divide-gray-300 dark:divide-gray-600"
              >
                <div className="pr-4">
                  {line("Order ID", p.orderId)}
                  {line("Metal", p.metal)}
                  {line("Weight", `${p.metal_weight} g`)}
                </div>
                <div className="pl-4">
                  {line("Date", p.date ?? "-")}
                  {line("Pay", `₹${p.workPay}`)}
                  {line("WP ID", p.wpid)}
                </div>
              </div>
            ))}
          </>
        )}

        {/* ─── Transactions ─── */}
        {worker.workerTransactionHistories?.length > 0 && (
          <>
            <h2 className="text-xl font-semibold text-purple-600 dark:text-purple-300 mb-2">
              Transactions
            </h2>
            <ul className="mb-8 pl-5 list-disc">
              {worker.workerTransactionHistories.map((t) => (
                <li key={t.wtid}>
                  ₹{t.paidAmount} on&nbsp;
                  {new Date(t.paymentDate).toLocaleString()}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

export default WorkerDetails;
