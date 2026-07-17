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

import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";

import type {
  ConfirmationResult,
} from "firebase/auth";

import { auth } from "@/services/firebase";

interface VillageCustomer {
  phoneNumber: string;
  name: string;
}

interface AadhaarVerifyResponse {
  matched: boolean;
  message: string;
  extractedText?: string;
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

const [aadhaarFile, setAadhaarFile] =
  useState<File | null>(null);

const [aadhaarVerified, setAadhaarVerified] =
  useState(false);

const [verifyingAadhaar, setVerifyingAadhaar] =
  useState(false);

const [otpDialogOpen, setOtpDialogOpen] =
  useState(false);

const [otp, setOtp] = useState("");

const [sendingOtp, setSendingOtp] =
  useState(false);

const [verifyingOtp, setVerifyingOtp] =
  useState(false);

const [confirmationResult, setConfirmationResult] =
  useState<ConfirmationResult | null>(null);

const recaptchaVerifierRef =
  useRef<RecaptchaVerifier | null>(null);

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
    newValue = value
      .split(" ")
      .filter(Boolean)
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1).toLowerCase(),
      )
      .join(" ");
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

  if (field === "name" || field === "aadhaarNumber") {
    setAadhaarVerified(false);
  }

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


const verifyAdminCustomerAadhaar = async (
  file: File,
  name: string,
  aadhaarNumber: string,
): Promise<AadhaarVerifyResponse> => {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("name", name.trim());
  formData.append("aadhaarNumber", aadhaarNumber.trim());

  const response = await api.post<AadhaarVerifyResponse>(
    "/admin/verify-customer-aadhaar",
    formData,
  );

  return response.data;
};

const validateCustomerRegistration = (): boolean => {
  const errors: Partial<Record<keyof Customer, string>> = {};

  const name = customer.name.trim();
  const village = customer.village.trim();
  const phoneNumber = customer.phoneNumber.trim();
  const fullAddress = customer.fullAddress.trim();
  const pincode = customer.pincode.trim();
  const aadhaarNumber = customer.aadhaarNumber.trim();

  if (!name) {
    errors.name = "Customer name is required";
  }

  if (!village) {
    errors.village = "Village is required";
  }

  if (!phoneNumber) {
    errors.phoneNumber = "Phone number is required";
  } else if (!/^\d{10}$/.test(phoneNumber)) {
    errors.phoneNumber = "Enter a valid 10-digit phone number";
  }

  if (
    customer.emailId.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      customer.emailId.trim(),
    )
  ) {
    errors.emailId = "Enter a valid email address";
  }

  if (!customer.password.trim()) {
    errors.password = "Password is required";
  } else if (customer.password.length < 6) {
    errors.password =
      "Password must contain at least 6 characters";
  }

  if (!fullAddress) {
    errors.fullAddress = "Full address is required";
  }

  if (!pincode) {
    errors.pincode = "Pincode is required";
  } else if (!/^\d{6}$/.test(pincode)) {
    errors.pincode = "Enter a valid 6-digit pincode";
  }

  if (!aadhaarNumber) {
    errors.aadhaarNumber = "Aadhaar number is required";
  } else if (!/^\d{12}$/.test(aadhaarNumber)) {
    errors.aadhaarNumber =
      "Enter a valid 12-digit Aadhaar number";
  }

  if (
    customer.panNumber.trim() &&
    !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(
      customer.panNumber.trim(),
    )
  ) {
    errors.panNumber = "Enter a valid PAN number";
  }

  setFieldErrors(errors);

  if (Object.keys(errors).length > 0) {
    toast.error("Please correct the highlighted fields.");
    return false;
  }

  if (!aadhaarFile) {
    toast.error("Please upload the Aadhaar image.");
    return false;
  }

  return true;
};


