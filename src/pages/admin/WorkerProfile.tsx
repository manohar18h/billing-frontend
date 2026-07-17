import React, {
  useCallback,
  useEffect,
   useRef,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import type {
  LotWorkData,
  PageResponse,
  RepairWorkData,
  SpecialWorkData,
  WorkerPayData,
  WorkerProfileSummary,
  WorkerStockData,
  WorkerTransactionData,
} from "../../lib/WorkerProfileData";

import {
  fetchLotWorks,
  fetchRepairWorks,
  fetchSpecialWorks,
  fetchWorkerPayments,
  fetchWorkerProfile,
  fetchWorkerStocks,
  fetchWorkerTransactions,
} from "@/services/workerProfileApi";

import type { WorkerHistoryParams } from "@/services/workerProfileApi";

type SectionType =
  | "stocks"
  | "lotWorks"
  | "repairs"
  | "specialWorks"
  | "payments"
  | "transactions";

type HistoryRecord =
  | WorkerStockData
  | LotWorkData
  | RepairWorkData
  | SpecialWorkData
  | WorkerPayData
  | WorkerTransactionData;

const PAGE_SIZE = 10;

const sectionButtons: Array<{
  id: SectionType;
  label: string;
  shortLabel: string;
}> = [
  {
    id: "stocks",
    label: "Metal Stocks",
    shortLabel: "Stocks",
  },
  {
    id: "lotWorks",
    label: "Lot Works",
    shortLabel: "Lots",
  },
  {
    id: "repairs",
    label: "Repair Works",
    shortLabel: "Repairs",
  },
  {
    id: "specialWorks",
    label: "Special Works",
    shortLabel: "Special",
  },
  {
    id: "payments",
    label: "Work Payments",
    shortLabel: "Payments",
  },
  {
    id: "transactions",
    label: "Transactions",
    shortLabel: "Transactions",
  },
];

function numericValue(
  value: number | null | undefined,
): number {
  return Number(value ?? 0);
}

function formatMoney(
  value: number | null | undefined,
): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(numericValue(value));
}

function formatWeight(
  value: number | null | undefined,
): string {
  return `${numericValue(value).toFixed(3)} g`;
}

function formatDecimal(
  value: number | null | undefined,
): string {
  return numericValue(value).toFixed(3);
}

