import React, { useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, CircularProgress,
  MenuItem, Stack, TextField, Typography,
} from "@mui/material";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import api from "@/services/api";

type Period = "YEAR" | "MONTH" | "DAY";
type MetricKey =
  | "goldStockGrams" | "silverStockGrams" | "totalOrders"
  | "totalRevenue" | "goldSoldGrams" | "silverSoldGrams";
type DashboardRow = { period: string } & Record<MetricKey, number>;
type DashboardResponse = {
  history: DashboardRow[];
  estimatedStock?: boolean;
  warning?: string;
};
type Props = { token: string | null };
type Selection = { period: Period; from: string; to: string };

const METRICS: { key: MetricKey; label: string; color: string; unit: string }[] = [
  { key: "goldStockGrams", label: "Gold Stock", color: "#D4A017", unit: "g" },
  { key: "silverStockGrams", label: "Silver Stock", color: "#8A97A7", unit: "g" },
  { key: "totalOrders", label: "Total Orders", color: "#8B5CF6", unit: "" },
  { key: "totalRevenue", label: "Total Revenue", color: "#16A34A", unit: "₹" },
  { key: "goldSoldGrams", label: "Gold Sold", color: "#EA580C", unit: "g" },
  { key: "silverSoldGrams", label: "Silver Sold", color: "#0284C7", unit: "g" },
];
const fmt = (value: unknown, key: MetricKey) => {
  const n = Number(value ?? 0);
  const number = n.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: key === "totalOrders" || key === "totalRevenue" ? 0 : 3,
  });
  if (key === "totalRevenue") return `₹${number}`;
  if (key === "totalOrders") return number;
  return `${number} g`;
};
const compact = (value: number) => {
  if (Math.abs(value) >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`;
  if (Math.abs(value) >= 100000) return `${(value / 100000).toFixed(1)}L`;
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(Number(value.toFixed(2)));
};
const endOfMonth = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, "0")}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`;
const readablePeriod = (value: string) => {
  if (/^\d{4}-\d{2}$/.test(value)) {
    const [y, m] = value.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleString("en-IN", { month: "short", year: "numeric" });
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleString("en-IN", { day: "2-digit", month: "short" });
  }
  return value;
};

const StockMetalGraphs: React.FC<Props> = ({ token }) => {
  const [showroom, setShowroom] = useState("ALL");
  const [metric, setMetric] = useState<MetricKey>("goldStockGrams");
  const [selection, setSelection] = useState<Selection>({ period: "YEAR", from: "", to: "" });
  const [trail, setTrail] = useState<Selection[]>([]);
  const [rows, setRows] = useState<DashboardRow[]>([]);
  const [warning, setWarning] = useState("");
  const [estimated, setEstimated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [selectedRow, setSelectedRow] = useState<DashboardRow | null>(null);

  useEffect(() => {
    if (!token) {
      setRows([]);
      setError("Admin login required.");
      return;
    }
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError("");
      setRows([]);
      setSelectedRow(null);
      try {
        const { data } = await api.get<DashboardResponse>("/admin/analytics/stock/dashboard", {
          params: {
            period: selection.period,
            ...(showroom !== "ALL" ? { showroom: Number(showroom) } : {}),
            ...(selection.from ? { from: selection.from } : {}),
            ...(selection.to ? { to: selection.to } : {}),
          },
          headers: { Authorization: `Bearer ${token}` },
         
        });
        if (!controller.signal.aborted) {
          setRows(Array.isArray(data.history) ? data.history : []);
          setWarning(data.warning ?? "");
          setEstimated(Boolean(data.estimatedStock));
        }
      } catch (err: unknown) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Unable to load dashboard analytics.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [token, showroom, selection, reload]);

  const active = METRICS.find((m) => m.key === metric)!;
  const chartRows = useMemo(
    () => [...rows].sort((a, b) => a.period.localeCompare(b.period)),
    [rows]
  );

  const drillInto = (row: DashboardRow) => {
    setSelectedRow(row);
    if (selection.period === "DAY") return;
    let next: Selection;
    if (selection.period === "YEAR") {
      const year = Number(row.period);
      if (!Number.isInteger(year)) return;
      next = { period: "MONTH", from: `${year}-01-01`, to: `${year}-12-31` };
    } else {
      const match = /^(\d{4})-(\d{2})$/.exec(row.period);
      if (!match) return;
      const year = Number(match[1]);
      const month = Number(match[2]);
      next = { period: "DAY", from: `${match[1]}-${match[2]}-01`, to: endOfMonth(year, month) };
    }
    setTrail((prev) => [...prev, selection]);
    setSelection(next);
  };

  const goBack = () => {
    if (!trail.length) return;
    setSelection(trail[trail.length - 1]);
    setTrail((prev) => prev.slice(0, -1));
  };
  const reset = () => {
    setSelection({ period: "YEAR", from: "", to: "" });
    setTrail([]);
    setSelectedRow(null);
  };
  const chartWidth = Math.max(740, chartRows.length * (selection.period === "DAY" ? 92 : 120));
  const displayedRow = selectedRow && chartRows.find((r) => r.period === selectedRow.period)
    ? selectedRow : chartRows[chartRows.length - 1];

  return (
    <Box sx={{ mt: 3 }}>
      <Card sx={{ borderRadius: 3, mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2} mb={2}>
            <Box>
              <Typography variant="h6" fontWeight={800}>Stock & Business Analytics</Typography>
              <Typography variant="body2" color="text.secondary">
                {selection.period === "YEAR" ? "Yearly" : selection.period === "MONTH" ? "Monthly" : "Daily"} view
                {selection.from ? ` · ${selection.from} to ${selection.to}` : ""} · Click a bar to explore
              </Typography>
            </Box>
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} gap={2} mb={2}>
            <TextField select size="small" label="Showroom" value={showroom}
              onChange={(e) => { setShowroom(e.target.value); setSelectedRow(null); }} sx={{ minWidth: 175 }}>
              <MenuItem value="ALL">Both Showrooms</MenuItem>
              <MenuItem value="1">1# Showroom</MenuItem>
              <MenuItem value="2">2# Showroom</MenuItem>
            </TextField>
            <TextField select size="small" label="Graph metric" value={metric}
              onChange={(e) => setMetric(e.target.value as MetricKey)} sx={{ minWidth: 190 }}>
              {METRICS.map((m) => <MenuItem key={m.key} value={m.key}>{m.label}</MenuItem>)}
            </TextField>
          </Stack>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))", xl: "repeat(6, minmax(0, 1fr))" }, gap: 1.5 }}>
            {METRICS.map((m) => (
              <Box key={m.key} onClick={() => setMetric(m.key)} sx={{ p: 1.5, borderRadius: 2,
                cursor: "pointer", border: `2px solid ${metric === m.key ? m.color : "#e5e7eb"}`,
                bgcolor: metric === m.key ? "action.hover" : "background.paper", minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary">{m.label}</Typography>
                <Typography fontWeight={800} sx={{ fontSize: { xs: 14, md: 16 }, overflowWrap: "anywhere" }}>
                  {displayedRow ? fmt(displayedRow[m.key], m.key) : "—"}
                </Typography>
              </Box>
            ))}
          </Box>
          <Typography variant="caption" color="text.secondary" display="block" mt={1}>
            Values above are for {displayedRow ? readablePeriod(displayedRow.period) : "the selected period"}.
            Select a metric to change the graph. Click a bar to see its details and drill down.
          </Typography>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {warning && <Alert severity={estimated ? "warning" : "info"} sx={{ mb: 2 }}>{warning}</Alert>}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "flex-start" }} gap={2} mb={1}>
            <Box>
              <Typography fontWeight={800} mb={0.5}>{active.label} — {selection.period === "YEAR" ? "Yearly" : selection.period === "MONTH" ? "Monthly" : "Daily"}</Typography>
              <Typography variant="caption" color="text.secondary">Scroll horizontally for more periods. Click any bar to open the next level.</Typography>
            </Box>
            <Stack direction="row" gap={1} flexWrap="wrap" justifyContent="flex-end" sx={{ ml: { md: "auto" } }}>
              <Button size="small" variant="outlined" onClick={goBack} disabled={!trail.length}>← Back</Button>
              <Button size="small" variant="outlined" onClick={reset}>All Years</Button>
              <Button size="small" variant="outlined" onClick={() => setReload((v) => v + 1)}>Refresh</Button>
            </Stack>
          </Stack>
          {loading ? <Box sx={{ height: 360, display: "grid", placeItems: "center" }}><CircularProgress /></Box>
            : !error && !chartRows.length ? <Alert severity="info" sx={{ mt: 2 }}>No analytics records found.</Alert>
            : !error ? (
              <Box sx={{ overflowX: "auto", overflowY: "hidden", mt: 2, pb: 1 }}>
                <Box sx={{ width: chartWidth, height: 380 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartRows} margin={{ top: 25, right: 18, left: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="period" tickFormatter={readablePeriod} interval={0} tick={{ fontSize: 11 }} />
                      <YAxis width={70} tickFormatter={compact} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value) => fmt(value, metric)} labelFormatter={(value) => readablePeriod(String(value))} />
                      <Bar dataKey={metric} name={active.label} fill={active.color} radius={[7, 7, 0, 0]}
                        maxBarSize={65} animationDuration={900} cursor="pointer"
                        onClick={(data: any) => {
                          const periodValue = String(data?.payload?.period ?? data?.period ?? "");
                          const row = chartRows.find((r) => r.period === periodValue);
                          if (row) drillInto(row);
                        }} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            ) : null}
        </CardContent>
      </Card>
      <Typography variant="caption" color="text.secondary" display="block" mt={1}>
        Stock values are historical estimates, not verified physical inventory. Sold weights reflect available movement records.
        Orders and revenue are billing-based and do not change with the showroom selection.
      </Typography>
    </Box>
  );
};

export default StockMetalGraphs;
