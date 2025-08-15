// src/pages/admin/AllBillingOrders.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Paper,
  Typography,
  CircularProgress,
  Button,
  TextField,
  Box,
} from "@mui/material";

const API_BASE = "http://15.207.98.116:8081";

type Billing = {
  billId: number;
  billNumber: string;
  customerId: number;
  name: string;
  village: string;
  phoneNumber: string;
  emailId: string;
  deliveryStatus: string;
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

  // Try native Date first
  const d1 = new Date(s);
  if (!Number.isNaN(d1.getTime())) {
    const y = d1.getFullYear();
    const m = String(d1.getMonth() + 1).padStart(2, "0");
    const d = String(d1.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // Fallback for strings like "8/7/2025, 5:59:05 AM"
  // Take the first part before comma, expect M/D/YYYY
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

const AllBillingOrders: React.FC = () => {
  const [rows, setRows] = useState<Billing[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string>(""); // yyyy-mm-dd
  const [toDate, setToDate] = useState<string>(""); // yyyy-mm-dd
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const token = localStorage.getItem("token") ?? "";
        const { data } = await axios.get<Billing[]>(
          `${API_BASE}/admin/getALlBills`,
          { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
        );
        if (!alive) return;
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!alive) return;
        console.error("Failed to fetch all bills:", e);
        setErr("Failed to load billing orders.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Apply filter:
  const filteredRows = useMemo(() => {
    const f = fromDate.trim();
    const t = toDate.trim();

    if (!f && !t) return rows;

    return rows.filter((bill) => {
      const billDay = toDateOnlyYYYYMMDD(bill.billingDate);
      if (!billDay) return false;

      if (f && t) {
        return billDay >= f && billDay <= t;
      }
      if (f && !t) {
        return billDay === f;
      }
      if (!f && t) {
        return billDay === t;
      }
      return true;
    });
  }, [rows, fromDate, toDate]);

  const clearDates = () => {
    setFromDate("");
    setToDate("");
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

        {/* Date filters */}
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
    sx={{
      width: 180,                 // <= compact width
      "& .MuiOutlinedInput-input": {
        py: 0.75,                 // <= less inner vertical padding
      },
    }}
  />

  <TextField
    label="To"
    type="date"
    size="small"
    value={toDate}
    onChange={(e) => setToDate(e.target.value)}
    InputLabelProps={{ shrink: true }}
    sx={{
      width: 180,                 // <= compact width
      "& .MuiOutlinedInput-input": {
        py: 0.75,                 // <= less inner vertical padding
      },
    }}
  />

  <Button
    variant="outlined"
    size="small"
    onClick={clearDates}
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
            <table className="w-full border-collapse border border-gray-300 rounded-xl overflow-hidden">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border px-3 py-2 text-left">Billing Date</th>
                  <th className="border px-3 py-2 text-left">Bill Number</th>
                  <th className="border px-3 py-2 text-left">Delivery Status</th>
                  <th className="border px-3 py-2 text-right"># Orders</th>
                  <th className="border px-3 py-2 text-right">Total Amount</th>
                  <th className="border px-3 py-2 text-right">Due Amount</th>
                  <th className="border px-3 py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((bill) => (
                  <tr key={bill.billId} className="bg-white/90">
                    <td className="border px-3 py-2">
                      {bill.billingDate ?? "N/A"}
                    </td>
                    <td className="border px-3 py-2">{bill.billNumber}</td>
                    <td className="border px-3 py-2">
                      {bill.deliveryStatus || "-"}
                    </td>
                    <td className="border px-3 py-2 text-right">
                      {bill.numberOfOrders ?? 0}
                    </td>
                    <td className="border px-3 py-2 text-right">
                      {bill.billTotalAmount?.toFixed(2)}
                    </td>
                    <td className="border px-3 py-2 text-right">
                      {bill.billDueAmount?.toFixed(2)}
                    </td>
                    <td className="border px-3 py-2 text-center">
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => {
                          localStorage.setItem("billNumber", bill.billNumber);
                          navigate("/admin/bill-details");
                        }}
                      >
                        View More
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Paper>
    </div>
  );
};

export default AllBillingOrders;
