// src/pages/admin/Dashboard.tsx
import React, { useEffect, useState } from "react";
import api from "@/services/api"; // make sure this import path is correct
import { MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../../App.css";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowDown, ArrowUp } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { IconButton, Chip } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";

type MetalRates = {
  gold24Rate: number;
  gold22Rate: number;
  silver999Rate: number;
  silver995Rate: number;
};

type Billing = {
  billId: number;
  billNumber: string;
  customerId: number;
  name: string;
  village: string;
  phoneNumber: string;
  emailId: string;
  deliveryStatus: string;
  workStatus: string;
  numberOfOrders: number;
  billTotalAmount: number;
  billDiscountAmount: number;
  exchangeAmount: number;
  billPaidAmount: number;
  billDueAmount: number;
  selectedOrderIds: string;
  billingDate: string | null;
  checked: boolean;
};

type TodayOldExchangeData = {
  oldMetalReturnId: number;
  type: string;
  billNumber: string | null;
  onlyExchangeMetal: string;
  onlyExchange_metal_name: string;
  onlyExchange_metal_weight: number;
  onlyExchange_metal_purity_weight: number;
  onlyExchange_total_amount: number;
};

interface LoanBill {
  loanBillId: number;
  loanBillNumber: string;
  customerLoanId: number;
  name: string;
  village: string;
  phoneNumber: string;
  aadharCard: string;
  emailId: string;
  deliveryStatus: string;
  itemStatus: string;
  numberOfItems: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paidInterestAmount: number;
  dueInterestAmount: number;
  selectedItemsIds: string;
  loanBillingDate: string;
  checked: boolean;
}


interface TaggingWork {
  taggingWorkId: number;

  assignedTo: string;
  givenBy: string;

  stockBoxId: number | null;
  stockBoxName: string;
  itemName: string;

  beforeTagCount: number;
  afterTagCount: number;
  missingCount: number;
  remainingCount: number;

  status: string;

  remarks: string | null;

  verifiedBy: string | null;
  verificationStatus: string | null;
  verificationRemarks: string | null;

  assignedDate: string;
  returnedDate: string | null;
  verifiedDate: string | null;
  completedDate: string | null;

  archived: boolean;
}

interface TaggingWorker {
  taggingWorkerId: number;
  name: string;
  active: boolean;
}

interface StockBoxOption {
  stockBoxId: number;
  stockBoxName: string;
}


interface VillageStatsResponse {
  totalCustomers: number;
  totalVillages: number;
  villagePercentageList: BusinessGrowthResponse[];
}

function normalizeStatus(
  s: string | undefined | null,
): "delivered" | "pending" | "other" {
  const v = (s ?? "").toLowerCase().trim();
  if (v.includes("deliver")) return "delivered";
  if (v.includes("pend")) return "pending";
  return "other";
}

type OrdersMetric = {
  currentCount: number;
  previousCount: number;
  percentageChange: number;
  totalOrders: number;
};
type RevenueMetric = {
  currentRevenue: number;
  previousRevenue: number;
  totalRevenue: number;
  percentageChange: number;
  cashAmount: number;
  onlineAmount: number;
};

interface OrderStat {
  year: number;
  month: number;
  billCount: number;
}

interface CancelStat {
  year: number;
  month: number;
  canceledCount: number;
}

interface RevenueStat {
  monthName: string;
  totalRevenue: number;
}

interface BusinessGrowthResponse {
  village: string;
  totalCustomers: number;
  percentage: number;
}

function useOrdersMetric(
  endpoint: string,
  filter: string,
  token: string | null,
) {
  const [data, setData] = useState<OrdersMetric | null>(null);

  useEffect(() => {
    if (!token) return;
    api
      .get<OrdersMetric>(`${endpoint}?filter=${filter}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setData(res.data))
      .catch((err) => console.error("Error fetching metric:", err));
  }, [endpoint, filter, token]);

  return data;
}

function useRevenueMetric(
  endpoint: string,
  filter: string,
  token: string | null,
) {
  const [data, setData] = useState<RevenueMetric | null>(null);

  useEffect(() => {
    if (!token) return;
     setData(null);
    api
      .get<RevenueMetric>(`${endpoint}?filter=${filter}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
     .then((res) => {
        console.log("Revenue response:", res.data);
        setData(res.data);
      })
 .catch((err) => {
        console.error("Revenue API failed:", err);
        console.error("Status:", err.response?.status);
        console.error("Backend response:", err.response?.data);
        console.error("Requested URL:", `${endpoint}?filter=${filter}`);
      });
    }, [endpoint, filter, token]);

  return data;
}

/* ---------- Metal Prices (editable) ---------- */
const MetalPricesCard: React.FC = () => {
  const token = localStorage.getItem("token");

  const [gold24, setGold24] = useState("");
  const [gold22, setGold22] = useState("");
  const [silver999, setSilver999] = useState("");
  const [silver995, setSilver995] = useState("");

  const [open, setOpen] = useState(false);
  const [g24Draft, setG24Draft] = useState("");
  const [g22Draft, setG22Draft] = useState("");
  const [s999Draft, setS999Draft] = useState("");
  const [s995Draft, setS995Draft] = useState("");

  useEffect(() => {
    if (!token) return;

    api
      .get<MetalRates>("/admin/getRates", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const { gold24Rate, gold22Rate, silver999Rate, silver995Rate } =
          res.data;
        setGold24(gold24Rate.toString());
        setGold22(gold22Rate.toString());
        setSilver999(silver999Rate.toString());
        setSilver995(silver995Rate.toString());
        setG24Draft(gold24Rate.toString());
        setG22Draft(gold22Rate.toString());
        setS999Draft(silver999Rate.toString());
        setS995Draft(silver995Rate.toString());

        // keep local copy
        localStorage.setItem("Gold24Price", (gold24Rate ?? 0).toString());
        localStorage.setItem("Gold22Price", (gold22Rate ?? 0).toString());
        localStorage.setItem("Silver999Price", (silver999Rate ?? 0).toString());
        localStorage.setItem("Silver995Price", (silver995Rate ?? 0).toString());
      })
      .catch((err) => console.error("Error fetching rates:", err));
  }, [token]);

  const openEditor = () => {
    setG24Draft(gold24);
    setG22Draft(gold22);
    setS999Draft(silver999);
    setS995Draft(silver995);
    setOpen(true);
  };

  
  const save = () => {
    if (!token) return;

    api
      .put<MetalRates>(
        `/admin/updateRates?gold24Rate=${g24Draft}&gold22Rate=${g22Draft}&silver999Rate=${s999Draft}&silver995Rate=${s995Draft}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      .then((res) => {
        const { gold24Rate, gold22Rate, silver999Rate, silver995Rate } =
          res.data;
        setGold24(gold24Rate.toString());
        setGold22(gold22Rate.toString());
        setSilver999(silver999Rate.toString());
        setSilver995(silver995Rate.toString());
        setG24Draft(gold24Rate.toString());
        setG22Draft(gold22Rate.toString());
        setS999Draft(silver999Rate.toString());
        setS995Draft(silver995Rate.toString());

        localStorage.setItem("Gold24Price", (gold24Rate ?? 0).toString());
        localStorage.setItem("Gold22Price", (gold22Rate ?? 0).toString());
        localStorage.setItem("Silver999Price", (silver999Rate ?? 0).toString());
        localStorage.setItem("Silver995Price", (silver995Rate ?? 0).toString());

        setOpen(false);

        // keep local copy

        console.log(
          "Updated Prices =>",
          gold24Rate,
          gold22Rate,
          silver999Rate,
          silver995Rate,
        );
      })
      .catch((err) => console.error("Error updating rates:", err));
  };
  return (
    <div className="relative rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500 font-medium">Metal Prices</div>
        <button
          onClick={openEditor}
          className="inline-flex items-center gap-1 text-xs font-semibold rounded-lg px-2 py-1 bg-violet-50 text-violet-700 hover:bg-violet-100"
          title="Edit prices"
        >
          ✎ Edit
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-100 p-3">
          <div className="text-xs text-gray-500">24 Gold</div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
            ₹{(gold24 ?? 0).toLocaleString()}
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 p-3">
          <div className="text-xs text-gray-500">22 Gold</div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
            ₹{(gold22 ?? 0).toLocaleString()}
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-100 p-3">
          <div className="text-xs text-gray-500">999 Silver</div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
            ₹{(silver999 ?? 0).toLocaleString()}
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 p-3">
          <div className="text-xs text-gray-500">995 Silver</div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
            ₹{(silver995 ?? 0).toLocaleString()}
          </div>
        </div>
      </div>

      {open && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 rounded-2xl">
          <div className="w-full max-w-xs rounded-2xl bg-white p-4 shadow-lg ring-1 ring-black/5">
            <div className="text-sm font-semibold text-gray-800">
              Update Prices
            </div>
            <div className="mt-3 space-y-3">
              <label className="block">
                <span className="text-xs text-gray-500">24 Gold (₹)</span>
                <input
                  type="number"
                  value={g24Draft}
                  onChange={(e) => {
                    const value = e.target.value;
                    setG24Draft(value);
                    const new22 = (Number(value) * 92.7) / 100;
                    setG22Draft(new22.toFixed(0));
                  }}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500">22 Gold (₹)</span>
                <input
                  type="number"
                  value={g22Draft}
                  onChange={(e) => setG22Draft(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500">999 Silver (₹)</span>
                <input
                  type="number"
                  value={s999Draft}
                  onChange={(e) => setS999Draft(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500">995 Silver (₹)</span>
                <input
                  type="number"
                  value={s995Draft}
                  onChange={(e) => setS995Draft(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                />
              </label>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>{" "}
              <button
                onClick={save}
                className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-violet-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------- KPI card ---------- */
const MetricCard: React.FC<{
  title: string;
  endpoint: string;
  token: string | null;
}> = ({ title, endpoint, token }) => {
  const [filter, setFilter] = useState("ALL");
  const data = useOrdersMetric(endpoint, filter, token);

  const FILTER_OPTIONS = [
    "ALL",
    "TODAY",
    "THIS_WEEK",
    "THIS_MONTH",
    "THIS_YEAR",
  ] as const;



  const getVsLabel = (filter: string) => {
    switch (filter) {
      case "ALL":
        return "All";
      case "TODAY":
        return "Yesterday";
      case "THIS_WEEK":
        return "Last Week";
      case "THIS_MONTH":
        return "Last Month";
      case "THIS_YEAR":
        return "Last Year";
      default:
        return filter.replace("_", " ").toLowerCase();
    }
  };

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-5 relative">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-500 font-medium">{title}</div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded-full hover:bg-gray-100">
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {FILTER_OPTIONS.map((f) => (
              <DropdownMenuItem
                key={f}
                onClick={() => setFilter(f)}
                className={filter === f ? "font-semibold text-violet-600" : ""}
              >
                {f.replace("_", " ")}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="text-2xl font-bold">
        {data ? data.currentCount.toLocaleString() : "..."}
      </div>
      <div className="flex items-center gap-2 mt-1 text-sm">
        {/* Percentage Badge */}
        {data && (
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-medium
        ${
          data.percentageChange >= 0
            ? "text-green-700 bg-green-100"
            : "text-red-700 bg-red-100"
        }`}
          >
            {data.percentageChange >= 0 ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
            {Math.abs(data.percentageChange)}%
          </div>
        )}

        {/* "Vs last ..." text */}
        <span className="text-gray-500 text-xs">Vs {getVsLabel(filter)}</span>
      </div>

      {data && (
        <div className="mt-2 text-xs text-gray-500">
          Total Orders: {data.totalOrders.toLocaleString()}
        </div>
      )}
    </div>
  );
};

