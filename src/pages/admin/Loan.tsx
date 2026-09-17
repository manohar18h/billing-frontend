import React, { useState, useEffect, useRef } from "react";
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
  Dialog,
DialogTitle,
DialogContent,
DialogActions,
Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { toast } from "react-toastify";
import { useLocation } from "react-router-dom";
import api from "@/services/api";
import debounce from "lodash/debounce";
import { useNavigate } from "react-router-dom";

import VisibilityIcon from "@mui/icons-material/Visibility";
import EditNoteIcon from "@mui/icons-material/EditNote";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

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
  checked: boolean;
  itemNames: string[];
  itemWeight: number[];
  orderDate: string | null;
  salesNote?: string | null;
}

type PageResponse<T> = {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number; // current page
  size: number;
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

function formatDateDMY(s: string | null): string {
  if (!s) return "N/A";

  const d = new Date(s);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function normalizeStatus(
  s: string | undefined | null,
): "delivered" | "pending" | "other" {
  const v = (s ?? "").toLowerCase().trim();
  if (v.includes("deliver")) return "delivered";
  if (v.includes("pend")) return "pending";
  return "other";
}

type LoanBillingFilterState = {
  fromDate: string;
  toDate: string;
  statusFilter: "all" | "delivered" | "pending";
  villageSearch: string;
  filtersApplied: boolean;
  page: number;
};

const getSavedLoanFilterState = (): LoanBillingFilterState | null => {
  try {
    const saved = sessionStorage.getItem("loanBillingFilterState");

    if (!saved) {
      return null;
    }

    return JSON.parse(saved) as LoanBillingFilterState;
  } catch {
    return null;
  }
};

const Loan: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [deleteMessage, setDeleteMessage] = useState("");

const [noteDialogOpen, setNoteDialogOpen] = useState(false);
const [selectedNoteBill, setSelectedNoteBill] =
  useState<LoanCustomer | null>(null);
const [noteText, setNoteText] = useState("");
const [savingNote, setSavingNote] = useState(false);

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
        },
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
    if (
      (field === "name" || field === "village") &&
      typeof value === "string"
    ) {
      newValue = value
        .split(" ")
        .map((word) =>
          word.length === 0
            ? ""
            : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
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
          },
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
          },
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
        },
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

 const savedLoanFilterState = (() => {
  try {
    const saved = sessionStorage.getItem("loanBillingFilterState");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
})();



const [rows, setRows] = useState<LoanCustomer[]>([]);
const [err, setErr] = useState<string | null>(null);

// Visible filter values
const [fromDate, setFromDate] = useState<string>(
  savedLoanFilterState?.fromDate ?? "",
);

const [toDate, setToDate] = useState<string>(
  savedLoanFilterState?.toDate ?? "",
);

const [statusFilter, setStatusFilter] = useState<
  "all" | "delivered" | "pending"
>(
  savedLoanFilterState?.statusFilter ?? "all",
);

const [villageSearch, setVillageSearch] = useState(
  savedLoanFilterState?.villageSearch ?? "",
);

// Pagination
const [page, setPage] = useState(
  savedLoanFilterState?.page ?? 0,
);

const [totalPages, setTotalPages] = useState(0);

const pageSize = 50;

// Is filter currently applied?
const [filtersApplied, setFiltersApplied] = useState(
  savedLoanFilterState?.filtersApplied ?? false,
);

// Applied filter values
const [appliedFromDate, setAppliedFromDate] = useState(
  savedLoanFilterState?.fromDate ?? "",
);

const [appliedToDate, setAppliedToDate] = useState(
  savedLoanFilterState?.toDate ?? "",
);

const [appliedStatusFilter, setAppliedStatusFilter] = useState<
  "all" | "delivered" | "pending"
>(
  savedLoanFilterState?.statusFilter ?? "all",
);

const [appliedVillageSearch, setAppliedVillageSearch] = useState(
  savedLoanFilterState?.villageSearch ?? "",
);

  useEffect(() => {
  loadAllLoanCustomers(page);
}, [
  page,
  filtersApplied,
  appliedFromDate,
  appliedToDate,
  appliedStatusFilter,
  appliedVillageSearch,
]);

const loadAllLoanCustomers = async (
  pageNumber: number = 0,
) => {
  setLoading(true);
  setErr(null);

  try {
    const params = new URLSearchParams();

    params.set("page", pageNumber.toString());
    params.set("size", pageSize.toString());

    let endpoint = "/admin/getALlLoanBills";

    // Only use filtered endpoint AFTER Apply Filters
    if (filtersApplied) {
      endpoint = "/admin/getFilteredLoanBills";

      if (appliedFromDate) {
        params.set(
          "fromDate",
          appliedFromDate,
        );
      }

      if (appliedToDate) {
        params.set(
          "toDate",
          appliedToDate,
        );
      }

      params.set(
        "deliveryStatus",
        appliedStatusFilter,
      );

      if (appliedVillageSearch.trim()) {
        params.set(
          "village",
          appliedVillageSearch.trim(),
        );
      }
    }

    const { data } =
      await api.get<PageResponse<LoanCustomer>>(
        `${endpoint}?${params.toString()}`,
      );

    setRows(data.content || []);
    setTotalPages(data.totalPages || 0);

  } catch (e) {
    console.error(
      "Failed to fetch loan bills:",
      e,
    );

    setErr(
      "Failed to load loan billing orders.",
    );
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  const shouldReturnToBilling =
    sessionStorage.getItem("returnToLoanBilling");

  if (shouldReturnToBilling !== "true") {
    return;
  }

  // Wait until loan billing data has finished loading
  if (loading) {
    return;
  }

  const timer = setTimeout(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    sessionStorage.removeItem("returnToLoanBilling");
  }, 200);

  return () => clearTimeout(timer);
}, [loading]);