const handleAddCustomer = async () => {
  if (
    savingCustomer ||
    sendingOtp ||
    verifyingAadhaar
  ) {
    return;
  }

  if (!validateCustomerRegistration()) {
    return;
  }

  if (!aadhaarFile) {
    toast.error("Please upload the Aadhaar image.");
    return;
  }

  const phoneNumber = customer.phoneNumber.trim();

  try {
    setSendingOtp(true);
    setVerifyingAadhaar(true);

    /*
     * First verify Aadhaar using OCR.
     */
    const aadhaarResult =
      await verifyAdminCustomerAadhaar(
        aadhaarFile,
        customer.name,
        customer.aadhaarNumber,
      );

    if (!aadhaarResult.matched) {
      setAadhaarVerified(false);

      toast.error(
        aadhaarResult.message ||
          "Aadhaar verification failed.",
      );

      return;
    }

    setAadhaarVerified(true);

    /*
     * Clear any old Firebase reCAPTCHA instance.
     */
    if (recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current.clear();
      recaptchaVerifierRef.current = null;
    }

    /*
     * Create an invisible Firebase reCAPTCHA.
     */
    const verifier = new RecaptchaVerifier(
      auth,
      "admin-recaptcha-container",
      {
        size: "invisible",
        callback: () => {
          console.log("Admin reCAPTCHA verified");
        },
        "expired-callback": () => {
          toast.error(
            "reCAPTCHA expired. Please try again.",
          );
        },
      },
    );

    recaptchaVerifierRef.current = verifier;

    /*
     * Send OTP using Firebase.
     */
    const result = await signInWithPhoneNumber(
      auth,
      `+91${phoneNumber}`,
      verifier,
    );

    setConfirmationResult(result);
    setOtp("");
    setOtpDialogOpen(true);

    toast.success(
      `OTP sent successfully to +91 ${phoneNumber}`,
    );
  } catch (error: any) {
    console.error(
      "Aadhaar verification or OTP error:",
      error,
    );

    if (recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current.clear();
      recaptchaVerifierRef.current = null;
    }

    const firebaseErrorCode = error?.code;

    if (
      firebaseErrorCode ===
      "auth/too-many-requests"
    ) {
      toast.error(
        "Too many OTP requests. Please try again later.",
      );
      return;
    }

    if (
      firebaseErrorCode ===
      "auth/invalid-phone-number"
    ) {
      toast.error("The mobile number is invalid.");
      return;
    }

    if (
      firebaseErrorCode ===
      "auth/quota-exceeded"
    ) {
      toast.error(
        "Firebase OTP quota has been exceeded.",
      );
      return;
    }

    toast.error(
      error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to verify Aadhaar or send OTP.",
    );
  } finally {
    setSendingOtp(false);
    setVerifyingAadhaar(false);
  }
};

const createVerifiedCustomer = async (
  firebaseIdToken: string,
): Promise<Customer> => {
  if (!aadhaarFile) {
    throw new Error("Aadhaar image is missing.");
  }

  const formData = new FormData();

  const customerPayload = {
    name: customer.name.trim(),
    village: customer.village.trim(),
    phoneNumber: customer.phoneNumber.trim(),
    emailId: customer.emailId.trim(),
    password: customer.password,
    fullAddress: customer.fullAddress.trim(),
    pincode: customer.pincode.trim(),
    aadhaarNumber: customer.aadhaarNumber.trim(),
    panNumber: customer.panNumber.trim(),
  };

  formData.append(
    "customer",
    new Blob(
      [JSON.stringify(customerPayload)],
      {
        type: "application/json",
      },
    ),
  );

  formData.append("aadhaarFile", aadhaarFile);

  formData.append(
    "firebaseIdToken",
    firebaseIdToken,
  );

  const response = await api.post<Customer>(
    "/admin/addCustomerVerified",
    formData,
  );

  return response.data;
};

