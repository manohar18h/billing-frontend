import React, { useState, useEffect, useRef } from "react";
import {
  TextField,
  Box,
  Grid,
  Button,
  InputAdornment,
  Autocomplete,
  Typography,
  MenuItem,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useLocation } from "react-router-dom";
import api from "@/services/api";
import debounce from "lodash/debounce";



interface VillageCustomer {
  phoneNumber: string;
  name: string;
}



const SearchAddCustomer: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

   useEffect(() => {
  localStorage.removeItem("editBillFromBillDetails");
  localStorage.removeItem("billNumber");
  localStorage.removeItem("bill-phnNumber");
  localStorage.removeItem("phnNumber");
}, []);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [villageCustomers, setVillageCustomers] = useState<VillageCustomer[]>(
    [],
  );
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [customerNameSearch, setCustomerNameSearch] = useState("");

  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
const [duplicatePhoneNumber, setDuplicatePhoneNumber] = useState("");
const [duplicateMessage, setDuplicateMessage] = useState("");
const [savingCustomer, setSavingCustomer] = useState(false);

  

 interface Customer {
  customerId: string;
  name: string;
  village: string;
  phoneNumber: string;
  emailId: string;
  numberOfOrders: number;
  finalAmount: number;
  totalDueAmount: number;
  password: string;

  fullAddress: string;
  pincode: string;
  aadhaarNumber: string;
  panNumber: string;

  mobileVerified?: boolean;
  aadhaarVerified?: boolean;
  idProofUrl?: string;
  addressProofUrl?: string;
}

 const emptyCustomer: Customer = {
  customerId: "",
  name: "",
  village: "",
  phoneNumber: "",
  emailId: "",
  numberOfOrders: 0,
  finalAmount: 0,
  totalDueAmount: 0,
  password: "",

  fullAddress: "",
  pincode: "",
  aadhaarNumber: "",
  panNumber: "",

  mobileVerified: false,
  aadhaarVerified: false,
  idProofUrl: "",
  addressProofUrl: "",
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

 const handleChange = (
  field: keyof Customer,
  value: string | number,
) => {
  let newValue = value;

 if (field === "name" && typeof value === "string") {
  newValue = value.replace(
    /(^|\s)([a-zA-Z])/g,
    (_match, space, letter) =>
      space + letter.toUpperCase(),
  );
}

  if (
    field === "phoneNumber" ||
    field === "pincode" ||
    field === "aadhaarNumber"
  ) {
    newValue = String(value).replace(/\D/g, "");
  }

  if (field === "panNumber") {
    newValue = String(value).toUpperCase();
  }

  setCustomer((prev) => ({
    ...prev,
    [field]: newValue,
  }));



  setFieldErrors((prev) => ({
    ...prev,
    [field]: "",
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
      localStorage.removeItem("billNumber");
      localStorage.setItem("billNumber", "HJ-" + trimmedQuery);
      navigate("/admin/bill-details");
    } else if (searchType === "Phone Number") {
      localStorage.removeItem("bill-phnNumber");
      localStorage.setItem("bill-phnNumber", trimmedQuery);
      navigate("/admin/bill-Data");
    } else if (searchType === "Village") {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get(
          `/admin/customers/by-village?village=${trimmedQuery}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setVillageCustomers(res.data as VillageCustomer[]);
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      } catch (err) {
        toast.error("Failed to fetch customers");
      }
    } else if (searchType === "Delete Phone Number") {
      try {
        const token = localStorage.getItem("token");

        const res = await api.delete<string>(
          `/admin/deleteCustomerByPhone/${trimmedQuery}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        setVillageCustomers([]);
        toast.success(res.data);
        setDeleteMessage(res.data);
      } catch (err: any) {
        const errorMessage = err?.response?.data || "Something went wrong";

        toast.error(errorMessage);
        setDeleteMessage(errorMessage);
      }
    }
  };

 

  const capitalizeFirst = (value: string) =>
    value ? value.charAt(0).toUpperCase() + value.slice(1) : "";


  const handleCloseDuplicateDialog = () => {
  setDuplicateDialogOpen(false);
  setDuplicatePhoneNumber("");
  setDuplicateMessage("");
};

const handleOpenExistingCustomer = () => {
  const phoneNumber = String(duplicatePhoneNumber || "").trim();

  if (!phoneNumber) {
    toast.error("Customer phone number is missing.");
    return;
  }

  localStorage.removeItem("customerId");
  localStorage.removeItem("CusDetailsCustomerId");
  localStorage.removeItem("from");

  localStorage.setItem("bill-phnNumber", phoneNumber);

  navigate("/admin/bill-Data", {
    replace: true,
  });
};



const validateCustomerRegistration = (): boolean => {
  const errors: Partial<
    Record<keyof Customer, string>
  > = {};

  const name = customer.name.trim();
  const village = customer.village.trim();
  const phoneNumber =
    customer.phoneNumber.replace(/\D/g, "");

  if (!name) {
    errors.name = "Customer name is required";
  }

  if (!village) {
    errors.village = "Village is required";
  }

  if (!phoneNumber) {
    errors.phoneNumber =
      "Phone number is required";
  } else if (!/^\d{10}$/.test(phoneNumber)) {
    errors.phoneNumber =
      "Enter a valid 10-digit phone number";
  }

  if (
    customer.emailId.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      customer.emailId.trim(),
    )
  ) {
    errors.emailId =
      "Enter a valid email address";
  }

  setFieldErrors(errors);

  if (Object.keys(errors).length > 0) {
    toast.error(
      "Please correct the highlighted fields.",
    );
    return false;
  }

  return true;
};

const handleAddCustomer = async () => {
  if (savingCustomer) return;

  if (!validateCustomerRegistration()) {
    return;
  }

  const phoneNumber =
    customer.phoneNumber.replace(/\D/g, "");

  try {
    setSavingCustomer(true);

    localStorage.removeItem(
      "CusDetailsCustomerId",
    );
    localStorage.removeItem("customerId");
    localStorage.removeItem("from");

   if (customer.village.trim()) {
  try {
    await api.post("/admin/addVillage", {
      name: customer.village.trim(),
    });
  } catch (error: any) {
    const status = error?.response?.status;

    // Ignore duplicate village conflict.
    if (status !== 409) {
      throw error;
    }
  }
}
    const response = await api.post<Customer>(
      "/admin/addCustomer",
      {
        name: customer.name.trim(),
        village: customer.village.trim(),
        phoneNumber,
        emailId:
          customer.emailId.trim() || null,

        password: null,
        fullAddress: null,
        pincode: null,
        aadhaarNumber: null,
        panNumber: null,

        mobileVerified: false,
        aadhaarVerified: false,
      },
    );

    const result = response.data;

    if (!result?.customerId) {
      throw new Error(
        "Customer ID was not returned.",
      );
    }

    localStorage.setItem(
      "customerId",
      String(result.customerId),
    );

    localStorage.setItem(
      "CusDetailsCustomerId",
      String(result.customerId),
    );

    localStorage.setItem(
      "bill-phnNumber",
      String(result.phoneNumber),
    );

    localStorage.setItem("from", "customer");

    toast.success(
      "Customer created successfully.",
    );

    navigate("/admin/bill-Data", {
      replace: true,
    });
  } catch (error: any) {
    console.error(
      "Customer creation error:",
      error,
    );

    const status = error?.response?.status;
    const data = error?.response?.data;

    if (status === 409) {
      setDuplicatePhoneNumber(phoneNumber);

      setDuplicateMessage(
        typeof data === "string"
          ? data
          : data?.message ||
              "This phone number is already registered.",
      );

      setDuplicateDialogOpen(true);
      return;
    }

    if (
      status === 400 &&
      data &&
      typeof data === "object"
    ) {
      const validationErrors: Partial<
        Record<keyof Customer, string>
      > = {};

      Object.entries(data).forEach(
        ([field, message]) => {
          if (field in customer) {
            validationErrors[
              field as keyof Customer
            ] = String(message);
          }
        },
      );

      if (
        Object.keys(validationErrors).length > 0
      ) {
        setFieldErrors(validationErrors);
        return;
      }
    }

    toast.error(
      typeof data === "string"
        ? data
        : data?.message ||
            data?.error ||
            error?.message ||
            "Customer creation failed.",
    );
  } finally {
    setSavingCustomer(false);
  }
};







 useEffect(() => {
  if (location.state?.errorMessage) {
    toast.error(location.state.errorMessage);

    navigate(location.pathname, {
      replace: true,
      state: {},
    });
  }
}, [location.state, location.pathname, navigate]);

  const filteredVillageCustomers = villageCustomers.filter((customer) =>
    customer.name.toLowerCase().includes(customerNameSearch.toLowerCase()),
  );

  return (
    <div className="w-full overflow-x-hidden px-3 pb-[90px] md:px-0 md:pb-0">
<div className="mt-4 flex flex-col items-center justify-center gap-4 md:mt-10 md:p-3">
          <Paper
          elevation={4}
          sx={{ borderRadius: "24px" }}
         className="relative w-full rounded-xl border border-[#d0b3ff] bg-white/75 p-4 shadow-[0_10px_30px_rgba(136,71,255,0.3)] backdrop-blur-lg md:max-w-6xl md:p-6"
         >
         <Typography
  variant="h5"
  fontWeight="bold"
  color="primary"
  gutterBottom
  sx={{ fontSize: { xs: "22px", md: "34px" } }}
>
  Search Customer
</Typography>

 <Box
  mt={{ xs: 3, md: 6 }}
  display="grid"
  gridTemplateColumns={{ xs: "1fr", md: "220px 1fr 150px" }}
  gap={2}
  maxWidth="900px"
  mb={4}
>
           <TextField
  select
  label="Search Type"
  value={searchType}
  onChange={(e) => setSearchType(e.target.value)}
  fullWidth
  variant="outlined"
  InputLabelProps={{
    shrink: true,
  }}
  sx={{
    "& .MuiOutlinedInput-root": {
      borderRadius: "16px",
      backgroundColor: "#fff",
      height: "56px",
      fontWeight: 500,
      cursor: "pointer",
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderWidth: "1.5px",
      borderColor: "#9ca3af",
    },
    "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#8847FF",
    },
    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#8847FF",
      borderWidth: "2px",
    },
  }}
>
              <MenuItem value="">
                <em>Select Search Type</em>
              </MenuItem>
              <MenuItem value="Bill Number">Bill Number</MenuItem>
              <MenuItem value="Phone Number">Phone Number</MenuItem>
              <MenuItem value="Village">Village</MenuItem>
              <MenuItem value="Delete Phone Number">
                Delete Phone Number
              </MenuItem>
            </TextField>
            {searchType === "Village" ? (
              <Autocomplete
                fullWidth
                options={results}
                value={searchQuery}
                loading={loading}
                onChange={(event, newValue) => {
                  handleChange("village", newValue || "");
                  setSearchQuery(newValue || ""); // IMPORTANT
                }}
                onInputChange={(event, newInputValue) => {
                  setSearchQuery(newInputValue); // triggers typing
                  setSearch(newInputValue); // triggers API search
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    placeholder="Type village name..."
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon color="action" />
                        </InputAdornment>
                      ),
                      style: {
                        borderRadius: "25px",
                        backgroundColor: "#fff",
                        paddingLeft: 8,
                      },
                    }}
                  />
                )}
              />
            ) : (
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  style: {
                    borderRadius: "25px",
                    backgroundColor: "#fff",
                    paddingLeft: 8,
                  },
                }}
              />
            )}

            <Button
              variant="outlined"
              onClick={handleSearch}
              sx={{
                paddingX: 6,
                paddingY: 0.2,
                borderRadius: "12px",
                fontWeight: "bold",
                boxShadow: "0px 4px 10px rgba(136,71,255,0.5)",
                borderColor: "#8847FF",
                color: "#8847FF",
                transition: "all 0.3s",
                "&:hover": { backgroundColor: "#8847FF", color: "#fff" },
              }}
            >
              Search
            </Button>
          </Box>
        </Paper>
      </div>

