import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  InputAdornment,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import debounce from "lodash/debounce";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Box } from "@mui/system";
import api from "@/services/api"; // ← import your api.ts
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import type { ConfirmationResult } from "firebase/auth";
import { auth } from "@/services/firebase";

interface selectedItems {
  loanId: number;
  loanDate: string;
  itemName: string;
  metal: string;
  gross_weight: number;
  total_amount: number;
  paid_amount: number;
  deliveryStatus: string;
  due_amount: number;
  paid_interest_amount: number;
  due_interest_amount: number;
  active_month_count: number;
}

interface LoanCustomerProfile {
  loanCusId: number;
  name: string;
  village: string;
  phoneNumber: string;
  emailId: string;
  alternatePhoneNumber?: string | null;
  aadharCard: string;
  numberOfActiveItems: number;
  finalAmount: number;
  totalDueAmount: number;
  paidInterestAmount: number;
  dueInterestAmount: number;
  mobileVerified: boolean;
}

export interface LoanBilling {
  loanBillId: number;
  loanBillingDate: string;
  customerLoanId: number;
  loanBillNumber: string;
  name: string;
  village: string;
  phoneNumber: string;
  emailId: string;
  aadharCard: string;
  numberOfItems: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paidInterestAmount: number;
  dueInterestAmount: number;
  deliveryStatus: string;
  version: number;
  selectedItems: selectedItems[]; // <== Ensure this line exists
}