const handleVerifyOtpAndCreateCustomer =
  async () => {
    if (verifyingOtp || savingCustomer) {
      return;
    }

    if (!confirmationResult) {
      toast.error(
        "OTP session was not found. Please send OTP again.",
      );
      setOtpDialogOpen(false);
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      toast.error("Enter a valid 6-digit OTP.");
      return;
    }

    if (!aadhaarFile) {
      toast.error("Aadhaar image is missing.");
      return;
    }

    try {
      setVerifyingOtp(true);
      setSavingCustomer(true);

      /*
       * Verify the OTP entered by the customer.
       */
      const credential =
        await confirmationResult.confirm(otp);

      /*
       * Get Firebase ID token.
       * The backend must verify this token.
       */
      const firebaseIdToken =
        await credential.user.getIdToken(true);

      /*
       * Add village only after OTP succeeds.
       */
      if (customer.village.trim()) {
        await api.post("/admin/addVillage", {
          name: customer.village.trim(),
        });
      }

      /*
       * Create the customer using the secure endpoint.
       */
      const result =
        await createVerifiedCustomer(
          firebaseIdToken,
        );

      if (!result?.customerId) {
        throw new Error(
          "Customer creation failed. Customer ID was not returned.",
        );
      }

      localStorage.removeItem(
        "CusDetailsCustomerId",
      );
      localStorage.removeItem("customerId");
      localStorage.removeItem("from");

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

      setOtpDialogOpen(false);
      setOtp("");
      setConfirmationResult(null);

      toast.success(
        "Customer registered successfully. Mobile and Aadhaar verified.",
      );

      navigate("/admin/bill-Data", {
        replace: true,
      });
    } catch (error: any) {
      console.error(
        "OTP verification or registration error:",
        error,
      );

      const status = error?.response?.status;
      const responseData =
        error?.response?.data;

      if (
        error?.code === "auth/invalid-verification-code"
      ) {
        toast.error(
          "Incorrect OTP. Please enter the OTP received by the customer.",
        );
        return;
      }

      if (
        error?.code === "auth/code-expired"
      ) {
        toast.error(
          "OTP has expired. Please close this dialog and send OTP again.",
        );
        return;
      }

      if (status === 409) {
        const message =
          typeof responseData === "string"
            ? responseData
            : responseData?.message ||
              responseData?.error ||
              "This phone number is already registered.";

        setDuplicatePhoneNumber(
          customer.phoneNumber.trim(),
        );
        setDuplicateMessage(message);

        setOtpDialogOpen(false);
        setDuplicateDialogOpen(true);

        return;
      }

      if (
        status === 400 &&
        responseData &&
        typeof responseData === "object"
      ) {
        const validationErrors: Partial<
          Record<keyof Customer, string>
        > = {};

        Object.entries(responseData).forEach(
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
          setOtpDialogOpen(false);
          return;
        }
      }

      toast.error(
        typeof responseData === "string"
          ? responseData
          : responseData?.message ||
              responseData?.error ||
              error?.message ||
              "OTP verification or customer registration failed.",
      );
    } finally {
      setVerifyingOtp(false);
      setSavingCustomer(false);
    }
  };


  const handleCloseOtpDialog = () => {
  if (verifyingOtp || savingCustomer) {
    return;
  }

  setOtpDialogOpen(false);
  setOtp("");
  setConfirmationResult(null);

  if (recaptchaVerifierRef.current) {
    recaptchaVerifierRef.current.clear();
    recaptchaVerifierRef.current = null;
  }
};