<div className="mt-4 flex flex-col items-center justify-center gap-4 md:mt-10 md:p-3">
          <Paper
          elevation={4}
          sx={{ borderRadius: "24px" }}
      className="relative w-full rounded-xl border border-[#d0b3ff] bg-white/75 p-4 shadow-[0_10px_30px_rgba(136,71,255,0.3)] backdrop-blur-lg md:max-w-6xl md:p-6"
        >
        <Typography
  variant="h5"
  fontWeight="bold"
  color="primary"
  gutterBottom
  sx={{ fontSize: { xs: "22px", md: "34px" } }}
>
  Add Customer
</Typography>
          <Grid container spacing={{ xs: 2, md: 3 }} mt={{ xs: 3, md: 6 }}>
            {(
             [
  "name",
  "village",
  "phoneNumber",
  "emailId",
 
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
                      const formatted = capitalizeFirst(newInputValue);
                      setSearch(formatted);
                      handleChange("village", formatted);
                    }}
                    onChange={(event, newValue) => {
                      handleChange("village", capitalizeFirst(newValue || ""));
                    }}
                    renderOption={(props, option) => (
                      <li {...props} key={option}>
                        {capitalizeFirst(option)}
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        {...thickTextFieldProps}
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
                ) : (
                  <TextField
  {...thickTextFieldProps}
 label={
  key === "phoneNumber"
    ? "Phone Number"
    : key === "emailId"
      ? "Email ID"
      : key.charAt(0).toUpperCase() +
        key.slice(1)
}
 type={key === "emailId" ? "email" : "text"}
  value={String(customer[key] ?? "")}
  required={[
    "name",
    "village",
    "phoneNumber",
  ].includes(key)}
 inputProps={{
  maxLength:
    key === "phoneNumber"
      ? 10
      : undefined,

  inputMode:
    key === "phoneNumber"
      ? "numeric"
      : undefined,
}}
  onChange={(e) =>
    handleChange(key, e.target.value)
  }
  error={Boolean(fieldErrors[key])}
 helperText={fieldErrors[key] || ""}
/>
                )}
              </Grid>

              
              
              
            ))}

          </Grid>

          

          <Box display="flex" justifyContent={{ xs: "center", md: "flex-end" }} mt={4}>

      <Button
  onClick={handleAddCustomer}
  variant="outlined"
  disabled={savingCustomer}
  sx={{
    width: { xs: "100%", md: "auto" },
    px: 4,
    py: 1.5,
    borderRadius: "12px",
    fontWeight: "bold",
    borderColor: "#8847FF",
    color: "#8847FF",
    boxShadow:
      "0px 4px 10px rgba(136,71,255,0.35)",
    "&:hover": {
      backgroundColor: "#8847FF",
      color: "#fff",
      borderColor: "#8847FF",
    },
  }}