function formatDate(
  value: string | null | undefined,
): string {
  if (!value) {
    return "-";
  }

  // Handles yyyy-MM-dd and ISO date/time values.
  const isoMatch = value.match(
    /^(\d{4})-(\d{2})-(\d{2})/,
  );

  if (isoMatch) {
    return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
  }

  // Handles M/d/yyyy and M/d/yyyy, time values.
  const firstPart = value.split(",")[0]?.trim();
  const slashParts = firstPart?.split("/");

  if (slashParts?.length === 3) {
    const [month, day, year] = slashParts;

    return `${String(day).padStart(2, "0")}/${String(
      month,
    ).padStart(2, "0")}/${year}`;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-IN");
}


function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const axiosError = error as {
      response?: {
        status?: number;
        data?: string | { message?: string };
      };
    };

    const status = axiosError.response?.status;
    const data = axiosError.response?.data;

    if (status === 401 || status === 403) {
      return "Your login session has expired. Please log in again.";
    }

    if (typeof data === "string" && data.trim()) {
      return data;
    }

    if (
      typeof data === "object" &&
      data?.message
    ) {
      return data.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unable to load worker information.";
}

const WorkerProfile: React.FC = () => {
  const navigate = useNavigate();
  const fromDateRef = useRef<HTMLInputElement | null>(null);
const toDateRef = useRef<HTMLInputElement | null>(null);


  const [worker, setWorker] =
    useState<WorkerProfileSummary | null>(null);

  const [activeSection, setActiveSection] =
    useState<SectionType>("lotWorks");

  const [historyPage, setHistoryPage] =
    useState<PageResponse<HistoryRecord> | null>(null);

  const [pageNumber, setPageNumber] = useState(0);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [appliedFromDate, setAppliedFromDate] =
    useState("");

  const [appliedToDate, setAppliedToDate] =
    useState("");

  const [profileLoading, setProfileLoading] =
    useState(true);

  const [historyLoading, setHistoryLoading] =
    useState(false);

  const [profileError, setProfileError] =
    useState("");

  const [historyError, setHistoryError] =
    useState("");

  const activeSectionDetails = useMemo(
    () =>
      sectionButtons.find(
        (section) => section.id === activeSection,
      ),
    [activeSection],
  );

  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileError("");

    try {
      const data = await fetchWorkerProfile();
      setWorker(data);
    } catch (error) {
      const message = getErrorMessage(error);
      setProfileError(message);

      if (
        message.toLowerCase().includes("session") ||
        message.toLowerCase().includes("token")
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
      }
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError("");

    const params: WorkerHistoryParams = {
      page: pageNumber,
      size: PAGE_SIZE,
      fromDate: appliedFromDate || undefined,
      toDate: appliedToDate || undefined,
    };

    try {
      let response: PageResponse<HistoryRecord>;

      switch (activeSection) {
        case "stocks":
          response = await fetchWorkerStocks(params);
          break;

        case "lotWorks":
          response = await fetchLotWorks(params);
          break;

        case "repairs":
          response = await fetchRepairWorks(params);
          break;

        case "specialWorks":
          response = await fetchSpecialWorks(params);
          break;

        case "payments":
          response = await fetchWorkerPayments(params);
          break;

        case "transactions":
          response =
            await fetchWorkerTransactions(params);
          break;

        default:
          throw new Error("Invalid worker section");
      }

      setHistoryPage(response);
    } catch (error) {
      setHistoryPage(null);
      setHistoryError(getErrorMessage(error));
    } finally {
      setHistoryLoading(false);
    }
  }, [
    activeSection,
    pageNumber,
    appliedFromDate,
    appliedToDate,
  ]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const changeSection = (section: SectionType) => {
    setActiveSection(section);
    setPageNumber(0);
    setHistoryPage(null);
    setHistoryError("");
  };

const applyDateFilter = () => {
  if (!fromDate && !toDate) {
    setHistoryError("Please select a date.");
    return;
  }

  if (fromDate && toDate && fromDate > toDate) {
    setHistoryError(
      "From date cannot be later than To date.",
    );
    return;
  }

  setHistoryError("");
  setHistoryPage(null);
  setPageNumber(0);

  // Only From Date selected: exact one-day filter
  if (fromDate && !toDate) {
    setAppliedFromDate(fromDate);
    setAppliedToDate(fromDate);
    return;
  }

  // Only To Date selected: exact one-day filter
  if (!fromDate && toDate) {
    setAppliedFromDate(toDate);
    setAppliedToDate(toDate);
    return;
  }

  // Both selected: range filter
  setAppliedFromDate(fromDate);
  setAppliedToDate(toDate);
};

  const clearDateFilter = () => {
    setFromDate("");
    setToDate("");
    setAppliedFromDate("");
    setAppliedToDate("");
    setPageNumber(0);
    setHistoryError("");
  };

  const refreshPage = () => {
    void loadProfile();
    void loadHistory();
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#181329] to-slate-950 flex items-center justify-center px-5">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-2xl border border-amber-300/30 bg-amber-300/10 flex items-center justify-center shadow-2xl">
            <div className="h-7 w-7 rounded-full border-2 border-amber-200 border-t-transparent animate-spin" />
          </div>

          <h2 className="mt-5 text-xl font-bold text-white">
            Loading worker dashboard
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Preparing profile information...
          </p>
        </div>
      </div>
    );
  }

  if (profileError || !worker) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-5">
        <div className="w-full max-w-md rounded-3xl border border-red-400/20 bg-white/5 p-7 text-center shadow-2xl">
          <div className="mx-auto h-14 w-14 rounded-full bg-red-500/10 flex items-center justify-center text-2xl">
            !
          </div>

          <h2 className="mt-4 text-xl font-bold text-white">
            Profile unavailable
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            {profileError ||
              "Worker profile was not found."}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="h-12 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-white"
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => void loadProfile()}
              className="h-12 rounded-xl bg-gradient-to-r from-amber-300 to-yellow-500 text-sm font-bold text-slate-950"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderHistoryRecord = (
    record: HistoryRecord,
    index: number,
  ) => {
    switch (activeSection) {
      case "stocks": {
        const stock = record as WorkerStockData;

        return (
          <RecordCard
            key={stock.stockId}
            title={stock.metal}
            badge={`Stock #${stock.stockId}`}
            date={formatDate(stock.todaysDate)}
            rows={[
              {
                label: "Metal Weight",
                value: formatWeight(
                  stock.metalWeight,
                ),
              },
            ]}
          />
        );
      }

      case "lotWorks": {
        const lot = record as LotWorkData;

        return (
          <RecordCard
            key={lot.lotId}
            title={lot.itemName || "Lot Work"}
            badge={lot.metal}
            date={formatDate(lot.deliveryDate)}
            rows={[
              {
                label: "Item Weight",
                value: formatWeight(lot.itemWeight),
              },
              {
                label: "Pieces",
                value: String(lot.pieces ?? 0),
              },
              {
                label: "Wastage",
                value:
                  lot.wastage == null
                    ? "-"
                    : formatDecimal(lot.wastage),
              },
              {
                label: "Amount",
                value:
                  lot.amount == null
                    ? "-"
                    : formatMoney(lot.amount),
              },
            ]}
          />
        );
      }

      case "repairs": {
        const repair = record as RepairWorkData;

        return (
          <RecordCard
            key={repair.repairWorkId}
            title={repair.itemName || "Repair Work"}
            badge={repair.metal || "Non Metal"}
            date={formatDate(repair.deliveryDate)}
            rows={[
              {
                label: "Metal Weight",
                value: formatWeight(
                  repair.metalWeight,
                ),
              },
              {
                label: "Worker Pay",
                value:
                  repair.workerPay == null
                    ? "-"
                    : formatMoney(
                        repair.workerPay,
                      ),
              },
            ]}
          />
        );
      }

      case "specialWorks": {
        const special =
          record as SpecialWorkData;

        return (
          <RecordCard
            key={special.speclWorkId ?? index}
            title={
              special.itemName || "Special Work"
            }
            badge={special.metal || "Work"}
            date={formatDate(
              special.deliveryDate,
            )}
            rows={[
              {
                label: "Worker Metal Weight",
                value: formatWeight(
                  special.workerMetalWeight,
                ),
              },
              {
                label: "Other Metal",
                value:
                  special.otherMetalName || "-",
              },
              {
                label: "Other Weight",
                value:
                  special.otherWeight == null
                    ? "-"
                    : formatWeight(
                        special.otherWeight,
                      ),
              },
              {
                label: "Amount",
                value:
                  special.amount == null
                    ? "-"
                    : formatMoney(
                        special.amount,
                      ),
              },
              {
                label: "Wastage",
                value:
                  special.wastage == null
                    ? "-"
                    : formatDecimal(
                        special.wastage,
                      ),
              },
              {
                label: "Item Link Code",
                value:
                  special.itemLinkCode || "-",
              },
            ]}
          />
        );
      }

      case "payments": {
        const payment = record as WorkerPayData;

        const paymentId =
          payment.wpid ??
          payment.wPid ??
          index;

        return (
          <RecordCard
            key={paymentId}
            title={
              payment.orderId
                ? `Order #${payment.orderId}`
                : "Work Payment"
            }
            badge={payment.metal || "Payment"}
            date={formatDate(payment.date)}
            rows={[
              {
                label: "Metal Weight",
                value: formatWeight(
                  payment.metal_weight,
                ),
              },
              {
                label: "Work Pay",
                value:
                  payment.workPay == null
                    ? "-"
                    : formatMoney(
                        payment.workPay,
                      ),
              },
              {
                label: "Wastage",
                value:
                  payment.wastage == null
                    ? "-"
                    : formatDecimal(
                        payment.wastage,
                      ),
              },
            ]}
          />
        );
      }

      case "transactions": {
        const transaction =
          record as WorkerTransactionData;

        const transactionId =
          transaction.wtid ??
          transaction.wTid ??
          transaction.WTid ??
          index;

        return (
          <RecordCard
            key={transactionId}
            title={
              transaction.reason ||
              "Worker Transaction"
            }
            badge={
              transaction.paymentMethod ||
              transaction.methodType ||
              "Transaction"
            }
            date={formatDate(
              transaction.paymentDate,
            )}
            rows={[
              {
                label: "Amount",
                value: formatMoney(
                  transaction.paid,
                ),
              },
              {
                label: "Method Type",
                value:
                  transaction.methodType || "-",
              },
            ]}
          />
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#171229] to-[#050711] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            ← Back
          </button>

          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-300 sm:text-xs">
              Hambire Jewellery
            </p>

            <h1 className="mt-1 text-sm font-bold text-white sm:text-lg">
              Worker Dashboard
            </h1>
          </div>

          <button
            type="button"
            onClick={refreshPage}
            className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Refresh
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
        {/* Main profile card */}
        <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-amber-200 via-yellow-500 to-amber-700 p-[1px] shadow-2xl shadow-black/30">
          <div className="relative overflow-hidden rounded-[27px] bg-gradient-to-br from-[#211b31] via-slate-900 to-slate-950 p-5 sm:p-8">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-200 to-yellow-600 text-2xl font-black text-slate-950 shadow-xl sm:h-20 sm:w-20 sm:text-3xl">
                  {worker.fullName
                    ?.trim()
                    .charAt(0)
                    .toUpperCase() || "W"}
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-300">
                    Employee Profile
                  </p>

                  <h2 className="mt-1 truncate text-2xl font-black text-white sm:text-3xl">
                    {worker.fullName}
                  </h2>

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-300">
                    <span>
                      📞 {worker.phnNumber}
                    </span>

                    <span>
                      📍 {worker.village}
                    </span>

                    <span>
                      👤 @{worker.userName}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <TopMetric
                  label="Earned"
                  value={formatMoney(
                    worker.earnedAmount,
                  )}
                />

                <TopMetric
                  label="Received"
                  value={formatMoney(
                    worker.receivedAmount,
                  )}
                />

                <TopMetric
                  label="Pending"
                  value={formatMoney(
                    worker.pendingAmount,
                  )}
                  danger={
                    worker.pendingAmount < 0
                  }
                />
              </div>
            </div>
          </div>
        </section>

        {/* Metal stock summary */}
        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard
            title="24K Gold"
            value={formatWeight(
              worker.total24GoldStock,
            )}
            description="Pure gold stock"
          />

          <SummaryCard
            title="22K Gold"
            value={formatWeight(
              worker.total22GoldStock,
            )}
            description="22 karat stock"
          />

          <SummaryCard
            title="999 Silver"
            value={formatWeight(
              worker.total999SilverStock,
            )}
            description="Pure silver stock"
          />

          <SummaryCard
            title="995 Silver"
            value={formatWeight(
              worker.total995SilverStock,
            )}
            description="995 silver stock"
          />
        </section>

        {/* Wastage summary */}
        <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SummaryCard
            title="Earned Wastage"
            value={`${formatDecimal(
              worker.earnedWastage,
            )} g`}
            description="Total earned wastage"
          />

          <SummaryCard
            title="Received Wastage"
            value={`${formatDecimal(
              worker.receivedWastage,
            )} g`}
            description="Total received wastage"
          />

          <SummaryCard
            title="Pending Wastage"
            value={`${formatDecimal(
              worker.pendingWastage,
            )} g`}
            description="Remaining wastage balance"
          />
        </section>

        {/* History section */}
        <section className="mt-7 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] shadow-2xl backdrop-blur-xl">
          {/* Date filter */}
          <div className="border-b border-white/10 p-4 sm:p-6">
            <div>
              <h3 className="text-lg font-bold text-white">
                Filter Records
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                Select dates and apply the filter to
                the active section.
              </p>
            </div>

<div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto]">             <label>
  <span className="mb-2 block text-xs font-semibold text-slate-400">
    From Date
  </span>

  <div
    role="button"
    tabIndex={0}
    onClick={() => {
      fromDateRef.current?.showPicker?.();
      fromDateRef.current?.focus();
    }}
    onKeyDown={(event) => {
      if (event.key === "Enter" || event.key === " ") {
        fromDateRef.current?.showPicker?.();
        fromDateRef.current?.focus();
      }
    }}
    className="relative cursor-pointer"
  >
    <input
      ref={fromDateRef}
      type="date"
      value={fromDate}
      max={toDate || undefined}
      onChange={(event) => {
        setFromDate(event.target.value);
        setHistoryError("");
      }}
      className="h-12 w-full cursor-pointer rounded-xl border border-white/10 bg-slate-950/60 px-4 pr-12 text-sm text-white outline-none transition focus:border-amber-300/60 focus:ring-2 focus:ring-amber-300/10"
    />

    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg text-amber-300">
      📅
    </span>
  </div>
</label>

            <label>
  <span className="mb-2 block text-xs font-semibold text-slate-400">
    To Date
  </span>

  <div
    role="button"
    tabIndex={0}
    onClick={() => {
      toDateRef.current?.showPicker?.();
      toDateRef.current?.focus();
    }}
    onKeyDown={(event) => {
      if (event.key === "Enter" || event.key === " ") {
        toDateRef.current?.showPicker?.();
        toDateRef.current?.focus();
      }
    }}
    className="relative cursor-pointer"
  >
    <input
      ref={toDateRef}
      type="date"
      value={toDate}
      min={fromDate || undefined}
      onChange={(event) => {
        setToDate(event.target.value);
        setHistoryError("");
      }}
      className="h-12 w-full cursor-pointer rounded-xl border border-white/10 bg-slate-950/60 px-4 pr-12 text-sm text-white outline-none transition focus:border-amber-300/60 focus:ring-2 focus:ring-amber-300/10"
    />

    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg text-amber-300">
      📅
    </span>
  </div>
</label>
             <button
  type="button"
  onClick={applyDateFilter}
  disabled={historyLoading}
  className="mt-auto h-12 rounded-xl bg-gradient-to-r from-amber-300 to-yellow-500 px-6 text-sm font-black text-slate-950 shadow-lg transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
>
  {historyLoading ? "Filtering..." : "Apply Filter"}
</button>

<button
  type="button"
  onClick={clearDateFilter}
  disabled={historyLoading}
  className="mt-auto h-12 rounded-xl border border-white/10 bg-white/5 px-6 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
>
  Clear
</button>
            </div>

            {(appliedFromDate ||
              appliedToDate) && (
              <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-xs text-amber-100">
                Showing records
                {appliedFromDate
                  ? ` from ${formatDate(
                      appliedFromDate,
                    )}`
                  : ""}
                {appliedToDate
                  ? ` to ${formatDate(
                      appliedToDate,
                    )}`
                  : ""}
              </div>
            )}
          </div>

          {/* Horizontal section tabs */}
          <div className="overflow-x-auto border-b border-white/10">
            <div className="flex min-w-max gap-2 p-3 sm:p-4">
              {sectionButtons.map((section) => {
                const active =
                  activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() =>
                      changeSection(section.id)
                    }
                    className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                      active
                        ? "bg-gradient-to-r from-amber-300 to-yellow-500 text-slate-950 shadow-lg"
                        : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="sm:hidden">
                      {section.shortLabel}
                    </span>

                    <span className="hidden sm:inline">
                      {section.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected records */}
          <div className="p-4 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {activeSectionDetails?.label}
                </h3>

               <p className="mt-1 text-xs text-slate-400">
  {historyLoading && !historyPage
    ? "Loading records..."
    : `${historyPage?.totalElements ?? 0} total records`}
</p>
              </div>

              {historyLoading && (
                <div className="h-6 w-6 rounded-full border-2 border-amber-200 border-t-transparent animate-spin" />
              )}
            </div>

            {historyError && (
              <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {historyError}
              </div>
            )}

            {historyLoading &&
            !historyPage ? (
              <HistoryLoading />
            ) : historyPage?.content?.length ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {historyPage.content.map(
                  renderHistoryRecord,
                )}
              </div>
            ) : (
              !historyLoading && (
                <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.025] px-5 py-14 text-center">
                  <div className="text-4xl">
                    📦
                  </div>

                  <h4 className="mt-4 font-bold text-slate-200">
                    No records found
                  </h4>

                  <p className="mt-2 text-sm text-slate-500">
                    Select another section or change
                    the date range.
                  </p>
                </div>
              )
            )}

            {/* Pagination */}
           {historyPage &&
  historyPage.totalPages > 1 && (
    <div className="mt-7 flex items-center justify-between gap-3 border-t border-white/10 pt-5">
      <button
        type="button"
        disabled={
          historyPage.first ||
          historyLoading
        }
        onClick={() =>
          setPageNumber((current) =>
            Math.max(current - 1, 0),
          )
        }
        className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ← Previous
      </button>

      <div className="text-center">
        <p className="text-xs font-semibold text-slate-300">
          Page {historyPage.number + 1} of{" "}
          {historyPage.totalPages}
        </p>

        <p className="mt-1 text-[10px] text-slate-500">
          Showing {historyPage.numberOfElements} of{" "}
          {historyPage.totalElements} records
        </p>
      </div>

      <button
        type="button"
        disabled={
          historyPage.last ||
          historyLoading
        }
        onClick={() =>
          setPageNumber((current) => current + 1)
        }
        className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next →
      </button>
    </div>
  )}
          </div>
        </section>
      </main>
    </div>
  );
};

interface TopMetricProps {
  label: string;
  value: string;
  danger?: boolean;
}

const TopMetric: React.FC<TopMetricProps> = ({
  label,
  value,
  danger = false,
}) => {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-3 text-center backdrop-blur">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 sm:text-[10px]">
        {label}
      </p>

      <p
        className={`mt-1 truncate text-[11px] font-black sm:text-sm ${
          danger
            ? "text-red-300"
            : "text-amber-200"
        }`}
      >
        {value}
      </p>
    </div>
  );
};