useEffect(() => {
  return () => {
    if (recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current.clear();
      recaptchaVerifierRef.current = null;
    }
  };
}, []);


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
  "password",
  "fullAddress",
  "pincode",
  "aadhaarNumber",
  "panNumber",
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
        : key === "fullAddress"
          ? "Full Address"
          : key === "aadhaarNumber"
            ? "Aadhaar Number"
            : key === "panNumber"
              ? "PAN Number"
              : key.charAt(0).toUpperCase() +
                key.slice(1)
  }
  type={
    key === "password"
      ? "password"
      : key === "emailId"
        ? "email"
        : "text"
  }
  value={String(customer[key] ?? "")}
  required={[
    "name",
    "village",
    "phoneNumber",
    "password",
    "fullAddress",
    "pincode",
    "aadhaarNumber",
  ].includes(key)}
  inputProps={{
    maxLength:
      key === "phoneNumber"
        ? 10
        : key === "pincode"
          ? 6
          : key === "aadhaarNumber"
            ? 12
            : key === "panNumber"
              ? 10
              : undefined,
    inputMode:
      key === "phoneNumber" ||
      key === "pincode" ||
      key === "aadhaarNumber"
        ? "numeric"
        : undefined,
  }}
  onChange={(e) =>
    handleChange(key, e.target.value)
  }
  error={Boolean(fieldErrors[key])}
  helperText={
    fieldErrors[key] ||
    (key === "aadhaarNumber"
      ? "Enter the 12-digit number shown on the uploaded Aadhaar."
      : key === "password"
        ? "Minimum 6 characters."
        : "")
  }
/>
                )}
              </Grid>

              
              
              
            ))}

            <Grid size={{ xs: 12 }}>
  <Box
    sx={{
      border: "2px dashed",
      borderColor: aadhaarVerified
        ? "success.main"
        : "#b8a1e8",
      borderRadius: "16px",
      p: 2.5,
      backgroundColor: aadhaarVerified
        ? "#f0fdf4"
        : "#faf8ff",
    }}
  >
    <Typography
      sx={{
        mb: 1.5,
        fontWeight: 700,
        color: "#4c1d95",
      }}
    >
      Aadhaar Document
      <span style={{ color: "red" }}> *</span>
    </Typography>

    <Button
      component="label"
      variant="outlined"
      fullWidth
      disabled={
        verifyingAadhaar ||
        sendingOtp ||
        savingCustomer
      }
      sx={{
        minHeight: "56px",
        borderRadius: "12px",
        borderColor: aadhaarVerified
          ? "success.main"
          : "#8847FF",
        color: aadhaarVerified
          ? "success.main"
          : "#8847FF",
        fontWeight: 700,
      }}
    >
      {aadhaarFile
        ? `Selected: ${aadhaarFile.name}`
        : "Choose Aadhaar Image"}

      <input
        hidden
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={(e) => {
          const selectedFile =
            e.target.files?.[0] || null;

          if (
            selectedFile &&
            selectedFile.size >
              5 * 1024 * 1024
          ) {
            toast.error(
              "Aadhaar image must be below 5 MB.",
            );
            e.target.value = "";
            return;
          }

          setAadhaarFile(selectedFile);
          setAadhaarVerified(false);
        }}
      />
    </Button>

    <Typography
      sx={{
        mt: 1.2,
        fontSize: "13px",
        color: "#6b7280",
      }}
    >
      Upload a clear JPG, PNG or WEBP image.
      Maximum file size: 5 MB.
    </Typography>

    {aadhaarVerified && (
      <Typography
        sx={{
          mt: 1.5,
          color: "success.main",
          fontWeight: 800,
        }}
      >
        ✓ Aadhaar name and number verified
      </Typography>
    )}
  </Box>
</Grid>
          </Grid>

          

          <Box display="flex" justifyContent={{ xs: "center", md: "flex-end" }} mt={4}>

          <div id="admin-recaptcha-container" />
           <Button
  onClick={handleAddCustomer}
  variant="outlined"
  disabled={
  savingCustomer ||
  sendingOtp ||
  verifyingAadhaar ||
  verifyingOtp
}
  sx={{
    width: { xs: "100%", md: "auto" },
    paddingX: 4,
    paddingY: 1.5,
    borderRadius: "12px",
    fontWeight: "bold",
    boxShadow: "0px 4px 10px rgba(136,71,255,0.5)",
    borderColor: "#8847FF",
    color: "#8847FF",
    transition: "all 0.3s",
    "&:hover": {
      backgroundColor: "#8847FF",
      color: "#fff",
    },
  }}
