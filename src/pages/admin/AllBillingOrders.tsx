// src/pages/admin/AllBillingOrders.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Paper,
  Typography,
  CircularProgress,
  Button,
  TextField,
  Box,
  MenuItem,
  Chip,
  IconButton,
} from "@mui/material";
import api from "@/services/api";
import VisibilityIcon from "@mui/icons-material/Visibility";

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
};

function toDateOnlyYYYYMMDD(s: string | null): string | null {
  if (!s) return null;
  const d1 = new Date(s);
  if (!Number.isNaN(d1.getTime())) {
    const y = d1.getFullYear();
    const m = String(d1.getMonth() + 1).padStart(2, "0");
    const d = String(d1.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const firstPart = s.split(",")[0]?.trim();
  const parts = firstPart?.split("/") ?? [];
  if (parts.length === 3) {
    const m = Number(parts[0]);
    const d = Number(parts[1]);
    const y = Number(parts[2]);
    const safe = new Date(y, m - 1, d);
    if (!Number.isNaN(safe.getTime())) {
      const mm = String(safe.getMonth() + 1).padStart(2, "0");
      const dd = String(safe.getDate()).padStart(2, "0");
      return `${y}-${mm}-${dd}`;
    }
  }
  return null;
}

function normalizeStatus(
  s: string | undefined | null
): "delivered" | "pending" | "other" {
  const v = (s ?? "").toLowerCase().trim();
  if (v.includes("deliver")) return "delivered";
  if (v.includes("pend")) return "pending";
  return "other";
}

const AllBillingOrders: React.FC = () => {
  const [rows, setRows] = useState<Billing[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "delivered" | "pending"
  >("all");
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    localStorage.removeItem("CheckBack");
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const token = localStorage.getItem("token") ?? "";
        const { data } = await api.get<Billing[]>(`/admin/getALlBills`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!alive) return;
        setRows(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (!alive) return;
        console.error("Failed to fetch all bills:", e);
        setErr("Failed to load billing orders.");
        console.error("Axios error:", e);
        console.error("Code:", e.code);
        console.error("Message:", e.message);
        setErr(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filteredRows = useMemo(() => {
    const f = fromDate.trim();
    const t = toDate.trim();
    return rows.filter((bill) => {
      const norm = normalizeStatus(bill.deliveryStatus);
      if (statusFilter !== "all" && norm !== statusFilter) return false;

      if (!f && !t) return true;
      const billDay = toDateOnlyYYYYMMDD(bill.billingDate);
      if (!billDay) return false;

      if (f && t) return billDay >= f && billDay <= t;
      if (f && !t) return billDay === f;
      if (!f && t) return billDay === t;
      return true;
    });
  }, [rows, fromDate, toDate, statusFilter]);

  const clearFilters = () => {
    setFromDate("");
    setToDate("");
    setStatusFilter("all"); // 👈 also reset status to ALL
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
    <div className="mt-10 p-3 flex flex-col items-center justify-center">
      <Paper
        elevation={0}
        sx={{
          p: 6,
          width: "100%",
          maxWidth: "80rem",
          borderRadius: "24px",
          backgroundColor: "rgba(255,255,255,0.75)",
          backdropFilter: "blur(12px)",
          border: "1px solid #d0b3ff",
          boxShadow: "0 10px 30px rgba(136,71,255,0.3)",
        }}
      >
        <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
          All Billing Orders
        </Typography>

        {/* Filters row */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
            mt: 2,
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

          <TextField
            select
            label="Status"
            size="small"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            sx={{ width: 170, ml: { xs: 0, sm: 1 } }}
            InputLabelProps={{ shrink: true }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="delivered">Delivered</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
          </TextField>

          {/* 👇 moved to the end and clears all filters */}
          <Button
            variant="outlined"
            size="small"
            onClick={clearFilters}
            sx={{ whiteSpace: "nowrap" }}
          >
            Clear
          </Button>
        </Box>

        {loading ? (
          <div className="flex items-center gap-3 py-6">
            <CircularProgress size={22} />
            <span>Loading…</span>
          </div>
        ) : err ? (
          <p className="text-red-600 py-4">{err}</p>
        ) : filteredRows.length === 0 ? (
          <p className="py-4">No billing orders found.</p>
        ) : (
          <div className="mt-4">
            <Box
              sx={{
                width: "100%",
                overflowX: "auto", // allows horizontal scrolling on small screens
              }}
            >
              <table className="w-full border-collapse border border-gray-300 rounded-xl overflow-hidden sx={{ minWidth: 800">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border px-3 py-2 text-center">
                      <div className="flex justify-center items-center">
                        Billing Date
                      </div>
                    </th>
                    <th className="border px-3 py-2 text-center">
                      <div className="flex justify-center items-center">
                        Bill Number
                      </div>
                    </th>
                    <th className="border px-3 py-2 text-center">
                      <div className="flex justify-center items-center">
                        Name
                      </div>
                    </th>
                    <th className="border px-3 py-2 text-center">
                      <div className="flex justify-center items-center">
                        Work Status
                      </div>
                    </th>
                    <th className="border px-3 py-2 text-center">
                      <div className="flex justify-center items-center">
                        Delivery Status
                      </div>
                    </th>
                    <th className="border px-3 py-2 text-center">
                      <div className="flex justify-center items-center">
                        Orders
                      </div>
                    </th>
                    <th className="border px-3 py-2 text-center">
                      <div className="flex justify-center items-center">
                        Total Amount
                      </div>
                    </th>
                    <th className="border px-3 py-2 text-center">
                      <div className="flex justify-center items-center">
                        Due Amount
                      </div>
                    </th>
                    <th className="border px-3 py-2 text-center">
                      <div className="flex justify-center items-center">
                        Action
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((bill) => (
                    <tr key={bill.billId} className="bg-white/90">
                      <td className="border px-3 py-2 text-center">
                        <div className="flex justify-center items-center">
                          {bill.billingDate ?? "N/A"}
                        </div>
                      </td>

                      <td className="border px-3 py-2 text-center">
                        <div className="flex justify-center items-center">
                          {bill.billNumber}{" "}
                        </div>
                      </td>
                      <td className="border px-3 py-2 text-center">
                        <div className="flex justify-center items-center">
                          {bill.name}{" "}
                        </div>
                      </td>
                      <td className="border px-3 py-2 text-center">
                        <div className="flex justify-center items-center">
                          {renderStatusChip(bill.workStatus)}
                        </div>
                      </td>
                      <td className="border px-3 py-2 text-center">
                        <div className="flex justify-center items-center">
                          {renderStatusChip(bill.deliveryStatus)}
                        </div>
                      </td>

                      <td className="border px-3 py-2 text-center">
                        <div className="flex justify-center items-center">
                          {bill.numberOfOrders ?? 0}
                        </div>
                      </td>

                      <td className="border px-3 py-2 text-center">
                        <div className="flex justify-center items-center">
                          {bill.billTotalAmount != null
                            ? bill.billTotalAmount.toFixed(2)
                            : "-"}
                        </div>
                      </td>

                      <td className="border px-3 py-2 text-center">
                        <div className="flex justify-center items-center">
                          {bill.billDueAmount != null
                            ? bill.billDueAmount.toFixed(2)
                            : "-"}
                        </div>
                      </td>

                      <td className="border px-3 py-2 text-center">
                        <div className="flex justify-center items-center">
                          <IconButton
                            size="medium"
                            color="primary"
                            sx={{
                              "&:hover": { backgroundColor: "#E0E0E0" },
                            }}
                            onClick={() => {
                              localStorage.setItem(
                                "billNumber",
                                bill.billNumber
                              );
                              localStorage.setItem("CheckBack", "AllBillBack");
                              navigate("/admin/bill-details");
                            }}
                          >
                            <VisibilityIcon fontSize="medium" />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </div>
        )}
      </Paper>
    </div>
  );
};

export default AllBillingOrders;