const RevenueCard: React.FC<{
  title: string;
  endpoint: string;
  token: string | null;
}> = ({ title, endpoint, token }) => {
  const [filter, setFilter] = useState("TODAY");
  const data = useRevenueMetric(endpoint, filter, token);

  const FILTER_OPTIONS = [
    "ALL",
    "TODAY",
    "THIS_WEEK",
    "THIS_MONTH",
    "THIS_YEAR",
  ] as const;

    const getRevenueTitle = (filter: string) => {
    switch (filter) {
      case "TODAY":
        return "Today's Total Revenue";
      case "THIS_WEEK":
        return "This Week Total Revenue";
      case "THIS_MONTH":
        return "This Month Total Revenue";
      case "THIS_YEAR":
        return "This Year Total Revenue";
      case "ALL":
      default:
        return "Total Revenue";
    }
  };

  const getVsLabel = (filter: string) => {
    switch (filter) {
      case "ALL":
        return "All";
      case "TODAY":
        return "Yesterday";
      case "THIS_WEEK":
        return "Last Week";
      case "THIS_MONTH":
        return "Last Month";
      case "THIS_YEAR":
        return "Last Year";
      default:
        return filter.replace("_", " ").toLowerCase();
    }
  };

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-5 relative">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-500 font-medium"> {getRevenueTitle(filter)}</div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded-full hover:bg-gray-100">
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {FILTER_OPTIONS.map((f) => (
              <DropdownMenuItem
                key={f}
                onClick={() => setFilter(f)}
                className={filter === f ? "font-semibold text-violet-600" : ""}
              >
                {f.replace("_", " ")}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="text-2xl font-bold">
        ₹{data ? Math.round(Number(data.currentRevenue || 0)).toLocaleString("en-IN") : "..."}
      </div>

      <div className="flex items-center gap-2 mt-1 text-sm">
        {data && (
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-medium
          ${
            data.percentageChange >= 0
              ? "text-green-700 bg-green-100"
              : "text-red-700 bg-red-100"
          }`}
          >
            {data.percentageChange >= 0 ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
            {Math.abs(data.percentageChange).toFixed(2)}%
          </div>
        )}
        <span className="text-gray-500 text-xs">Vs {getVsLabel(filter)}</span>
      </div>

      {data && (
        <div className="mt-2 text-xs text-gray-500">
          Total Revenue: ₹{Math.round(Number(data.totalRevenue || 0)).toLocaleString("en-IN")}
        </div>
      )}
      {data && (
  <div className="mt-3 grid grid-cols-2 gap-2">
    <div className="rounded-xl bg-green-50 px-3 py-2">
      <div className="text-[11px] font-semibold text-green-700">
        Cash
      </div>
      <div className="mt-1 text-sm font-bold text-green-800">
       ₹{Math.round(Number(data.cashAmount || 0)).toLocaleString("en-IN")}
      </div>
    </div>

    <div className="rounded-xl bg-blue-50 px-3 py-2">
      <div className="text-[11px] font-semibold text-blue-700">
        Online / PhonePe
      </div>
      <div className="mt-1 text-sm font-bold text-blue-800">
       ₹{Math.round(Number(data.onlineAmount || 0)).toLocaleString("en-IN")}
      </div>
    </div>
  </div>
)}
    </div>
  );
};

/* ---------- Target: semicircle gauge with dynamic revenue ---------- */
const TargetCard: React.FC<{ token?: string | null }> = ({ token }) => {
  const [filter, setFilter] = useState("TODAY");
  const data = useRevenueMetric("/admin/revenueStats", filter, token ?? null);
  const BASE_TARGET = 200000; // ₹ per day target

  const getDynamicTarget = (filter: string): number => {
    const today = new Date();

    switch (filter) {
      case "TODAY":
        return BASE_TARGET;

      case "THIS_WEEK":
        return BASE_TARGET * 7;

      case "THIS_MONTH": {
        const year = today.getFullYear();
        const month = today.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        return BASE_TARGET * daysInMonth;
      }

      case "THIS_YEAR":
        return BASE_TARGET * 365;

      case "ALL": {
        // calculate total days since a fixed start date (e.g., start of business)
        const startDate = new Date("2025-05-01"); // change this to your actual business start date
        const diffTime = today.getTime() - startDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return BASE_TARGET * diffDays;
      }

      default:
        return BASE_TARGET;
    }
  };

  const target = getDynamicTarget(filter);
  const currentRevenue = data?.currentRevenue ?? 0;
  const percentage = Math.min((currentRevenue / target) * 100, 100);
  const diffPercent = data?.percentageChange ?? 0;

  const radius = 90;
  const circumference = Math.PI * radius;
  const dash = (percentage / 100) * circumference;

  const FILTER_OPTIONS = [
    "TODAY",
    "THIS_WEEK",
    "THIS_MONTH",
    "THIS_YEAR",
    "ALL",
  ] as const;

  const getVsLabel = (f: string) => {
    switch (f) {
      case "TODAY":
        return "Yesterday";
      case "THIS_WEEK":
        return "Last Week";
      case "THIS_MONTH":
        return "Last Month";
      case "THIS_YEAR":
        return "Last Year";
      default:
        return "All";
    }
  };

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-5 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-700 font-medium">
          Target vs Performance
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded-full hover:bg-gray-100">
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {FILTER_OPTIONS.map((f) => (
              <DropdownMenuItem
                key={f}
                onClick={() => setFilter(f)}
                className={filter === f ? "font-semibold text-violet-600" : ""}
              >
                {f.replace("_", " ")}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Gauge */}
      <div className="flex items-center justify-center">
        <svg width="420" height="220" viewBox="0 0 420 220">
          {/* Base arc */}
          <path
            d="M50 200 A160 160 0 0 1 370 200"
            fill="none"
            stroke="#eee"
            strokeWidth="20"
            strokeLinecap="round"
          />

          {/* Progress arc */}
          <path
            d="M50 200 A160 160 0 0 1 370 200"
            fill="none"
            stroke="#6d28d9"
            strokeWidth="20"
            strokeLinecap="round"
            strokeDasharray={Math.PI * 160}
            strokeDashoffset={(1 - percentage / 100) * Math.PI * 160}
            style={{
              transition: "stroke-dashoffset 0.8s ease-out",
            }}
          />

          {/* Main percentage text */}
          <text
            x="210"
            y="120"
            textAnchor="middle"
            fill="#111827"
            style={{ fontSize: 28, fontWeight: 800 }}
          >
            {percentage.toFixed(2)}%
          </text>

          {/* Comparison text */}
          <text
            x="210"
            y="145"
            textAnchor="middle"
            fill={diffPercent >= 0 ? "#059669" : "#dc2626"}
            style={{ fontSize: 12, fontWeight: 700 }}
          >
            {diffPercent >= 0 ? "+" : ""}
            {diffPercent.toFixed(2)}% vs {getVsLabel(filter)}
          </text>
        </svg>
      </div>

      {/* Footer summary */}
      <div className="text-center text-xs text-gray-500 -mt-3">
        {`You achieved ₹${currentRevenue.toLocaleString()} / ₹${target.toLocaleString()}`}
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4 text-xs">
        <div className="text-center">
          <div className="text-gray-500">Target</div>
          <div className="font-semibold">₹{target.toLocaleString()}</div>
        </div>
        <div className="text-center">
          <div className="text-gray-500">Revenue</div>
          <div className="font-semibold text-rose-600">
            ₹{currentRevenue.toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-gray-500">Achieved</div>
          <div className="font-semibold text-emerald-600">
            {percentage.toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- Statistic: SVG line chart with static data ---------- */
const StatisticCard: React.FC = () => {
  const token = localStorage.getItem("token");
  const [year, setYear] = useState<number>(2026);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const YEAR_OPTIONS = [2025, 2026, 2027, 2028, 2029, 2030];

  const months = [
    "JANUARY",
    "FEBRUARY",
    "MARCH",
    "APRIL",
    "MAY",
    "JUNE",
    "JULY",
    "AUGUST",
    "SEPTEMBER",
    "OCTOBER",
    "NOVEMBER",
    "DECEMBER",
  ];

  useEffect(() => {
    if (!token) return;
    setLoading(true);

    const fetchData = async () => {
      try {
        const [ordersRes, canceledRes, revenueRes] = await Promise.all([
          api.get(`/admin/bill-stats-counts?year=${year}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get(`/admin/canceled-stats-orders?year=${year}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get(`/admin/revenue-monthly/${year}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const orders: OrderStat[] = Array.isArray(ordersRes.data)
          ? ordersRes.data
          : [];
        const canceled: CancelStat[] = Array.isArray(canceledRes.data)
          ? canceledRes.data
          : [];
        const revenue: RevenueStat[] = Array.isArray(revenueRes.data)
          ? revenueRes.data
          : [];

        // Merge all three by month
        const combined = months.map((m, i) => {
          const monthIndex = i + 1;
          const orderObj = orders.find((o: any) => o.month === monthIndex);
          const cancelObj = canceled.find((c: any) => c.month === monthIndex);
          const revenueObj = revenue.find(
            (r: any) => r.monthName?.toUpperCase() === m,
          );

          return {
            month: m.slice(0, 3), // Short form for chart
            sales: orderObj ? orderObj.billCount : 0,
            canceled: cancelObj ? cancelObj.canceledCount : 0,
            revenue: revenueObj ? revenueObj.totalRevenue : 0,
          };
        });

        setData(combined);
      } catch (error) {
        console.error("Error fetching statistic data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [year, token]);

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-700 font-medium">
          Monthly Statistics
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded-full hover:bg-gray-100">
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {YEAR_OPTIONS.map((y) => (
              <DropdownMenuItem
                key={y}
                onClick={() => setYear(y)}
                className={year === y ? "font-semibold text-violet-600" : ""}
              >
                {y}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="flex items-center justify-center h-56 text-gray-400">
          Loading chart...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart
            data={data}
            margin={{ top: 10, right: 40, left: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />

            {/* Left axis for Sales and Canceled Orders */}
            <YAxis
              yAxisId="left"
              domain={[
                (dataMin: number) =>
                  dataMin > 5 ? Math.floor(dataMin - 5) : 5,
                (dataMax: number) => {
                  if (dataMax <= 100) return 100;
                  if (dataMax <= 250) return 250;
                  if (dataMax <= 500) return 500;
                  if (dataMax <= 1000) return 1000;
                  if (dataMax <= 2500) return 2500;
                  return dataMax + 500;
                },
              ]}
              tickCount={7}
              tickFormatter={(value) => value.toLocaleString()}
              label={{
                value: "Sales, Canceled Orders",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle", fontSize: 11 },
              }}
            />

            {/* Right axis for Revenue */}
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              label={{
                value: "Revenue",
                angle: 90,
                position: "insideRight",
                style: { textAnchor: "middle", fontSize: 11 },
              }}
            />

            <Tooltip
              contentStyle={{
                fontSize: "12px",
                borderRadius: "8px",
              }}
            />
            <Legend />

            {/* Sales */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="sales"
              stroke="#0ea5e9"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              name="Sales"
            />

            {/* Canceled Orders */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="canceled"
              stroke="#ef4444"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              name="Canceled Orders"
            />

            {/* Revenue */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="revenue"
              stroke="#f59e0b"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              name="Revenue"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

const DueAmountCard: React.FC<{ token: string | null }> = ({ token }) => {
  const [dueAmount, setDueAmount] = useState<number | null>(null);

  useEffect(() => {
    const fetchDueAmount = async () => {
      try {
        const response = await api.get<number>("/admin/getTotalDueAmount", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setDueAmount(response.data);
      } catch (error) {
        console.error("Error fetching due amount:", error);
      }
    };

    if (token) fetchDueAmount();
  }, [token]);

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-500 font-medium">Total Order Due Amount</div>
      </div>

      <div className="text-2xl font-bold">
        ₹{dueAmount !== null ? dueAmount.toLocaleString() : "..."}
      </div>

      <div className="text-xs text-gray-500 mt-2">
        Total outstanding due amount from all Customers
      </div>
    </div>
  );
};

const DueLoanAmountCard: React.FC<{ token: string | null }> = ({ token }) => {
  const [dueLoanAmount, setDueLoanAmount] = useState<number | null>(null);

  useEffect(() => {
    const fetchDueLoanAmount = async () => {
      try {
        const response = await api.get<number>("/admin/getTotalLoanDueAmount", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setDueLoanAmount(response.data);
      } catch (error) {
        console.error("Error fetching due amount:", error);
      }
    };

    if (token) fetchDueLoanAmount();
  }, [token]);

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-500 font-medium">Total Loan Due Amount</div>
      </div>

      <div className="text-2xl font-bold">
          ₹{dueLoanAmount !== null
  ? Math.round(dueLoanAmount).toLocaleString("en-IN")
  : "..."}
      </div>

      <div className="text-xs text-gray-500 mt-2">
        Total outstanding Loan due amount from all Loan Customers
      </div>
    </div>
  );
};

const TaggingWorkTable: React.FC = () => {
  const token = localStorage.getItem("token") ?? "";

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const ADMIN_NAMES = ["Devadas", "Navanath", "Manohar"];

  // ============================================================
  // DATA
  // ============================================================

  const [rows, setRows] = useState<TaggingWork[]>([]);
  const [stockBoxes, setStockBoxes] = useState<StockBoxOption[]>([]);
  const [workers, setWorkers] = useState<TaggingWorker[]>([]);

  // ============================================================
  // ASSIGN / EDIT MODAL
  // ============================================================

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [assignedTo, setAssignedTo] = useState("");
  const [givenBy, setGivenBy] = useState("");

  const [stockBoxId, setStockBoxId] = useState("");
  const [stockBoxName, setStockBoxName] = useState("");
  const [showBoxSuggestions, setShowBoxSuggestions] = useState(false);

  const [itemName, setItemName] = useState("");
  const [beforeTagCount, setBeforeTagCount] = useState("");
  const [remarks, setRemarks] = useState("");

  const [adminPassword, setAdminPassword] = useState("");

  // Worker autocomplete
  const [showWorkerSuggestions, setShowWorkerSuggestions] = useState(false);

  // ============================================================
  // VERIFY / RETURN MODAL
  // ============================================================

  const [verifyRow, setVerifyRow] = useState<TaggingWork | null>(null);

  const [returnedCount, setReturnedCount] = useState("");
  const [verifiedBy, setVerifiedBy] = useState("");
  const [verificationRemarks, setVerificationRemarks] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");

  // ============================================================
  // VIEW MODAL
  // ============================================================

  const [viewRow, setViewRow] = useState<TaggingWork | null>(null);

  // ============================================================
  // DELETE MODAL
  // ============================================================

  const [deleteRow, setDeleteRow] = useState<TaggingWork | null>(null);
  const [deletePassword, setDeletePassword] = useState("");

  // ============================================================
  // LOADING STATES
  // ============================================================

  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ============================================================
  // FETCH DATA
  // ============================================================

  const fetchTaggingWorks = async () => {
    try {
      const response = await api.get<TaggingWork[]>(
        "/admin/tagging-work/active",
        {
          headers: authHeaders,
        },
      );

      setRows(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to fetch tagging work", error);
    }
  };

  const fetchStockBoxes = async () => {
    try {
      const response = await api.get<StockBoxOption[]>(
        "/admin/getALlStockBox",
        {
          headers: authHeaders,
        },
      );

      setStockBoxes(
        Array.isArray(response.data) ? response.data : [],
      );
    } catch (error) {
      console.error("Failed to load stock boxes", error);
    }
  };

  const fetchWorkers = async () => {
    try {
      const response = await api.get<TaggingWorker[]>(
        "/admin/tagging-work/workers",
        {
          headers: authHeaders,
        },
      );

      setWorkers(
        Array.isArray(response.data) ? response.data : [],
      );
    } catch (error) {
      console.error("Failed to load tagging workers", error);
    }
  };

  useEffect(() => {
    if (!token) return;

    fetchTaggingWorks();
    fetchStockBoxes();
    fetchWorkers();
  }, []);

  // ============================================================
  // HELPERS
  // ============================================================

  const getErrorMessage = (
    error: any,
    fallback: string,
  ) => {
    return (
      error?.response?.data?.message ||
      error?.response?.data ||
      fallback
    );
  };

  const formatDateTime = (
    value: string | null | undefined,
  ) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getMissingCount = (row: TaggingWork) => {
    if (row.missingCount !== null && row.missingCount !== undefined) {
      return Number(row.missingCount);
    }

    return Math.max(
      Number(row.beforeTagCount || 0) -
        Number(row.afterTagCount || 0),
      0,
    );
  };

  const getStatus = (row: TaggingWork) => {
    if (row.verificationStatus === "ALL_GOOD") {
      return {
        label: "All Good",
        className: "bg-green-100 text-green-700",
      };
    }

    if (row.verificationStatus === "MISSING") {
      return {
        label: "Missing",
        className: "bg-red-100 text-red-700",
      };
    }

    if (row.verifiedDate) {
      return {
        label: "Verified",
        className: "bg-green-100 text-green-700",
      };
    }

    return {
      label: "Pending Return",
      className: "bg-yellow-100 text-yellow-700",
    };
  };

  // ============================================================
  // ASSIGN / EDIT
  // ============================================================

  const resetForm = () => {
    setEditId(null);

    setAssignedTo("");
    setGivenBy("");

    setStockBoxId("");
    setStockBoxName("");
    setShowBoxSuggestions(false);

    setItemName("");
    setBeforeTagCount("");
    setRemarks("");

    setAdminPassword("");

    setShowWorkerSuggestions(false);
  };

  const openAdd = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (row: TaggingWork) => {
    setEditId(row.taggingWorkId);

    setAssignedTo(row.assignedTo ?? "");
    setGivenBy(row.givenBy ?? "");

    setStockBoxId(
      row.stockBoxId !== null &&
        row.stockBoxId !== undefined
        ? String(row.stockBoxId)
        : "",
    );

    setStockBoxName(row.stockBoxName ?? "");
    setItemName(row.itemName ?? "");

    setBeforeTagCount(
      String(row.beforeTagCount ?? ""),
    );

    setRemarks(row.remarks ?? "");

    setAdminPassword("");

    setOpen(true);
  };

  const closeAssignmentModal = () => {
    setOpen(false);
    resetForm();
  };

  // ============================================================
  // STOCK BOX
  // ============================================================

  const handleStockBoxTyping = (value: string) => {
    setStockBoxName(value);

    // Manual box name = no DB StockBox ID
    setStockBoxId("");

    setShowBoxSuggestions(true);
  };

  const selectExistingStockBox = (
    box: StockBoxOption,
  ) => {
    setStockBoxId(String(box.stockBoxId));
    setStockBoxName(box.stockBoxName);
    setShowBoxSuggestions(false);
  };

  const filteredStockBoxes = stockBoxes
    .filter((box) => {
      const search =
        stockBoxName.trim().toLowerCase();

      if (!search) return true;

      return box.stockBoxName
        .toLowerCase()
        .includes(search);
    })
    .sort((a, b) => {
      const search =
        stockBoxName.trim().toLowerCase();

      if (!search) {
        return a.stockBoxName.localeCompare(
          b.stockBoxName,
        );
      }

      const aName =
        a.stockBoxName.toLowerCase();

      const bName =
        b.stockBoxName.toLowerCase();

      if (aName === search && bName !== search) {
        return -1;
      }

      if (bName === search && aName !== search) {
        return 1;
      }

      const aStarts =
        aName.startsWith(search);

      const bStarts =
        bName.startsWith(search);

      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      return aName.localeCompare(bName);
    });

  // ============================================================
  // WORKER AUTOCOMPLETE
  // ============================================================

  const filteredWorkers = workers.filter((worker) => {
    const search =
      assignedTo.trim().toLowerCase();

    if (!search) return true;

    return worker.name
      .toLowerCase()
      .includes(search);
  });

  // ============================================================
  // SAVE ASSIGNMENT / EDIT
  // ============================================================

  const save = async () => {
    if (!assignedTo.trim()) {
      alert("Please enter Assigned To");
      return;
    }

    if (!givenBy.trim()) {
      alert("Please select Given By");
      return;
    }

    if (!stockBoxName.trim()) {
      alert("Please select or enter Stock Box");
      return;
    }

    if (!itemName.trim()) {
      alert("Please enter Item Name");
      return;
    }

    if (
      !beforeTagCount ||
      Number(beforeTagCount) <= 0
    ) {
      alert("Given count must be greater than 0");
      return;
    }

    if (!adminPassword.trim()) {
      alert("Please enter admin password");
      return;
    }

    const payload = {
      assignedTo: assignedTo.trim(),

      givenBy: givenBy.trim(),

      stockBoxId:
        stockBoxId === ""
          ? null
          : Number(stockBoxId),

      stockBoxName: stockBoxName.trim(),

      itemName: itemName.trim(),

      beforeTagCount:
        Number(beforeTagCount),

      remarks:
        remarks.trim() || null,

      adminPassword,
    };

    try {
      setSaving(true);

      if (editId !== null) {
        await api.put(
          `/admin/tagging-work/${editId}`,
          payload,
          {
            headers: authHeaders,
          },
        );
      } else {
        await api.post(
          "/admin/tagging-work",
          payload,
          {
            headers: authHeaders,
          },
        );
      }

      closeAssignmentModal();

      await Promise.all([
        fetchTaggingWorks(),
        fetchWorkers(),
      ]);
    } catch (error: any) {
      console.error(
        "Failed saving tagging work",
        error,
      );

      alert(
        getErrorMessage(
          error,
          "Failed to save tagging work",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // RETURN & VERIFY
  // ============================================================

 const openVerify = (row: TaggingWork) => {
  setVerifyRow(row);

  // If already verified, load previous values for editing
  setReturnedCount(
    row.afterTagCount !== null &&
    row.afterTagCount !== undefined
      ? String(row.afterTagCount)
      : "",
  );

  setVerifiedBy(row.verifiedBy ?? "");

  setVerificationRemarks(
    row.verificationRemarks ?? "",
  );

  // Password must always be entered again
  setVerifyPassword("");
};

  const closeVerify = () => {
    setVerifyRow(null);

    setReturnedCount("");
    setVerifiedBy("");
    setVerificationRemarks("");
    setVerifyPassword("");
  };

  const calculatedMissing = verifyRow
    ? Math.max(
        Number(verifyRow.beforeTagCount || 0) -
          Number(returnedCount || 0),
        0,
      )
    : 0;

  const verificationResult =
    verifyRow && returnedCount !== ""
      ? Number(returnedCount) ===
        Number(verifyRow.beforeTagCount)
        ? "ALL_GOOD"
        : "MISSING"
      : "";

  const verifyReturn = async () => {
    if (!verifyRow) return;

    if (returnedCount === "") {
      alert("Please enter returned count");
      return;
    }

    const returned =
      Number(returnedCount);

    if (
      !Number.isInteger(returned) ||
      returned < 0
    ) {
      alert(
        "Returned count must be a valid whole number",
      );
      return;
    }

    if (
      returned >
      Number(verifyRow.beforeTagCount)
    ) {
      alert(
        "Returned count cannot be greater than given count",
      );
      return;
    }

    if (!verifiedBy) {
      alert("Please select Verified By");
      return;
    }

    if (
      returned <
        Number(verifyRow.beforeTagCount) &&
      !verificationRemarks.trim()
    ) {
      alert(
        "Please enter remarks for the missing pieces",
      );
      return;
    }

    if (!verifyPassword.trim()) {
      alert("Please enter admin password");
      return;
    }

    const payload = {
      returnedCount: returned,

      verifiedBy,

      verificationRemarks:
        verificationRemarks.trim() || null,

      adminPassword: verifyPassword,
    };

    try {
      setVerifying(true);

      await api.put(
        `/admin/tagging-work/${verifyRow.taggingWorkId}/verify-return`,
        payload,
        {
          headers: authHeaders,
        },
      );

      closeVerify();

      await fetchTaggingWorks();
    } catch (error: any) {
      console.error(
        "Return verification failed",
        error,
      );

      alert(
        getErrorMessage(
          error,
          "Unable to verify returned tagging work",
        ),
      );
    } finally {
      setVerifying(false);
    }
  };

  // ============================================================
  // DELETE
  // ============================================================

  const openDelete = (row: TaggingWork) => {
    setDeleteRow(row);
    setDeletePassword("");
  };

  const closeDelete = () => {
    setDeleteRow(null);
    setDeletePassword("");
  };

  const deleteWork = async () => {
    if (!deleteRow) return;

    if (!deletePassword.trim()) {
      alert("Please enter admin password");
      return;
    }

    const confirmed =
      window.confirm(
        `Delete tagging work for ${deleteRow.itemName}?`,
      );

    if (!confirmed) return;

    try {
      setDeleting(true);

      await api.delete(
        `/admin/tagging-work/${deleteRow.taggingWorkId}`,
        {
          headers: authHeaders,

          data: {
            adminPassword:
              deletePassword,
          },
        },
      );

      closeDelete();

      await fetchTaggingWorks();
    } catch (error: any) {
      console.error(
        "Delete tagging work failed",
        error,
      );

      alert(
        getErrorMessage(
          error,
          "Unable to delete tagging work",
        ),
      );
    } finally {
      setDeleting(false);
    }
  };

  // ============================================================
  // TOTALS
  // ============================================================

  const totalGiven =
    rows.reduce(
      (sum, row) =>
        sum +
        Number(row.beforeTagCount || 0),
      0,
    );

  const totalReturned =
    rows.reduce(
      (sum, row) =>
        sum +
        Number(row.afterTagCount || 0),
      0,
    );

  const totalMissing =
    rows.reduce(
      (sum, row) =>
        sum + getMissingCount(row),
      0,
    );

  // ============================================================
  // UI
  // ============================================================

  return (
    <>
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 md:p-5">

        {/* HEADER */}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">

          <div>
            <div className="text-lg font-bold text-[#4911a9]">
              RFID Tagging Work
            </div>

            <div className="mt-1 text-xs text-gray-500">
              Track RFID work from hand-over to return verification
            </div>
          </div>

          <button
            onClick={openAdd}
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700"
          >
            + Assign Tagging Work
          </button>

        </div>

        {/* TOTAL CARDS */}

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">

          <div className="rounded-xl bg-blue-50 p-3">
            <div className="text-xs font-semibold text-blue-600">
              Total Given
            </div>

            <div className="mt-1 text-xl font-bold text-blue-800">
              {totalGiven}
            </div>
          </div>

          <div className="rounded-xl bg-green-50 p-3">
            <div className="text-xs font-semibold text-green-600">
              Total Returned
            </div>

            <div className="mt-1 text-xl font-bold text-green-800">
              {totalReturned}
            </div>
          </div>

          <div className="rounded-xl bg-red-50 p-3">
            <div className="text-xs font-semibold text-red-600">
              Missing
            </div>

            <div className="mt-1 text-xl font-bold text-red-800">
              {totalMissing}
            </div>
          </div>

        </div>

        {/* DESKTOP TABLE */}

        <div className="hidden overflow-x-auto md:block">

          <table className="w-full min-w-[1250px] border-collapse overflow-hidden rounded-xl border">

            <thead className="bg-gray-100">

              <tr>
                <th className="border px-3 py-2">
                  Assigned To
                </th>

                <th className="border px-3 py-2">
                  Given By
                </th>

                <th className="border px-3 py-2">
                  Stock Box
                </th>

                <th className="border px-3 py-2">
                  Item
                </th>

                <th className="border px-3 py-2">
                  Given
                </th>

                <th className="border px-3 py-2">
                  Returned
                </th>

                <th className="border px-3 py-2">
                  Missing
                </th>

                <th className="border px-3 py-2">
                  Status
                </th>

                <th className="border px-3 py-2">
                  Actions
                </th>
              </tr>

            </thead>

            <tbody>

              {rows.length === 0 ? (

                <tr>
                  <td
                    colSpan={9}
                    className="border px-4 py-8 text-center text-sm text-gray-500"
                  >
                    No active RFID tagging work
                  </td>
                </tr>

              ) : (

                rows.map((row) => {

                  const status =
                    getStatus(row);

                  const missing =
                    getMissingCount(row);

                  return (

                    <tr
                      key={row.taggingWorkId}
                      className="bg-white"
                    >

                      <td className="border px-3 py-3 text-center font-semibold">
                        {row.assignedTo}
                      </td>

                      <td className="border px-3 py-3 text-center">
                        {row.givenBy || "-"}
                      </td>

                      <td className="border px-3 py-3 text-center">
                        {row.stockBoxName}
                      </td>

                      <td className="border px-3 py-3 text-center">
                        {row.itemName}
                      </td>

                      <td className="border px-3 py-3 text-center font-bold text-blue-700">
                        {row.beforeTagCount}
                      </td>

                      <td className="border px-3 py-3 text-center font-bold text-green-700">
                        {row.afterTagCount ?? 0}
                      </td>

                      <td
                        className={`border px-3 py-3 text-center font-bold ${
                          missing > 0
                            ? "text-red-600"
                            : "text-green-700"
                        }`}
                      >
                        {missing}
                      </td>

                      <td className="border px-3 py-3 text-center">

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${status.className}`}
                        >
                          {status.label}
                        </span>

                      </td>

                      <td className="border px-3 py-3">

                        <div className="flex flex-wrap justify-center gap-2">

                          <button
                            onClick={() =>
                              setViewRow(row)
                            }
                            className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                          >
                            View
                          </button>

                          {!row.verifiedDate && (

                            <button
                              onClick={() =>
                                openEdit(row)
                              }
                              className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                            >
                              Edit
                            </button>

                          )}

                         {!row.archived && (
  <button
    type="button"
    onClick={() => openVerify(row)}
    className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100"
  >
    {row.verifiedDate
      ? "Edit Return"
      : "Return & Verify"}
  </button>
)}

                          <button
                            onClick={() =>
                              openDelete(row)
                            }
                            className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>
                  );
                })
              )}

            </tbody>

          </table>

        </div>

        {/* MOBILE */}

        <div className="space-y-3 md:hidden">

          {rows.length === 0 && (

            <div className="rounded-xl border p-5 text-center text-sm text-gray-500">
              No active RFID tagging work
            </div>

          )}

          {rows.map((row) => {

            const status =
              getStatus(row);

            const missing =
              getMissingCount(row);

            return (

              <div
                key={row.taggingWorkId}
                className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
              >

                <div className="flex items-start justify-between gap-3">

                  <div>
                    <div className="text-xs text-gray-500">
                      Assigned To
                    </div>

                    <div className="font-bold text-violet-700">
                      {row.assignedTo}
                    </div>

                    <div className="mt-1 text-[11px] text-gray-500">
                      Given by {row.givenBy || "-"}
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${status.className}`}
                  >
                    {status.label}
                  </span>

                </div>

                <div className="mt-3 text-sm font-semibold">
                  {row.itemName}
                </div>

                <div className="text-xs text-gray-500">
                  {row.stockBoxName}
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">

                  <div className="rounded-xl bg-white p-2 text-center">
                    <div className="text-[10px] text-gray-500">
                      Given
                    </div>

                    <div className="font-bold text-blue-700">
                      {row.beforeTagCount}
                    </div>
                  </div>

                  <div className="rounded-xl bg-white p-2 text-center">
                    <div className="text-[10px] text-gray-500">
                      Returned
                    </div>

                    <div className="font-bold text-green-700">
                      {row.afterTagCount ?? 0}
                    </div>
                  </div>

                  <div className="rounded-xl bg-white p-2 text-center">
                    <div className="text-[10px] text-gray-500">
                      Missing
                    </div>

                    <div
                      className={`font-bold ${
                        missing > 0
                          ? "text-red-600"
                          : "text-green-700"
                      }`}
                    >
                      {missing}
                    </div>
                  </div>

                </div>

                <div className="mt-3 flex flex-wrap gap-2">

                  <button
                    onClick={() =>
                      setViewRow(row)
                    }
                    className="flex-1 rounded-xl bg-gray-600 px-3 py-2 text-xs font-bold text-white"
                  >
                    View
                  </button>

                  {!row.verifiedDate && (

                    <button
                      onClick={() =>
                        openEdit(row)
                      }
                      className="flex-1 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white"
                    >
                      Edit
                    </button>

                  )}

                  {!row.verifiedDate && (

                    <button
                      onClick={() =>
                        openVerify(row)
                      }
                      className="flex-1 rounded-xl bg-green-600 px-3 py-2 text-xs font-bold text-white"
                    >
                      Return
                    </button>

                  )}

                </div>

              </div>
            );
          })}

        </div>

      </div>

      {/* ======================================================
          ASSIGN / EDIT MODAL
      ====================================================== */}

      {open && (

        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">

            <div className="mb-5 flex items-center justify-between">

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editId
                    ? "Edit RFID Tagging Work"
                    : "Assign RFID Tagging Work"}
                </h2>

                <p className="text-xs text-gray-500">
                  Record who received the items and who handed them over
                </p>
              </div>

              <button
                type="button"
                onClick={closeAssignmentModal}
                className="text-2xl text-gray-500"
              >
                ×
              </button>

            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              {/* ASSIGNED TO */}

              <label className="relative block">

                <span className="text-xs font-semibold text-gray-600">
                  Assigned To *
                </span>

                <input
                  type="text"
                  value={assignedTo}
                  onChange={(e) => {
                    setAssignedTo(
                      e.target.value,
                    );

                    setShowWorkerSuggestions(
                      true,
                    );
                  }}
                  onFocus={() =>
                    setShowWorkerSuggestions(
                      true,
                    )
                  }
                  placeholder="Type or select worker"
                  autoComplete="off"
                  className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500"
                />

                {showWorkerSuggestions && (

                  <div className="absolute z-[10001] mt-1 max-h-52 w-full overflow-y-auto rounded-xl border bg-white shadow-xl">

                    {filteredWorkers.map(
                      (worker) => (

                        <button
                          key={
                            worker.taggingWorkerId
                          }
                          type="button"
                          onMouseDown={(e) =>
                            e.preventDefault()
                          }
                          onClick={() => {
                            setAssignedTo(
                              worker.name,
                            );

                            setShowWorkerSuggestions(
                              false,
                            );
                          }}
                          className="block w-full border-b px-4 py-2 text-left text-sm hover:bg-violet-50"
                        >
                          {worker.name}
                        </button>

                      ),
                    )}

                    {assignedTo.trim() &&
                      !workers.some(
                        (worker) =>
                          worker.name
                            .trim()
                            .toLowerCase() ===
                          assignedTo
                            .trim()
                            .toLowerCase(),
                      ) && (

                        <button
                          type="button"
                          onMouseDown={(e) =>
                            e.preventDefault()
                          }
                          onClick={() =>
                            setShowWorkerSuggestions(
                              false,
                            )
                          }
                          className="block w-full bg-violet-50 px-4 py-3 text-left"
                        >
                          <div className="text-[10px] font-semibold uppercase text-violet-500">
                            New worker
                          </div>

                          <div className="font-bold text-violet-800">
                            {assignedTo}
                          </div>
                        </button>

                      )}

                  </div>

                )}

              </label>

              {/* GIVEN BY */}

              <label className="block">

                <span className="text-xs font-semibold text-gray-600">
                  Given By *
                </span>

                <select
                  value={givenBy}
                  onChange={(e) =>
                    setGivenBy(
                      e.target.value,
                    )
                  }
                  className="mt-1 w-full rounded-xl border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">
                    Select admin
                  </option>

                  {ADMIN_NAMES.map(
                    (name) => (
                      <option
                        key={name}
                        value={name}
                      >
                        {name}
                      </option>
                    ),
                  )}

                </select>

              </label>

              {/* STOCK BOX */}

              <label className="relative block">

                <span className="text-xs font-semibold text-gray-600">
                  Stock Box *
                </span>

                <input
                  type="text"
                  value={stockBoxName}
                  onChange={(e) =>
                    handleStockBoxTyping(
                      e.target.value,
                    )
                  }
                  onFocus={() =>
                    setShowBoxSuggestions(
                      true,
                    )
                  }
                  placeholder="Type or select Stock Box"
                  autoComplete="off"
                  className="mt-1 w-full rounded-xl border px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-violet-500"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowBoxSuggestions(
                      (prev) => !prev,
                    )
                  }
                  className="absolute right-3 top-[34px] text-gray-500"
                >
                  ▼
                </button>

                {showBoxSuggestions && (

                  <div className="absolute z-[10000] mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">

                    {stockBoxName.trim() !== "" &&
                      !stockBoxes.some(
                        (box) =>
                          box.stockBoxName
                            .trim()
                            .toLowerCase() ===
                          stockBoxName
                            .trim()
                            .toLowerCase(),
                      ) && (

                        <button
                          type="button"
                          onMouseDown={(e) =>
                            e.preventDefault()
                          }
                          onClick={() => {
                            setStockBoxId("");
                            setShowBoxSuggestions(
                              false,
                            );
                          }}
                          className="w-full border-b bg-violet-50 px-4 py-3 text-left hover:bg-violet-100"
                        >
                          <div className="text-[11px] font-semibold uppercase text-violet-500">
                            Use temporary box name
                          </div>

                          <div className="mt-0.5 font-bold text-violet-800">
                            {stockBoxName}
                          </div>
                        </button>

                      )}

                    {filteredStockBoxes.length > 0 ? (

                      filteredStockBoxes.map(
                        (box) => {

                          const selected =
                            String(
                              box.stockBoxId,
                            ) ===
                            stockBoxId;

                          return (

                            <button
                              type="button"
                              key={
                                box.stockBoxId
                              }
                              onMouseDown={(e) =>
                                e.preventDefault()
                              }
                              onClick={() =>
                                selectExistingStockBox(
                                  box,
                                )
                              }
                              className={`w-full border-b px-4 py-3 text-left last:border-b-0 hover:bg-gray-50 ${
                                selected
                                  ? "bg-green-50"
                                  : "bg-white"
                              }`}
                            >

                              <div className="flex items-center justify-between gap-3">

                                <span className="text-sm font-medium text-gray-800">
                                  {
                                    box.stockBoxName
                                  }
                                </span>

                                {selected && (

                                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                                    Selected
                                  </span>

                                )}

                              </div>

                            </button>
                          );
                        },
                      )

                    ) : (

                      <div className="px-4 py-4 text-center text-sm text-gray-400">
                        No matching Stock Boxes
                      </div>

                    )}

                  </div>

                )}

                {stockBoxName.trim() !== "" && (

                  <div className="mt-1">

                    {stockBoxId ? (

                      <span className="text-[11px] font-semibold text-green-600">
                        ✓ Existing Stock Box
                      </span>

                    ) : (

                      <span className="text-[11px] font-semibold text-orange-500">
                        Temporary / Manual Box Name
                      </span>

                    )}

                  </div>

                )}

              </label>

              {/* ITEM */}

              <label className="block">

                <span className="text-xs font-semibold text-gray-600">
                  Item Name *
                </span>

                <input
                  value={itemName}
                  onChange={(e) =>
                    setItemName(
                      e.target.value,
                    )
                  }
                  placeholder="Example: Pustha"
                  className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500"
                />

              </label>

              {/* GIVEN COUNT */}

              <label className="block">

                <span className="text-xs font-semibold text-gray-600">
                  Pieces Given *
                </span>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={beforeTagCount}
                  onChange={(e) =>
                    setBeforeTagCount(
                      e.target.value,
                    )
                  }
                  className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500"
                />

              </label>

              {/* PASSWORD */}

              <label className="block">

                <span className="text-xs font-semibold text-gray-600">
                  Admin Password *
                </span>

                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) =>
                    setAdminPassword(
                      e.target.value,
                    )
                  }
                  autoComplete="new-password"
                  placeholder="Enter admin password"
                  className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500"
                />

              </label>

              {/* REMARKS */}

              <label className="block sm:col-span-2">

                <span className="text-xs font-semibold text-gray-600">
                  Assignment Remarks
                </span>

                <textarea
                  value={remarks}
                  onChange={(e) =>
                    setRemarks(
                      e.target.value,
                    )
                  }
                  rows={3}
                  placeholder="Optional remarks"
                  className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500"
                />

              </label>

            </div>

            <div className="mt-5 flex justify-end gap-2">

              <button
                type="button"
                onClick={closeAssignmentModal}
                disabled={saving}
                className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-600"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="rounded-xl bg-violet-600 px-5 py-2 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editId
                    ? "Update"
                    : "Assign Work"}
              </button>

            </div>

          </div>

        </div>

      )}

      {/* ======================================================
          RETURN / VERIFY MODAL
      ====================================================== */}

      {verifyRow && (

        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">

          <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl">

            <div className="mb-4 flex items-center justify-between">

              <div>
                <h2 className="text-xl font-bold">
                  Return & Verify
                </h2>

                <p className="text-xs text-gray-500">
                  Confirm items received back from the worker
                </p>
              </div>

              <button
                type="button"
                onClick={closeVerify}
                className="text-2xl text-gray-500"
              >
                ×
              </button>

            </div>

            <div className="mb-4 rounded-xl bg-gray-50 p-4">

              <div className="grid grid-cols-2 gap-3 text-sm">

                <div>
                  <div className="text-xs text-gray-500">
                    Assigned To
                  </div>

                  <div className="font-bold">
                    {verifyRow.assignedTo}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500">
                    Given By
                  </div>

                  <div className="font-bold">
                    {verifyRow.givenBy || "-"}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500">
                    Item
                  </div>

                  <div className="font-bold">
                    {verifyRow.itemName}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500">
                    Given
                  </div>

                  <div className="font-bold text-blue-700">
                    {verifyRow.beforeTagCount}
                  </div>
                </div>

              </div>

            </div>

            <div className="space-y-4">

              <label className="block">

                <span className="text-xs font-semibold text-gray-600">
                  Returned Count *
                </span>

                <input
                  type="number"
                  min="0"
                  step="1"
                  max={
                    verifyRow.beforeTagCount
                  }
                  value={returnedCount}
                  onChange={(e) =>
                    setReturnedCount(
                      e.target.value,
                    )
                  }
                  className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500"
                />

              </label>

              {returnedCount !== "" && (

                <div className="grid grid-cols-2 gap-3">

                  <div
                    className={`rounded-xl p-3 ${
                      calculatedMissing > 0
                        ? "bg-red-50"
                        : "bg-green-50"
                    }`}
                  >
                    <div className="text-xs text-gray-500">
                      Missing
                    </div>

                    <div
                      className={`text-xl font-bold ${
                        calculatedMissing > 0
                          ? "text-red-700"
                          : "text-green-700"
                      }`}
                    >
                      {calculatedMissing}
                    </div>
                  </div>

                  <div
                    className={`rounded-xl p-3 ${
                      verificationResult ===
                      "ALL_GOOD"
                        ? "bg-green-50"
                        : "bg-red-50"
                    }`}
                  >
                    <div className="text-xs text-gray-500">
                      Result
                    </div>

                    <div
                      className={`font-bold ${
                        verificationResult ===
                        "ALL_GOOD"
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {verificationResult ===
                      "ALL_GOOD"
                        ? "ALL GOOD"
                        : "MISSING"}
                    </div>
                  </div>

                </div>

              )}

              <label className="block">

                <span className="text-xs font-semibold text-gray-600">
                  Verified By *
                </span>

                <select
                  value={verifiedBy}
                  onChange={(e) =>
                    setVerifiedBy(
                      e.target.value,
                    )
                  }
                  className="mt-1 w-full rounded-xl border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">
                    Select verifier
                  </option>

                  {ADMIN_NAMES.map(
                    (name) => (
                      <option
                        key={name}
                        value={name}
                      >
                        {name}
                      </option>
                    ),
                  )}

                </select>

              </label>

              <label className="block">

                <span className="text-xs font-semibold text-gray-600">
                  Verification Remarks
                  {calculatedMissing > 0
                    ? " *"
                    : ""}
                </span>

                <textarea
                  value={
                    verificationRemarks
                  }
                  onChange={(e) =>
                    setVerificationRemarks(
                      e.target.value,
                    )
                  }
                  rows={3}
                  placeholder={
                    calculatedMissing > 0
                      ? "Explain the missing pieces"
                      : "Example: All pieces received correctly"
                  }
                  className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500"
                />

              </label>

              <label className="block">

                <span className="text-xs font-semibold text-gray-600">
                  Admin Password *
                </span>

                <input
                  type="password"
                  value={verifyPassword}
                  onChange={(e) =>
                    setVerifyPassword(
                      e.target.value,
                    )
                  }
                  autoComplete="new-password"
                  placeholder="Enter admin password"
                  className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500"
                />

              </label>

            </div>

            <div className="mt-5 flex justify-end gap-2">

              <button
                type="button"
                onClick={closeVerify}
                disabled={verifying}
                className="rounded-xl border px-4 py-2 text-sm font-semibold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={verifyReturn}
                disabled={verifying}
                className="rounded-xl bg-green-600 px-5 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {verifying
                  ? "Verifying..."
                  : "Verify Return"}
              </button>

            </div>

          </div>

        </div>

      )}

      {/* ======================================================
          VIEW DETAILS MODAL
      ====================================================== */}

      {viewRow && (

        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">

            <div className="mb-5 flex items-center justify-between">

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  RFID Tagging Work Details
                </h2>

                <p className="text-xs text-gray-500">
                  Complete assignment and return history
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setViewRow(null)
                }
                className="text-2xl text-gray-500"
              >
                ×
              </button>

            </div>

            {/* ASSIGNMENT */}

            <div className="rounded-xl border p-4">

              <div className="mb-3 font-bold text-violet-700">
                Assignment
              </div>

              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">

                <Detail
                  label="Assigned To"
                  value={viewRow.assignedTo}
                />

                <Detail
                  label="Given By"
                  value={viewRow.givenBy || "-"}
                />

                <Detail
                  label="Assigned Date & Time"
                  value={formatDateTime(
                    viewRow.assignedDate,
                  )}
                />

                <Detail
                  label="Stock Box"
                  value={viewRow.stockBoxName}
                />

                <Detail
                  label="Item Name"
                  value={viewRow.itemName}
                />

                <Detail
                  label="Given Count"
                  value={String(
                    viewRow.beforeTagCount,
                  )}
                />

                <Detail
                  label="Assignment Remarks"
                  value={
                    viewRow.remarks || "-"
                  }
                />

              </div>

            </div>

            {/* RETURN */}

            <div className="mt-4 rounded-xl border p-4">

              <div className="mb-3 font-bold text-green-700">
                Return & Verification
              </div>

              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">

                <Detail
                  label="Returned Count"
                  value={String(
                    viewRow.afterTagCount ??
                      0,
                  )}
                />

                <Detail
                  label="Missing Count"
                  value={String(
                    getMissingCount(
                      viewRow,
                    ),
                  )}
                />

                <Detail
                  label="Verification Result"
                  value={
                    viewRow.verificationStatus
                      ? viewRow.verificationStatus.replace(
                          "_",
                          " ",
                        )
                      : "Not verified"
                  }
                />

                <Detail
                  label="Verified By"
                  value={
                    viewRow.verifiedBy ||
                    "-"
                  }
                />

                <Detail
                  label="Returned Date & Time"
                  value={formatDateTime(
                    viewRow.returnedDate,
                  )}
                />

                <Detail
                  label="Verified Date & Time"
                  value={formatDateTime(
                    viewRow.verifiedDate,
                  )}
                />

                <Detail
                  label="Verification Remarks"
                  value={
                    viewRow.verificationRemarks ||
                    "-"
                  }
                />

                <Detail
                  label="Status"
                  value={
                    viewRow.status || "-"
                  }
                />

              </div>

            </div>

            <div className="mt-5 flex justify-end">

              <button
                type="button"
                onClick={() =>
                  setViewRow(null)
                }
                className="rounded-xl bg-gray-800 px-5 py-2 text-sm font-bold text-white"
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

      {/* ======================================================
          DELETE PASSWORD MODAL
      ====================================================== */}

      {deleteRow && (

        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">

          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">

            <h2 className="text-lg font-bold text-red-700">
              Delete RFID Tagging Work
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Delete work for{" "}
              <strong>
                {deleteRow.itemName}
              </strong>
              ?
            </p>

            <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700">
              The backend will allow deletion only when the work satisfies its deletion rules.
            </div>

            <label className="mt-4 block">

              <span className="text-xs font-semibold text-gray-600">
                Admin Password *
              </span>

              <input
                type="password"
                value={deletePassword}
                onChange={(e) =>
                  setDeletePassword(
                    e.target.value,
                  )
                }
                autoComplete="new-password"
                placeholder="Enter admin password"
                className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
              />

            </label>

            <div className="mt-5 flex justify-end gap-2">

              <button
                type="button"
                onClick={closeDelete}
                disabled={deleting}
                className="rounded-xl border px-4 py-2 text-sm font-semibold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={deleteWork}
                disabled={deleting}
                className="rounded-xl bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting
                  ? "Deleting..."
                  : "Delete"}
              </button>

            </div>

          </div>

        </div>

      )}

    </>
  );
};


// Small reusable component used by View modal
const Detail: React.FC<{
  label: string;
  value: string;
}> = ({ label, value }) => {
  return (
    <div>
      <div className="text-xs text-gray-500">
        {label}
      </div>

      <div className="mt-0.5 break-words font-semibold text-gray-800">
        {value}
      </div>
    </div>
  );
};


/* ---------- Latest Orders: static table ---------- */
const LatestOrders: React.FC = () => {
  const [rows, setRows] = useState<Billing[]>([]);

  const navigate = useNavigate();

  const fetchBillingRows = async () => {
    try {
      const token = localStorage.getItem("token") ?? "";
      const { data } = await api.get<Billing[]>(`/admin/today-bills`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch Todays bills:", e);
    }
  };

  const totalTodayOrders = rows.length;

const deliveredTodayOrders = rows.filter(
  (r) => normalizeStatus(r.deliveryStatus) === "delivered"
).length;

const canceledTodayOrders = rows.filter(
  (r) =>
    ["cancelled", "canceled"].includes(
      (r.deliveryStatus || "").trim().toLowerCase()
    )
).length;

const pendingTodayOrders = rows.filter(
  (r) => normalizeStatus(r.deliveryStatus) === "pending"
).length;


  useEffect(() => {
    fetchBillingRows();
  }, []);

  const handleCheckboxChange = async (billId: number, checked: boolean) => {
    // optimistic update
    setRows((prev) =>
      prev.map((row) =>
        Number(row.billId) === Number(billId) ? { ...row, checked } : row,
      ),
    );

    console.log("API Base URL:", api.defaults.baseURL);
    console.log(
      "PATCH URL:",
      `/admin/billing/${billId}/checkbox?checked=${checked}`,
    );

    try {
      const token = localStorage.getItem("token") ?? "";

      await api.patch(
        `/admin/billing/${billId}/checkbox?checked=${checked}`,
        null,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      );
      fetchBillingRows();
    } catch (err) {
      console.error("Checkbox update failed", err);

      // rollback
      setRows((prev) =>
        prev.map((row) =>
          Number(row.billId) === Number(billId)
            ? { ...row, checked: !checked }
            : row,
        ),
      );
    }
  };

  const renderStatusChip = (raw: string) => {
    const n = normalizeStatus(raw);
    if (n === "delivered")
      return (
        <Chip
          label="Delivered"
          size="small"
          sx={{ bgcolor: "#d9f7d9", color: "#1b5e20", fontWeight: 600 }}
        />
      );
    if (n === "pending")
      return (
        <Chip
          label="Pending"
          size="small"
          sx={{ bgcolor: "#fff3e0", color: "#e65100", fontWeight: 600 }}
        />
      );
    return (
      <Chip
        label={raw || "-"}
        size="small"
        sx={{ bgcolor: "#eeeeee", color: "#424242" }}
      />
    );
  };

  

  return (
  <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 md:p-5">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
  <div className="text-lg font-bold text-[#85400b]">
    Today's Order
  </div>

  <div className="flex flex-wrap gap-2">
    <span className="rounded-full bg-blue-100 px-4 py-1 text-[13px] font-bold text-blue-700">
      Total: {totalTodayOrders}
    </span>

    <span className="rounded-full bg-green-100 px-4 py-1 text-[13px] font-bold text-green-700">
      Delivered: {deliveredTodayOrders}
    </span>

    <span className="rounded-full bg-yellow-100 px-4 py-1 text-[13px] font-bold text-yellow-700">
      Pending: {pendingTodayOrders}
    </span>

    <span className="rounded-full bg-red-100 px-4 py-1 text-[13px] font-bold text-red-700">
      Canceled: {canceledTodayOrders}
    </span>
  </div>
</div>

    {/* Mobile card view */}
    <div className="space-y-3 md:hidden">
      {rows.length === 0 ? (
        <div className="rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-500">
          No orders found today
        </div>
      ) : (
        rows.map((r) => {
          const isDelivered =
            normalizeStatus(r.deliveryStatus) === "delivered";

          return (
            <div
              key={r.billId}
              className="rounded-2xl border border-gray-100 bg-[#fffaf0] p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-gray-500">Bill No</div>
                  <div className="font-bold text-blue-700">{r.billNumber}</div>
                </div>

                <input
                  type="checkbox"
                  checked={Boolean(r.checked)}
                  disabled={isDelivered}
                  onChange={(e) =>
                    handleCheckboxChange(Number(r.billId), e.target.checked)
                  }
                  className={`jewel-checkbox ${isDelivered ? "disabled" : ""}`}
                />
              </div>

              <div className="mt-3 text-sm">
                <div className="font-bold text-[#b6276f]">{r.name}</div>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-white p-2">
                    <div className="text-[11px] text-gray-500">Total</div>
                    <div className="font-bold text-[#e38111]">
                      ₹{Number(r.billTotalAmount || 0).toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div className="rounded-xl bg-white p-2">
                    <div className="text-[11px] text-gray-500">Due</div>
                    <div className="font-bold text-red-600">
                      ₹{Number(r.billDueAmount || 0).toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  {renderStatusChip(r.workStatus)}
                  {renderStatusChip(r.deliveryStatus)}
                </div>

                <button
                  onClick={() => {
                    localStorage.setItem("billNumber", r.billNumber);
                    navigate("/admin/bill-details");
                  }}
                  className="rounded-full bg-[#85400b] px-4 py-2 text-xs font-bold text-white"
                >
                  View
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>

    {/* Desktop table view */}
    <div className="mt-4 hidden overflow-x-auto md:block">
      <table className="min-w-[850px] w-full border-collapse border border-gray-300 rounded-xl overflow-hidden">
        <thead className="bg-gray-200">
          <tr>
            <th className="border px-3 py-2 text-center">Check</th>
            <th className="border px-3 py-2 text-center">Bill Number</th>
            <th className="border px-3 py-2 text-center">Name</th>
            <th className="border px-3 py-2 text-center">Total</th>
            <th className="border px-3 py-2 text-center">Due</th>
            <th className="border px-3 py-2 text-center">Work</th>
            <th className="border px-3 py-2 text-center">Status</th>
            <th className="border px-3 py-2 text-center">View</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {rows.map((r) => {
            const isDelivered =
              normalizeStatus(r.deliveryStatus) === "delivered";

            return (
              <tr key={r.billId} className="bg-white">
                <td className="border px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={Boolean(r.checked)}
                    disabled={isDelivered}
                    onChange={(e) =>
                      handleCheckboxChange(Number(r.billId), e.target.checked)
                    }
                    className={`jewel-checkbox ${isDelivered ? "disabled" : ""}`}
                  />
                </td>

                <td className="border px-3 py-2 text-center font-semibold text-[#4911a9]">
                  {r.billNumber}
                </td>

                <td className="border px-3 py-2 text-center font-semibold text-[#b6276f]">
                  {r.name}
                </td>

                <td className="border px-3 py-2 text-center font-semibold text-[#e38111]">
                  {r.billTotalAmount}
                </td>

                <td className="border px-3 py-2 text-center font-semibold text-red-600">
                  {r.billDueAmount}
                </td>

                <td className="border px-3 py-2 text-center">
                  {renderStatusChip(r.workStatus)}
                </td>

                <td className="border px-3 py-2 text-center">
                  {renderStatusChip(r.deliveryStatus)}
                </td>

                <td className="border px-3 py-2 text-center">
                  <IconButton
                    size="medium"
                    color="primary"
                    onClick={() => {
                      localStorage.setItem("billNumber", r.billNumber);
                      navigate("/admin/bill-details");
                    }}
                  >
                    <VisibilityIcon fontSize="medium" />
                  </IconButton>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);
};

const LatestLoanOrders: React.FC = () => {
  const [rows, setRows] = useState<LoanBill[]>([]);

  const navigate = useNavigate();

  const fetchLoanBillingRows = async () => {
    try {
      const token = localStorage.getItem("token") ?? "";
      const { data } = await api.get<LoanBill[]>(`/admin/today-loan-bills`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch Todays Loan bills:", e);
    }
  };

  useEffect(() => {
    fetchLoanBillingRows();
  }, []);

  const handleLoanCheckboxChange = async (
    loanBillId: number,
    checked: boolean,
  ) => {
    // optimistic update
    setRows((prev) =>
      prev.map((row) =>
        Number(row.loanBillId) === Number(loanBillId)
          ? { ...row, checked }
          : row,
      ),
    );

    try {
      const token = localStorage.getItem("token") ?? "";

      await api.patch(
        `/admin/loanBilling/${loanBillId}/checkbox?checked=${checked}`,
        null,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      );
      fetchLoanBillingRows();
    } catch (err) {
      console.error("Checkbox update failed", err);

      // rollback
      setRows((prev) =>
        prev.map((row) =>
          Number(row.loanBillId) === Number(loanBillId)
            ? { ...row, checked: !checked }
            : row,
        ),
      );
    }
  };

const totalTodayLoanOrders = rows.length;

const packedTodayLoanOrders = rows.filter(
  (r) => (r.itemStatus || "").trim().toLowerCase() === "packed"
).length;

const notPackedTodayLoanOrders = rows.filter((r) =>
  ["pending", "not packed", "not_packed", "notpacked"].includes(
    (r.itemStatus || "").trim().toLowerCase()
  )
).length;

  const renderStatusChip = (raw: string) => {
    const n = normalizeStatus(raw);
    if (n === "delivered")
      return (
        <Chip
          label="Delivered"
          size="small"
          sx={{ bgcolor: "#d9f7d9", color: "#1b5e20", fontWeight: 600 }}
        />
      );
    if (n === "pending")
      return (
        <Chip
          label="Pending"
          size="small"
          sx={{ bgcolor: "#fff3e0", color: "#e65100", fontWeight: 600 }}
        />
      );
    return (
      <Chip
        label={raw || "-"}
        size="small"
        sx={{ bgcolor: "#eeeeee", color: "#424242" }}
      />
    );
  };

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-5">
     <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
  <div className="text-lg font-bold text-[#85400b]">
    Today's Loan Order
  </div>

  <div className="flex flex-wrap gap-2">
    <span className="rounded-full bg-blue-100 px-4 py-2 text-[13px] font-bold text-blue-700">
      Total: {totalTodayLoanOrders}
    </span>

    <span className="rounded-full bg-green-100 px-4 py-2 text-[13px] font-bold text-green-700">
      Packed: {packedTodayLoanOrders}
    </span>

    <span className="rounded-full bg-orange-100 px-4 py-2 text-[13px] font-bold text-orange-700">
      Not Packed: {notPackedTodayLoanOrders}
    </span>
  </div>
</div>
     {/* Mobile card view */}
<div className="space-y-3 md:hidden">
  {rows.length === 0 ? (
    <div className="rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-500">
      No loan orders found today
    </div>
  ) : (
    rows.map((r) => {
      const isDelivered =
        normalizeStatus(r.deliveryStatus) === "delivered";

      return (
        <div
          key={r.loanBillId}
          className="rounded-2xl border border-gray-100 bg-[#f8fbff] p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs text-gray-500">Loan Bill No</div>
              <div className="font-bold text-blue-700">{r.loanBillNumber}</div>
            </div>

            <input
              type="checkbox"
              checked={Boolean(r.checked)}
              disabled={isDelivered}
              onChange={(e) =>
                handleLoanCheckboxChange(Number(r.loanBillId), e.target.checked)
              }
              className={`jewel-checkbox ${isDelivered ? "disabled" : ""}`}
            />
          </div>

          <div className="mt-3 font-bold text-[#b6276f]">{r.name}</div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-white p-2">
              <div className="text-[11px] text-gray-500">Total</div>
              <div className="font-bold text-[#e38111]">
                ₹{Number(r.totalAmount || 0).toLocaleString("en-IN")}
              </div>
            </div>

            <div className="rounded-xl bg-white p-2">
              <div className="text-[11px] text-gray-500">Interest Paid</div>
              <div className="font-bold text-red-600">
                ₹{Number(r.paidInterestAmount || 0).toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {renderStatusChip(r.itemStatus)}
              {renderStatusChip(r.deliveryStatus)}
            </div>

            <button
              onClick={() => {
                localStorage.removeItem("billLoanNumber");
                localStorage.removeItem("checkBackFrom");
                localStorage.setItem("billLoanNumber", r.loanBillNumber);
                localStorage.setItem("checkBackFrom", "DashBoard");
                navigate("/admin/bill-loan-details");
              }}
              className="rounded-full bg-[#85400b] px-4 py-2 text-xs font-bold text-white"
            >
              View
            </button>
          </div>
        </div>
      );
    })
  )}
</div>
{/* Desktop table view */}
<div className="mt-4 hidden overflow-x-auto md:block">
  <table className="min-w-[850px] w-full border-collapse border border-gray-300 rounded-xl overflow-hidden">
    <thead className="bg-gray-200">
      <tr>
        <th className="border px-3 py-2 text-center">Check</th>
        <th className="border px-3 py-2 text-center">Loan Bill Number</th>
        <th className="border px-3 py-2 text-center">Name</th>
        <th className="border px-3 py-2 text-center">Total</th>
        <th className="border px-3 py-2 text-center">Interest Paid</th>
        <th className="border px-3 py-2 text-center">Item Status</th>
        <th className="border px-3 py-2 text-center">Delivery Status</th>
        <th className="border px-3 py-2 text-center">View</th>
      </tr>
    </thead>

    <tbody>
      {rows.length === 0 ? (
        <tr>
          <td colSpan={8} className="border px-3 py-4 text-center text-gray-500">
            No loan orders found today
          </td>
        </tr>
      ) : (
        rows.map((r) => {
          const isDelivered =
            normalizeStatus(r.deliveryStatus) === "delivered";

          return (
            <tr key={r.loanBillId} className="bg-white">
              <td className="border px-3 py-2 text-center">
                <input
                  type="checkbox"
                  checked={Boolean(r.checked)}
                  disabled={isDelivered}
                  onChange={(e) =>
                    handleLoanCheckboxChange(
                      Number(r.loanBillId),
                      e.target.checked,
                    )
                  }
                  className={`jewel-checkbox ${isDelivered ? "disabled" : ""}`}
                />
              </td>

              <td className="border px-3 py-2 text-center font-semibold text-blue-700">
                {r.loanBillNumber}
              </td>

              <td className="border px-3 py-2 text-center font-semibold text-[#b6276f]">
                {r.name}
              </td>

              <td className="border px-3 py-2 text-center font-semibold text-[#e38111]">
                ₹{Number(r.totalAmount || 0).toLocaleString("en-IN")}
              </td>

              <td className="border px-3 py-2 text-center font-semibold text-red-600">
                ₹{Number(r.paidInterestAmount || 0).toLocaleString("en-IN")}
              </td>

              <td className="border px-3 py-2 text-center">
                {renderStatusChip(r.itemStatus)}
              </td>

              <td className="border px-3 py-2 text-center">
                {renderStatusChip(r.deliveryStatus)}
              </td>

              <td className="border px-3 py-2 text-center">
                <IconButton
                  size="medium"
                  color="primary"
                  onClick={() => {
                    localStorage.removeItem("billLoanNumber");
                    localStorage.removeItem("checkBackFrom");
                    localStorage.setItem("billLoanNumber", r.loanBillNumber);
                    localStorage.setItem("checkBackFrom", "DashBoard");
                    navigate("/admin/bill-loan-details");
                  }}
                >
                  <VisibilityIcon fontSize="medium" />
                </IconButton>
              </td>
            </tr>
          );
        })
      )}
    </tbody>
  </table>
</div>

    </div>
  );
};

const TodayOldExchangeTable: React.FC = () => {
  const [rows, setRows] = useState<TodayOldExchangeData[]>([]);

  useEffect(() => {
    const fetchTodayOldExchangeData = async () => {
      try {
        const token = localStorage.getItem("token") ?? "";

        const { data } = await api.get<TodayOldExchangeData[]>(
          "/admin/today-old-return-metal-data",
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          },
        );

        setRows(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch today old exchange data:", error);
      }
    };

    fetchTodayOldExchangeData();
  }, []);const totalOldExchangeCount = rows.length;

const totalGoldWeight = rows
  .filter(
    (r) =>
      (r.onlyExchangeMetal || "").trim().toLowerCase() === "gold"
  )
  .reduce(
    (sum, r) => sum + Number(r.onlyExchange_metal_purity_weight || 0),
    0
  );

const totalSilverWeight = rows
  .filter(
    (r) =>
      (r.onlyExchangeMetal || "").trim().toLowerCase() === "silver"
  )
  .reduce(
    (sum, r) => sum + Number(r.onlyExchange_metal_purity_weight || 0),
    0
  );



  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 md:p-5">
     <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
  <div className="text-lg font-bold text-[#85400b]">
    Today's Old Return & Old Exchange
  </div>

  <div className="flex flex-wrap gap-2">
    <span className="rounded-full bg-blue-100 px-4 py-2 text-[13px] font-bold text-blue-700">
      Total: {totalOldExchangeCount}
    </span>

    <span className="rounded-full bg-yellow-100 px-4 py-2 text-[13px] font-bold text-yellow-700">
      Gold: {totalGoldWeight.toFixed(3)} gm
    </span>

    <span className="rounded-full bg-gray-200 px-4 py-2 text-[13px] font-bold text-gray-700">
      Silver: {totalSilverWeight.toFixed(3)} gm
    </span>
  </div>
</div>

      <div className="space-y-3 md:hidden">
        {rows.length === 0 ? (
          <div className="rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-500">
            No old return or old exchange data found today
          </div>
        ) : (
          rows.map((item) => (
            <div
              key={item.oldMetalReturnId}
              className="rounded-2xl border border-gray-100 bg-[#fffaf0] p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-gray-500">Type</div>
                  <div className="font-bold text-purple-700">
                    {item.type === "Return"
                      ? "Return Metal"
                      : item.type === "Exchange"
                        ? "Exchange Item"
                        : item.type}
                  </div>
                </div>

                <div className="rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-700">
                  {item.billNumber || "-"}
                </div>
              </div>

              <div className="mt-3 font-bold text-gray-800">
                {item.onlyExchangeMetal} - {item.onlyExchange_metal_name}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-white p-2">
                  <div className="text-[11px] text-gray-500">Gross Wt</div>
                  <div className="font-bold">
                    {Number(item.onlyExchange_metal_weight || 0).toFixed(3)}
                  </div>
                </div>

                <div className="rounded-xl bg-white p-2">
                  <div className="text-[11px] text-gray-500">Purity Wt</div>
                  <div className="font-bold">
                    {Number(
                      item.onlyExchange_metal_purity_weight || 0,
                    ).toFixed(3)}
                  </div>
                </div>

                <div className="col-span-2 rounded-xl bg-white p-2">
                  <div className="text-[11px] text-gray-500">Amount</div>
                  <div className="font-bold text-[#e38111]">
                    ₹
                    {Number(
                      item.onlyExchange_total_amount || 0,
                    ).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
{/* Desktop table view */}
<div className="mt-4 hidden overflow-x-auto md:block">
  <table className="min-w-[850px] w-full border-collapse border border-gray-300 rounded-xl overflow-hidden">
    <thead className="bg-gray-200">
      <tr>
        <th className="border px-3 py-2 text-center">Type</th>
        <th className="border px-3 py-2 text-center">Bill No</th>
        <th className="border px-3 py-2 text-center">Metal</th>
        <th className="border px-3 py-2 text-center">Name</th>
        <th className="border px-3 py-2 text-center">Gross Wt</th>
        <th className="border px-3 py-2 text-center">Purity Wt</th>
        <th className="border px-3 py-2 text-center">Amount</th>
      </tr>
    </thead>

    <tbody>
      {rows.length === 0 ? (
        <tr>
          <td colSpan={7} className="border px-3 py-4 text-center text-gray-500">
            No old return or old exchange data found today
          </td>
        </tr>
      ) : (
        rows.map((item) => (
          <tr key={item.oldMetalReturnId} className="bg-white">
            <td className="border px-3 py-2 text-center font-semibold text-purple-700">
              {item.type === "Return"
                ? "Return Metal"
                : item.type === "Exchange"
                  ? "Exchange Item"
                  : item.type}
            </td>

            <td className="border px-3 py-2 text-center font-semibold text-blue-700">
              {item.billNumber || "-"}
            </td>

            <td className="border px-3 py-2 text-center">
              {item.onlyExchangeMetal}
            </td>

            <td className="border px-3 py-2 text-center">
              {item.onlyExchange_metal_name}
            </td>

            <td className="border px-3 py-2 text-center">
              {Number(item.onlyExchange_metal_weight || 0).toFixed(3)}
            </td>

            <td className="border px-3 py-2 text-center">
              {Number(item.onlyExchange_metal_purity_weight || 0).toFixed(3)}
            </td>

            <td className="border px-3 py-2 text-center font-semibold text-[#e38111]">
              ₹{Number(item.onlyExchange_total_amount || 0).toLocaleString("en-IN")}
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>

    </div>
  );
};

/* ---------- Business Growth: static country list + bars ---------- */
const BusinessGrowth: React.FC = () => {
  const [villages, setVillages] = useState<BusinessGrowthResponse[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalVillages, setTotalVillages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchBusinessGrowth = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await api.get<VillageStatsResponse>(
          "/admin/village-percentage",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        setVillages(response.data.villagePercentageList);
        setTotalCustomers(response.data.totalCustomers);
        setTotalVillages(response.data.totalVillages);
      } catch (error) {
        console.error("Error fetching business growth data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessGrowth();
  }, []);

  const filteredVillages = villages.filter((item) =>
    item.village.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-semibold text-gray-800">Business Growth</div>
          <div className="text-xs text-gray-500">
            Village wise customer percentage
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className="rounded-full bg-violet-100 text-violet-700 px-3 py-1 text-xs font-bold">
            {totalVillages} Villages
          </div>

          <div className=" mt-1 text-xs text-blue-600 font-bold">
            {totalCustomers} Customers
          </div>
        </div>
      </div>

      <input
        type="text"
        placeholder="Search village..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500"
      />

      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : (
        <div className="max-h-[560px] overflow-y-auto pr-2 space-y-3">
          {filteredVillages.length > 0 ? (
            filteredVillages.map((item) => (
              <div
                key={item.village}
                className="rounded-xl border border-gray-100 bg-gray-50 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-800">
                      {item.village}
                    </div>

                    <div className="text-xs text-gray-500 mt-0.5">
                      Customers:{" "}
                      <span className="font-bold text-violet-700">
                        {item.totalCustomers}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-xs font-bold">
                    {item.percentage.toFixed(2)}%
                  </div>
                </div>

                <div className="mt-3 h-2 rounded-full bg-white overflow-hidden">
                  <div
                    className="h-full rounded-full bg-violet-500 transition-all duration-500"
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500">No village found</div>
          )}
        </div>
      )}
    </div>
  );
};

/* ---------- Page (no banner; adds spacing under banner) ---------- */
const Dashboard: React.FC = () => {
  const token = localStorage.getItem("token") || "";

  return (
    <div className="mt-4 space-y-4 px-1 md:mt-6 md:space-y-6 md:px-0">
      {/* KPI row (first tile = Metal Prices) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetalPricesCard />
        <MetricCard
          title="Total Orders"
          endpoint="/admin/ordersCount"
          token={token}
        />
        <MetricCard
          title="Delivered Orders"
          endpoint="/admin/deliveredOrders"
          token={token}
        />
        <MetricCard
          title="Pending Orders"
          endpoint="/admin/pendingOrders"
          token={token}
        />
        <MetricCard
          title="Canceled Orders"
          endpoint="/admin/canceledOrders"
          token={token}
        />
        <RevenueCard
          title="Total Revenue"
          endpoint="/admin/revenueStats"
          token={token}
        />
        <DueAmountCard token={token} />
        <DueLoanAmountCard token={token} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <TargetCard token={token} />

        <div className="xl:col-span-2">
          <StatisticCard />
        </div>
      </div>

      {/* Tables / Growth row */}
      {/* RFID TAGGING WORK */}
<TaggingWorkTable />

{/* Tables / Growth row */}
<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* LEFT SIDE */}
        <div className="lg:col-span-2 space-y-5">
          <LatestOrders />
          <LatestLoanOrders />
          <TodayOldExchangeTable />
        </div>

        {/* RIGHT SIDE */}
        <div className="lg:col-span-1">
          <BusinessGrowth />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
