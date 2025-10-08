// src/pages/admin/Dashboard.tsx
import React, { useEffect, useState } from "react";
import api from "@/services/api"; // make sure this import path is correct
import { MoreVertical } from "lucide-react";
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

type MetalRates = {
  goldRate: number;
  silverRate: number;
};

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

function useOrdersMetric(
  endpoint: string,
  filter: string,
  token: string | null
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
  token: string | null
) {
  const [data, setData] = useState<RevenueMetric | null>(null);

  useEffect(() => {
    if (!token) return;
    api
      .get<RevenueMetric>(`${endpoint}?filter=${filter}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setData(res.data))
      .catch((err) => console.error("Error fetching revenue metric:", err));
  }, [endpoint, filter, token]);

  return data;
}

/* ---------- Metal Prices (editable) ---------- */
const MetalPricesCard: React.FC = () => {
  const token = localStorage.getItem("token");

  const [gold, setGold] = useState(0);
  const [silver, setSilver] = useState(0);

  const [open, setOpen] = useState(false);
  const [gDraft, setGDraft] = useState(0);
  const [sDraft, setSDraft] = useState(0);

  useEffect(() => {
    if (!token) return;

    api
      .get<MetalRates>("/admin/getRates", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const { goldRate, silverRate } = res.data;
        setGold(goldRate);
        setSilver(silverRate);
        setGDraft(goldRate);
        setSDraft(silverRate);

        // keep local copy
        localStorage.setItem("GoldPrice", goldRate.toString());
        localStorage.setItem("SilverPrice", silverRate.toString());
      })
      .catch((err) => console.error("Error fetching rates:", err));
  }, [token]);

  const openEditor = () => {
    setGDraft(gold);
    setSDraft(silver);
    setOpen(true);
  };
  const save = () => {
    if (!token) return;

    api
      .put<MetalRates>(
        `/admin/updateRates?goldRate=${gDraft}&silverRate=${sDraft}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then((res) => {
        const { goldRate, silverRate } = res.data;
        setGold(goldRate);
        setSilver(silverRate);

        setGDraft(goldRate);
        setSDraft(silverRate);

        localStorage.setItem("GoldPrice", goldRate.toString());
        localStorage.setItem("SilverPrice", silverRate.toString());

        setOpen(false);

        // keep local copy

        console.log("Updated Prices =>", goldRate, silverRate);
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
          <div className="text-xs text-gray-500">Gold</div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
            ₹{gold.toLocaleString()}
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 p-3">
          <div className="text-xs text-gray-500">Silver</div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
            ₹{silver.toLocaleString()}
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
                <span className="text-xs text-gray-500">Gold (₹)</span>
                <input
                  type="number"
                  value={gDraft}
                  onChange={(e) => setGDraft(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500">Silver (₹)</span>
                <input
                  type="number"
                  value={sDraft}
                  onChange={(e) => setSDraft(Number(e.target.value))}
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
              </button>
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
          Total Orders: ₹{data.totalOrders.toLocaleString()}
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
  const [filter, setFilter] = useState("ALL");
  const data = useRevenueMetric(endpoint, filter, token);

  const FILTER_OPTIONS = [
    "ALL",
    "TODAY",
    "THIS_WEEK",
    "THIS_MONTH",
    "THIS_YEAR",
    "CASH",
    "ONLINE",
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
        ₹{data ? data.currentRevenue.toLocaleString() : "..."}
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
          Total Revenue: ₹{data.totalRevenue.toLocaleString()}
        </div>
      )}
    </div>
  );
};

/* ---------- Target: semicircle gauge with dynamic revenue ---------- */
const TargetCard: React.FC<{ token?: string | null }> = ({ token }) => {
  const [filter, setFilter] = useState("TODAY");
  const data = useRevenueMetric("/admin/revenueStats", filter, token ?? null);
  const BASE_TARGET = 500; // ₹ per day target

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
  const [year, setYear] = useState<number>(2025);
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
            (r: any) => r.monthName?.toUpperCase() === m
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
        <div className="text-sm text-gray-500 font-medium">Total Due</div>
      </div>

      <div className="text-2xl font-bold">
        ₹{dueAmount !== null ? dueAmount.toLocaleString() : "..."}
      </div>

      <div className="text-xs text-gray-500 mt-2">
        Total outstanding due amount from all customers
      </div>
    </div>
  );
};

/* ---------- Latest Orders: static table ---------- */
const LatestOrders: React.FC = () => {
  const rows = [
    {
      src: "🛍️ Shop",
      name: "Ibnul Shams Al Asad",
      email: "shams@hotmail.com",
      total: "AED 8,12,100",
      status: "Processing",
      tone: "text-amber-700 bg-amber-50",
    },
    {
      src: "🌐 Website",
      name: "Zara Hassan",
      email: "zara.hassan@hotmail.com",
      total: "AED 12,69,650",
      status: "Delivered",
      tone: "text-emerald-700 bg-emerald-50",
    },
    {
      src: "📱 App",
      name: "Maria R.",
      email: "maria@example.com",
      total: "AED 6,15,000",
      status: "Pending",
      tone: "text-orange-700 bg-orange-50",
    },
  ];

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-5">
      <div className="font-semibold text-gray-800 mb-3">Latest Order</div>
      <div className="overflow-hidden rounded-xl border border-gray-100">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-2 text-left">Source</th>
              <th className="px-4 py-2 text-left">Customer</th>
              <th className="px-4 py-2 text-left">Total</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r, i) => (
              <tr key={i} className="bg-white">
                <td className="px-4 py-3">{r.src}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800">{r.name}</div>
                  <div className="text-xs text-gray-400">{r.email}</div>
                </td>
                <td className="px-4 py-3">{r.total}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${r.tone}`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs hover:bg-gray-50">
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ---------- Business Growth: static country list + bars ---------- */
const BusinessGrowth: React.FC = () => {
  const countries = [
    { name: "Hyderabad", value: 72 },
    { name: "Medak", value: 58 },
    { name: "Karimnagar", value: 43 },
    { name: "Khamam", value: 31 },
  ];

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-5">
      <div className="font-semibold text-gray-800 mb-3">Business Growth</div>
      <div className="space-y-3">
        {countries.map((c) => (
          <div key={c.name}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{c.name}</span>
              <span className="font-semibold">{c.value}%</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-violet-500"
                style={{ width: `${c.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ---------- Page (no banner; adds spacing under banner) ---------- */
const Dashboard: React.FC = () => {
  const token = localStorage.getItem("token") || "";

  return (
    <div className="mt-6 space-y-6">
      {/* KPI row (first tile = Metal Prices) */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
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
        <DueAmountCard token={token} /> {/* ✅ Added here */}
      </div>

      {/* Charts row */}
      <div className="grid gap-5 xl:grid-cols-3">
        <TargetCard token={token} />

        <div className="xl:col-span-2">
          <StatisticCard />
        </div>
      </div>

      {/* Tables / Growth row */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LatestOrders />
        </div>
        <BusinessGrowth />
      </div>
    </div>
  );
};

export default Dashboard;