interface SummaryCardProps {
  title: string;
  value: string;
  description: string;
}

const SummaryCard: React.FC<
  SummaryCardProps
> = ({
  title,
  value,
  description,
}) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 shadow-xl backdrop-blur-xl sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-400">
          {title}
        </p>

        <span className="text-amber-300">
          ◆
        </span>
      </div>

      <p className="mt-3 break-words text-lg font-black text-white sm:text-xl">
        {value}
      </p>

      <p className="mt-1 text-[11px] text-slate-500">
        {description}
      </p>
    </div>
  );
};

interface RecordCardProps {
  title: string;
  badge: string;
  date: string;
  rows: Array<{
    label: string;
    value: string;
  }>;
}

const RecordCard: React.FC<
  RecordCardProps
> = ({
  title,
  badge,
  date,
  rows,
}) => {
  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40 shadow-lg transition hover:border-amber-300/20">
      <div className="flex items-start justify-between gap-3 border-b border-white/10 bg-white/[0.035] px-4 py-4">
        <div className="min-w-0">
          <h4 className="truncate font-bold capitalize text-white">
            {title}
          </h4>

          <span className="mt-2 inline-flex rounded-lg border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[11px] font-bold text-amber-200">
            {badge}
          </span>
        </div>

        <span className="shrink-0 rounded-lg bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-400">
          {date}
        </span>
      </div>

      <div className="divide-y divide-white/5 px-4">
        {rows.map((row, index) => (
          <div
            key={`${row.label}-${index}`}
            className="flex items-center justify-between gap-4 py-3 text-sm"
          >
            <span className="text-slate-400">
              {row.label}
            </span>

            <span className="max-w-[60%] break-words text-right font-semibold text-slate-100">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </article>
  );
};

const HistoryLoading: React.FC = () => {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {[1, 2, 3, 4].map((value) => (
        <div
          key={value}
          className="h-48 animate-pulse rounded-2xl border border-white/10 bg-white/5"
        />
      ))}
    </div>
  );
};

export default WorkerProfile;