>
 {verifyingAadhaar ? (
  <>
    <CircularProgress
      size={20}
      sx={{ mr: 1 }}
    />
    Verifying Aadhaar...
  </>
) : sendingOtp ? (
  <>
    <CircularProgress
      size={20}
      sx={{ mr: 1 }}
    />
    Sending OTP...
  </>
) : savingCustomer ? (
  <>
    <CircularProgress
      size={20}
      sx={{ mr: 1 }}
    />
    Creating Customer...
  </>
) : (
  "Verify Aadhaar & Send OTP"
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

<Dialog
  open={otpDialogOpen}
  onClose={handleCloseOtpDialog}
  fullWidth
  maxWidth="xs"
  PaperProps={{
    sx: {
      borderRadius: "22px",
      overflow: "hidden",
    },
  }}
>
  <Box
    sx={{
      background:
        "linear-gradient(135deg, #4c1d95, #8847FF)",
      color: "white",
      textAlign: "center",
      px: 3,
      py: 3,
    }}
  >
    <Typography
      sx={{
        fontSize: "25px",
        fontWeight: 800,
      }}
    >
      Verify Mobile Number
    </Typography>

    <Typography
      sx={{
        mt: 1,
        opacity: 0.9,
      }}
    >
      OTP sent to +91 {customer.phoneNumber}
    </Typography>
  </Box>

  <DialogContent
    sx={{
      pt: "30px !important",
      px: 3,
    }}
  >
    <TextField
      autoFocus
      fullWidth
      label="Enter 6-digit OTP"
      value={otp}
      disabled={verifyingOtp}
      inputProps={{
        maxLength: 6,
        inputMode: "numeric",
        style: {
          textAlign: "center",
          fontSize: "24px",
          letterSpacing: "8px",
          fontWeight: 700,
        },
      }}
      onChange={(e) =>
        setOtp(
          e.target.value
            .replace(/\D/g, "")
            .slice(0, 6),
        )
      }
      onKeyDown={(e) => {
        if (
          e.key === "Enter" &&
          otp.length === 6
        ) {
          void handleVerifyOtpAndCreateCustomer();
        }
      }}
      sx={{
        "& .MuiOutlinedInput-root": {
          borderRadius: "14px",
        },
      }}
    />

    <Typography
      sx={{
        mt: 2,
        textAlign: "center",
        color: "#6b7280",
        fontSize: "14px",
      }}
    >
      Ask the customer for the OTP received on
      their mobile number.
    </Typography>
  </DialogContent>

  <DialogActions
    sx={{
      px: 3,
      pb: 3,
      pt: 2,
      gap: 1,
    }}
  >
    <Button
      fullWidth
      variant="outlined"
      disabled={verifyingOtp}
      onClick={handleCloseOtpDialog}
      sx={{
        py: 1.3,
        borderRadius: "12px",
        fontWeight: 700,
      }}
    >
      Cancel
    </Button>

    <Button
      fullWidth
      variant="contained"
      disabled={
        verifyingOtp ||
        savingCustomer ||
        otp.length !== 6
      }
      onClick={
        handleVerifyOtpAndCreateCustomer
      }
      sx={{
        py: 1.3,
        borderRadius: "12px",
        fontWeight: 700,
        background:
          "linear-gradient(135deg, #6d28d9, #8847FF)",
      }}
    >
      {verifyingOtp || savingCustomer ? (
        <>
          <CircularProgress
            size={19}
            sx={{
              mr: 1,
              color: "white",
            }}
          />
          Verifying...
        </>
      ) : (
        "Verify & Create"
      )}
    </Button>
  </DialogActions>
</Dialog>
    </div>
  );
};

export default SearchAddCustomer;
