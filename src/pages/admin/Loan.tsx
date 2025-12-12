import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  TextField,
  Box,
  Grid,
  Button,
  InputAdornment,
  CircularProgress,
  Autocomplete,
  Typography,
  Paper,
  MenuItem,
  Chip,
  IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { toast } from "react-toastify";
import { useLocation } from "react-router-dom";
import api from "@/services/api";
import debounce from "lodash/debounce";
import { useNavigate } from "react-router-dom";

import VisibilityIcon from "@mui/icons-material/Visibility";

export interface LoanCustomer {
  loanBillId: number;
  loanBillNumber: string;
  customerLoanId: number;
  name: string;
  village: string;
  phoneNumber: number;
  emailId: string;
  aadharCard: number;
  deliveryStatus: string;
  itemStatus: string;
  numberOfItems: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paidInterestAmount: number;
  dueInterestAmount: number;
  selectedItemsIds: number[];
  loanBillingDate: string;
}

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

const Loan: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [villageSearch, setVillageSearch] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");

  localStorage.removeItem("editBillFromBillDetails");

  localStorage.removeItem("billLoanNumber");
  localStorage.removeItem("bill-phnNumber");
  localStorage.removeItem("phnNumber");

  interface Customer {
    loanCusId: string;
    name: string;
    village: string;
    phoneNumber: string;
    emailId: string;
    gender: string;
    aadharCard: string;
    numberOfActiveItems: number;
    finalAmount: number;
    totalDueAmount: number;
    paidInterestAmount: number;
    dueInterestAmount: number;
  }

  const emptyCustomer: Customer = {
    loanCusId: "",
    name: "",
    village: "",
    phoneNumber: "",
    emailId: "",
    gender: "",
    aadharCard: "",
    numberOfActiveItems: 0,
    finalAmount: 0.0,
    totalDueAmount: 0.0,
    paidInterestAmount: 0.0,
    dueInterestAmount: 0.0,
  };

  // Debounced API call
  const fetchData = debounce(async (query: string) => {
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }

    console.log("🔍 Calling API for:", query);

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.get<string[]>(
        `/admin/searchVillage?query=${query}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("✅ API Response:", res.data);
      setResults(res.data || []);
    } catch (err) {
      console.error("❌ Error fetching villages:", err);
    } finally {
      setLoading(false);
    }
  }, 500);

  // Trigger when user types 3+ chars
  useEffect(() => {
    localStorage.removeItem("loanItemsFrom");

    if (search.trim().length >= 3) {
      fetchData(search);
    } else {
      setResults([]);
    }

    // cancel debounce on unmount
    return () => fetchData.cancel();
  }, [search]);

  const [customer, setCustomer] = useState<Customer>({ ...emptyCustomer });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof Customer, string>>
  >({});

  const handleChange = (field: string, value: string | number) => {
    let newValue = value;
    if (field === "name" && typeof value === "string") {
      newValue = value
        .split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");
    }

    setCustomer((prev) => ({
      ...prev,
      [field]: newValue,
    }));
  };

  const thickTextFieldProps = {
    variant: "outlined" as const,
    fullWidth: true,
    InputLabelProps: { shrink: true },
    InputProps: { style: { fontWeight: "500" } },
  };

  const handleSearch = async () => {
    const trimmedQuery = searchQuery.trim();

    if (!searchType) {
      toast.error("Please select a search type.");
      return;
    }

    if (!trimmedQuery) {
      toast.error("Please enter a value to search.");
      return;
    }

    if (searchType === "Bill Number") {
      localStorage.removeItem("billLoanNumber");
      localStorage.removeItem("bill-loan-phnNumber");
      localStorage.removeItem("checkBackFrom");
      localStorage.setItem("billLoanNumber", "L-" + trimmedQuery);
      localStorage.setItem("checkBackFrom", "billLoanNumber");
      navigate("/admin/bill-loan-details");
    } else if (searchType === "Phone Number") {
      localStorage.removeItem("checkBackFrom");
      localStorage.removeItem("billLoanNumber");
      localStorage.removeItem("bill-loan-phnNumber");
      localStorage.setItem("bill-loan-phnNumber", trimmedQuery);
      localStorage.setItem("checkBackFrom", "Phn-Number");
      navigate("/admin/bill-loan-data");
    } else if (searchType === "Delete Phone Number") {
      try {
        const token = localStorage.getItem("token");

        const res = await api.delete<string>(
          `/admin/deleteLoanCustomerByPhone/${trimmedQuery}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        toast.success(res.data);
        setDeleteMessage(res.data);
      } catch (err: any) {
        const errorMessage = err?.response?.data || "Something went wrong";

        toast.error(errorMessage);
        setDeleteMessage(errorMessage);
      }
    }
  };

  const handleAddCustomer = async () => {
    localStorage.removeItem("loanItemsFrom");

    try {
      const token = localStorage.getItem("token");
      localStorage.removeItem("loanCusDetailsCustomerId");
      localStorage.removeItem("loanCustomerId");

      setFieldErrors({});

      // --- Add village if not empty ---
      if (customer.village?.trim()) {
        await api.post(
          "/admin/addVillage",
          { name: customer.village.trim() },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      console.log("requestbody : ", JSON.stringify(customer));

      const response = await api.post<Customer>(
        "/admin/addLoanCustomer",
        customer,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = response.data;

      if (result?.loanCusId) {
        localStorage.setItem("loanCustomerId", result.loanCusId);
        console.log(" Loan customerId in customer:", result.loanCusId);

        navigate("/admin/loanItems", {
          replace: true,
          state: {
            loanFrom: "LoanPage",
            fromLoanCustomer: true,
          },
        });

        localStorage.setItem("loanItemsFrom", "LoanPage");
      } else {
        toast.error("Failed to add customer");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        // covers both network errors and general JS errors
        console.error("Error adding customer:", error.message);
        toast.error(error.message);
      } else {
        // fallback for unexpected error shapes
        console.error("Unexpected error:", error);
        toast.error("Something went wrong");
      }
    }
  };
  useEffect(() => {
    localStorage.removeItem("editBillFromBillDetails");
    if (location.state?.errorMessage) {
      toast.error(location.state.errorMessage);

      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const [rows, setRows] = useState<LoanCustomer[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "delivered" | "pending"
  >("all");

  useEffect(() => {
    loadAllLoanCustomers();
  }, []);

  const loadAllLoanCustomers = async () => {
    setLoading(true);
    setErr(null);

    try {
      const token = localStorage.getItem("token") ?? "";

      const { data } = await api.get<LoanCustomer[]>("/admin/getALlLoanBills", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch all bills:", e);
      setErr("Failed to load billing orders.");
    } finally {
      setLoading(false);
    }
  };

  const filteredRows = useMemo(() => {
    const f = fromDate.trim();
    const t = toDate.trim();
    const v = villageSearch.trim().toLowerCase();

    return rows.filter((bill) => {
      const norm = normalizeStatus(bill.deliveryStatus);
      if (statusFilter !== "all" && norm !== statusFilter) return false;

      if (v && !bill.village?.toLowerCase().includes(v)) return false;

      if (!f && !t) return true;
      const billDay = toDateOnlyYYYYMMDD(bill.loanBillingDate);
      if (!billDay) return false;

      if (f && t) return billDay >= f && billDay <= t;
      if (f && !t) return billDay === f;
      if (!f && t) return billDay === t;
      return true;
    });
  }, [rows, fromDate, toDate, statusFilter, villageSearch]);

  const clearFilters = () => {
    setFromDate("");
    setToDate("");
    setStatusFilter("all"); // 👈 also reset status to ALL
    setVillageSearch("");
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
    <div>
      <div className="mt-6 px-2 sm:mt-10 sm:p-3 flex flex-col items-center justify-center gap-6">
        <Paper
          elevation={4}
          sx={{ borderRadius: "24px" }}
          className="relative p-4 sm:p-6 rounded-xl w-full max-w-6xl bg-white/75 backdrop-blur-lg border border-[#d0b3ff] shadow-[0_10px_30px_rgba(136,71,255,0.3)]"
        >
          <Typography
            variant="h4"
            fontWeight="bold"
            color="primary"
            gutterBottom
          >
            Search Loan Customer
          </Typography>

          <Box
            mt={4}
            className="flex flex-col sm:flex-row w-full max-w-2xl gap-3 sm:gap-2"
            mb={4}
          >
            <TextField
              select
              label="Search Type"
              value={searchType}
              onChange={(e) => {
                setSearchType(e.target.value);
                if (e.target.value === "ALL") {
                  setSearchQuery("");
                }
              }}
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              sx={{ width: "1500px" }}
            >
              <MenuItem value="">
                <em>Select Search Type</em>
              </MenuItem>
              <MenuItem value="Bill Number">Bill Number</MenuItem>
              <MenuItem value="Phone Number">Phone Number</MenuItem>
              <MenuItem value="Delete Phone Number">
                Delete Phone Number
              </MenuItem>
            </TextField>

            <TextField
              sx={{ width: "200%" }}
              variant="outlined"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={searchType === "ALL"}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon
                      color={searchType === "ALL" ? "disabled" : "action"}
                    />
                  </InputAdornment>
                ),
                style: {
                  backgroundColor: searchType === "ALL" ? "#f0f0f0" : "#fff",
                },
              }}
            />

            <Button
              variant="outlined"
              onClick={async () => {
                handleSearch();
              }}
              sx={{
                paddingX: 6,
                paddingY: 0.2,
                borderRadius: "12px",
                fontWeight: "bold",
                borderColor: "#8847FF",
                color: "#8847FF",
                "&:hover": { backgroundColor: "#8847FF", color: "#fff" },
              }}
            >
              Search
            </Button>
          </Box>
        </Paper>
      </div>

      <div className="mt-10 p-3 flex flex-col items-center justify-center gap-6">
        <Paper
          elevation={4}
          sx={{ borderRadius: "24px" }}
          className="relative p-6 rounded-xl w-full max-w-6xl bg-white/75 backdrop-blur-lg border border-[#d0b3ff] shadow-[0_10px_30px_rgba(136,71,255,0.3)]"
        >
          <Typography
            variant="h4"
            fontWeight="bold"
            color="primary"
            gutterBottom
          >
            Add Loan Customer
          </Typography>
          <Grid container spacing={3} mt={6}>
            {(
              [
                "name",
                "village",
                "phoneNumber",
                "emailId",
                "gender",
                "aadharCard",
              ] as (keyof Customer)[]
            ).map((key) => (
              <Grid key={key} size={{ xs: 6, sm: 4 }}>
                {key === "village" ? (
                  <Autocomplete
                    freeSolo
                    disableClearable
                    options={results || []}
                    loading={loading}
                    value={customer.village || ""}
                    onInputChange={(event, newInputValue) => {
                      setSearch(newInputValue); // only update search
                    }}
                    onChange={(event, newValue) => {
                      handleChange("village", newValue || ""); // update customer only after selection
                    }}
                    renderOption={(props, option) => (
                      <li {...props} key={option}>
                        {option}
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        {...thickTextFieldProps}
                        sx={{ width: "100%" }}
                        label="Village"
                        placeholder="Type 3 letters to search..."
                        helperText={
                          search.length >= 3
                            ? results.length > 0
                              ? "Select from list or type new"
                              : "No villages found, you can add new"
                            : ""
                        }
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loading ? (
                                <span className="text-gray-400 text-sm pr-2">
                                  Loading...
                                </span>
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                ) : key === "gender" ? (
                  <TextField
                    {...thickTextFieldProps}
                    sx={{ width: "100%" }}
                    select
                    label="Gender"
                    value={customer.gender}
                    onChange={(e) => handleChange("gender", e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Select Gender</em>
                    </MenuItem>
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                  </TextField>
                ) : (
                  <TextField
                    {...thickTextFieldProps}
                    sx={{ width: "100%" }}
                    label={
                      key === "phoneNumber"
                        ? "Phone Number"
                        : key === "emailId"
                        ? "Email ID"
                        : key === "aadharCard"
                        ? "Aadhar Card"
                        : key.charAt(0).toUpperCase() + key.slice(1)
                    }
                    value={customer[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    error={!!fieldErrors[key]}
                    helperText={fieldErrors[key]}
                  />
                )}
              </Grid>
            ))}
          </Grid>

          <Box display="flex" justifyContent="flex-end" mt={4}>
            <Button
              onClick={handleAddCustomer}
              variant="outlined"
              sx={{
                paddingX: 4,
                paddingY: 1.5,
                borderRadius: "12px",
                fontWeight: "bold",
                boxShadow: "0px 4px 10px rgba(136,71,255,0.5)",
                borderColor: "#8847FF",
                color: "#8847FF",
                transition: "all 0.3s",
                "&:hover": { backgroundColor: "#8847FF", color: "#fff" },
              }}
            >
              Next
            </Button>
          </Box>
        </Paper>
      </div>
      <div
        className="mt-10 p-3 flex flex-col items-center justify-center"
        style={{ paddingBottom: "300px" }}
        ref={bottomRef}
      >
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
          <Typography
            variant="h4"
            fontWeight="bold"
            color="primary"
            gutterBottom
          >
            All Loan Billing Orders
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

            <Autocomplete
              freeSolo
              disableClearable
              options={results || []}
              loading={loading}
              value={villageSearch || ""}
              sx={{ width: 170, ml: { xs: 0, sm: 1 } }}
              onInputChange={(event, newValue) => {
                setVillageSearch(newValue); // update input box

                if (newValue.length >= 3) {
                  fetchData(newValue); // your debounce API call
                } else {
                  setResults([]); // clear suggestions
                }
              }}
              onChange={(event, newValue) => {
                setVillageSearch(newValue || ""); // update selected value
              }}
              renderOption={(props, option) => (
                <li {...props} key={option}>
                  {option}
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  variant="outlined"
                  className="mb-3"
                  label="Search by Village"
                  placeholder="Type 3 letters to search..."
                  helperText={
                    villageSearch.length >= 3
                      ? results.length > 0
                        ? "Select from the list"
                        : "No villages found"
                      : ""
                  }
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loading ? (
                          <span className="text-gray-400 text-sm pr-2">
                            Loading...
                          </span>
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />

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
                          Loan Bill Number
                        </div>
                      </th>
                      <th className="border px-3 py-2 text-center">
                        <div className="flex justify-center items-center">
                          Name
                        </div>
                      </th>
                      <th className="border px-3 py-2 text-center">
                        <div className="flex justify-center items-center">
                          Village
                        </div>
                      </th>
                      <th className="border px-3 py-2 text-center">
                        <div className="flex justify-center items-center">
                          Item Status
                        </div>
                      </th>
                      <th className="border px-3 py-2 text-center">
                        <div className="flex justify-center items-center">
                          Delivery Status
                        </div>
                      </th>
                      <th className="border px-3 py-2 text-center">
                        <div className="flex justify-center items-center">
                          Items
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
                      <tr key={bill.loanBillId} className="bg-white/90">
                        <td className="border px-3 py-2 text-center">
                          <div className="flex justify-center items-center">
                            {bill.loanBillingDate ?? "N/A"}
                          </div>
                        </td>

                        <td className="border px-3 py-2 text-center">
                          <div className="flex justify-center items-center">
                            {bill.loanBillNumber}{" "}
                          </div>
                        </td>
                        <td className="border px-3 py-2 text-center">
                          <div className="flex justify-center items-center">
                            {bill.name}{" "}
                          </div>
                        </td>
                        <td className="border px-3 py-2 text-center">
                          <div className="flex justify-center items-center">
                            {bill.village}{" "}
                          </div>
                        </td>

                        <td className="border px-3 py-2 text-center">
                          <div className="flex justify-center items-center">
                            {renderStatusChip(bill.itemStatus)}
                          </div>
                        </td>
                        <td className="border px-3 py-2 text-center">
                          <div className="flex justify-center items-center">
                            {renderStatusChip(bill.deliveryStatus)}
                          </div>
                        </td>

                        <td className="border px-3 py-2 text-center">
                          <div className="flex justify-center items-center">
                            {bill.numberOfItems ?? 0}
                          </div>
                        </td>

                        <td className="border px-3 py-2 text-center">
                          <div className="flex justify-center items-center">
                            {bill.totalAmount != null
                              ? bill.totalAmount.toFixed(2)
                              : "-"}
                          </div>
                        </td>

                        <td className="border px-3 py-2 text-center">
                          <div className="flex justify-center items-center">
                            {bill.dueAmount != null
                              ? bill.dueAmount.toFixed(2)
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
                                localStorage.removeItem("billLoanNumber");
                                localStorage.removeItem("checkBackFrom");

                                localStorage.setItem(
                                  "billLoanNumber",
                                  bill.loanBillNumber
                                );
                                localStorage.setItem("checkBackFrom", "Loan");
                                navigate("/admin/bill-loan-details");
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
      {deleteMessage && (
        <div className="mt-4 p-3 bg-gray-100 text-black rounded-md shadow">
          {deleteMessage}
        </div>
      )}
    </div>
  );
};

export default Loan;
