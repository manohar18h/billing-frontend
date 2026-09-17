// src/pages/admin/AllBillingOrders.tsx
import React, { useEffect, useRef, useState } from "react";
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
import "../../App.css";

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
  itemNames: string[];
  itemWeight: number[];
  deliveryDate: string[];
  design: string[];
  billingDate: string | null;
  checked: boolean;
  orderDate: string | null;
};

type PageResponse<T> = {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
};

function toDateOnlyYYYYMMDD(s: string | null): string | null {
  if (!s) return null;

  // Ignore time completely
  const datePart = s.split(" ")[0]; // "03-01-2026"

  const parts = datePart.split("-");
  if (parts.length !== 3) return null;

  const [dd, mm, yyyy] = parts;

  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}
function formatDateDMY(s: string | null): string {
  if (!s) return "N/A";

  const d = new Date(s);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function normalizeWorkStatus(
  s: string | undefined | null,
): "done" | "pending" | "other" {
  const v = (s ?? "").toLowerCase().trim();
  if (v.includes("done")) return "done";
  if (v.includes("pend")) return "pending";
  return "other";
}

function normalizeStatus(
  s: string | undefined | null,
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
  const [filtersApplied, setFiltersApplied] = useState(false);

  const [workFilter, setWorkFilter] = useState<"all" | "done" | "pending">(
    "all",
  );
  // Filters actually sent to backend
const [appliedFromDate, setAppliedFromDate] = useState("");
const [appliedToDate, setAppliedToDate] = useState("");
const [appliedWorkFilter, setAppliedWorkFilter] = useState<
  "all" | "done" | "pending"
>("all");

const [appliedStatusFilter, setAppliedStatusFilter] = useState<
  "all" | "delivered" | "pending"
>("all");
  const navigate = useNavigate();

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const billingOrdersRef = useRef<HTMLDivElement | null>(null);

const [stateRestored, setStateRestored] = useState(false);

useEffect(() => {
  const saved = sessionStorage.getItem("allBillingOrdersState");

  if (saved) {
    try {
      const state = JSON.parse(saved);

      setPage(state.page ?? 0);

      setFromDate(state.fromDate ?? "");
      setToDate(state.toDate ?? "");
      setWorkFilter(state.workFilter ?? "all");
      setStatusFilter(state.statusFilter ?? "all");

      setAppliedFromDate(state.appliedFromDate ?? "");
      setAppliedToDate(state.appliedToDate ?? "");
      setAppliedWorkFilter(state.appliedWorkFilter ?? "all");
      setAppliedStatusFilter(state.appliedStatusFilter ?? "all");

      setFiltersApplied(state.filtersApplied ?? false);
    } catch (error) {
      console.error("Failed to restore billing state:", error);
    }
  }

  setStateRestored(true);
}, []);

const fetchBillingRows = async () => {
  localStorage.removeItem("CheckBack");
  setLoading(true);
  setErr(null);

  try {
    const params = new URLSearchParams();

    params.set("page", page.toString());
    params.set("size", "50");

    let endpoint = "/admin/getALlBills";

    if (filtersApplied) {
      endpoint = "/admin/getFilteredBills";

      if (appliedFromDate) {
        params.set("fromDate", appliedFromDate);
      }

      if (appliedToDate) {
        params.set("toDate", appliedToDate);
      }

      params.set("workStatus", appliedWorkFilter);
      params.set("deliveryStatus", appliedStatusFilter);
    }

    const { data } = await api.get<PageResponse<Billing>>(
      `${endpoint}?${params.toString()}`,
    );

    setRows(data.content);
    setTotalPages(data.totalPages);

  } catch (e) {
    console.error("Failed to fetch billing orders:", e);
    setErr("Failed to load billing orders.");
  } finally {
    setLoading(false);
  }
};
  const pageSize = 50;

useEffect(() => {
  if (!stateRestored) return;

  fetchBillingRows();
}, [
  stateRestored,
  page,
  filtersApplied,
  appliedFromDate,
  appliedToDate,
  appliedWorkFilter,
  appliedStatusFilter,
]);

  const handleCheckboxChange = async (billId: number, checked: boolean) => {
    // optimistic update
    setRows((prev) =>
      prev.map((row) =>
        Number(row.billId) === Number(billId) ? { ...row, checked } : row,
      ),
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

 const applyFilters = () => {

  setPage(0);

  setAppliedFromDate(fromDate);
  setAppliedToDate(toDate);
  setAppliedWorkFilter(workFilter);
  setAppliedStatusFilter(statusFilter);

  setFiltersApplied(true);
};

const clearFilters = () => {

  setFromDate("");
  setToDate("");
  setStatusFilter("all");
  setWorkFilter("all");

  setAppliedFromDate("");
  setAppliedToDate("");
  setAppliedStatusFilter("all");
  setAppliedWorkFilter("all");

  setFiltersApplied(false);
  setPage(0);
};

useEffect(() => {
  if (!stateRestored) return;
  if (loading) return;

  const shouldScroll =
    sessionStorage.getItem("returnToAllBillingOrders");

  if (shouldScroll !== "true") return;

  const timer = setTimeout(() => {
    billingOrdersRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    sessionStorage.removeItem("returnToAllBillingOrders");
  }, 200);

  return () => clearTimeout(timer);
}, [loading, stateRestored]);



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

  const renderWorkStatusChip = (raw: string) => {
    const n = normalizeWorkStatus(raw);

    if (n === "done")
      return (
        <Chip
          label="Done"
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
<div className="mt-4 flex flex-col items-center justify-center px-3 pb-[90px] md:mt-10 md:p-3 md:pb-0">
        <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 6 },
          width: "100%",
          maxWidth: "80rem",
          borderRadius: "24px",
          backgroundColor: "rgba(255,255,255,0.75)",
          backdropFilter: "blur(12px)",
          border: "1px solid #d0b3ff",
          boxShadow: "0 10px 30px rgba(136,71,255,0.3)",
        }}
      >
       <div
  ref={billingOrdersRef}
  style={{ scrollMarginTop: "30px" }}
>
  <Typography
    variant="h4"
    fontWeight="bold"
    color="primary"
    gutterBottom
    sx={{ fontSize: { xs: "24px", md: "34px" } }}
  >
    All Billing Orders
  </Typography>
</div>



        {/* Filters row */}
        <Box
         sx={{
  display: "grid",
  gridTemplateColumns: {
    xs: "1fr",
    sm: "1fr 1fr",
    md: "180px 180px 170px 170px 130px 100px",
  },
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
  width: "100%",
  "& .MuiOutlinedInput-input": { py: 0.75 },
}}          />

          <TextField
            label="To"
            type="date"
            size="small"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
sx={{
  width: "100%",
  "& .MuiOutlinedInput-input": { py: 0.75 },
}}          />
          <TextField
            select
            label="Work Status"
            size="small"
            value={workFilter}
            onChange={(e) =>
  setWorkFilter(e.target.value as "all" | "done" | "pending")
}
sx={{
  width: "100%",
  "& .MuiOutlinedInput-input": { py: 0.75 },
}}            InputLabelProps={{ shrink: true }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="done">Done</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
          </TextField>

          <TextField
            select
            label="Delivery Status"
            size="small"
            value={statusFilter}
            onChange={(e) =>
  setStatusFilter(
    e.target.value as "all" | "delivered" | "pending",
  )
}
sx={{
  width: "100%",
  "& .MuiOutlinedInput-input": { py: 0.75 },
}}            InputLabelProps={{ shrink: true }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="delivered">Delivered</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
          </TextField>


          <Button
  variant="contained"
  size="small"
  onClick={applyFilters}
  sx={{
    width: "100%",
    whiteSpace: "nowrap",
    height: "40px",
  }}
>
  Apply Filters
</Button>

        <Button
  variant="outlined"
  size="small"
  onClick={clearFilters}
  sx={{
    width: "100%",
    whiteSpace: "nowrap",
    height: "40px",
  }}
>
  Clear
</Button>
        </Box>

        <Box
        sx={{
  display: "flex",
  justifyContent: { xs: "center", md: "flex-end" },
  alignItems: "center",
  flexWrap: "wrap",
  gap: 1,
  mt: 2,
}}
        >
          <Button
            size="small" // 👈 smaller button
            variant="outlined"
            disabled={page === 0}
            onClick={() => setPage((prev) => prev - 1)}
          >
            ◀ Prev
          </Button>

          <Typography variant="body2">
            {" "}
            {/* 👈 smaller text */}
            Page {page + 1} of {totalPages}
          </Typography>

          <Button
            size="small" // 👈 smaller button
            variant="outlined"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((prev) => prev + 1)}
          >
            Next ▶
          </Button>
        </Box>

        {loading ? (
          <div className="flex items-center gap-3 py-6">
            <CircularProgress size={22} />
            <span>Loading…</span>
          </div>
        ) : err ? (
          <p className="text-red-600 py-4">{err}</p>
        ) : rows.length === 0 ? (
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
                        S.No
                      </div>
                    </th>
                    <th className="border px-3 py-2 text-center">
                      <div className="flex justify-center items-center">
                        Check
                      </div>
                    </th>
                    <th className="border px-3 py-2 text-center">
                      <div className="flex justify-center items-center">
                        Date
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
                        Item Name
                      </div>
                    </th>
                    <th className="border px-3 py-2 text-center">
                      <div className="flex justify-center items-center">
                        Weight
                      </div>
                    </th>
                    <th className="border px-3 py-2 text-center">
                      <div className="flex justify-center items-center">
                        Design
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
                        Total Amount
                      </div>
                    </th>
                    <th className="border px-3 py-2 text-center">
                      <div className="flex justify-center items-center">
                        Delivery Date
                      </div>
                    </th>
                    <th className="border px-3 py-2 text-center">
                      <div className="flex justify-center items-center">
                        View
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((bill, index) => {
                    const rawStatus = (bill.deliveryStatus ?? "")
                      .toLowerCase()
                      .trim();

                    const isDisabled =
                      rawStatus.includes("deliver") ||
                      rawStatus.includes("cancel");

                    return (
                      <tr
                        key={bill.billId}
                        className={
                          index % 2 === 0 ? "bg-white" : "bg-[#f0f0f0]"
                        }
                      >
                        <td className="border px-3 py-2 text-center">
                          <div className="flex justify-center items-center">
                            {page * pageSize + index + 1}
                          </div>
                        </td>
                        {/* ✅ CHECKBOX COLUMN */}
                        <td className="border px-3 py-2 text-center">
                          <div className="flex justify-center items-center">
                            <input
                              type="checkbox"
                              checked={Boolean(bill.checked)}
                              disabled={isDisabled}
                              onChange={(e) =>
                                handleCheckboxChange(
                                  Number(bill.billId),
                                  e.target.checked,
                                )
                              }
                              className={`jewel-checkbox ${isDisabled ? "disabled" : ""}`}
                            />
                          </div>
                        </td>

                        <td className="border px-3 py-2 text-center">
                          <div className="flex justify-center items-center">
                            {formatDateDMY(bill.orderDate)}
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
                            {bill.itemNames?.join(", ") || "-"}
                          </div>
                        </td>
                        <td className="border px-3 py-2 text-center">
                          <div className="flex justify-center items-center">
                            {bill.itemWeight?.join(", ") || "-"}
                          </div>
                        </td>
                        <td className="border px-3 py-2 text-center">
                          <div className="flex justify-center items-center">
                            {bill.design?.join(", ") || "-"}
                          </div>
                        </td>
                        <td className="border px-3 py-2 text-center">
                          <div className="flex justify-center items-center">
                            {renderWorkStatusChip(bill.workStatus)}{" "}
                          </div>
                        </td>
                        <td className="border px-3 py-2 text-center">
                          <div className="flex justify-center items-center">
                            {renderStatusChip(bill.deliveryStatus)}
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
                            {bill.deliveryDate?.length
                              ? bill.deliveryDate
                                  .map((d) => formatDateDMY(d))
                                  .join(", ")
                              : "N/A"}{" "}
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
  const billingState = {
    page,

    // visible filter controls
    fromDate,
    toDate,
    workFilter,
    statusFilter,

    // filters actually applied to backend
    appliedFromDate,
    appliedToDate,
    appliedWorkFilter,
    appliedStatusFilter,

    filtersApplied,
  };

  sessionStorage.setItem(
    "allBillingOrdersState",
    JSON.stringify(billingState),
  );

  // We came from All Billing Orders
  sessionStorage.setItem(
    "returnToAllBillingOrders",
    "true",
  );

  localStorage.setItem(
    "billNumber",
    bill.billNumber,
  );

  localStorage.setItem(
    "CheckBack",
    "AllBillBack",
  );

  navigate("/admin/bill-details");
}}
                            >
                              <VisibilityIcon fontSize="medium" />
                            </IconButton>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 1, // smaller gap
                mt: 2, // smaller margin
              }}
            >
              <Button
                size="small" // 👈 smaller button
                variant="outlined"
                disabled={page === 0}
                onClick={() => setPage((prev) => prev - 1)}
              >
                ◀ Prev
              </Button>

              <Typography variant="body2">
                {" "}
                {/* 👈 smaller text */}
                Page {page + 1} of {totalPages}
              </Typography>

              <Button
                size="small" // 👈 smaller button
                variant="outlined"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Next ▶
              </Button>
            </Box>
          </div>
        )}
      </Paper>
    </div>
  );
};

export default AllBillingOrders;