const BillLoanData: React.FC = () => {
  const [loanBillingData, setLoanBillingData] = useState<LoanBilling[]>([]);
  const [loanCustomer, setLoanCustomer] =
  useState<LoanCustomerProfile | null>(null);

const [profileLoading, setProfileLoading] = useState(true);
  const navigate = useNavigate();

  const [openEdit, setOpenEdit] = useState(false);
const [editName, setEditName] = useState("");
const [editVillage, setEditVillage] = useState("");
const [editPhone, setEditPhone] = useState("");
const [editEmail, setEditEmail] = useState("");
const [editAlternatePhone, setEditAlternatePhone] = useState("");

const normalizePhone = (value: string) =>
  (value || "").replace(/\D/g, "");

const phoneHasChanged =
  !!loanCustomer &&
  normalizePhone(editPhone) !==
    normalizePhone(loanCustomer.phoneNumber);


// Mobile OTP verification
const [otp, setOtp] = useState("");
const [sendingOtp, setSendingOtp] = useState(false);
const [verifyingOtp, setVerifyingOtp] = useState(false);
const [isRecaptchaVerified, setIsRecaptchaVerified] =
  useState(false);
const [confirmationResult, setConfirmationResult] =
  useState<ConfirmationResult | null>(null);
const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

const [villageSearch, setVillageSearch] = useState("");
const [villageResults, setVillageResults] = useState<string[]>([]);
const [villageLoading, setVillageLoading] = useState(false);
const formatName = (value: string) =>
  value
    .split(" ")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase()
    )
    .join(" ");

    const fetchVillages = debounce(async (query: string) => {
  if (query.trim().length < 3) {
    setVillageResults([]);
    return;
  }

  setVillageLoading(true);

  try {
    const res = await api.get<string[]>(
      `/admin/searchVillage?query=${query}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    setVillageResults(res.data || []);
  } catch (error) {
    console.error("Error fetching villages:", error);
  } finally {
    setVillageLoading(false);
  }
}, 500);

useEffect(() => {
  if (villageSearch.trim().length >= 3) {
    fetchVillages(villageSearch);
  } else {
    setVillageResults([]);
  }

  return () => fetchVillages.cancel();
}, [villageSearch]);

useEffect(() => {
  if (
    !openEdit ||
    !loanCustomer ||
    loanCustomer.mobileVerified ||
    phoneHasChanged
  ) {
    return;
  }

  const timer = window.setTimeout(() => {
    const container = document.getElementById(
      "loan-profile-recaptcha-container"
    );

    if (!container || recaptchaRef.current) return;

    const verifier = new RecaptchaVerifier(
      auth,
      "loan-profile-recaptcha-container",
      {
        size: "normal",

        callback: () => {
          setIsRecaptchaVerified(true);
        },

        "expired-callback": () => {
          setIsRecaptchaVerified(false);
          setConfirmationResult(null);
        },
      }
    );

    recaptchaRef.current = verifier;

    verifier.render().catch((error) => {
      console.error("Loan reCAPTCHA error:", error);
      recaptchaRef.current = null;
      setIsRecaptchaVerified(false);
    });
  }, 500);

  return () => {
    window.clearTimeout(timer);

    if (recaptchaRef.current) {
      recaptchaRef.current.clear();
      recaptchaRef.current = null;
    }
  };
}, [
  openEdit,
  loanCustomer?.mobileVerified,
  phoneHasChanged,
]);

const handleSendOtp = async () => {
  if (sendingOtp || !loanCustomer) return;

  const phoneNumber = normalizePhone(editPhone);

  if (!/^\d{10}$/.test(phoneNumber)) {
    alert("Enter a valid 10-digit mobile number.");
    return;
  }

  if (phoneHasChanged) {
    alert("Please save the new phone number before sending OTP.");
    return;
  }

  if (!isRecaptchaVerified || !recaptchaRef.current) {
    alert("Please complete reCAPTCHA first.");
    return;
  }

  try {
    setSendingOtp(true);

    const result = await signInWithPhoneNumber(
      auth,
      `+91${phoneNumber}`,
      recaptchaRef.current
    );

    setConfirmationResult(result);
    setOtp("");

    alert(`OTP sent successfully to +91 ${phoneNumber}`);
  } catch (error: any) {
    console.error("Loan OTP sending error:", error);
    alert(error?.message || "Failed to send OTP.");
  } finally {
    setSendingOtp(false);
  }
};



const handleVerifyOtp = async () => {
  if (!loanCustomer || !confirmationResult) {
    alert("Please send OTP first.");
    return;
  }

  if (!/^\d{6}$/.test(otp)) {
    alert("Enter a valid 6-digit OTP.");
    return;
  }

  try {
    setVerifyingOtp(true);

    const credential = await confirmationResult.confirm(otp);

    const firebaseIdToken =
      await credential.user.getIdToken(true);

 const response = await api.post<{ mobileVerified: boolean }>(
  `/admin/loan-customer/${loanCustomer.loanCusId}/verify-mobile`,
      {
        firebaseIdToken,
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    setLoanCustomer((previous) =>
      previous
        ? {
            ...previous,
            mobileVerified: response.data.mobileVerified === true,
          }
        : previous
    );

    setOtp("");
    setConfirmationResult(null);
    setIsRecaptchaVerified(false);

    if (recaptchaRef.current) {
      recaptchaRef.current.clear();
      recaptchaRef.current = null;
    }

    alert("Loan customer mobile verified successfully.");
  } catch (error: any) {
    console.error("Loan OTP verification error:", error);

    alert(
      error?.response?.data?.message ||
      error?.message ||
      "OTP verification failed."
    );
  } finally {
    setVerifyingOtp(false);
  }
};

const handleOpenEdit = () => {
  if (!loanCustomer) return;
  setEditName(loanCustomer.name || "");
  setEditVillage(loanCustomer.village || "");
  setEditPhone(loanCustomer.phoneNumber || "");
  setEditEmail(loanCustomer.emailId || "");
  setEditAlternatePhone(loanCustomer.alternatePhoneNumber || "");
  setOpenEdit(true);
};


const handleUpdateLoanCustomer = async () => {
  if (!loanCustomer) return;

  const phoneNumber = normalizePhone(editPhone);
  const alternatePhoneNumber = normalizePhone(editAlternatePhone);

  if (!editName.trim()) {
    alert("Name is required.");
    return;
  }

  if (!editVillage.trim()) {
    alert("Village is required.");
    return;
  }

  if (!/^\d{10}$/.test(phoneNumber)) {
    alert("Enter a valid 10-digit phone number.");
    return;
  }

  // Alternate phone is optional
  if (
    alternatePhoneNumber &&
    !/^\d{10}$/.test(alternatePhoneNumber)
  ) {
    alert("Alternate phone number must be exactly 10 digits.");
    return;
  }

  try {
    const response = await api.put<LoanCustomerProfile>(
      `/admin/loan-customer/update/${loanCustomer.loanCusId}`,
      {
        name: editName.trim(),
        village: editVillage.trim(),
        phoneNumber,
        alternatePhoneNumber: alternatePhoneNumber || null,
        emailId: editEmail.trim(),
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    const updatedCustomer = response.data;

    setLoanCustomer(updatedCustomer);

    setEditPhone(updatedCustomer.phoneNumber);
    setEditAlternatePhone(updatedCustomer.alternatePhoneNumber || "");

    localStorage.setItem(
      "bill-loan-phnNumber",
      updatedCustomer.phoneNumber
    );

    setOtp("");
    setConfirmationResult(null);
    setIsRecaptchaVerified(false);

    if (recaptchaRef.current) {
      recaptchaRef.current.clear();
      recaptchaRef.current = null;
    }

    if (updatedCustomer.mobileVerified) {
      setOpenEdit(false);
      alert("Loan customer updated successfully.");
    } else {
      alert(
        "Profile updated. Please complete mobile OTP verification."
      );
    }

  } catch (error: any) {
    console.error("Loan customer update error:", error);

    alert(
      error?.response?.data?.message ||
      error?.response?.data ||
      "Loan customer update failed."
    );
  }
};


  const handleBackClick = () => {
    navigate("/admin/Loan");
  };
  useEffect(() => {
  const fetchLoanCustomerData = async () => {
    const phnNumber = localStorage.getItem("bill-loan-phnNumber");

    if (!phnNumber) {
      navigate("/admin/Loan", {
        replace: true,
        state: { errorMessage: "Phone number is missing." },
      });
      return;
    }

    const config = {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    };

    try {
      // 1. Fetch customer profile independently
      const customerResponse = await api.get<LoanCustomerProfile>(
        `/admin/getByLoanCusPhnNumber/${phnNumber}`,
        config
      );

      setLoanCustomer(customerResponse.data);

      // 2. Fetch billing history separately
      try {
        const billingResponse = await api.get<LoanBilling[]>(
          `/admin/by-phone-loan/${phnNumber}`,
          config
        );

        setLoanBillingData(billingResponse.data || []);
      } catch (billingError) {
        console.error("Error fetching loan billing history:", billingError);
        setLoanBillingData([]);
      }

    } catch (error) {
      console.error("Error fetching loan customer profile:", error);

      navigate("/admin/Loan", {
        replace: true,
        state: {
          errorMessage: "Unable to find this loan customer.",
        },
      });
    } finally {
      setProfileLoading(false);
    }
  };

  fetchLoanCustomerData();
}, [navigate]);


if (profileLoading) {
  return <p className="p-4">Loading loan customer profile...</p>;
}

if (!loanCustomer) {
  return <p className="p-4">Loan customer profile not found.</p>;
}

  // ✅ Aggregate values
 const totalItems =
  loanBillingData.length > 0
    ? loanBillingData.reduce(
        (sum, bill) => sum + (bill.numberOfItems || 0),
        0
      )
    : loanCustomer.numberOfActiveItems || 0;

const totalDueAmount =
  loanBillingData.length > 0
    ? loanBillingData.reduce(
        (sum, bill) => sum + (bill.dueAmount || 0),
        0
      )
    : loanCustomer.totalDueAmount || 0;

const totalInterestDueAmount =
  loanBillingData.length > 0
    ? loanBillingData.reduce(
        (sum, bill) => sum + (bill.dueInterestAmount || 0),
        0
      )
    : loanCustomer.dueInterestAmount || 0;

 const handleAddOrder = () => {
  if (!loanCustomer) return;

  const items = loanBillingData.flatMap(
    (bill) => bill.selectedItems || []
  );

  localStorage.removeItem("from");

  localStorage.setItem(
    "loanCusDetailsCustomerId",
    String(loanCustomer.loanCusId)
  );

  sessionStorage.setItem(
    "loanCustomer",
    JSON.stringify(loanCustomer)
  );

  sessionStorage.setItem("items", JSON.stringify(items));

  localStorage.setItem("from", "loanCustomerDetails");

  navigate("/admin/loanItems", {
    replace: true,
    state: {
      fromLoanCustomerDetails: true,
      loanCustomerId: loanCustomer.loanCusId,
    },
  });
};

  return (
    <div>
      <div className="mt-10 flex flex-col items-center justify-center">
        <div
          className="w-full max-w-4xl rounded-2xl shadow-xl p-6"
          style={{
            background: "linear-gradient(135deg, #1e293b, #0f172a)", // dark gradient
            color: "#fff",
          }}
        >
          {/* Header */}
          <div className="flex items-center mb-6">
            <IconButton
              onClick={handleBackClick}
              sx={{
                backgroundColor: "rgba(255,255,255,0.1)",
                color: "#fbbf24",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.25)" },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <h2 className="text-2xl font-bold text-amber-300 ml-2">
              Loan Customer Details
            </h2>

            {/* ✅ Add Order Button (top right corner) */}
            <div className="ml-auto flex items-center gap-3">
              <IconButton
  onClick={handleOpenEdit}
  sx={{
    backgroundColor: "rgba(255,255,255,0.12)",
    color: "#fbbf24",
    "&:hover": {
      backgroundColor: "rgba(255,255,255,0.25)",
    },
  }}
>
  <EditIcon />
</IconButton>
              <Button
                variant="contained"
                sx={{
                  background: "linear-gradient(135deg, #f59e0b, #ef4444)", // orange-red
                  borderRadius: "12px",
                  textTransform: "none",
                  fontWeight: "600",
                  boxShadow: "0 8px 20px rgba(239,68,68,0.35)",
                  px: 3,
                  py: 1,
                  "&:hover": {
                    background: "linear-gradient(135deg, #ef4444, #f59e0b)",
                  },
                }}
                onClick={handleAddOrder}
              >
                Add Item
              </Button>
            </div>
          </div>

          {/* Grid Info */}
          <div className="grid grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-4 pr-4 border-r border-white/20">
              <p className="flex justify-between">
                <span className="text-gray-300 font-medium">Name:</span>
                <span className="text-emerald-300 font-semibold">
                  {loanCustomer.name}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-300 font-medium">Village:</span>
                <span className="text-purple-300 font-semibold">
                  {loanCustomer.village}
                </span>
              </p>

              <p className="flex justify-between">
                <span className="text-gray-300 font-medium">Phone:</span>
                <span className="text-teal-300 font-semibold">
                  {loanCustomer.phoneNumber}
                </span>
              </p>

<p className="flex justify-between">
  <span className="text-gray-300 font-medium">
    Alternate Phone:
  </span>
  <span className="text-teal-300 font-semibold">
    {loanCustomer.alternatePhoneNumber || "—"}
  </span>
</p>

              <p className="flex justify-between">
                <span className="text-gray-300 font-medium">Email:</span>
                <span className="text-orange-300 font-semibold">
                  {loanCustomer.emailId || "—"}
                </span>
              </p>
            </div>

            {/* Right column */}
            <div className="space-y-4 pl-4">
              <p className="flex justify-between">
                <span className="text-gray-300 font-medium">Aadhar Card:</span>
                <span className="text-orange-300 font-semibold">
                  {loanCustomer.aadharCard || "—"}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-300 font-medium">
                  Number of Items:
                </span>
                <span className="text-yellow-300 font-semibold">
                  {totalItems}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-300 font-medium">Total Due:</span>
                <span className="text-red-400 font-semibold">
                  {totalDueAmount.toFixed(2)}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-300 font-medium">
                  Total Interest Due:
                </span>
                <span className="text-red-400 font-semibold">
                  {totalInterestDueAmount.toFixed(2)}
                </span>
              </p>
            </div>
          </div>
            {/* Mobile OTP Verification Card */}
<div className="mt-6 flex flex-wrap gap-4">

  <div
    className={`flex min-w-[230px] items-center justify-between rounded-2xl border p-4 ${
      loanCustomer.mobileVerified
        ? "border-emerald-500/40 bg-emerald-500/10"
        : "border-red-500/40 bg-red-500/10"
    }`}
  >
    <div>
      <p className="text-sm text-gray-300">
        Mobile Verification
      </p>

      <p
        className={`mt-1 font-bold ${
          loanCustomer.mobileVerified
            ? "text-emerald-300"
            : "text-red-400"
        }`}
      >
        {loanCustomer.mobileVerified
          ? "OTP Verified"
          : "OTP Not Verified"}
      </p>
    </div>

    <span
      className={`text-3xl font-bold ${
        loanCustomer.mobileVerified
          ? "text-emerald-300"
          : "text-red-400"
      }`}
    >
      {loanCustomer.mobileVerified ? "✓" : "✕"}
    </span>
  </div>

</div>

        </div>
      </div>
    
      {/* Billing Table */}
      <div className="mt-10 p-3 flex flex-col items-center justify-center">
        <div className="p-6 rounded-3xl w-full max-w-6xl bg-white/75 backdrop-blur-lg border border-[#d0b3ff] shadow-[0_10px_30px_rgba(136,71,255,0.3)]">
          <h3 className=" text-3xl font-bold mb-10 text-blue-600">
            Billing History
          </h3>
          <Box
            className="w-full"
            sx={{
              width: "100%",
              overflowX: "auto", // allows horizontal scrolling on small screens
            }}
          >
            <table className="w-full min-w-[900px] border-collapse border border-gray-300">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border px-3 py-2">Billing Date</th>
                  <th className="border px-3 py-2">Bill Number</th>
                  <th className="border px-3 py-2">Total Amount</th>
                  <th className="border px-3 py-2">Paid</th>
                  <th className="border px-3 py-2">Due</th>
                  <th className="border px-3 py-2">I.Due</th>
                  <th className="border px-3 py-2">Delivery Status</th>
                  <th className="border px-3 py-2">View</th>
                </tr>
              </thead>
              <tbody>
                {loanBillingData.length === 0 ? (
  <tr>
    <td
      colSpan={8}
      className="border px-3 py-8 text-center text-gray-500"
    >
      No billing history available. You can add a new loan item.
    </td>
  </tr>
) : (
  loanBillingData.map((bill) => (
                  <tr key={bill.loanBillId} className="text-center">
                    <td className="border px-3 py-2">
                      {bill.loanBillId
                        ? new Date(bill.loanBillingDate).toLocaleString()
                        : "N/A"}
                    </td>
                    <td className="border px-3 py-2">{bill.loanBillNumber}</td>
                    <td className="border px-3 py-2 text-yellow-600 font-semibold">
                      {bill.totalAmount.toFixed(2)}
                    </td>

                    <td className="border px-3 py-2 text-green-600 font-semibold">
                      {bill.paidAmount.toFixed(2)}
                    </td>
                    <td
                      className={`border px-3 py-2 ${
                        bill.dueAmount !== 0 ? "text-red-600 font-semibold" : ""
                      }`}
                    >
                      {bill.dueAmount.toFixed(2)}
                    </td>

                    <td className="border px-3 py-2">
                      {bill.dueInterestAmount.toFixed(2)}
                    </td>

                    <td
                      className={`border px-3 py-2 font-semibold ${
                        bill.deliveryStatus === "Pending"
                          ? "text-yellow-600"
                          : bill.deliveryStatus === "Delivered"
                          ? "text-green-600"
                          : bill.deliveryStatus === "Canceled"
                          ? "text-red-600"
                          : ""
                      }`}
                    >
                      {bill.deliveryStatus}
                    </td>
                    <td className="border px-3 py-2">
                      <IconButton
                        size="medium"
                        color="primary"
                        sx={{
                          "&:hover": { backgroundColor: "#E0E0E0" },
                        }}
                        onClick={() => {
                          localStorage.setItem(
                            "billLoanNumber",
                            bill.loanBillNumber
                          );
                          navigate("/admin/bill-loan-details");
                        }}
                      >
                        <VisibilityIcon fontSize="medium" />
                      </IconButton>
                    </td>
                  </tr>
               ))
)}
              </tbody>
            </table>
          </Box>
        </div>
      </div>
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="sm" fullWidth>
  <DialogTitle>Edit Loan Customer</DialogTitle>

  <DialogContent>
    <TextField
      margin="dense"
      label="Name"
      fullWidth
      value={editName}
      onChange={(e) => setEditName(formatName(e.target.value))}
    />

    <Autocomplete
      freeSolo
      disableClearable
      options={villageResults || []}
      loading={villageLoading}
      value={editVillage || ""}
      onInputChange={(event, newInputValue) => {
        setEditVillage(newInputValue);
        setVillageSearch(newInputValue);
      }}
      onChange={(event, newValue) => {
        setEditVillage(newValue || "");
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          margin="dense"
          label="Village"
          fullWidth
          placeholder="Type 3 letters to search..."
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <>
                {villageLoading ? (
                  <span className="text-gray-400 text-sm pr-2">Loading...</span>
                ) : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />






    <TextField
      margin="dense"
      label="Phone Number"
      fullWidth
      value={editPhone}
      onChange={(e) => setEditPhone(e.target.value)}
    />

<TextField
  margin="dense"
  label="Alternate Phone Number (Optional)"
  fullWidth
  value={editAlternatePhone}
  onChange={(e) => setEditAlternatePhone(e.target.value)}
  inputProps={{
    maxLength: 15,
    inputMode: "numeric",
  }}
/>

    {/* Mobile OTP Verification */}

{phoneHasChanged ? (

  <div className="mt-4 rounded-xl border border-orange-300 bg-orange-50 p-4">
    <p className="font-bold text-orange-700">
      Mobile Number Changed
    </p>

    <p className="mt-1 text-sm text-orange-700">
      Save the new mobile number first. Existing OTP
      verification will be reset. You must verify the
      new number again.
    </p>
  </div>

) : loanCustomer.mobileVerified ? (

  <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 p-4">
    <div>
      <p className="text-sm text-gray-600">
        Mobile Verification
      </p>

      <p className="font-bold text-emerald-700">
        ✓ OTP Verified
      </p>
    </div>
  </div>

) : (

  <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-4">

    <p className="font-bold text-red-600">
      ✕ OTP Not Verified
    </p>

    <p className="mt-1 text-sm text-gray-600">
      Verify this mobile number to complete the customer profile.
    </p>

    <div className="mt-4 flex justify-center">
      <div id="loan-profile-recaptcha-container" />
    </div>

    <p className="mt-2 text-center text-sm text-gray-600">
      {isRecaptchaVerified
        ? "reCAPTCHA verified. You can send OTP."
        : "Complete reCAPTCHA before sending OTP."}
    </p>

    <Button
      fullWidth
      variant="outlined"
      sx={{ mt: 2 }}
      disabled={!isRecaptchaVerified || sendingOtp}
      onClick={handleSendOtp}
    >
      {sendingOtp ? "Sending OTP..." : "Send OTP"}
    </Button>

    {confirmationResult && (
      <>
        <TextField
          fullWidth
          margin="normal"
          label="Enter OTP"
          value={otp}
          inputProps={{
            maxLength: 6,
            inputMode: "numeric",
          }}
          onChange={(e) =>
            setOtp(e.target.value.replace(/\D/g, ""))
          }
        />

        <Button
          fullWidth
          variant="contained"
          sx={{ mt: 1 }}
          disabled={verifyingOtp}
          onClick={handleVerifyOtp}
        >
          {verifyingOtp ? "Verifying..." : "Verify OTP"}
        </Button>
      </>
    )}

  </div>
)}

    <TextField
      margin="dense"
      label="Email"
      fullWidth
      value={editEmail}
      onChange={(e) => setEditEmail(e.target.value)}
    />
  </DialogContent>

  <DialogActions>
    <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
    <Button variant="contained" onClick={handleUpdateLoanCustomer}>
      Save
    </Button>
  </DialogActions>
</Dialog>
    </div>
  );
};

export default BillLoanData;