>
  {savingCustomer ? (
    <>
      <CircularProgress
        size={20}
        sx={{ mr: 1 }}
      />
      Creating Customer...
    </>
  ) : (
    "Create Customer"
  )}
</Button>
          </Box>
        </Paper>
      </div>
      <div
        className="mt-10 p-3 flex flex-col items-center  gap-1"
        style={{ paddingBottom: "300px" }}
        ref={bottomRef}
      >
        {searchType === "Village" && villageCustomers.length > 0 && (
          <Paper
            elevation={4}
            sx={{ borderRadius: "20px" }}
            className="p-6 mt-6 w-full max-w-4xl bg-white/80 backdrop-blur-lg shadow-lg"
          >
            <Typography
              variant="h5"
              fontWeight="bold"
              color="primary"
              gutterBottom
            >
              Customers in Village
            </Typography>

            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search customer name..."
              value={customerNameSearch}
              onChange={(e) => setCustomerNameSearch(e.target.value)}
              sx={{ mt: 2, mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                style: {
                  borderRadius: "18px",
                  backgroundColor: "#fff",
                },
              }}
            />

         <div className="max-h-[640px] overflow-y-auto rounded-lg border border-gray-300">
  {/* Mobile cards */}
  <div className="space-y-3 p-3 md:hidden">
    {filteredVillageCustomers.length > 0 ? (
      filteredVillageCustomers.map((c: any, index) => (
        <div
          key={index}
          className="rounded-2xl border border-purple-100 bg-purple-50 p-4 shadow-sm"
        >
          <div className="text-xs text-gray-500">Name</div>
          <div className="font-bold text-[#4911a9]">{c.name}</div>

          <div className="mt-2 text-xs text-gray-500">Phone Number</div>
          <div className="font-bold text-[#85400b]">{c.phoneNumber}</div>
        </div>
      ))
    ) : (
      <div className="rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-500">
        No customer found
      </div>
    )}
  </div>

  {/* Desktop table */}
  <table className="hidden w-full border-collapse md:table">
    <thead className="sticky top-0 z-10 bg-purple-200">
      <tr>
        <th className="p-3 text-left font-bold">Name</th>
        <th className="p-3 text-left font-bold">Phone Number</th>
      </tr>
    </thead>

    <tbody>
      {filteredVillageCustomers.length > 0 ? (
        filteredVillageCustomers.map((c: any, index) => (
          <tr key={index} className="border-b transition-all hover:bg-purple-50">
            <td className="p-3">{c.name}</td>
            <td className="p-3">{c.phoneNumber}</td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan={2} className="p-4 text-center text-gray-500">
            No customer found
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>
          </Paper>
        )}
      </div>
      {deleteMessage && (
        <div className="mt-4 p-3 bg-gray-100 text-black rounded-md shadow">
          {deleteMessage}
        </div>
      )}

      <Dialog
  open={duplicateDialogOpen}
  onClose={handleCloseDuplicateDialog}
  fullWidth
  maxWidth="sm"
  PaperProps={{
    sx: {
      borderRadius: "24px",
      overflow: "hidden",
      boxShadow: "0 24px 80px rgba(0,0,0,0.28)",
    },
  }}
>
  <Box
    sx={{
      background:
        "linear-gradient(135deg, #4c1d95 0%, #8847FF 55%, #b56cff 100%)",
      color: "#fff",
      textAlign: "center",
      px: 3,
      pt: 4,
      pb: 3,
    }}
  >
    <Box
      sx={{
        width: 70,
        height: 70,
        mx: "auto",
        mb: 2,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.18)",
        border: "2px solid rgba(255,255,255,0.35)",
        fontSize: "34px",
      }}
    >
      👤
    </Box>

    <DialogTitle
      sx={{
        p: 0,
        fontSize: { xs: "24px", md: "30px" },
        fontWeight: 800,
      }}
    >
      Customer Already Exists
    </DialogTitle>
  </Box>

  <DialogContent
    sx={{
      textAlign: "center",
      px: { xs: 3, md: 5 },
      pt: "30px !important",
      pb: 2,
    }}
  >
    <Typography
      sx={{
        color: "#4b5563",
        fontSize: "16px",
        lineHeight: 1.7,
      }}
    >
      {duplicateMessage ||
        "A customer account is already registered with this mobile number."}
    </Typography>

    <Box
      sx={{
        mt: 3,
        p: 2,
        borderRadius: "16px",
        backgroundColor: "#f5f0ff",
        border: "1px solid #dfccff",
      }}
    >
      <Typography
        sx={{
          color: "#6b21a8",
          fontSize: "13px",
          fontWeight: 600,
        }}
      >
        REGISTERED MOBILE NUMBER
      </Typography>

      <Typography
        sx={{
          mt: 0.5,
          color: "#2e1065",
          fontSize: { xs: "22px", md: "26px" },
          fontWeight: 800,
          letterSpacing: "1px",
        }}
      >
        {duplicatePhoneNumber}
      </Typography>
    </Box>

    <Typography
      sx={{
        mt: 3,
        color: "#111827",
        fontSize: "17px",
        fontWeight: 600,
      }}
    >
      Would you like to open the existing customer profile?
    </Typography>
  </DialogContent>

  <DialogActions
    sx={{
      px: { xs: 3, md: 5 },
      pb: 4,
      pt: 2,
      gap: 1.5,
      justifyContent: "center",
      flexDirection: { xs: "column-reverse", sm: "row" },
    }}
  >
    <Button
      onClick={handleCloseDuplicateDialog}
      variant="outlined"
      fullWidth
      sx={{
        borderRadius: "12px",
        py: 1.4,
        fontWeight: 700,
        borderColor: "#9ca3af",
        color: "#4b5563",
      }}
    >
      No, Cancel
    </Button>

    <Button
      onClick={handleOpenExistingCustomer}
      variant="contained"
      fullWidth
      sx={{
        borderRadius: "12px",
        py: 1.4,
        fontWeight: 700,
        background:
          "linear-gradient(135deg, #6d28d9, #8847FF)",
        boxShadow: "0 8px 20px rgba(136,71,255,0.35)",
        "&:hover": {
          background:
            "linear-gradient(135deg, #5b21b6, #7c3aed)",
        },
      }}
    >
      Yes, Open Profile
    </Button>
  </DialogActions>
</Dialog>


    </div>
  );
};

export default SearchAddCustomer;