const applyFilters = () => {
  const filterState = {
    fromDate,
    toDate,
    statusFilter,
    villageSearch,
    filtersApplied: true,
    page: 0,
  };

  // Save filter state
  sessionStorage.setItem(
    "loanBillingFilterState",
    JSON.stringify(filterState),
  );

  setPage(0);

  setAppliedFromDate(fromDate);
  setAppliedToDate(toDate);
  setAppliedStatusFilter(statusFilter);
  setAppliedVillageSearch(villageSearch);

  setFiltersApplied(true);
};
 

  const handleCheckboxChange = async (loanBillId: number, checked: boolean) => {
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
      loadAllLoanCustomers(page);
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

 

 const clearFilters = () => {

    sessionStorage.removeItem("loanBillingFilterState");

  // Visible filter controls
  setFromDate("");
  setToDate("");
  setStatusFilter("all");
  setVillageSearch("");

  // Actually applied filters
  setAppliedFromDate("");
  setAppliedToDate("");
  setAppliedStatusFilter("all");
  setAppliedVillageSearch("");

  // Return to normal pagination
  setFiltersApplied(false);
  setPage(0);
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

const changePage = (newPage: number) => {
  setPage(newPage);

  const filterState = {
    fromDate: appliedFromDate,
    toDate: appliedToDate,
    statusFilter: appliedStatusFilter,
    villageSearch: appliedVillageSearch,
    filtersApplied,
    page: newPage,
  };

  sessionStorage.setItem(
    "loanBillingFilterState",
    JSON.stringify(filterState),
  );
};



const openNoteDialog = (bill: LoanCustomer) => {
  setSelectedNoteBill(bill);
  setNoteText(bill.salesNote || "");
  setNoteDialogOpen(true);
};

const closeNoteDialog = () => {
  if (savingNote) return;

  setNoteDialogOpen(false);
  setSelectedNoteBill(null);
  setNoteText("");
};

const saveLoanNote = async () => {
  if (!selectedNoteBill) return;

  if (!noteText.trim()) {
    toast.error("Please enter a note.");
    return;
  }

  try {
    setSavingNote(true);

    const token = localStorage.getItem("token") ?? "";

    await api.patch(
      `/admin/loanBilling/${selectedNoteBill.loanBillId}/note`,
      {
        note: noteText.trim(),
      },
      {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : undefined,
      },
    );

    setRows((prev) =>
      prev.map((row) =>
        row.loanBillId === selectedNoteBill.loanBillId
          ? { ...row, salesNote: noteText.trim() }
          : row,
      ),
    );

    toast.success("Note saved successfully.");
    closeNoteDialog();
  } catch (error) {
    console.error("Failed to save note:", error);
    toast.error("Failed to save note.");
  } finally {
    setSavingNote(false);
  }
};

const deleteLoanNote = async () => {
  if (!selectedNoteBill) return;

  const confirmed = window.confirm(
    "Are you sure you want to delete this note?",
  );

  if (!confirmed) return;

  try {
    setSavingNote(true);

    const token = localStorage.getItem("token") ?? "";

    await api.delete(
      `/admin/loanBilling/${selectedNoteBill.loanBillId}/note`,
      {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : undefined,
      },
    );

    setRows((prev) =>
      prev.map((row) =>
        row.loanBillId === selectedNoteBill.loanBillId
          ? { ...row, salesNote: null }
          : row,
      ),
    );

    toast.success("Note deleted successfully.");

    setNoteDialogOpen(false);
    setSelectedNoteBill(null);
    setNoteText("");
  } catch (error) {
    console.error("Failed to delete note:", error);
    toast.error("Failed to delete note.");
  } finally {
    setSavingNote(false);
  }
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
  mb={4}
  className="grid w-full grid-cols-1 gap-3 md:max-w-3xl md:grid-cols-[220px_1fr_150px]"
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
             sx={{ width: "100%" }}
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
              sx={{ width: "100%" }}
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
  height: { xs: 48, md: "auto" },
  px: { xs: 4, md: 6 },
  py: { xs: 1.2, md: 0.2 },
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

<div className="mt-6 px-2 md:mt-10 md:p-3 flex flex-col items-center justify-center gap-6">
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
              <Grid key={key} size={{ xs: 12, sm: 6, md: 4 }}>
                {key === "village" ? (
                  <Autocomplete
                    freeSolo
                    disableClearable
                    options={results || []}
                    loading={loading}
                    value={customer.village || ""}
                    onInputChange={(event, newInputValue) => {
                      setSearch(newInputValue); // only update search
                      handleChange("village", newInputValue);
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
      >
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
          <Typography
  ref={bottomRef}
  variant="h4"
  fontWeight="bold"
  color="primary"
  gutterBottom
  sx={{ scrollMarginTop: "30px" }}
>
  All Loan Billing Orders
</Typography>

          {/* Filters row */}
          <Box
           sx={{
  display: "grid",
  gridTemplateColumns: {
    xs: "1fr",
    sm: "1fr 1fr",
    md: "180px 180px 170px 200px 150px 100px",
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
sx={{ width: "100%" }}            />

            <TextField
              label="To"
              type="date"
              size="small"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
sx={{ width: "100%" }}            />

            <TextField
              select
              label="Status"
              size="small"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
sx={{ width: "100%" }}              InputLabelProps={{ shrink: true }}
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


            <Button
  variant="contained"
  onClick={applyFilters}
  sx={{
    height: 45,
    whiteSpace: "nowrap",
  }}
>
  APPLY FILTERS
</Button>

            {/* 👇 moved to the end and clears all filters */}
           <Button
  variant="outlined"
  onClick={clearFilters}
  sx={{
    height: 45,
    whiteSpace: "nowrap",
  }}
>
  CLEAR
</Button>
          </Box>



          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 1,
              mt: 3,
            }}
          >
            <Button
              size="small"
              variant="outlined"
              disabled={page === 0}
              onClick={() => changePage(page - 1)}
            >
              ◀ Prev
            </Button>

            <Typography variant="body2">
              Page {page + 1} of {totalPages}
            </Typography>

            <Button
              size="small"
              variant="outlined"
              disabled={page + 1 >= totalPages}
              onClick={() => changePage(page + 1)}
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

              {/* Mobile card view */}
<div className="space-y-3 md:hidden">
  {rows.map((bill, index) => {
    const isDelivered =
      normalizeStatus(bill.deliveryStatus) === "delivered";

    return (
      <div
        key={bill.loanBillId}
        className="rounded-2xl border border-gray-100 bg-[#fffaf0] p-4 shadow-sm"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold text-gray-500">
              #{page * pageSize + index + 1}
            </div>

            <div className="mt-1 text-xs text-gray-500">Loan Bill No</div>
            <div className="font-bold text-blue-700">
              {bill.loanBillNumber}
            </div>
          </div>

          <input
            type="checkbox"
            checked={Boolean(bill.checked)}
            disabled={isDelivered}
            onChange={(e) =>
              handleCheckboxChange(Number(bill.loanBillId), e.target.checked)
            }
            className={`jewel-checkbox ${isDelivered ? "disabled" : ""}`}
          />
        </div>

        <div className="mt-3">
          <div className="font-bold text-[#b6276f]">{bill.name}</div>
          <div className="text-xs text-gray-600">{bill.village}</div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-white p-2">
            <div className="text-[11px] text-gray-500">Date</div>
            <div className="text-sm font-bold">
              {formatDateDMY(bill.orderDate)}
            </div>
          </div>

          <div className="rounded-xl bg-white p-2">
            <div className="text-[11px] text-gray-500">Total</div>
            <div className="text-sm font-bold text-[#e38111]">
              ₹{bill.totalAmount != null ? bill.totalAmount.toFixed(2) : "-"}
            </div>
          </div>

          <div className="rounded-xl bg-white p-2">
            <div className="text-[11px] text-gray-500">Item</div>
            <div className="text-sm font-bold">
              {bill.itemNames?.join(", ") || "-"}
            </div>
          </div>

          <div className="rounded-xl bg-white p-2">
            <div className="text-[11px] text-gray-500">Weight</div>
            <div className="text-sm font-bold">
              {bill.itemWeight?.join(", ") || "-"}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {renderStatusChip(bill.itemStatus)}
          {renderStatusChip(bill.deliveryStatus)}
        </div>

        <div className="mt-3 flex justify-between items-center">

  <Button
    size="small"
    startIcon={<EditNoteIcon />}
    onClick={() => openNoteDialog(bill)}
    sx={{
      color: bill.salesNote?.trim()
        ? "#16a34a"
        : "#d97706",
      fontWeight: 700,
    }}
  >
    {bill.salesNote?.trim() ? "View Note" : "Add Note"}
  </Button>
          <button
            onClick={() => {
  const filterState = {
    fromDate: appliedFromDate,
    toDate: appliedToDate,
    statusFilter: appliedStatusFilter,
    villageSearch: appliedVillageSearch,
    filtersApplied,
    page,
  };

  sessionStorage.setItem(
    "loanBillingFilterState",
    JSON.stringify(filterState),
  );

  sessionStorage.setItem(
    "returnToLoanBilling",
    "true",
  );

  localStorage.removeItem("billLoanNumber");
  localStorage.removeItem("checkBackFrom");

  localStorage.setItem(
    "billLoanNumber",
    bill.loanBillNumber,
  );

  localStorage.setItem(
    "checkBackFrom",
    "Loan",
  );

  navigate("/admin/bill-loan-details");
}}
            className="rounded-full bg-[#85400b] px-4 py-2 text-xs font-bold text-white"
          >
            View
          </button>
        </div>
      </div>
    );
  })}
</div>
             <Box
  sx={{
    width: "100%",
    overflowX: "auto",
    display: { xs: "none", md: "block" },
  }}
>




<table className="min-w-[1100px] w-full border-collapse border border-gray-300 rounded-xl overflow-hidden">                  <thead className="bg-gray-200">
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
    Total Amount
  </div>
</th>

<th className="border px-3 py-2 text-center">
  <div className="flex justify-center items-center">
    Note
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
                      const isDelivered =
                        normalizeStatus(bill.deliveryStatus) === "delivered";
                      return (
                        <tr
                          key={bill.loanBillId}
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-[#f0f0f0]"
                          }
                        >
                          <td className="border px-3 py-2 text-center">
                            <div className="flex justify-center items-center">
                              {page * pageSize + index + 1}
                            </div>
                          </td>
                          <td className="border px-3 py-2 text-center">
                            <div className="flex justify-center items-center">
                              <input
                                type="checkbox"
                                checked={Boolean(bill.checked)}
                                disabled={isDelivered}
                                onChange={(e) =>
                                  handleCheckboxChange(
                                    Number(bill.loanBillId),
                                    e.target.checked,
                                  )
                                }
                                className={`jewel-checkbox ${isDelivered ? "disabled" : ""}`}
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
                              {bill.totalAmount != null
                                ? bill.totalAmount.toFixed(2)
                                : "-"}
                            </div>
                          </td>

                         <td className="border px-3 py-2 text-center">
  <Tooltip
    title={
      bill.salesNote?.trim()
        ? bill.salesNote
        : "Add customer follow-up note"
    }
    arrow
  >
    <IconButton
      size="medium"
      onClick={() => openNoteDialog(bill)}
      sx={{
        color: bill.salesNote?.trim()
          ? "#16a34a"
          : "#d97706",
        "&:hover": {
          backgroundColor: "#fff7ed",
        },
      }}
    >
      <EditNoteIcon fontSize="medium" />
    </IconButton>
  </Tooltip>
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
  // Save current page + filters
  const filterState = {
    fromDate: appliedFromDate,
    toDate: appliedToDate,
    statusFilter: appliedStatusFilter,
    villageSearch: appliedVillageSearch,
    filtersApplied,
    page,
  };

  sessionStorage.setItem(
    "loanBillingFilterState",
    JSON.stringify(filterState),
  );

  // IMPORTANT: tells Loan page to scroll to billing orders on return
  sessionStorage.setItem(
    "returnToLoanBilling",
    "true",
  );

  localStorage.removeItem("billLoanNumber");
  localStorage.removeItem("checkBackFrom");

  localStorage.setItem(
    "billLoanNumber",
    bill.loanBillNumber,
  );

  localStorage.setItem(
    "checkBackFrom",
    "Loan",
  );

  navigate("/admin/bill-loan-details");
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
                  gap: 1,
                  mt: 3,
                }}
              >
                <Button
                  size="small"
                  variant="outlined"
                  disabled={page === 0}
                  onClick={() => changePage(page - 1)}
                >
                  ◀ Prev
                </Button>

                <Typography variant="body2">
                  Page {page + 1} of {totalPages}
                </Typography>

                <Button
                  size="small"
                  variant="outlined"
                  disabled={page + 1 >= totalPages}
                  onClick={() => changePage(page + 1)}
                >
                  Next ▶
                </Button>
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


      <Dialog
  open={noteDialogOpen}
  onClose={closeNoteDialog}
  fullWidth
  maxWidth="sm"
>
  <DialogTitle sx={{ fontWeight: 700 }}>
    Customer Follow-up Note
  </DialogTitle>

  <DialogContent>
    {selectedNoteBill && (
      <Box
        sx={{
          mb: 2,
          mt: 0.5,
          p: 1.5,
          borderRadius: 2,
          backgroundColor: "#f8fafc",
        }}
      >
        <Typography fontWeight={700}>
          {selectedNoteBill.name}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Bill: {selectedNoteBill.loanBillNumber}
        </Typography>
      </Box>
    )}

    <TextField
      autoFocus
      fullWidth
      multiline
      minRows={4}
      maxRows={8}
      label="Sales Follow-up Note"
      placeholder="Example: Customer said he will pay the interest on 20/09/2026."
      value={noteText}
      onChange={(e) => setNoteText(e.target.value)}
    />
  </DialogContent>

  <DialogActions sx={{ px: 3, pb: 2 }}>
    {selectedNoteBill?.salesNote?.trim() && (
      <Button
        color="error"
        startIcon={<DeleteOutlineIcon />}
        disabled={savingNote}
        onClick={deleteLoanNote}
      >
        Delete
      </Button>
    )}

    <Box sx={{ flex: 1 }} />

    <Button
      onClick={closeNoteDialog}
      disabled={savingNote}
    >
      Cancel
    </Button>

    <Button
      variant="contained"
      disabled={savingNote || !noteText.trim()}
      onClick={saveLoanNote}
    >
      {savingNote ? "Saving..." : "Save Note"}
    </Button>
  </DialogActions>
</Dialog>
    </div>


  );
};

export default Loan;
