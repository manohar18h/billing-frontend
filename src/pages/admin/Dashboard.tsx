// src/pages/admin/Dashboard.tsx
import React, { useEffect, useState } from "react";
import api from "@/services/api"; // make sure this import path is correct

type MetalRates = {
  goldRate: number;
  silverRate: number;
};

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
  value: string;
  delta?: { up?: boolean; label: string };
  subtitle?: string;
}> = ({ title, value, delta, subtitle }) => (
  <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-5">
    <div className="text-sm text-gray-500">{title}</div>
    <div className="mt-1 text-3xl font-bold tracking-tight">{value}</div>
    <div className="mt-1 flex items-center gap-3">
      {delta && (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
            delta.up
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          }`}
        >
          {delta.up ? "▲" : "▼"} {delta.label}
        </span>
      )}
      {subtitle && <span className="text-xs text-gray-500">{subtitle}</span>}
    </div>
  </div>
);

/* ---------- Target: semicircle gauge with static values ---------- */
const TargetCard: React.FC = () => {
  const percent = 62.28;
  const radius = 90;
  const circumference = Math.PI * radius;
  const dash = (percent / 100) * circumference;

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-5">
      <div className="text-sm text-gray-700 font-medium mb-2">Target</div>
      <div className="flex items-center justify-center">
        <svg width="420" height="220" viewBox="0 0 420 220">
          <path
            d="M30 190 A160 160 0 0 1 390 190"
            fill="none"
            stroke="#eee"
            strokeWidth="20"
            strokeLinecap="round"
          />
          <g transform="translate(210,190) rotate(180) translate(-210,-190)">
            <path
              d="M30 190 A160 160 0 0 1 390 190"
              fill="none"
              stroke="#6d28d9"
              strokeWidth="20"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
            />
          </g>
          <text
            x="210"
            y="120"
            textAnchor="middle"
            className="fill-gray-900"
            style={{ fontSize: 28, fontWeight: 800 }}
          >
            {percent.toFixed(2)}%
          </text>
          <text
            x="210"
            y="145"
            textAnchor="middle"
            className="fill-rose-600"
            style={{ fontSize: 12, fontWeight: 700 }}
          >
            −37.72%
          </text>
        </svg>
      </div>

      <div className="text-center text-xs text-gray-500 -mt-3">
        You succeed earn AED 0.74M · Current Sales Revenue is 40%
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4 text-xs">
        <div className="text-center">
          <div className="text-gray-500">Target</div>
          <div className="font-semibold">AED 1.02M</div>
        </div>
        <div className="text-center">
          <div className="text-gray-500">Revenue</div>
          <div className="font-semibold text-rose-600">AED 0.29M</div>
        </div>
        <div className="text-center">
          <div className="text-gray-500">Sales</div>
          <div className="font-semibold text-emerald-600">AED 0.27M</div>
        </div>
      </div>
    </div>
  );
};

/* ---------- Statistic: SVG line chart with static data ---------- */
const StatisticCard: React.FC = () => {
  // months 12 points
  const sales = [12, 18, 25, 24, 33, 30, 40, 28, 48, 38, 44, 47];
  const revenue = [10, 11, 20, 16, 23, 22, 27, 26, 30, 34, 26, 31];

  const w = 680;
  const h = 240;
  const left = 40;
  const right = 10;
  const top = 20;
  const bottom = 20;

  const toPoints = (arr: number[]) => {
    const maxV = 50;
    const stepX = (w - left - right) / (arr.length - 1);
    return arr
      .map((v, i) => {
        const x = left + stepX * i;
        const y = top + (h - top - bottom) * (1 - v / maxV);
        return `${x},${y}`;
      })
      .join(" ");
  };

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-700 font-medium">Statistic</div>
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-sky-500" />{" "}
            Sales
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />{" "}
            Revenue
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[240px]">
        <rect x="0" y="0" width={w} height={h} fill="white" />
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            x1={left}
            x2={w - right}
            y1={top + i * 44}
            y2={top + i * 44}
            stroke="#f1f5f9"
          />
        ))}
        <line x1={left} x2={left} y1={top} y2={h - bottom} stroke="#e2e8f0" />
        <line
          x1={left}
          x2={w - right}
          y1={h - bottom}
          y2={h - bottom}
          stroke="#e2e8f0"
        />

        <polyline
          fill="none"
          stroke="#0ea5e9"
          strokeWidth="3"
          points={toPoints(sales)}
        />
        <polyline
          fill="none"
          stroke="#f59e0b"
          strokeWidth="3"
          points={toPoints(revenue)}
        />

        {[
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ].map((m, i) => (
          <text
            key={m}
            x={left + i * ((w - left - right) / 11)}
            y={h - 4}
            className="fill-gray-400"
            style={{ fontSize: 11 }}
          >
            {m}
          </text>
        ))}
      </svg>
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
  return (
    <div className="mt-6 space-y-6">
      {/* KPI row (first tile = Metal Prices) */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetalPricesCard />
        <MetricCard
          title="Total Orders"
          value="16,920"
          delta={{ up: false, label: "3%" }}
          subtitle="Vs last month · View orders"
        />
        <MetricCard
          title="Order Complete"
          value="16,581"
          delta={{ up: true, label: "98%" }}
          subtitle="Vs last month"
        />
        <MetricCard
          title="Cancel Order"
          value="338"
          delta={{ up: false, label: "2%" }}
          subtitle="227 Decreasing Orders"
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-5 xl:grid-cols-3">
        <TargetCard />
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
