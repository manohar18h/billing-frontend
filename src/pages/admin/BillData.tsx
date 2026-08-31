import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  IconButton,
  Button,
  Autocomplete,
  InputAdornment,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Box } from "@mui/system";
import api from "@/services/api"; // ← import your api.ts
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import debounce from "lodash/debounce";

import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";

import type {
  ConfirmationResult,
} from "firebase/auth";

import { auth } from "@/services/firebase";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  CircularProgress,
  Chip,
  Divider,
} from "@mui/material";



interface SelectedOrder {
  orderId: number;
  orderDate: string;
  metal: string;
  metalPrice: number;
  itemName: string;
  occasion: string;
  design: string;
  size: string;
}

interface CustomerProfileResponse {
  customerId: number;

  name: string;
  village: string;
  phoneNumber: string;
  emailId?: string;

  numberOfOrders: number;
  totalDueAmount: number;

  fullAddress?: string;
  pincode?: string;
  aadhaarNumber?: string;
  panNumber?: string;

  mobileVerified: boolean;
  aadhaarVerified: boolean;

  idProofUrl?: string;
  addressProofUrl?: string;

  schemeDashboard: any;
}


interface Billing {
  billId: number;
  billNumber: string;
  customerId: number;
  name: string;
  village: string;
  phoneNumber: string;
  emailId: string;
  deliveryStatus: string; // ✅ top level
  numberOfOrders: number;
  billTotalAmount: number;
  billDiscountAmount: number;
  exchangeAmount: number;
  billPaidAmount: number;
  billDueAmount: number;
  billResAmount: number;
  selectedOrderIds: string;
  billingDate: string | null;
  itemNames: string[];
  selectedOrders: SelectedOrder[];
}

const BillData: React.FC = () => {
  const navigate = useNavigate();

const [customer, setCustomer] =
  useState<CustomerProfileResponse | null>(null);

const [billingData, setBillingData] =
  useState<Billing[]>([]);

const [pageLoading, setPageLoading] =
  useState(true);

  const [openEdit, setOpenEdit] = useState(false);

const [editName, setEditName] = useState("");
const [editVillage, setEditVillage] = useState("");
const [editPhone, setEditPhone] = useState("");
const [editEmail, setEditEmail] = useState("");


const [editFullAddress, setEditFullAddress] = useState("");
const [editPincode, setEditPincode] = useState("");
const [editAadhaarNumber, setEditAadhaarNumber] =
  useState("");
const [editPanNumber, setEditPanNumber] = useState("");

const [aadhaarFile, setAadhaarFile] =
  useState<File | null>(null);

const [otp, setOtp] = useState("");

const [sendingOtp, setSendingOtp] =
  useState(false);

const [verifyingOtp, setVerifyingOtp] =
  useState(false);


  const [isRecaptchaVerified, setIsRecaptchaVerified] =
  useState(false);

const recaptchaRef =
  useRef<RecaptchaVerifier | null>(null);

const [confirmationResult, setConfirmationResult] =
  useState<ConfirmationResult | null>(null);

const [verifyingAadhaar, setVerifyingAadhaar] =
  useState(false);

const [savingProfile, setSavingProfile] =
  useState(false);



const [villageSearch, setVillageSearch] = useState("");
const [villageResults, setVillageResults] = useState<string[]>([]);
const [villageLoading, setVillageLoading] = useState(false);

  const overviewRef = React.useRef<HTMLDivElement | null>(null);
const preBookingRef = React.useRef<HTMLDivElement | null>(null);
const flexi11Ref = React.useRef<HTMLDivElement | null>(null);
const quickBuyRef = React.useRef<HTMLDivElement | null>(null);

const [showActiveSchemes, setShowActiveSchemes] = useState(false);
const [showSchemeDashboard, setShowSchemeDashboard] = useState(false);
type SchemeSection =
  | "PRE_BOOKING"
  | "FLEXI_11"
  | "QUICK_BUY";

const [activeSchemeSection, setActiveSchemeSection] =
  useState<SchemeSection>("PRE_BOOKING");

const [schemeTab, setSchemeTab] = useState<
  "overview" | "preBooking" | "flexi11" | "quickBuy"
>("overview");


const [selectedScheme, setSelectedScheme] = useState<any>(null);
const [selectedSchemeType, setSelectedSchemeType] = useState<
  "PRE_BOOKING" | "FLEXI_11" | "QUICK_BUY" | null
>(null);


const [schemeRedemptions, setSchemeRedemptions] = useState<any[]>([]);
const [redemptionLoading, setRedemptionLoading] = useState(false);
const [redemptionError, setRedemptionError] = useState("");

const schemeDashboard =
  customer?.schemeDashboard || null;



const preBookingCards = schemeDashboard?.preBookingSchemes || [];
const flexi11Cards = schemeDashboard?.flexi11Schemes || [];
const quickBuyCards = schemeDashboard?.quickBuySummaries || [];

const totalSchemeCards =
  preBookingCards.length + flexi11Cards.length + quickBuyCards.length;


  const normalizeSchemeStatus = (status: any) =>
  String(status || "").trim().toUpperCase();

const isActiveStatus = (status: any) =>
  normalizeSchemeStatus(status) === "ACTIVE";

const isCompletedStatus = (status: any) =>
  normalizeSchemeStatus(status) === "COMPLETED";

const isInactiveStatus = (status: any) => {
  const normalized = normalizeSchemeStatus(status);

  return (
    normalized === "INACTIVE" ||
    normalized === "CANCELLED" ||
    normalized === "CANCELED" ||
    normalized === "CLOSED"
  );
};

const sumSchemeValues = (
  items: any[],
  valueSelector: (item: any) => number,
) =>
  items.reduce(
    (total, item) =>
      total + Number(valueSelector(item) || 0),
    0,
  );

/* ---------------- PRE-BOOKING SUMMARY ---------------- */

const preBookingActiveCount =
  preBookingCards.filter((item: any) =>
    isActiveStatus(item.status),
  ).length;

const preBookingCompletedCount =
  preBookingCards.filter((item: any) =>
    isCompletedStatus(item.status),
  ).length;

const preBookingInactiveCount =
  preBookingCards.filter((item: any) =>
    isInactiveStatus(item.status),
  ).length;

const advanceGoldBookingCount =
  preBookingCards.filter(
    (item: any) =>
      item.schemeSubType ===
      "ADVANCE_GOLD_BOOKING",
  ).length;

const advanceKamalSilverCount =
  preBookingCards.filter(
    (item: any) =>
      item.schemeSubType ===
      "ADVANCE_KAMAL_SILVER_BOOKING",
  ).length;

const advanceSwastikSilverCount =
  preBookingCards.filter(
    (item: any) =>
      item.schemeSubType ===
      "ADVANCE_SWASTIK_SILVER_BOOKING",
  ).length;

const oldGoldExchangeCount =
  preBookingCards.filter(
    (item: any) =>
      item.schemeSubType === "OLD_GOLD_EXCHANGE",
  ).length;

const oldSilverExchangeCount =
  preBookingCards.filter(
    (item: any) =>
      item.schemeSubType === "OLD_SILVER_EXCHANGE",
  ).length;

const totalPreBookingGoldWeight =
  sumSchemeValues(
    preBookingCards.filter(
      (item: any) =>
        item.schemeSubType ===
          "ADVANCE_GOLD_BOOKING" ||
        item.schemeSubType ===
          "OLD_GOLD_EXCHANGE",
    ),
    (item: any) =>
      item.schemeSubType === "OLD_GOLD_EXCHANGE"
        ? item.oldPurityWeight
        : item.metalWeight,
  );

const totalPreBookingSilverWeight =
  sumSchemeValues(
    preBookingCards.filter(
      (item: any) =>
        item.schemeSubType ===
          "ADVANCE_KAMAL_SILVER_BOOKING" ||
        item.schemeSubType ===
          "ADVANCE_SWASTIK_SILVER_BOOKING" ||
        item.schemeSubType ===
          "OLD_SILVER_EXCHANGE",
    ),
    (item: any) =>
      item.schemeSubType === "OLD_SILVER_EXCHANGE"
        ? item.oldPurityWeight
        : item.metalWeight,
  );

const totalPreBookingAmount =
  sumSchemeValues(
    preBookingCards,
    (item: any) =>
      item.oldExchangeAmount ?? item.amount,
  );

/* ---------------- FLEXI 11 SUMMARY ---------------- */

const flexiActiveCount =
  flexi11Cards.filter((item: any) =>
    isActiveStatus(item.status),
  ).length;

const flexiCompletedCount =
  flexi11Cards.filter((item: any) =>
    isCompletedStatus(item.status),
  ).length;

const flexiInactiveCount =
  flexi11Cards.filter((item: any) =>
    isInactiveStatus(item.status),
  ).length;

const flexiPaymentDueCount =
  flexi11Cards.filter(
    (item: any) =>
      Boolean(item.showPayButton) &&
      !isCompletedStatus(item.status),
  ).length;

const totalFlexiPaidAmount =
  sumSchemeValues(
    flexi11Cards,
    (item: any) => item.totalPaidAmount,
  );

const totalFlexiGoldWeight =
  sumSchemeValues(
    flexi11Cards,
    (item: any) => item.totalGoldWeight,
  );

const totalFlexiPaidMonths =
  sumSchemeValues(
    flexi11Cards,
    (item: any) => item.paidMonths,
  );

/* ---------------- QUICK BUY SUMMARY ---------------- */

const quickBuyTransactionCount =
  sumSchemeValues(
    quickBuyCards,
    (item: any) => item.transactionCount,
  );

const quickBuyTotalAmount =
  sumSchemeValues(
    quickBuyCards,
    (item: any) => item.totalAmount,
  );





const quickBuyGoldTransactions =
  sumSchemeValues(
    quickBuyCards.filter(
      (item: any) =>
        String(item.metalName || "")
          .trim()
          .toLowerCase() === "gold"
    ),
    (item: any) => item.transactionCount
  );

const quickBuyKamalSilverTransactions =
  sumSchemeValues(
    quickBuyCards.filter(
      (item: any) =>
        String(item.metalName || "")
          .trim()
          .toLowerCase() ===
        "kamal silver"
    ),
    (item: any) => item.transactionCount
  );

  const quickBuySwastikSilverTransactions =
  sumSchemeValues(
    quickBuyCards.filter(
      (item: any) =>
        String(item.metalName || "")
          .trim()
          .toLowerCase() ===
        "swastik silver"
    ),
    (item: any) => item.transactionCount
  );

  const quickBuyGoldWeight =
  sumSchemeValues(
    quickBuyCards.filter(
      (item: any) =>
        String(item.metalName || "")
          .trim()
          .toLowerCase() === "gold"
    ),
    (item: any) => item.totalWeight
  );
  const quickBuyKamalSilverWeight =
  sumSchemeValues(
    quickBuyCards.filter(
      (item: any) =>
        String(item.metalName || "")
          .trim()
          .toLowerCase() ===
        "kamal silver"
    ),
    (item: any) => item.totalWeight
  );

const quickBuySwastikSilverWeight =
  sumSchemeValues(
    quickBuyCards.filter(
      (item: any) =>
        String(item.metalName || "")
          .trim()
          .toLowerCase() ===
        "swastik silver"
    ),
    (item: any) => item.totalWeight
  );

const activeSectionTitle =
  activeSchemeSection === "PRE_BOOKING"
    ? "Pre-Booking & Exchange Schemes"
    : activeSchemeSection === "FLEXI_11"
     ? "Flexi 12 Monthly Schemes"
      : "Quick Buy Transactions";

const activeSectionCount =
  activeSchemeSection === "PRE_BOOKING"
    ? preBookingCards.length
    : activeSchemeSection === "FLEXI_11"
      ? flexi11Cards.length
      : quickBuyTransactionCount;

const openSchemeSection = (
  section: SchemeSection,
) => {
  setActiveSchemeSection(section);
  setShowActiveSchemes(true);

  window.setTimeout(() => {
    const sectionElement =
      document.getElementById(
        "scheme-section-details",
      );

    sectionElement?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 150);
};


const openSchemeDetails = async (
  type: "PRE_BOOKING" | "FLEXI_11" | "QUICK_BUY",
  data: any
) => {
  setSelectedSchemeType(type);
  setSelectedScheme(data);

  setSchemeRedemptions([]);
  setRedemptionError("");

  try {
    setRedemptionLoading(true);

    let response;

    /*
     * QUICK BUY
     *
     * Quick Buy card is a grouped wallet,
     * so there is no single schemeId.
     *
     * Fetch using customerId + metalName.
     */
    if (type === "QUICK_BUY") {

      const customerId =
        customer?.customerId;

      if (!customerId) {
        throw new Error(
          "Customer ID not found."
        );
      }

      if (!data?.metalName) {
        throw new Error(
          "Quick Buy metal name not found."
        );
      }

      response = await api.get(
        `/scheme/admin/quick-buy-redemptions/${customerId}`,
        {
          params: {
            metalName: data.metalName,
          },

          headers: {
            Authorization:
              `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

    } else {

      /*
       * PRE-BOOKING / FLEXI
       */
      if (!data?.schemeId) {
        throw new Error(
          "Scheme ID not found."
        );
      }

      response = await api.get(
        `/scheme/redemptions/${data.schemeId}`,
        {
          headers: {
            Authorization:
              `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
    }

    console.log(
      "SCHEME REDEMPTION HISTORY:",
      response.data
    );

    setSchemeRedemptions(
      Array.isArray(response.data)
        ? response.data
        : []
    );

  } catch (error: any) {

    console.error(
      "Failed to load scheme redemption history:",
      error
    );

    setRedemptionError(
      getApiErrorMessage(
        error,
        "Failed to load redemption history."
      )
    );

  } finally {
    setRedemptionLoading(false);
  }
};


const closeSchemeDetails = () => {
  setSelectedScheme(null);
  setSelectedSchemeType(null);

  setSchemeRedemptions([]);
  setRedemptionError("");
  setRedemptionLoading(false);
};

const renderQuickBuyRedemptionHistory = () => (
  <div className="mt-8 rounded-[24px] border border-blue-200 bg-blue-50/40 p-6 max-md:p-4">

    <div className="flex items-center justify-between gap-4">

      <div>
        <p className="text-[12px] font-bold uppercase tracking-[3px] text-blue-600">
          Wallet Usage
        </p>

        <h3 className="mt-1 text-[24px] font-bold text-[#1f2937]">
          Redemption History
        </h3>
      </div>

      {schemeRedemptions.length > 0 && (
        <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700">
          {schemeRedemptions.length} Redemption
          {schemeRedemptions.length !== 1 ? "s" : ""}
        </span>
      )}

    </div>

    {redemptionLoading ? (

      <div className="mt-6 flex justify-center py-8">
        <CircularProgress size={28} />
      </div>

    ) : redemptionError ? (

      <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600">
        {redemptionError}
      </div>

    ) : schemeRedemptions.length === 0 ? (

      <div className="mt-5 rounded-2xl border border-dashed border-gray-300 bg-white p-5 text-center">
        <p className="font-semibold text-gray-500">
          This Quick Buy wallet has not been redeemed yet.
        </p>
      </div>

    ) : (

      <div className="mt-6 space-y-4">

        {schemeRedemptions.map(
          (redemption: any, index: number) => (

            <div
              key={
                redemption.redemptionId ||
                `${redemption.billId}-${index}`
              }
              className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm"
            >

              <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4">

                <div>
                  <p className="text-xs font-bold uppercase tracking-[2px] text-gray-400">
                    Redeemed In Bill
                  </p>

                  <p className="mt-1 text-[22px] font-black text-blue-600">
                    {redemption.billNumber || "-"}
                  </p>
                </div>

                <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700">
                  QUICK BUY
                </span>

              </div>

              <div className="mt-5 grid grid-cols-3 gap-4 max-md:grid-cols-1">

                <div>
                  <p className="text-sm text-gray-500">
                    Redeemed Weight
                  </p>

                  <p className="mt-1 font-bold text-gray-900">
                    {Number(
                      redemption.redeemedWeight || 0
                    ).toFixed(4)}{" "}
                    gm
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Metal
                  </p>

                  <p className="mt-1 font-bold text-gray-900">
                    {redemption.metalName || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Redeemed Date
                  </p>

                  <p className="mt-1 font-bold text-gray-900">
                    {formatDate(
                      redemption.redeemedAt
                    )}
                  </p>
                </div>

              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">
                    Bill Reference
                  </p>

                  <p className="mt-1 font-bold text-gray-900">
                    {redemption.billNumber ||
                      (redemption.billId
                        ? `Bill ID ${redemption.billId}`
                        : "-")}
                  </p>
                </div>

                <div className="rounded-xl bg-blue-50 p-4">
                  <p className="text-sm text-gray-500">
                    Redemption Type
                  </p>

                  <p className="mt-1 font-bold text-blue-700">
                    Quick Buy Wallet
                  </p>
                </div>

              </div>

            </div>
          )
        )}

      </div>
    )}

  </div>
);

const clickable = "clickable-ui";

const [preBookingType, setPreBookingType] = useState("Advance Gold Booking");
const [holdMonths] = useState("12");
const [metalWeight, setMetalWeight] = useState("");
const [metalAmount, setMetalAmount] = useState("");

const [itemName, setItemName] = useState("");
const [oldGrossWeight, setOldGrossWeight] = useState("");
const [oldPurity, setOldPurity] = useState("");
const [oldExchangeAmount, setOldExchangeAmount] = useState("");

const [monthlyAmount, setMonthlyAmount] = useState("5000");

const [quickMetal, setQuickMetal] = useState<
  "Gold" | "Kamal Silver" | "Swastik Silver"
>("Gold");

const [quickAmount, setQuickAmount] = useState("1000");

const [rates, setRates] = useState<any>(null);

const fetchRates = async () => {
  try {
    const res = await api.get("/admin/getRates", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    setRates(res.data);
  } catch (error) {
    console.error("Rates error:", error);
  }
};

useEffect(() => {
  fetchRates();
}, []);

const fetchCustomerProfile = async (
  phoneNumber: string,
): Promise<CustomerProfileResponse> => {
  const response =
    await api.get<CustomerProfileResponse>(
      `/scheme/customer-profile/by-phone/${phoneNumber}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    );

  return response.data;
};





const detailButtonClass = `
  ${clickable}
  flex
  h-[52px]
  w-full
  items-center
  justify-center
  rounded-xl
  border
  border-[#f5c542]
  bg-transparent
  px-4
  font-bold
  text-[#f5c542]
  transition-all
  duration-300
  hover:bg-[#f5c542]
  hover:text-black
  hover:shadow-lg
`;

const getStatusClass = (status: any) => {
  const normalized = normalizeSchemeStatus(status);

  if (normalized === "COMPLETED") {
    return "border border-emerald-300/30 bg-emerald-100 text-emerald-700";
  }

  if (normalized === "ACTIVE") {
    return "border border-green-300/30 bg-green-100 text-green-700";
  }

  if (
    normalized === "CANCELLED" ||
    normalized === "CANCELED" ||
    normalized === "INACTIVE"
  ) {
    return "border border-red-300/30 bg-red-100 text-red-700";
  }

  return "border border-gray-300 bg-gray-100 text-gray-700";
};

  const handleBackClick = () => {
    navigate("/admin/customers");
  };

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

const formatMoney = (value: any) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const formatWeight = (value: any) =>
  `${Number(value || 0).toFixed(3)} gm`;

const getQuickBuyWalletData = (
  metalName: string
) => {
  const metal = String(metalName || "")
    .trim()
    .toLowerCase();

  if (metal === "gold") {
    const total = Number(
      schemeDashboard?.goldWallet || 0
    );

    const used = Number(
      schemeDashboard?.goldUsedWeight || 0
    );

    return {
      total,
      used,
      remaining: Math.max(
        0,
        total - used
      ),
    };
  }

  if (metal === "kamal silver") {
    const total = Number(
      schemeDashboard?.kamalSilverWallet || 0
    );

    const used = Number(
      schemeDashboard?.kamalSilverUsedWeight || 0
    );

    return {
      total,
      used,
      remaining: Math.max(
        0,
        total - used
      ),
    };
  }

  if (metal === "swastik silver") {
    const total = Number(
      schemeDashboard?.swastikSilverWallet || 0
    );

    const used = Number(
      schemeDashboard?.swastikSilverUsedWeight || 0
    );

    return {
      total,
      used,
      remaining: Math.max(
        0,
        total - used
      ),
    };
  }

  return {
    total: 0,
    used: 0,
    remaining: 0,
  };
};

const formatDate = (value: any) =>
  value ? new Date(value).toLocaleDateString("en-IN") : "-";



useEffect(() => {
  if (
    !openEdit ||
    customer?.mobileVerified
  ) {
    return;
  }

  const timer = window.setTimeout(() => {
    const container =
      document.getElementById(
        "profile-recaptcha-container",
      );

    if (!container) {
      console.error(
        "Profile reCAPTCHA container was not found.",
      );
      return;
    }

    if (recaptchaRef.current) {
      return;
    }

    setIsRecaptchaVerified(false);

    const verifier =
      new RecaptchaVerifier(
        auth,
        "profile-recaptcha-container",
        {
          size: "normal",

          callback: () => {
            setIsRecaptchaVerified(true);
          },

          "expired-callback": () => {
            setIsRecaptchaVerified(false);
            setConfirmationResult(null);
          },
        },
      );

    recaptchaRef.current = verifier;

    verifier.render().catch((error) => {
      console.error(
        "reCAPTCHA render error:",
        error,
      );

      setIsRecaptchaVerified(false);

      recaptchaRef.current = null;
    });
  }, 500);

  return () => {
    window.clearTimeout(timer);
  };
}, [
  openEdit,
  customer?.mobileVerified,
]);

useEffect(() => {
  const loadBillDataPage = async () => {
    const phoneNumber =
      localStorage.getItem("bill-phnNumber");

    if (!phoneNumber) {
      navigate("/admin/customers", {
        replace: true,
        state: {
          errorMessage: "Phone number is missing.",
        },
      });

      return;
    }

    setPageLoading(true);

    try {
      const token =
        localStorage.getItem("token");

      const [
        customerResponse,
        billingResponse,
      ] = await Promise.all([
        api.get<CustomerProfileResponse>(
          `/scheme/customer-profile/by-phone/${phoneNumber}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        ),

        api.get<Billing[]>(
          `/admin/by-phone/${phoneNumber}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        ),
      ]);

      setCustomer(customerResponse.data);

      const validBills = Array.isArray(billingResponse.data)
  ? billingResponse.data.filter(
      (bill) =>
        Array.isArray(bill.selectedOrders) &&
        bill.selectedOrders.length > 0,
    )
  : [];

setBillingData(validBills);
    } catch (error: any) {
      console.error(
        "Error loading customer details:",
        error,
      );

      navigate("/admin/customers", {
        replace: true,
        state: {
          errorMessage:
            error?.response?.data?.message ||
            error?.response?.data ||
            "Customer details could not be loaded.",
        },
      });
    } finally {
      setPageLoading(false);
    }
  };

  loadBillDataPage();
}, [navigate]);

useEffect(() => {
  return () => {
    if (recaptchaRef.current) {
      recaptchaRef.current.clear();
      recaptchaRef.current = null;
    }
  };
}, []);

if (pageLoading) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <p className="text-lg font-semibold text-gray-600">
        Loading customer details...
      </p>
    </div>
  );
}

if (!customer) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <p className="text-lg font-semibold text-red-600">
        Customer profile not found.
      </p>
    </div>
  );
}

const totalOrders =
  Number(customer.numberOfOrders || 0);

const totalDueAmount = billingData.reduce(
  (total, bill) =>
    total + Number(bill.billDueAmount || 0),
  0,
);
  const normalizeCustomerName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const nameHasUnsavedChange =
  normalizeCustomerName(editName) !==
  normalizeCustomerName(customer.name || "");


  const normalizedSavedPhone =
  (customer.phoneNumber || "")
    .replace(/\D/g, "");

const normalizedEditPhone =
  editPhone.replace(/\D/g, "");

const phoneHasChanged =
  normalizedSavedPhone !== normalizedEditPhone;

 



const getCompletedMonths = (item: any) => {
  if (!item.createdAt || !item.maturityDate || !item.holdMonths) return 0;

  const created = new Date(item.createdAt).getTime();
  const maturity = new Date(item.maturityDate).getTime();
  const now = Date.now();

  const total = maturity - created;
  if (total <= 0) return item.holdMonths;

  const elapsed = Math.max(0, Math.min(now - created, total));

  return Math.floor((elapsed / total) * item.holdMonths);
};





  
  // ✅ Add Order Handler (copied from CustomerDetails)
 const handleAddOrder = () => {
  if (!customer?.customerId) {
    alert("Customer details are missing");
    return;
  }

  localStorage.removeItem("from");
  localStorage.removeItem(
    "editBillFromBillDetails",
  );

  localStorage.setItem(
    "CusDetailsCustomerId",
    String(customer.customerId),
  );

  localStorage.setItem(
    "customerId",
    String(customer.customerId),
  );

  localStorage.setItem(
    "from",
    "customerDetails",
  );

  sessionStorage.setItem(
    "customer",
    JSON.stringify(customer),
  );

  sessionStorage.setItem(
    "orders",
    JSON.stringify([]),
  );

  navigate("/admin/orders", {
    replace: true,
    state: {
      fromCustomerDetails: true,
      customerId: customer.customerId,
    },
  });
};

const handleOpenEdit = () => {
  setEditName(customer.name || "");
  setEditVillage(customer.village || "");
  setEditPhone(customer.phoneNumber || "");
  setEditEmail(customer.emailId || "");


  setEditFullAddress(customer.fullAddress || "");
  setEditPincode(customer.pincode || "");
  setEditAadhaarNumber(
    customer.aadhaarNumber || "",
  );
  setEditPanNumber(customer.panNumber || "");

  setAadhaarFile(null);
  setOtp("");
  setConfirmationResult(null);
  setIsRecaptchaVerified(false);

  if (recaptchaRef.current) {
    recaptchaRef.current.clear();
    recaptchaRef.current = null;
  }

  setOpenEdit(true);
};

const handleCloseEdit = () => {
  if (
    savingProfile ||
    sendingOtp ||
    verifyingOtp ||
    verifyingAadhaar
  ) {
    return;
  }

  setOpenEdit(false);
  setOtp("");
  setConfirmationResult(null);
  setIsRecaptchaVerified(false);

  if (recaptchaRef.current) {
    recaptchaRef.current.clear();
    recaptchaRef.current = null;
  }

  const container = document.getElementById(
    "profile-recaptcha-container",
  );

  if (container) {
    container.innerHTML = "";
  }
};
const handleUpdateCustomer = async () => {
  const phoneNumber =
    editPhone.replace(/\D/g, "");

  if (!editName.trim()) {
    alert("Customer name is required.");
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

  if (
    editEmail.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      editEmail.trim(),
    )
  ) {
    alert("Enter a valid email address.");
    return;
  }



  if (
    editPincode &&
    !/^\d{6}$/.test(editPincode)
  ) {
    alert("Pincode must contain 6 digits.");
    return;
  }

  if (
    editAadhaarNumber &&
    !/^\d{12}$/.test(editAadhaarNumber)
  ) {
    alert(
      "Aadhaar number must contain 12 digits.",
    );
    return;
  }

  try {
    setSavingProfile(true);

  const updatePayload: Record<string, any> = {
  name: editName.trim(),
  village: editVillage.trim(),
  phoneNumber,

  emailId:
    editEmail.trim() || null,



  fullAddress:
    editFullAddress.trim() || null,

  pincode:
    editPincode.trim() || null,

  panNumber:
    editPanNumber.trim() || null,
};

if (!customer.aadhaarVerified) {
  updatePayload.aadhaarNumber =
    editAadhaarNumber
      .replace(/\D/g, "") || null;
}

await api.put(
  `/admin/customer/${customer.customerId}/profile`,
  updatePayload,
);

    localStorage.setItem(
      "bill-phnNumber",
      phoneNumber,
    );

   await refreshCustomerProfile(phoneNumber);

if (phoneHasChanged) {
  setOtp("");
  setConfirmationResult(null);
  setIsRecaptchaVerified(false);

  if (recaptchaRef.current) {
    recaptchaRef.current.clear();
    recaptchaRef.current = null;
  }

  const container = document.getElementById(
    "profile-recaptcha-container"
  );

  if (container) {
    container.innerHTML = "";
  }
}

alert(
  phoneHasChanged
    ? "Profile updated. Mobile OTP verification was reset because the phone number changed."
    : "Customer profile updated successfully.",
);
  } catch (error: any) {
    alert(
      getApiErrorMessage(
        error,
        "Customer profile update failed.",
      ),
    );
  } finally {
    setSavingProfile(false);
  }
};
const handleSendOtp = async () => {
  if (sendingOtp) return;

  const phoneNumber =
    editPhone.replace(/\D/g, "");

  if (!/^\d{10}$/.test(phoneNumber)) {
    alert(
      "Enter a valid 10-digit mobile number.",
    );
    return;
  }

  if (!isRecaptchaVerified) {
    alert(
      "Please complete reCAPTCHA first.",
    );
    return;
  }

  if (!recaptchaRef.current) {
    alert(
      "reCAPTCHA is not ready. Close Edit, reopen it and try again.",
    );
    return;
  }

  try {
    setSendingOtp(true);

    const result =
      await signInWithPhoneNumber(
        auth,
        `+91${phoneNumber}`,
        recaptchaRef.current,
      );

    setConfirmationResult(result);
    setOtp("");

    alert(
      `OTP sent successfully to +91 ${phoneNumber}`,
    );
  } catch (error: any) {
    console.error(
      "Firebase OTP error:",
      error,
    );

    alert(
      error?.message ||
        "Failed to send OTP.",
    );
  } finally {
    setSendingOtp(false);
  }
};

const handleVerifyOtp = async () => {
  if (!confirmationResult) {
    alert("Please send OTP first.");
    return;
  }

  if (!/^\d{6}$/.test(otp)) {
    alert("Enter a valid 6-digit OTP.");
    return;
  }

  try {
    setVerifyingOtp(true);

    const credential =
      await confirmationResult.confirm(otp);

    const firebaseIdToken =
      await credential.user.getIdToken(true);

    await api.post(
      `/admin/customer/${customer.customerId}/verify-mobile`,
      {
        firebaseIdToken,
      },
    );

    await refreshCustomerProfile();

    setOtp("");
setConfirmationResult(null);
setIsRecaptchaVerified(false);

if (recaptchaRef.current) {
  recaptchaRef.current.clear();
  recaptchaRef.current = null;
}

const container =
  document.getElementById(
    "profile-recaptcha-container",
  );

if (container) {
  container.innerHTML = "";
}

    alert(
      "Mobile number verified successfully.",
    );
  } catch (error: any) {
    alert(
      getApiErrorMessage(
        error,
        "OTP verification failed.",
      ),
    );
  } finally {
    setVerifyingOtp(false);
  }
};

const handleVerifyAadhaar = async () => {
  if (customer.aadhaarVerified) {
  alert(
    "Aadhaar is already verified and cannot be changed.",
  );
  return;
}
  if (
    !/^\d{12}$/.test(editAadhaarNumber)
  ) {
    alert(
      "Enter a valid 12-digit Aadhaar number.",
    );
    return;
  }

  if (!aadhaarFile) {
    alert("Please upload the Aadhaar image.");
    return;
  }

  try {
    setVerifyingAadhaar(true);

    const formData = new FormData();

    formData.append(
      "aadhaarNumber",
      editAadhaarNumber,
    );

    formData.append("file", aadhaarFile);

  const response = await api.post<{
  verified: boolean;
  message: string;
  url?: string;
}>(
  `/admin/customer/${customer.customerId}/verify-aadhaar`,
  formData,
);

if (!response.data.verified) {
  throw new Error(
    response.data.message ||
      "Aadhaar verification failed.",
  );
}
   await refreshCustomerProfile();
setAadhaarFile(null);

alert(
  response.data.message ||
    "Aadhaar verified successfully.",
);
  } catch (error: any) {
    alert(
      getApiErrorMessage(
        error,
        "Aadhaar verification failed.",
      ),
    );
  } finally {
    setVerifyingAadhaar(false);
  }
};



const goldRate = Number(rates?.gold24Rate || 0);
const silver999Rate = Number(rates?.silver999Rate || 0);
const silver995Rate = Number(rates?.silver995Rate || 0);

const getPreBookingSubType = () => {
  switch (preBookingType) {
    case "Advance Gold Booking":
      return "ADVANCE_GOLD_BOOKING";
    case "Advance Kamal Silver Booking":
      return "ADVANCE_KAMAL_SILVER_BOOKING";
    case "Advance Swastik Silver Booking":
      return "ADVANCE_SWASTIK_SILVER_BOOKING";
    case "Old Gold Exchange":
      return "OLD_GOLD_EXCHANGE";
    case "Old Silver Exchange":
      return "OLD_SILVER_EXCHANGE";
    default:
      return "ADVANCE_GOLD_BOOKING";
  }
};

const getPreBookingMetalName = () => {
  if (
    preBookingType === "Advance Kamal Silver Booking"
  ) {
    return "Kamal Silver";
  }

  if (
    preBookingType === "Advance Swastik Silver Booking"
  ) {
    return "Swastik Silver";
  }

  return "Gold";
};

const isOldExchange =
  preBookingType === "Old Gold Exchange" ||
  preBookingType === "Old Silver Exchange";

const isAdvanceBooking = !isOldExchange;

const selectedRate =
  preBookingType === "Advance Gold Booking"
    ? goldRate
    : preBookingType === "Advance Kamal Silver Booking"
    ? silver999Rate
    : preBookingType === "Advance Swastik Silver Booking"
    ? silver995Rate
    : 0;

    const selectedRateTitle =
  preBookingType === "Advance Gold Booking"
    ? "24K Gold Rate"
    : preBookingType === "Advance Kamal Silver Booking"
    ? "Kamal Silver Rate"
    : preBookingType === "Advance Swastik Silver Booking"
    ? "Swastik Silver Rate"
    : "";

const calculatePreBookingAmount = (weight: string) => {
  const perGram = selectedRate ? selectedRate / 10 : 0;
  return Number(weight || 0) * perGram;
};

const quickRate =
  quickMetal === "Gold"
    ? goldRate
    : quickMetal === "Kamal Silver"
    ? silver999Rate
    : silver995Rate;

const quickWeight =
  quickRate > 0 ? Number(quickAmount || 0) / (quickRate / 10) : 0;
const refreshCustomerProfile = async (
  phoneNumber?: string,
) => {
  const targetPhone =
    phoneNumber || customer?.phoneNumber;

  if (!targetPhone) return;

  try {
    const updatedCustomer =
      await fetchCustomerProfile(targetPhone);

    setCustomer(updatedCustomer);
  } catch (error) {
    console.error(
      "Failed to refresh customer profile:",
      error,
    );
  }
};
const handleAdminCreatePreBooking = async () => {
  if (!validateSchemeEligibility()) {
  return;
}
  if (isAdvanceBooking) {
    if (!selectedRate) return alert("Metal rate not loaded");
    if (!metalWeight || !metalAmount) {
      return alert("Enter metal weight and amount");
    }
  }

  if (isOldExchange) {
    if (!itemName || !oldGrossWeight || !oldPurity || !oldExchangeAmount) {
      return alert("Enter old item name, gross weight, purity weight and amount");
    }
  }

  try {
    await api.post(
      "/scheme/admin/pre-booking",
      {
        customerId: customer.customerId,
        schemeSubType: getPreBookingSubType(),
        metalName: getPreBookingMetalName(),
        itemName: isOldExchange ? itemName : null,

        ratePerGram: isAdvanceBooking ? selectedRate / 10 : null,
        metalWeight: isAdvanceBooking
          ? Number(metalWeight || 0)
          : Number(oldPurity || 0),

        amount: isAdvanceBooking
          ? Number(metalAmount || 0)
          : Number(oldExchangeAmount || 0),

        holdMonths: 12,

        oldGrossWeight: isOldExchange ? Number(oldGrossWeight || 0) : null,
        oldPurityWeight: isOldExchange ? Number(oldPurity || 0) : null,
        oldExchangeAmount: isOldExchange
          ? Number(oldExchangeAmount || 0)
          : null,
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    alert("Pre-Booking scheme added successfully");

    setItemName("");
    setOldGrossWeight("");
    setOldPurity("");
    setOldExchangeAmount("");
    setMetalWeight("");
    setMetalAmount("");

  await refreshCustomerProfile();

setSchemeTab("overview");
setActiveSchemeSection("PRE_BOOKING");
setShowActiveSchemes(true);
  } catch (error: any) {
alert(
  getApiErrorMessage(
    error,
    "Failed to activate Pre-Booking scheme",
  ),
);
}
};


const validateSchemeEligibility = (): boolean => {
  if (!customer.mobileVerified) {
    alert(
      "Mobile number is not verified. Please complete OTP verification before activating a scheme.",
    );
    return false;
  }

  if (!customer.aadhaarVerified) {
    alert(
      "Aadhaar is not verified. Please upload and verify Aadhaar before activating a scheme.",
    );
    return false;
  }

  if (
    !customer.fullAddress ||
    !customer.fullAddress.trim()
  ) {
    alert(
      "Full address is missing. Please complete the scheme profile first.",
    );
    return false;
  }

  if (
    !customer.pincode ||
    !/^\d{6}$/.test(customer.pincode)
  ) {
    alert(
      "A valid 6-digit pincode is required before activating a scheme.",
    );
    return false;
  }

  return true;
};


const handleAdminCreateFlexi11 = async () => {
  if (!validateSchemeEligibility()) {
  return;
}
  if (!goldRate) return alert("Gold rate not loaded");
  try {
    await api.post(
      "/scheme/admin/flexi11",
      {
        customerId: customer.customerId,
        monthlyAmount: Number(monthlyAmount),
        durationMonths: 12,
        firstMonthRatePerGram: goldRate / 10,
        firstMonthGoldWeight: Number(monthlyAmount) / (goldRate / 10),
        paymentMethod: "ADMIN",
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    alert("Flexi 12 scheme added successfully");
   await refreshCustomerProfile();

setSchemeTab("overview");
setActiveSchemeSection("FLEXI_11");
setShowActiveSchemes(true);
  } catch (error: any) {
alert(
  getApiErrorMessage(
    error,
    "Failed to activate Flexi 12 scheme",
  ),
);}
};

const handleAdminCreateQuickBuy = async () => {
  if (!validateSchemeEligibility()) {
  return;
}
  const rate =
    quickMetal === "Gold"
      ? goldRate
      : quickMetal === "Kamal Silver"
      ? silver999Rate
      : silver995Rate;

  const perGram = rate / 10;
  if (!perGram) return alert("Metal rate not loaded");
  const weight = Number(quickAmount || 0) / perGram;

  try {
    await api.post(
      "/scheme/admin/quick-buy",
      {
        customerId: customer.customerId,
        schemeSubType:
          quickMetal === "Gold"
            ? "QUICK_GOLD_BUY"
            : quickMetal === "Kamal Silver"
            ? "QUICK_KAMAL_SILVER_BUY"
            : "QUICK_SWASTIK_SILVER_BUY",
        metalName: quickMetal,
        ratePerGram: perGram,
        metalWeight: weight,
        amount: Number(quickAmount),
        paymentMethod: "ADMIN",
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    alert("Quick Buy added successfully");
   await refreshCustomerProfile();

setSchemeTab("overview");
setActiveSchemeSection("QUICK_BUY");
setShowActiveSchemes(true);
  } catch (error: any) {
alert(
  getApiErrorMessage(
    error,
    "Failed to activate Quick Buy scheme",
  ),
);}
};
const getApiErrorMessage = (
  error: any,
  fallback: string,
) => {
  const data = error?.response?.data;

  console.error("Scheme API error:", {
    status: error?.response?.status,
    data,
    code: error?.code,
    message: error?.message,
  });

  if (typeof data === "string") {
    return data;
  }

  if (
    data?.message &&
    typeof data.message === "string"
  ) {
    return data.message;
  }

  if (
    data?.error &&
    typeof data.error === "string"
  ) {
    return data.error;
  }

  if (
    error?.message &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return fallback;
};


const handleAdminPayFlexiMonth = async (scheme: any) => {
  const ratePerGram = goldRate / 10;
  const paidAmount = Number(scheme.monthlyAmount || 0);

  if (!paidAmount || !ratePerGram) {
    return alert("Invalid amount or gold rate");
  }

  try {
    await api.post(
     "/scheme/flexi11/pay",
      {
        schemeId: scheme.schemeId,
        paidAmount,
        ratePerGram,
        paymentMethod: "ADMIN",
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    alert("Payment saved successfully");
    await refreshCustomerProfile();
    setShowActiveSchemes(true);
  } catch (error: any) {
    alert(getApiErrorMessage(error, "Payment failed"));
  }
};

const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
  if (!ref.current) return;

  const y =
    ref.current.getBoundingClientRect().top +
    window.pageYOffset -
    80;

  window.scrollTo({
    top: y,
    behavior: "smooth",
  });
};

const handleSchemeTabClick = (
  tab: "overview" | "preBooking" | "flexi11" | "quickBuy"
) => {
  setSchemeTab(tab);

  const target =
    tab === "overview"
      ? overviewRef
      : tab === "preBooking"
      ? preBookingRef
      : tab === "flexi11"
      ? flexi11Ref
      : quickBuyRef;

  if (showActiveSchemes) {
    setShowActiveSchemes(false);

    setTimeout(() => {
      scrollToSection(target);
    }, 300);
  } else {
    setTimeout(() => {
      scrollToSection(target);
    }, 100);
  }
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
              Customer Details
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
                Add Order
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
                  {customer.name}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-300 font-medium">Village:</span>
                <span className="text-purple-300 font-semibold">
                  {customer.village}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-300 font-medium">
                  Number of Orders:
                </span>
                <span className="text-yellow-300 font-semibold">
                  {totalOrders}
                </span>
              </p>
            </div>

            {/* Right column */}
            <div className="space-y-4 pl-4">
              <p className="flex justify-between">
                <span className="text-gray-300 font-medium">Phone:</span>
                <span className="text-teal-300 font-semibold">
                  {customer.phoneNumber}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-300 font-medium">Email:</span>
                <span className="text-orange-300 font-semibold">
                  {customer.emailId || "—"}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-300 font-medium">Total Due:</span>
                <span className="text-red-400 font-semibold">
                  {totalDueAmount.toFixed(2)}
                </span>
              </p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 max-md:grid-cols-1">
  <div
    className={`rounded-2xl border p-4 ${
      customer.mobileVerified
        ? "border-green-400/40 bg-green-500/10"
        : "border-red-400/40 bg-red-500/10"
    }`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-300">
          Mobile Verification
        </p>

        <p
          className={`mt-1 font-bold ${
            customer.mobileVerified
              ? "text-green-300"
              : "text-red-300"
          }`}
        >
          {customer.mobileVerified
            ? "OTP Verified"
            : "OTP Not Verified"}
        </p>
      </div>

      <span className="text-2xl">
        {customer.mobileVerified ? "✓" : "!"}
      </span>
    </div>
  </div>

  <div
    className={`rounded-2xl border p-4 ${
      customer.aadhaarVerified
        ? "border-green-400/40 bg-green-500/10"
        : "border-red-400/40 bg-red-500/10"
    }`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-300">
          Aadhaar Verification
        </p>

        <p
          className={`mt-1 font-bold ${
            customer.aadhaarVerified
              ? "text-green-300"
              : "text-red-300"
          }`}
        >
          {customer.aadhaarVerified
            ? "Aadhaar Verified"
            : "Aadhaar Not Verified"}
        </p>
      </div>

      <span className="text-2xl">
        {customer.aadhaarVerified ? "✓" : "!"}
      </span>
    </div>
  </div>
</div>
          </div>
        </div>
      </div>

{schemeDashboard && (
  <div className="mt-10 flex flex-col items-center justify-center px-3">
    <div className="w-full max-w-6xl overflow-hidden rounded-[34px] border border-[#f5c542]/40 bg-[#111] shadow-2xl">

      <button
        onClick={() => setShowSchemeDashboard((prev) => !prev)}
        className={`${clickable} flex w-full items-center justify-between gap-4 px-8 py-6 text-left max-md:px-4 max-md:py-5`}
      >
        <div>
          <p className="text-[13px] font-bold uppercase tracking-[4px] text-[#f5c542]">
            Scheme Dashboard
          </p>

          <h3 className="mt-2 font-serif text-[34px] text-white max-md:text-[25px]">
            Customer Scheme Wallet
          </h3>

          <p className="mt-2 text-white/60">
            Open wallet, schemes, transactions and add new scheme.
          </p>
        </div>

        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#f5c542] text-[28px] font-bold text-black transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
            showSchemeDashboard ? "rotate-180" : ""
          }`}
        >
          ↓
        </div>
      </button>

      <div
        className={`grid transition-all duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          showSchemeDashboard
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div
            className={`bg-white p-6 transition-all duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              showSchemeDashboard
                ? "translate-y-0 scale-100 opacity-100"
                : "-translate-y-6 scale-[0.98] opacity-0"
            }`}
          >
              <div className="mb-6">
        <p className="text-[14px] font-bold uppercase tracking-[4px] text-[#b98213]">
          Hambire Scheme Dashboard
        </p>

        <h2 className="mt-3 font-serif text-[46px] max-md:text-[30px]">
          Customer Scheme Wallet
        </h2>
      </div>

      {/* WALLET CARDS */}
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
       {[
  {
    title: "Active Schemes",
    value:
      schemeDashboard?.activeSchemes || 0,
    used: null,
  },

  {
    title: "Pre-Booking",
    value: preBookingCards.length,
    used: `Active: ${preBookingActiveCount} • Completed: ${preBookingCompletedCount} • Inactive: ${preBookingInactiveCount}`,
  },

  {
    title: "Flexi 12",
    value: flexi11Cards.length,
    used: `Active: ${flexiActiveCount} • Completed: ${flexiCompletedCount} • Inactive: ${flexiInactiveCount}`,
  },

  {
    title: "Quick Buy Gold",
    value: formatWeight(
      Math.max(
        0,
        Number(
          schemeDashboard?.goldWallet || 0
        ) -
          Number(
            schemeDashboard
              ?.goldUsedWeight || 0
          )
      )
    ),
    used: `Purchased: ${formatWeight(
      schemeDashboard?.goldWallet
    )} • Used: ${formatWeight(
      schemeDashboard?.goldUsedWeight
    )}`,
  },

  {
    title: "Quick Buy Kamal Silver",
    value: formatWeight(
      Math.max(
        0,
        Number(
          schemeDashboard
            ?.kamalSilverWallet || 0
        ) -
          Number(
            schemeDashboard
              ?.kamalSilverUsedWeight || 0
          )
      )
    ),
    used: `Purchased: ${formatWeight(
      schemeDashboard?.kamalSilverWallet
    )} • Used: ${formatWeight(
      schemeDashboard
        ?.kamalSilverUsedWeight
    )}`,
  },

  {
    title: "Quick Buy Swastik Silver",
    value: formatWeight(
      Math.max(
        0,
        Number(
          schemeDashboard
            ?.swastikSilverWallet || 0
        ) -
          Number(
            schemeDashboard
              ?.swastikSilverUsedWeight || 0
          )
      )
    ),
    used: `Purchased: ${formatWeight(
      schemeDashboard?.swastikSilverWallet
    )} • Used: ${formatWeight(
      schemeDashboard
        ?.swastikSilverUsedWeight
    )}`,
  },
].map((item) => (
          <div
            key={item.title}
            className={`rounded-[20px] p-4 text-center shadow ${
              item.title === "Active Schemes"
                ? "bg-[#111] text-white"
                : "bg-[#fbf7ef]"
            }`}
          >
            <p
              className={`text-[13px] ${
                item.title === "Active Schemes"
                  ? "text-white/60"
                  : "text-gray-600"
              }`}
            >
              {item.title}
            </p>

            <h3
              className={`mt-2 text-[20px] font-bold ${
                item.title === "Active Schemes"
                  ? "text-[#f5c542]"
                  : "text-[#b98213]"
              }`}
            >
              {item.value}
            </h3>

            {item.used && (
<p className="mt-2 min-h-[32px] text-[10px] font-semibold leading-4 text-gray-500">
                  {item.used}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* SAME TABS AS SCHEME REGISTER */}
      <div className="mt-8 grid grid-cols-4 gap-4 max-md:grid-cols-2 max-md:gap-3">
        {[
          ["overview", "Overview"],
          ["preBooking", "Pre-Booking"],
          ["flexi11", "Flexi 12"],
          ["quickBuy", "Quick Buy"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => handleSchemeTabClick(key as any)}
            className={`${clickable} rounded-full px-6 py-3 font-bold max-md:px-3 max-md:text-[14px] ${
              schemeTab === key
                ? "bg-[#f5c542] text-black"
                : "bg-[#fbf7ef] text-black"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* SCHEME TYPE SUMMARY CARDS */}
<div className="mt-10">
  <div className="mb-5 flex items-end justify-between gap-4 max-md:flex-col max-md:items-start">
    <div>
      <p className="text-[13px] font-bold uppercase tracking-[4px] text-[#b98213]">
        Customer Scheme Portfolio
      </p>

      <h3 className="mt-2 font-serif text-[34px] text-[#111] max-md:text-[27px]">
        Select a Scheme Category
      </h3>

      <p className="mt-2 max-w-3xl text-[15px] leading-7 text-gray-500">
        Each category is separated so you can easily check
        scheme counts, metal balances, payments and full
        transaction details.
      </p>
    </div>

    <div className="rounded-full bg-[#fff5d6] px-5 py-2 text-sm font-bold text-[#8c6510]">
      {totalSchemeCards} scheme groups
    </div>
  </div>

  <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-1">
    {/* PRE-BOOKING SUMMARY CARD */}
    <button
      type="button"
      onClick={() =>
        openSchemeSection("PRE_BOOKING")
      }
      className={`${clickable} group relative overflow-hidden rounded-[30px] border p-6 text-left shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
        activeSchemeSection === "PRE_BOOKING" &&
        showActiveSchemes
          ? "border-[#d79d22] bg-[#17120a] text-white ring-4 ring-[#f5c542]/20"
          : "border-[#ead9ad] bg-gradient-to-br from-[#fffaf0] to-[#f8ebc8] text-[#17120a]"
      }`}
    >
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#f5c542]/20" />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5c542] text-2xl font-black text-black shadow">
            PB
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              activeSchemeSection ===
                "PRE_BOOKING" &&
              showActiveSchemes
                ? "bg-white/10 text-[#f5c542]"
                : "bg-white text-[#9b6c08]"
            }`}
          >
            {preBookingCards.length} Schemes
          </span>
        </div>

        <h4 className="mt-5 font-serif text-[27px] font-bold">
          Pre-Booking & Exchange
        </h4>

        <p
          className={`mt-2 min-h-[48px] text-sm leading-6 ${
            activeSchemeSection ===
              "PRE_BOOKING" &&
            showActiveSchemes
              ? "text-white/60"
              : "text-gray-600"
          }`}
        >
          Advance gold or silver bookings and old
          jewellery exchange schemes.
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div
            className={`rounded-2xl p-3 text-center ${
              activeSchemeSection ===
                "PRE_BOOKING" &&
              showActiveSchemes
                ? "bg-white/[0.07]"
                : "bg-white/80"
            }`}
          >
            <p className="text-[11px] uppercase text-gray-500">
              Active
            </p>
            <p className="mt-1 text-xl font-black text-green-500">
              {preBookingActiveCount}
            </p>
          </div>

          <div
            className={`rounded-2xl p-3 text-center ${
              activeSchemeSection ===
                "PRE_BOOKING" &&
              showActiveSchemes
                ? "bg-white/[0.07]"
                : "bg-white/80"
            }`}
          >
            <p className="text-[11px] uppercase text-gray-500">
              Completed
            </p>
            <p className="mt-1 text-xl font-black text-blue-500">
              {preBookingCompletedCount}
            </p>
          </div>

          <div
            className={`rounded-2xl p-3 text-center ${
              activeSchemeSection ===
                "PRE_BOOKING" &&
              showActiveSchemes
                ? "bg-white/[0.07]"
                : "bg-white/80"
            }`}
          >
            <p className="text-[11px] uppercase text-gray-500">
              Inactive
            </p>
            <p className="mt-1 text-xl font-black text-red-500">
              {preBookingInactiveCount}
            </p>
          </div>
        </div>

        <div
          className={`mt-4 space-y-3 rounded-[22px] p-4 ${
            activeSchemeSection ===
              "PRE_BOOKING" &&
            showActiveSchemes
              ? "bg-white/[0.06]"
              : "bg-white/70"
          }`}
        >
          <div className="flex justify-between gap-4 text-sm">
            <span className="opacity-60">
              Gold / Old Gold
            </span>
            <b>
              {advanceGoldBookingCount} /{" "}
              {oldGoldExchangeCount}
            </b>
          </div>

          <div className="flex justify-between gap-4 text-sm">
            <span className="opacity-60">
              Silver / Old Silver
            </span>
            <b>
              {advanceKamalSilverCount +
                advanceSwastikSilverCount}{" "}
              / {oldSilverExchangeCount}
            </b>
          </div>

          <div className="flex justify-between gap-4 text-sm">
            <span className="opacity-60">
              Total Gold
            </span>
            <b>
              {totalPreBookingGoldWeight.toFixed(3)} gm
            </b>
          </div>

          <div className="flex justify-between gap-4 text-sm">
            <span className="opacity-60">
              Total Silver
            </span>
            <b>
              {totalPreBookingSilverWeight.toFixed(3)} gm
            </b>
          </div>

          <div className="flex justify-between gap-4 border-t border-current/10 pt-3 text-sm">
            <span className="opacity-60">
              Total Value
            </span>
            <b className="text-[#d49c22]">
              {formatMoney(totalPreBookingAmount)}
            </b>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-full bg-[#f5c542] px-5 py-3 font-bold text-black">
          <span>View Pre-Booking Schemes</span>
          <span className="text-xl">→</span>
        </div>
      </div>
    </button>

    {/* FLEXI 11 SUMMARY CARD */}
    <button
      type="button"
      onClick={() =>
        openSchemeSection("FLEXI_11")
      }
      className={`${clickable} group relative overflow-hidden rounded-[30px] border p-6 text-left shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
        activeSchemeSection === "FLEXI_11" &&
        showActiveSchemes
          ? "border-emerald-500 bg-[#071a14] text-white ring-4 ring-emerald-500/20"
          : "border-emerald-200 bg-gradient-to-br from-[#f4fff9] to-[#dff8ea] text-[#10241b]"
      }`}
    >
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/15" />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-xl font-black text-white shadow">
            12
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              activeSchemeSection ===
                "FLEXI_11" &&
              showActiveSchemes
                ? "bg-white/10 text-emerald-300"
                : "bg-white text-emerald-700"
            }`}
          >
            {flexi11Cards.length} Schemes
          </span>
        </div>

        <h4 className="mt-5 font-serif text-[27px] font-bold">
          Flexi 12 Month Plan
        </h4>

        <p
          className={`mt-2 min-h-[48px] text-sm leading-6 ${
            activeSchemeSection ===
              "FLEXI_11" &&
            showActiveSchemes
              ? "text-white/60"
              : "text-gray-600"
          }`}
        >
          Monthly gold savings with payment tracking,
          due dates and collected gold weight.
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div
            className={`rounded-2xl p-3 text-center ${
              activeSchemeSection ===
                "FLEXI_11" &&
              showActiveSchemes
                ? "bg-white/[0.07]"
                : "bg-white/80"
            }`}
          >
            <p className="text-[11px] uppercase text-gray-500">
              Active
            </p>
            <p className="mt-1 text-xl font-black text-green-500">
              {flexiActiveCount}
            </p>
          </div>

          <div
            className={`rounded-2xl p-3 text-center ${
              activeSchemeSection ===
                "FLEXI_11" &&
              showActiveSchemes
                ? "bg-white/[0.07]"
                : "bg-white/80"
            }`}
          >
            <p className="text-[11px] uppercase text-gray-500">
              Completed
            </p>
            <p className="mt-1 text-xl font-black text-blue-500">
              {flexiCompletedCount}
            </p>
          </div>

          <div
            className={`rounded-2xl p-3 text-center ${
              activeSchemeSection ===
                "FLEXI_11" &&
              showActiveSchemes
                ? "bg-white/[0.07]"
                : "bg-white/80"
            }`}
          >
            <p className="text-[11px] uppercase text-gray-500">
              Inactive
            </p>
            <p className="mt-1 text-xl font-black text-red-500">
              {flexiInactiveCount}
            </p>
          </div>
        </div>

        <div
          className={`mt-4 space-y-3 rounded-[22px] p-4 ${
            activeSchemeSection ===
              "FLEXI_11" &&
            showActiveSchemes
              ? "bg-white/[0.06]"
              : "bg-white/70"
          }`}
        >
          <div className="flex justify-between gap-4 text-sm">
            <span className="opacity-60">
              Payments Due
            </span>
            <b
              className={
                flexiPaymentDueCount > 0
                  ? "text-orange-500"
                  : "text-green-500"
              }
            >
              {flexiPaymentDueCount}
            </b>
          </div>

          <div className="flex justify-between gap-4 text-sm">
            <span className="opacity-60">
              Paid Months
            </span>
            <b>{totalFlexiPaidMonths}</b>
          </div>

          <div className="flex justify-between gap-4 text-sm">
            <span className="opacity-60">
              Gold Collected
            </span>
            <b>
              {totalFlexiGoldWeight.toFixed(4)} gm
            </b>
          </div>

          <div className="flex justify-between gap-4 border-t border-current/10 pt-3 text-sm">
            <span className="opacity-60">
              Total Paid
            </span>
            <b className="text-emerald-500">
              {formatMoney(totalFlexiPaidAmount)}
            </b>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-full bg-emerald-500 px-5 py-3 font-bold text-white">
          <span>View Flexi 12 Schemes</span>
          <span className="text-xl">→</span>
        </div>
      </div>
    </button>

    {/* QUICK BUY SUMMARY CARD */}
    <button
      type="button"
      onClick={() =>
        openSchemeSection("QUICK_BUY")
      }
      className={`${clickable} group relative overflow-hidden rounded-[30px] border p-6 text-left shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
        activeSchemeSection === "QUICK_BUY" &&
        showActiveSchemes
          ? "border-blue-500 bg-[#081426] text-white ring-4 ring-blue-500/20"
          : "border-blue-200 bg-gradient-to-br from-[#f5f9ff] to-[#dfeaff] text-[#10213d]"
      }`}
    >
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-500/15" />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500 text-2xl font-black text-white shadow">
            QB
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              activeSchemeSection ===
                "QUICK_BUY" &&
              showActiveSchemes
                ? "bg-white/10 text-blue-300"
                : "bg-white text-blue-700"
            }`}
          >
            {quickBuyTransactionCount} Transactions
          </span>
        </div>

        <h4 className="mt-5 font-serif text-[27px] font-bold">
          Quick Buy Metal Wallet
        </h4>

        <p
          className={`mt-2 min-h-[48px] text-sm leading-6 ${
            activeSchemeSection ===
              "QUICK_BUY" &&
            showActiveSchemes
              ? "text-white/60"
              : "text-gray-600"
          }`}
        >
          Instant gold and silver purchases stored in
          the customer scheme wallet.
        </p>

       <div className="mt-5 grid grid-cols-3 gap-2">
  <div
    className={`rounded-2xl p-3 text-center ${
      activeSchemeSection === "QUICK_BUY" &&
      showActiveSchemes
        ? "bg-white/[0.07]"
        : "bg-white/80"
    }`}
  >
    <p className="text-[10px] font-bold uppercase text-gray-500">
      Gold
    </p>

    <p className="mt-1 text-xl font-black text-[#d49c22]">
      {quickBuyGoldTransactions}
    </p>

    <p className="mt-1 text-[9px] text-gray-500">
      Transactions
    </p>
  </div>

  <div
    className={`rounded-2xl p-3 text-center ${
      activeSchemeSection === "QUICK_BUY" &&
      showActiveSchemes
        ? "bg-white/[0.07]"
        : "bg-white/80"
    }`}
  >
    <p className="text-[10px] font-bold uppercase text-gray-500">
      Kamal Silver
    </p>

    <p className="mt-1 text-xl font-black text-gray-500">
      {quickBuyKamalSilverTransactions}
    </p>

    <p className="mt-1 text-[9px] text-gray-500">
      Transactions
    </p>
  </div>

  <div
    className={`rounded-2xl p-3 text-center ${
      activeSchemeSection === "QUICK_BUY" &&
      showActiveSchemes
        ? "bg-white/[0.07]"
        : "bg-white/80"
    }`}
  >
    <p className="text-[10px] font-bold uppercase text-gray-500">
      Swastik Silver
    </p>

    <p className="mt-1 text-xl font-black text-gray-500">
      {quickBuySwastikSilverTransactions}
    </p>

    <p className="mt-1 text-[9px] text-gray-500">
      Transactions
    </p>
  </div>
</div>

        <div
          className={`mt-4 space-y-3 rounded-[22px] p-4 ${
            activeSchemeSection ===
              "QUICK_BUY" &&
            showActiveSchemes
              ? "bg-white/[0.06]"
              : "bg-white/70"
          }`}
        >
          <div className="flex justify-between gap-4 text-sm">
            <span className="opacity-60">
              Gold Purchased
            </span>
            <b>
              {quickBuyGoldWeight.toFixed(4)} gm
            </b>
          </div>

          <div className="flex justify-between gap-4 text-sm">
  <span className="opacity-60">
    Kamal Silver Purchased
  </span>

  <b>
    {quickBuyKamalSilverWeight.toFixed(4)} gm
  </b>
</div>

<div className="flex justify-between gap-4 text-sm">
  <span className="opacity-60">
    Swastik Silver Purchased
  </span>

  <b>
    {quickBuySwastikSilverWeight.toFixed(4)} gm
  </b>
</div>

          <div className="flex justify-between gap-4 border-t border-current/10 pt-3 text-sm">
            <span className="opacity-60">
              Total Invested
            </span>
            <b className="text-blue-500">
              {formatMoney(quickBuyTotalAmount)}
            </b>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-full bg-blue-500 px-5 py-3 font-bold text-white">
          <span>View Quick Buy Details</span>
          <span className="text-xl">→</span>
        </div>
      </div>
    </button>
  </div>
</div>

{/* SELECTED SCHEME CATEGORY DETAILS */}
<div
  id="scheme-section-details"
  className="scroll-mt-24"
>
  <div
    className={`mt-8 grid transition-all duration-700 ${
      showActiveSchemes
        ? "grid-rows-[1fr] opacity-100"
        : "grid-rows-[0fr] opacity-0"
    }`}
  >
    <div className="overflow-hidden">
      <div className="overflow-hidden rounded-[32px] border border-[#f5c542]/30 bg-[#111] shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-7 py-6 max-md:px-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[4px] text-[#f5c542]">
              Selected Category
            </p>

            <h3 className="mt-2 font-serif text-[30px] text-white max-md:text-[23px]">
              {activeSectionTitle}
            </h3>

            <p className="mt-1 text-sm text-white/50">
              {activeSectionCount}{" "}
              {activeSchemeSection === "QUICK_BUY"
                ? "transactions"
                : "schemes"}{" "}
              found
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowActiveSchemes(false)
            }
            className={`${clickable} flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-2xl font-bold text-white hover:bg-[#f5c542] hover:text-black`}
            aria-label="Close scheme section"
          >
            ×
          </button>
        </div>

        <div className="px-7 py-7 max-md:px-4">
          {/* PRE-BOOKING INDIVIDUAL CARDS */}
          {activeSchemeSection ===
            "PRE_BOOKING" && (
            <>
              {preBookingCards.length === 0 ? (
                <div className="rounded-[24px] bg-white/[0.07] p-10 text-center">
                  <p className="text-xl font-bold text-white">
                    No Pre-Booking schemes
                  </p>

                  <p className="mt-2 text-sm text-white/50">
                    This customer has not started a
                    Pre-Booking or Exchange scheme.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-md:grid-cols-1">
                  {preBookingCards.map(
                    (item: any, index: number) => {
                      const oldExchange =
                        item.schemeSubType ===
                          "OLD_GOLD_EXCHANGE" ||
                        item.schemeSubType ===
                          "OLD_SILVER_EXCHANGE";

                      return (
                        <article
                          key={`pre-${item.schemeId}`}
                          onClick={() =>
                            openSchemeDetails(
                              "PRE_BOOKING",
                              item,
                            )
                          }
                          className="group flex cursor-pointer flex-col rounded-[26px] border border-white/10 bg-white/[0.07] p-6 text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#f5c542]/70 hover:bg-white/[0.1] hover:shadow-2xl active:scale-[0.99]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-[#f5c542]">
                                {oldExchange
                                  ? "Exchange"
                                  : "Pre-Booking"}{" "}
                                #{index + 1}
                              </p>

                              <h4 className="mt-2 text-[21px] font-bold leading-8">
                                {String(
                                  item.schemeSubType ||
                                    "PRE BOOKING",
                                ).replaceAll(
                                  "_",
                                  " ",
                                )}
                              </h4>
                            </div>

                            <span
                              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${getStatusClass(
                                item.status,
                              )}`}
                            >
                              {item.status || "UNKNOWN"}
                            </span>
                          </div>

                          <div className="mt-5 flex-1 space-y-3">
                            <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                              <span className="text-white/50">
                                Metal
                              </span>
                              <b className="text-right">
                                {item.metalName || "-"}
                              </b>
                            </div>

                            {oldExchange ? (
                              <>
                                <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                                  <span className="text-white/50">
                                    Old Item
                                  </span>
                                  <b className="max-w-[55%] text-right">
                                    {item.itemName ||
                                      "Old Jewellery"}
                                  </b>
                                </div>

                                <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                                  <span className="text-white/50">
                                    Purity Weight
                                  </span>
                                  <b>
                                    {Number(
                                      item.oldPurityWeight ||
                                        0,
                                    ).toFixed(3)}{" "}
                                    gm
                                  </b>
                                </div>

                                <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                                  <span className="text-white/50">
                                    Exchange Value
                                  </span>
                                  <b className="text-[#f5c542]">
                                    {formatMoney(
                                      item.oldExchangeAmount,
                                    )}
                                  </b>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                                  <span className="text-white/50">
                                    Booked Weight
                                  </span>
                                  <b>
                                    {Number(
                                      item.metalWeight ||
                                        0,
                                    ).toFixed(3)}{" "}
                                    gm
                                  </b>
                                </div>

                                <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                                  <span className="text-white/50">
                                    Amount
                                  </span>
                                  <b className="text-[#f5c542]">
                                    {formatMoney(
                                      item.amount,
                                    )}
                                  </b>
                                </div>

                                <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                                  <span className="text-white/50">
                                    Booked Rate
                                  </span>
                                  <b>
                                    {formatMoney(
                                      item.ratePerGram,
                                    )}
                                    /gm
                                  </b>
                                </div>
                              </>
                            )}

                            <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
  <span className="text-white/50">
    Redeemed
  </span>

  <b>
    {formatWeight(
      item.redeemedWeight
    )}
  </b>
</div>

<div className="flex justify-between gap-4 border-b border-white/10 pb-3">
  <span className="text-white/50">
    Available
  </span>

  <b className="text-[#f5c542]">
    {formatWeight(
      item.remainingMetalWeight
    )}
  </b>
</div>

<div className="flex justify-between gap-4 border-b border-white/10 pb-3">
  <span className="text-white/50">
    Redemption
  </span>

  <b>
    {String(
      item.redemptionStatus ||
        "NOT_REDEEMED"
    ).replaceAll("_", " ")}
  </b>
</div>

                            <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                              <span className="text-white/50">
                                Hold Progress
                              </span>
                              <b>
                                {getCompletedMonths(
                                  item,
                                )}
                                /
                                {item.holdMonths || 0}{" "}
                                months
                              </b>
                            </div>

                            <div className="flex justify-between gap-4">
                              <span className="text-white/50">
                                Maturity
                              </span>
                              <b>
                                {formatDate(
                                  item.maturityDate,
                                )}
                              </b>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();

                              openSchemeDetails(
                                "PRE_BOOKING",
                                item,
                              );
                            }}
                            className={`${detailButtonClass} mt-6`}
                          >
                            View Full Details
                          </button>
                        </article>
                      );
                    },
                  )}
                </div>
              )}
            </>
          )}

          {/* FLEXI 11 INDIVIDUAL CARDS */}
          {activeSchemeSection === "FLEXI_11" && (
            <>
              {flexi11Cards.length === 0 ? (
                <div className="rounded-[24px] bg-white/[0.07] p-10 text-center">
                  <p className="text-xl font-bold text-white">
                    No Flexi 12 schemes
                  </p>

                  <p className="mt-2 text-sm text-white/50">
                    This customer has not started a
                    Flexi 12 monthly scheme.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-md:grid-cols-1">
                  {flexi11Cards.map(
                    (item: any, index: number) => {
                      const canPay =
                        Boolean(
                          item.showPayButton,
                        ) &&
                        isActiveStatus(
                          item.status,
                        ) &&
                        !isCompletedStatus(
                          item.status,
                        );

                      return (
                        <article
                          key={`flexi-${item.schemeId}`}
                          onClick={() =>
                            openSchemeDetails(
                              "FLEXI_11",
                              item,
                            )
                          }
                          className="group flex cursor-pointer flex-col rounded-[26px] border border-white/10 bg-white/[0.07] p-6 text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400/60 hover:bg-white/[0.1] hover:shadow-2xl active:scale-[0.99]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-emerald-400">
                                Flexi 12 #{index + 1}
                              </p>

                              <h4 className="mt-2 text-[22px] font-bold">
                                Monthly Gold Savings
                              </h4>
                            </div>

                            <span
                              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${getStatusClass(
                                item.status,
                              )}`}
                            >
                              {item.status || "UNKNOWN"}
                            </span>
                          </div>

                          <div className="mt-5 flex-1 space-y-3">
                            <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                              <span className="text-white/50">
                                Monthly Amount
                              </span>
                              <b>
                                {formatMoney(
                                  item.monthlyAmount,
                                )}
                              </b>
                            </div>

                            <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                              <span className="text-white/50">
                                Total Paid
                              </span>
                              <b className="text-emerald-400">
                                {formatMoney(
                                  item.totalPaidAmount,
                                )}
                              </b>
                            </div>

                            <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                              <span className="text-white/50">
                                Gold Collected
                              </span>
                              <b>
                                {Number(
                                  item.totalGoldWeight ||
                                    0,
                                ).toFixed(4)}{" "}
                                gm
                              </b>
                            </div>

                            <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
  <span className="text-white/50">
    Redeemed Gold
  </span>

  <b>
    {formatWeight(
      item.redeemedWeight
    )}
  </b>
</div>

<div className="flex justify-between gap-4 border-b border-white/10 pb-3">
  <span className="text-white/50">
    Available Gold
  </span>

  <b className="text-[#f5c542]">
    {formatWeight(
      item.remainingGoldWeight
    )}
  </b>
</div>

<div className="flex justify-between gap-4 border-b border-white/10 pb-3">
  <span className="text-white/50">
    Redemption
  </span>

  <b>
    {String(
      item.redemptionStatus ||
        "NOT_REDEEMED"
    ).replaceAll("_", " ")}
  </b>
</div>

                            <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                              <span className="text-white/50">
                                Paid Months
                              </span>
                              <b>
                                {item.paidMonths || 0}/
                                {item.durationMonths ||
                                  12}
                              </b>
                            </div>

                            <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
  <span className="text-white/50">
    Benefit Months
  </span>

  <b>
    {item.benefitMonths || 0}/
    {item.durationMonths || 12}
  </b>
</div>

                            <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
  <span className="text-white/50">
    Wastage Benefit
  </span>

  <b className="text-emerald-400">
    {item.benefitText ||
      "0% Wastage Discount"}
  </b>
</div>

                            <div className="flex justify-between gap-4">
                              <span className="text-white/50">
                                Next Due Date
                              </span>
                              <b
                                className={
                                  canPay
                                    ? "text-orange-400"
                                    : ""
                                }
                              >
                                {formatDate(
                                  item.nextDueDate,
                                )}
                              </b>
                            </div>
                          </div>

                          {canPay && (
                            <div className="mt-5 rounded-2xl border border-orange-400/30 bg-orange-400/10 px-4 py-3">
                              <p className="text-xs font-bold uppercase tracking-[2px] text-orange-300">
                                Payment available
                              </p>

                              <p className="mt-1 text-sm text-white/60">
                                The next Flexi month can
                                now be paid.
                              </p>
                            </div>
                          )}

                          <div className="mt-5 grid gap-3">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();

                                openSchemeDetails(
                                  "FLEXI_11",
                                  item,
                                );
                              }}
                              className={detailButtonClass}
                            >
                              View Full Details
                            </button>

                            {canPay && (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();

                                  handleAdminPayFlexiMonth(
                                    item,
                                  );
                                }}
                                className={`${clickable} flex h-[52px] w-full items-center justify-center rounded-xl bg-[#f5c542] px-4 font-black text-black shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#ffd85c] hover:shadow-xl active:scale-[0.98]`}
                              >
                                Pay Next Installment —{" "}
{formatMoney(item.monthlyAmount)}
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    },
                  )}
                </div>
              )}
            </>
          )}

          {/* QUICK BUY INDIVIDUAL CARDS */}
          {activeSchemeSection === "QUICK_BUY" && (
            <>
              {quickBuyCards.length === 0 ? (
                <div className="rounded-[24px] bg-white/[0.07] p-10 text-center">
                  <p className="text-xl font-bold text-white">
                    No Quick Buy transactions
                  </p>

                  <p className="mt-2 text-sm text-white/50">
                    This customer has not purchased gold
                    or silver through Quick Buy.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-md:grid-cols-1">
                  {quickBuyCards.map(
                    (item: any, index: number) => (
                      <article
                        key={`quick-${
                          item.metalName || index
                        }`}
                        onClick={() =>
                          openSchemeDetails(
                            "QUICK_BUY",
                            item,
                          )
                        }
                        className="group flex cursor-pointer flex-col rounded-[26px] border border-white/10 bg-white/[0.07] p-6 text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-400/60 hover:bg-white/[0.1] hover:shadow-2xl active:scale-[0.99]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-blue-400">
                              Quick Buy
                            </p>

                            <h4 className="mt-2 text-[22px] font-bold">
                              {item.metalName || "Metal"}
                            </h4>
                          </div>

                          <span className="shrink-0 rounded-full border border-blue-300/30 bg-blue-100 px-3 py-1 text-[11px] font-bold text-blue-700">
                            COMPLETED
                          </span>
                        </div>
                        <div className="mt-5 flex-1 space-y-3">
                          <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                            <span className="text-white/50">
                              Transactions
                            </span>
                            <b>
                              {item.transactionCount ||
                                0}
                            </b>
                          </div>

                          <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                            <span className="text-white/50">
                              Total Amount
                            </span>
                            <b className="text-blue-400">
                              {formatMoney(
                                item.totalAmount,
                              )}
                            </b>
                          </div>

                         <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
  <span className="text-white/50">
    Purchased
  </span>

  <b>
    {formatWeight(
      getQuickBuyWalletData(
        item.metalName
      ).total
    )}
  </b>
</div>

<div className="flex justify-between gap-4 border-b border-white/10 pb-3">
  <span className="text-white/50">
    Used
  </span>

  <b>
    {formatWeight(
      getQuickBuyWalletData(
        item.metalName
      ).used
    )}
  </b>
</div>

<div className="flex justify-between gap-4">
  <span className="text-white/50">
    Available
  </span>

  <b className="text-[#f5c542]">
    {formatWeight(
      getQuickBuyWalletData(
        item.metalName
      ).remaining
    )}
  </b>
</div>
                        </div>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();

                            openSchemeDetails(
                              "QUICK_BUY",
                              item,
                            );
                          }}
                          className={`${detailButtonClass} mt-6`}
                        >
                          View All Transactions
                        </button>
                      </article>
                    ),
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  </div>
</div>

      {/* OVERVIEW SAME AS SCHEME REGISTER */}
      <div ref={overviewRef}>
        {schemeTab === "overview" && (
          <div className="mt-10 grid grid-cols-3 gap-6 max-md:grid-cols-1">
            {[
              {
                title: "Pre-Booking & Exchange",
                desc: "Hold advance amount or old jewellery and buy later with VA benefits.",
                action: "Start Pre-Booking",
                tab: "preBooking",
              },
              {
                title: "Flexi 12 Month Plan",
                desc: "Pay monthly amount for 12 months and track amount + gold grams.",
                action: "Start Flexi Plan",
                tab: "flexi11",
              },
              {
                title: "Quick Buy Gold/Silver",
                desc: "Enter amount, calculate metal weight and save it in wallet instantly.",
                action: "Buy Metal",
                tab: "quickBuy",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-[30px] bg-[#111] p-7 text-white shadow-xl"
              >
                <h3 className="font-serif text-[28px] text-[#f5c542]">
                  {item.title}
                </h3>

                <p className="mt-4 text-[16px] leading-7 text-white/70">
                  {item.desc}
                </p>

                <button
                  onClick={() => handleSchemeTabClick(item.tab as any)}
                  className={`${clickable} mt-5 w-full rounded-full bg-[#f5c542] px-5 py-3 font-bold text-black`}
                >
                  {item.action}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* KEEP YOUR EXISTING ADD FORMS */}
      <div ref={preBookingRef}>
        {schemeTab === "preBooking" && (
          <div className="mt-8 rounded-[30px] bg-[#111] p-8 text-white shadow-2xl">
           <p className="text-[14px] font-bold uppercase tracking-[4px] text-[#f5c542]">
  Pre-Booking & Exchange
</p>

<div className="flex items-start justify-between max-md:flex-col max-md:gap-4">
  <div>
    <h3 className="mt-2 font-serif text-[38px] max-md:text-[28px]">
      Hold Gold Value & Buy Jewellery Later
    </h3>

    <p className="mt-4 max-w-[950px] text-[17px] leading-8 text-white/70">
      Customer can either pay advance amount or submit old jewellery for exchange.
      After holding for selected months, customer can purchase jewellery with eligible VA benefit.
    </p>
  </div>

  {isAdvanceBooking && selectedRate > 0 && (
    <div className="text-right max-md:text-left">
      <p className="text-[14px] font-semibold uppercase tracking-[2px] text-[#f5c542]">
        {selectedRateTitle}
      </p>

      <h2 className="mt-1 text-[42px] font-extrabold leading-none text-[#f5c542] max-md:text-[32px]">
        ₹{selectedRate / 10}
      </h2>

      <p className="mt-1 text-[15px] text-white/60">Per Gram</p>
    </div>
  )}
</div>

<div className="mt-8 grid grid-cols-2 gap-6 max-md:grid-cols-1">
  <div>
    <label className="mb-2 block text-white/70">Scheme Type</label>
    <select
      value={preBookingType}
      onChange={(e) => setPreBookingType(e.target.value)}
      className="w-full rounded-xl border border-white/20 bg-black/40 px-4 py-4 outline-none"
    >
      <option>Advance Gold Booking</option>
      <option>Advance Kamal Silver Booking</option>
      <option>Advance Swastik Silver Booking</option>
      <option>Old Gold Exchange</option>
      <option>Old Silver Exchange</option>
    </select>
  </div>

  <div>
  <label className="mb-2 block text-white/70">
    Scheme Duration
  </label>

  <div className="rounded-xl border border-white/20 bg-black/40 px-4 py-4">
    <p className="font-bold text-[#f5c542]">
      12 Months
    </p>

    <p className="mt-1 text-sm leading-6 text-white/60">
      Months 1–5: 0% wastage discount. Months
      6–11: corresponding wastage discount.
      Month 12: full eligible wastage discount.
    </p>
  </div>
</div>

  {isAdvanceBooking && (
    <>
      <div>
        <label className="mb-2 block text-white/70">Metal Weight</label>
        <input
          value={metalWeight}
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9.]/g, "");
            setMetalWeight(value);

            const amount = calculatePreBookingAmount(value);
            setMetalAmount(amount ? amount.toFixed(0) : "");
          }}
          placeholder="Enter metal weight in grams"
          className="w-full rounded-xl border border-white/20 bg-black/40 px-4 py-4 outline-none"
        />
      </div>

      <div>
        <label className="mb-2 block text-white/70">Metal Amount</label>
        <input
          value={metalAmount}
          onChange={(e) => setMetalAmount(e.target.value.replace(/\D/g, ""))}
          placeholder="Enter amount for metal"
          className="w-full rounded-xl border border-white/20 bg-black/40 px-4 py-4 outline-none"
        />
      </div>
    </>
  )}

  {isOldExchange && (
    <>
      <input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Gold Chain / Ring / Bangles" className="w-full rounded-xl border border-white/20 bg-black/40 px-4 py-4 outline-none" />
      <input value={oldGrossWeight} onChange={(e) => setOldGrossWeight(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="Enter gross weight" className="w-full rounded-xl border border-white/20 bg-black/40 px-4 py-4 outline-none" />
      <input value={oldPurity} onChange={(e) => setOldPurity(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="Enter purity weight" className="w-full rounded-xl border border-white/20 bg-black/40 px-4 py-4 outline-none" />
      <input value={oldExchangeAmount} onChange={(e) => setOldExchangeAmount(e.target.value.replace(/\D/g, ""))} placeholder="Enter old exchange amount" className="w-full rounded-xl border border-white/20 bg-black/40 px-4 py-4 outline-none" />
    </>
  )}
</div>

<button
  onClick={handleAdminCreatePreBooking}
  className={`${clickable} mt-5 w-full rounded-full bg-[#f5c542] px-5 py-3 font-bold text-black`}
>
  Pay / Submit Old Gold & Activate Pre-Booking
</button>
          </div>
        )}
      </div>

      <div ref={flexi11Ref}>
        {schemeTab === "flexi11" && (
          <div className="mt-8 rounded-[30px] bg-[#111] p-8 text-white">
            <h3 className="font-serif text-[38px] text-[#f5c542]">Flexi 12 Month Plan</h3>

<div className="mt-8 grid grid-cols-4 gap-5 max-md:grid-cols-2">
  {[1000, 2000, 5000, 10000, 15000, 20000, 25000, 50000].map((value) => (
    <button
      key={value}
      onClick={() => setMonthlyAmount(String(value))}
      className={`${clickable} rounded-2xl border border-[#f5c542]/30 px-5 py-6 text-[22px] font-bold ${
        monthlyAmount === String(value)
          ? "bg-[#f5c542] text-black"
          : "bg-[#fff8e6] text-black"
      }`}
    >
      ₹{value.toLocaleString("en-IN")}
    </button>
  ))}
</div>

<button
  onClick={handleAdminCreateFlexi11}
  className={`${clickable} mt-5 w-full rounded-full bg-[#f5c542] px-5 py-3 font-bold text-black`}
>
  Pay First Month & Activate
</button>
          </div>
        )}
      </div>

      <div ref={quickBuyRef}>
        {schemeTab === "quickBuy" && (
          <div className="mt-8 rounded-[30px] bg-[#111] p-8 text-white">
            <h3 className="font-serif text-[38px] text-[#f5c542]">Quick Buy Metal Wallet</h3>

<div className="mt-8 grid grid-cols-3 gap-3">
  {["Gold", "Kamal Silver", "Swastik Silver"].map((metal) => (
    <button
      key={metal}
      onClick={() => setQuickMetal(metal as any)}
      className={`${clickable} rounded-2xl px-2 py-4 text-[13px] font-bold md:text-[22px] ${
        quickMetal === metal ? "bg-[#f5c542] text-black" : "bg-white/10 text-white"
      }`}
    >
      {metal}
    </button>
  ))}
</div>

<input
  value={quickAmount}
  onChange={(e) => setQuickAmount(e.target.value.replace(/\D/g, ""))}
  placeholder="Enter amount"
  className="mt-8 w-full rounded-2xl border border-white/20 bg-black/40 px-5 py-5 text-[26px] outline-none"
/>

<div className="mt-5 rounded-[28px] bg-white/10 p-6 text-center">
  <p className="text-white/60">Metal Weight</p>
  <h4 className="mt-3 text-[42px] font-bold text-[#f5c542]">
    {quickWeight.toFixed(3)} gm
  </h4>
</div>

<button
  onClick={handleAdminCreateQuickBuy}
  className={`${clickable} mt-5 w-full rounded-full bg-[#f5c542] px-5 py-3 font-bold text-black`}
>
  Pay Now & Save {quickMetal} in Wallet
</button>
          </div>
        )}
      </div>
             </div>
        </div>
      </div>
    </div>
  </div>
)}
  

      {/* Billing Table */}
      <div className="mt-10 p-3 flex flex-col items-center justify-center">
        <div className="p-6 rounded-3xl w-full max-w-6xl bg-white/75 backdrop-blur-lg border border-[#d0b3ff] shadow-[0_10px_30px_rgba(136,71,255,0.3)]">
          <h3 className=" text-3xl font-bold mb-10 text-blue-600">
            Billing History
          </h3>
          <Box
            sx={{
              width: "100%",
              overflowX: "auto", // allows horizontal scrolling on small screens
            }}
          >
            <table className="w-full border-collapse border border-gray-300 minWidth: 800 ">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border px-3 py-2 text-center">
                    <div className="flex justify-center items-center">Date</div>
                  </th>
                  <th className="border px-3 py-2 text-center">
                    <div className="flex justify-center items-center">
                      Bill No
                    </div>
                  </th>
                  <th className="border px-3 py-2 text-center">
                    <div className="flex justify-center items-center">
                      Items
                    </div>
                  </th>
                  <th className="border px-3 py-2 text-center">
                    <div className="flex justify-center items-center">
                      Total
                    </div>
                  </th>
                  <th className="border px-3 py-2 text-center">
                    <div className="flex justify-center items-center">
                      Discount
                    </div>
                  </th>
                  <th className="border px-3 py-2 text-center">
                    <div className="flex justify-center items-center">
                      Exchange
                    </div>
                  </th>
                  <th className="border px-3 py-2 text-center">
                    <div className="flex justify-center items-center">Paid</div>
                  </th>
                  <th className="border px-3 py-2 text-center">
                    <div className="flex justify-center items-center">
                      Recived
                    </div>
                  </th>
                  <th className="border px-3 py-2 text-center">
                    <div className="flex justify-center items-center">Due</div>
                  </th>
                  <th className="border px-3 py-2 text-center">
                    <div className="flex justify-center items-center">
                      Status
                    </div>
                  </th>
                  <th className="border px-3 py-2 text-center">
                    <div className="flex justify-center items-center">View</div>
                  </th>
                </tr>
              </thead>
              <tbody>
  {billingData.length === 0 ? (
    <tr>
      <td
        colSpan={11}
        className="border px-4 py-12 text-center"
      >
        <p className="text-xl font-bold text-gray-700">
          No billing history
        </p>

        <p className="mt-2 text-sm text-gray-500">
          This customer has no generated bills yet.
        </p>
      </td>
    </tr>
  ) : (
    billingData.map((bill) => (
      <tr
        key={bill.billId}
        className="text-center"
      >
  <td className="border px-3 py-2">
                      {bill.billingDate
                        ? new Date(bill.billingDate).toLocaleString()
                        : "N/A"}
                    </td>
                    <td className="border px-3 py-2">{bill.billNumber}</td>
                    <td className="border px-3 py-2 text-center">
                      {bill.selectedOrders?.map((order, index) => (
                        <div key={index}>{order.itemName}</div>
                      ))}
                    </td>
                    <td className="border px-3 py-2 text-yellow-600 font-semibold">
                      {bill.billTotalAmount.toFixed(2)}
                    </td>
                    <td className="border px-3 py-2">
                      {bill.billDiscountAmount.toFixed(2)}
                    </td>
                    <td className="border px-3 py-2  text-blue-600 font-semibold">
                      {bill.exchangeAmount.toFixed(2)}
                    </td>
                    <td className="border px-3 py-2 text-green-600 font-semibold">
                      {bill.billPaidAmount.toFixed(2)}
                    </td>
                    <td className="border px-3 py-2 text-[#8B4513] font-semibold">
                      {bill.billResAmount.toFixed(2)}
                    </td>
                    <td
                      className={`border px-3 py-2 ${
                        bill.billDueAmount !== 0
                          ? "text-red-600 font-semibold"
                          : ""
                      }`}
                    >
                      {bill.billDueAmount.toFixed(2)}
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
                          localStorage.setItem("billNumber", bill.billNumber);
                          navigate("/admin/bill-details");
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
      {selectedScheme && (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-6">
    <div className="relative max-h-[90vh] w-full max-w-[1150px] overflow-y-auto rounded-[34px] bg-white p-8 shadow-2xl max-md:p-4">
      <button
        onClick={closeSchemeDetails}
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black text-2xl font-bold text-white"
      >
        ×
      </button>

    {selectedSchemeType === "PRE_BOOKING" && (
  <>
    <p className="text-[13px] font-bold uppercase tracking-[4px] text-[#b98213]">
      Pre-Booking Scheme Details
    </p>

    <h2 className="mt-2 font-serif text-[38px] max-md:text-[28px]">
      {selectedScheme.schemeSubType?.replaceAll("_", " ")}
    </h2>

    <div className="mt-8 grid grid-cols-4 gap-5 max-md:grid-cols-2 max-md:gap-3">
      {[
        ["Metal", selectedScheme.metalName || "-"],
        [
          "Item Name",
          selectedScheme.schemeSubType === "OLD_GOLD_EXCHANGE" ||
          selectedScheme.schemeSubType === "OLD_SILVER_EXCHANGE"
            ? selectedScheme.itemName || "Old Jewellery"
            : "-",
        ],
        [
          "Amount",
          formatMoney(
            selectedScheme.amount || selectedScheme.oldExchangeAmount
          ),
        ],
        [
          "Weight",
          `${selectedScheme.metalWeight || selectedScheme.oldPurityWeight || 0} gm`,
        ],
        ["Rate", `₹${selectedScheme.ratePerGram || 0}/gm`],
        ["Hold Months", `${selectedScheme.holdMonths || 0} Months`],
        ["Benefit", selectedScheme.benefitText || "-"],
        ["Maturity Date", formatDate(selectedScheme.maturityDate)],
      ].map(([title, value]) => (
        <div
          key={title}
          className="rounded-2xl bg-[#fbf7ef] p-5 max-md:p-4"
        >
          <p className="text-gray-500 max-md:text-[13px]">{title}</p>
          <h4 className="mt-2 break-words text-[20px] font-bold text-[#b98213] max-md:text-[16px]">
            {value}
          </h4>
        </div>
      ))}
    </div>

    <div className="mt-6 rounded-[24px] bg-black p-6 text-white max-md:p-5">
      <h3 className="text-[24px] font-bold text-[#f5c542]">
        Timeline
      </h3>

      <div className="mt-5 grid grid-cols-3 gap-5 max-md:gap-3">
        <div>
          <p className="text-white/50">Created Date</p>
          <b>{formatDate(selectedScheme.createdAt)}</b>
        </div>

        <div>
          <p className="text-white/50">Remaining Days</p>
          <b>{selectedScheme.remainingDays || 0} Days</b>
        </div>

        <div>
          <p className="text-white/50">Status</p>
          <b>{selectedScheme.status}</b>
        </div>
      </div>
    </div>
    {/* REDEMPTION HISTORY */}
<div className="mt-6 rounded-[24px] border border-[#ead8ae] bg-[#fffaf0] p-6 max-md:p-4">
  <div className="flex items-center justify-between gap-3">
    <div>
      <p className="text-[12px] font-bold uppercase tracking-[3px] text-[#b98213]">
        Scheme Usage
      </p>

      <h3 className="mt-1 text-[24px] font-bold text-[#1f2937]">
        Redemption History
      </h3>
    </div>

    {schemeRedemptions.length > 0 && (
      <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-bold text-green-700">
        {schemeRedemptions.length} Redemption
        {schemeRedemptions.length !== 1 ? "s" : ""}
      </span>
    )}
  </div>

  {redemptionLoading ? (
    <div className="mt-6 flex items-center justify-center py-8">
      <CircularProgress size={28} />
    </div>
  ) : redemptionError ? (
    <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600">
      {redemptionError}
    </div>
  ) : schemeRedemptions.length === 0 ? (
    <div className="mt-5 rounded-2xl border border-dashed border-gray-300 bg-white p-5 text-center">
      <p className="font-semibold text-gray-500">
        This scheme has not been redeemed yet.
      </p>
    </div>
  ) : (
    <div className="mt-6 space-y-4">
      {schemeRedemptions.map(
        (redemption: any, index: number) => (
          <div
            key={
              redemption.redemptionId ||
              `${redemption.billId}-${index}`
            }
            className="rounded-2xl border border-[#ead8ae] bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[2px] text-gray-400">
                  Redeemed In Bill
                </p>

                <p className="mt-1 text-[22px] font-black text-[#b98213]">
                  {redemption.billNumber || "-"}
                </p>
              </div>

              <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-bold text-green-700">
                REDEEMED
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-gray-500">
                  Redeemed Weight
                </p>

                <p className="mt-1 font-bold text-gray-900">
                  {Number(
                    redemption.redeemedWeight || 0
                  ).toFixed(3)}{" "}
                  gm
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Metal
                </p>

                <p className="mt-1 font-bold text-gray-900">
                  {redemption.metalName || "-"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Redeemed Date
                </p>

                <p className="mt-1 font-bold text-gray-900">
                  {formatDate(redemption.redeemedAt)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Benefit Months
                </p>

                <p className="mt-1 font-bold text-gray-900">
                  {redemption.benefitMonths ?? 0} Months
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-green-50 p-4">
              <p className="text-sm text-gray-500">
                Benefit Applied
              </p>

              <p className="mt-1 font-bold text-green-700">
                {redemption.fullWastageDiscount
                  ? "Full Wastage Discount"
                  : `${Number(
                      redemption.wastageDiscountPercentage || 0
                    )}% Wastage Discount`}
              </p>
            </div>

            {redemption.billId && (
              <p className="mt-3 text-right text-xs text-gray-400">
                Bill ID: {redemption.billId}
              </p>
            )}
          </div>
        )
      )}
    </div>
  )}
</div>
  </>
)}

    {selectedSchemeType === "FLEXI_11" && selectedScheme && (
  <>
    <p className="text-[13px] font-bold uppercase tracking-[4px] text-[#b98213]">
      Flexi 12 Scheme Details
    </p>

    <h2 className="mt-2 font-serif text-[38px] max-md:text-[28px]">
      Monthly Gold Savings Tracker
    </h2>

    <div className="mt-8 grid grid-cols-4 gap-5 max-md:grid-cols-2">
      {[
        ["Metal", selectedScheme.metalName || "Gold"],
        ["Monthly Amount", formatMoney(selectedScheme.monthlyAmount)],
        ["Total Paid", formatMoney(selectedScheme.totalPaidAmount)],
        [
          "Gold Collected",
          `${Number(selectedScheme.totalGoldWeight || 0).toFixed(4)} gm`,
        ],
        [
          "Paid Months",
          `${selectedScheme.paidMonths || 0}/${selectedScheme.durationMonths || 12}`,
        ],
        [
  "Benefit Months",
  `${selectedScheme.benefitMonths || 0}/${selectedScheme.durationMonths || 12}`,
],
        ["Remaining Payments", selectedScheme.remainingMonths || 0],
        ["Next Eligible Date", formatDate(selectedScheme.nextDueDate)],
        ["Status", selectedScheme.status],
        
      ].map(([title, value]) => (
        <div key={title} className="rounded-2xl bg-[#fbf7ef] p-5">
          <p className="text-gray-500">{title}</p>
          <h4 className="mt-2 text-[20px] font-bold text-[#b98213]">
            {value}
          </h4>
        </div>
      ))}
    </div>

    <div className="mt-10 w-full overflow-x-auto rounded-2xl border border-[#ead7ae]">
      <table className="min-w-[700px] w-full border-collapse text-center text-[12px] md:text-[13px]">
        <thead className="bg-[#f5c542] text-black">
          <tr>
            <th className="whitespace-nowrap px-2 py-3">Month</th>
            <th className="whitespace-nowrap px-2 py-3">Due Date</th>
            <th className="whitespace-nowrap px-2 py-3">Paid Date</th>
            <th className="whitespace-nowrap px-2 py-3">Amount</th>
            <th className="whitespace-nowrap px-2 py-3">Gold Rate</th>
            <th className="whitespace-nowrap px-2 py-3">Gold Grams</th>
            <th className="whitespace-nowrap px-2 py-3">Type</th>
            <th className="whitespace-nowrap px-2 py-3">Status</th>
          </tr>
        </thead>

        <tbody>
          {Array.from({ length: selectedScheme?.durationMonths || 12 }).map(
            (_, index) => {
              const monthNumber = index + 1;

              const payment = selectedScheme.payments?.find(
                (p: any) => p.monthNumber === monthNumber
              );

              let dueDate = "-";

              if (selectedScheme.createdAt) {
                const date = new Date(selectedScheme.createdAt);
                date.setMonth(date.getMonth() + index);
                dueDate = date.toLocaleDateString("en-IN");
              }

              return (
                <tr key={index} className="border-b">
                  <td className="px-2 py-3 font-bold">{monthNumber}</td>

                  <td className="px-2 py-3">{dueDate}</td>

                  <td className="px-2 py-3">
                    {payment ? formatDate(payment.paymentDate) : "-"}
                  </td>

                  <td className="px-2 py-3">
                    {payment ? formatMoney(payment.paidAmount) : "-"}
                  </td>

                  <td className="px-2 py-3">
                    {payment ? `₹${payment.ratePerGram}/gm` : "-"}
                  </td>

                  <td className="px-2 py-3">
                    {payment
                      ? `${Number(payment.metalWeight || 0).toFixed(4)} gm`
                      : "-"}
                  </td>

                  <td className="px-2 py-3">
                    {payment?.paymentMethod || "-"}
                  </td>

                  <td className="px-2 py-3">
                    <span
                      className={`rounded-full px-4 py-1 text-sm font-bold ${
                        payment
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {payment ? "PAID" : "DUE"}
                    </span>
                  </td>
                </tr>
              );
            }
          )}
             </tbody>
      </table>
    </div>

    {/* FLEXI REDEMPTION HISTORY */}
    <div className="mt-8 rounded-[24px] border border-emerald-200 bg-emerald-50/40 p-6 max-md:p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[3px] text-emerald-600">
            Scheme Usage
          </p>

          <h3 className="mt-1 text-[24px] font-bold text-[#1f2937]">
            Redemption History
          </h3>
        </div>

        {schemeRedemptions.length > 0 && (
          <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700">
            {schemeRedemptions.length} Redemption
            {schemeRedemptions.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {redemptionLoading ? (
        <div className="mt-6 flex justify-center py-8">
          <CircularProgress size={28} />
        </div>
      ) : redemptionError ? (
        <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600">
          {redemptionError}
        </div>
      ) : schemeRedemptions.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-gray-300 bg-white p-5 text-center">
          <p className="font-semibold text-gray-500">
            This Flexi scheme has not been redeemed yet.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {schemeRedemptions.map(
            (redemption: any, index: number) => (
              <div
                key={
                  redemption.redemptionId ||
                  `${redemption.billId}-${index}`
                }
                className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[2px] text-gray-400">
                      Redeemed In Bill
                    </p>

                    <p className="mt-1 text-[22px] font-black text-emerald-600">
                      {redemption.billNumber || "-"}
                    </p>
                  </div>

                  <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700">
                    REDEEMED
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      Redeemed Gold
                    </p>

                    <p className="mt-1 font-bold text-gray-900">
                      {Number(
                        redemption.redeemedWeight || 0
                      ).toFixed(4)}{" "}
                      gm
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Bill Number
                    </p>

                    <p className="mt-1 font-bold text-gray-900">
                      {redemption.billNumber || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Redeemed Date
                    </p>

                    <p className="mt-1 font-bold text-gray-900">
                      {formatDate(
                        redemption.redeemedAt
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Benefit Months
                    </p>

                    <p className="mt-1 font-bold text-gray-900">
                      {redemption.benefitMonths ?? 0} Months
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-emerald-50 p-4">
                  <p className="text-sm text-gray-500">
                    Wastage Benefit Used
                  </p>

                  <p className="mt-1 font-bold text-emerald-700">
                    {redemption.fullWastageDiscount
                      ? "Full Wastage Discount"
                      : `${Number(
                          redemption.wastageDiscountPercentage || 0
                        )}% Wastage Discount`}
                  </p>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  </>
)}

      {selectedSchemeType === "QUICK_BUY" && (
        <>
          <p className="text-[13px] font-bold uppercase tracking-[4px] text-[#b98213]">
            Quick Buy Transactions
          </p>

          <h2 className="mt-2 font-serif text-[38px] max-md:text-[28px]">
            {selectedScheme.metalName} Purchase History
          </h2>

         <div className="mt-8 grid grid-cols-5 gap-4 max-lg:grid-cols-3 max-md:grid-cols-2">
  <div className="rounded-2xl bg-[#fbf7ef] p-5">
    <p className="text-gray-500">
      Total Transactions
    </p>

    <h4 className="mt-2 text-[20px] font-bold text-[#b98213]">
      {selectedScheme.transactionCount}
    </h4>
  </div>

  <div className="rounded-2xl bg-[#fbf7ef] p-5">
    <p className="text-gray-500">
      Total Amount
    </p>

    <h4 className="mt-2 text-[20px] font-bold text-[#b98213]">
      {formatMoney(
        selectedScheme.totalAmount
      )}
    </h4>
  </div>

  <div className="rounded-2xl bg-[#fbf7ef] p-5">
    <p className="text-gray-500">
      Purchased Weight
    </p>

    <h4 className="mt-2 text-[20px] font-bold text-[#b98213]">
      {formatWeight(
        getQuickBuyWalletData(
          selectedScheme.metalName
        ).total
      )}
    </h4>
  </div>

  <div className="rounded-2xl bg-[#fff5e8] p-5">
    <p className="text-gray-500">
      Used Weight
    </p>

    <h4 className="mt-2 text-[20px] font-bold text-orange-600">
      {formatWeight(
        getQuickBuyWalletData(
          selectedScheme.metalName
        ).used
      )}
    </h4>
  </div>

  <div className="rounded-2xl bg-[#111] p-5 text-white">
    <p className="text-white/60">
      Available Weight
    </p>

    <h4 className="mt-2 text-[20px] font-bold text-[#f5c542]">
      {formatWeight(
        getQuickBuyWalletData(
          selectedScheme.metalName
        ).remaining
      )}
    </h4>
  </div>
</div>

          <div className="mt-8 w-full overflow-x-auto rounded-2xl border border-[#ead7ae]">
            <table className="w-full min-w-[300px] border-collapse text-center text-[10px] md:text-[13px]">
              <thead className="bg-[#f5c542] text-black">
                <tr>
                  <th className="px-2 py-3">Date</th>
                  <th className="px-2 py-3">Metal</th>
                  <th className="px-2 py-3">Amount</th>
                  <th className="px-2 py-3">Rate</th>
                  <th className="px-2 py-3">Purchased</th>
                  <th className="px-2 py-3">Used</th>
                  <th className="px-2 py-3">Remaining</th>
                  <th className="px-2 py-3">Redemption</th>
                </tr>
              </thead>

              <tbody>
                {selectedScheme.transactions?.map((item: any) => (
                  <tr key={item.schemeId} className="border-b">
                    <td className="px-2 py-3">{formatDate(item.createdAt)}</td>
                    <td className="px-2 py-3 font-bold">{item.metalName}</td>
                    <td className="px-2 py-3">{formatMoney(item.amount)}</td>
                    <td className="px-2 py-3">₹{item.ratePerGram || 0}/gm</td>
                    <td className="px-2 py-3">
                      {Number(item.metalWeight || 0).toFixed(4)} gm
                    </td>
                    <td className="px-2 py-3">
  {Number(
    item.usedMetalWeight || 0
  ).toFixed(4)}{" "}
  gm
</td>

<td className="px-2 py-3 font-bold text-[#b98213]">
  {Math.max(
    0,
    Number(item.metalWeight || 0) -
      Number(item.usedMetalWeight || 0)
  ).toFixed(4)}{" "}
  gm
</td>
                   <td className="px-2 py-3">
  {String(
    item.redemptionStatus ||
      "NOT_REDEEMED"
  ).replaceAll("_", " ")}
</td>
                  </tr>
                ))}
                          </tbody>
            </table>
          </div>

          {/* QUICK BUY BILL / REDEMPTION HISTORY */}
          {renderQuickBuyRedemptionHistory()}

        </>
      )}
    </div>
  </div>
)}

<Dialog
  open={openEdit}
  onClose={handleCloseEdit}
  maxWidth="md"
  fullWidth
  PaperProps={{
    sx: {
      borderRadius: "26px",
      overflow: "hidden",
    },
  }}
>
  <Box
    sx={{
      background:
        "linear-gradient(135deg, #111827, #4c1d95)",
      color: "white",
      px: { xs: 3, md: 4 },
      py: 3,
    }}
  >
    <Typography
      sx={{
        fontSize: { xs: "24px", md: "32px" },
        fontWeight: 800,
      }}
    >
      Customer Profile & Verification
    </Typography>

    <Typography
      sx={{
        mt: 1,
        color: "rgba(255,255,255,0.7)",
      }}
    >
      Complete customer details and verify the
      profile before activating schemes.
    </Typography>
  </Box>

  <DialogContent
    sx={{
      p: { xs: 2, md: 4 },
      backgroundColor: "#f8fafc",
    }}
  >

    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          md: "1fr 1fr",
        },
        gap: 2,
      }}
    >
      <TextField
  fullWidth
  label="Customer Name"
  value={editName}
  onChange={(e) =>
    setEditName(e.target.value)
  }
  disabled={customer.aadhaarVerified}
  helperText={
    customer.aadhaarVerified
      ? "Name is locked because Aadhaar has been verified."
      : ""
  }
/>

      <Autocomplete
        freeSolo
        options={villageResults || []}
        value={editVillage || ""}
        onInputChange={(_, value) => {
          setEditVillage(value);
          setVillageSearch(value);
        }}
        onChange={(_, value) =>
          setEditVillage(value || "")
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label="Village"
            required
          />
        )}
      />

     <Box>
  <TextField
    label="Mobile Number"
    value={editPhone}
    required
    fullWidth
    inputProps={{
      maxLength: 10,
      inputMode: "numeric",
    }}
    onChange={(e) =>
      setEditPhone(
        e.target.value.replace(/\D/g, ""),
      )
    }
  />

  {phoneHasChanged && (
    <Typography
      sx={{
        mt: 1,
        color: "warning.main",
        fontSize: "13px",
        fontWeight: 600,
      }}
    >
      Changing the mobile number will remove the
      existing OTP verification. The new number must
      be verified again.
    </Typography>
  )}
</Box>

      <TextField
        label="Email ID"
        value={editEmail}
        fullWidth
        onChange={(e) =>
          setEditEmail(e.target.value)
        }
      />

     

      <TextField
        label="Pincode"
        value={editPincode}
        fullWidth
        inputProps={{
          maxLength: 6,
          inputMode: "numeric",
        }}
        onChange={(e) =>
          setEditPincode(
            e.target.value.replace(/\D/g, ""),
          )
        }
      />

      <TextField
        label="Full Address"
        value={editFullAddress}
        fullWidth
        multiline
        minRows={3}
        sx={{
          gridColumn: {
            xs: "auto",
            md: "1 / -1",
          },
        }}
        onChange={(e) =>
          setEditFullAddress(e.target.value)
        }
      />

      <TextField
        label="PAN Number"
        value={editPanNumber}
        fullWidth
        inputProps={{ maxLength: 10 }}
        onChange={(e) =>
          setEditPanNumber(
            e.target.value.toUpperCase(),
          )
        }
      />

      <TextField
  label="Aadhaar Number"
  value={
    customer.aadhaarVerified
      ? "XXXX XXXX XXXX"
      : editAadhaarNumber
  }
  onChange={(e) =>
    setEditAadhaarNumber(
      e.target.value
        .replace(/\D/g, "")
        .slice(0, 12),
    )
  }
  disabled={customer.aadhaarVerified}
  helperText={
    customer.aadhaarVerified
      ? "Aadhaar number is verified and cannot be changed."
      : "Enter the 12-digit Aadhaar number."
  }
/>

    </Box>

    <Divider sx={{ my: 4 }} />

    <Typography
      sx={{
        fontSize: "20px",
        fontWeight: 800,
        mb: 2,
      }}
    >
      Verification Status
    </Typography>

    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          md: "1fr 1fr",
        },
        gap: 2,
      }}
    >
      <Box
        sx={{
          border: "1px solid",
          borderColor: customer.mobileVerified
            ? "success.light"
            : "warning.light",
          borderRadius: "18px",
          p: 2.5,
          backgroundColor: customer.mobileVerified
            ? "#f0fdf4"
            : "#fff7ed",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography fontWeight={800}>
            Mobile OTP
          </Typography>

          <Chip
            label={
              customer.mobileVerified
                ? "Verified"
                : "Not Verified"
            }
            color={
              customer.mobileVerified
                ? "success"
                : "warning"
            }
            size="small"
          />
        </Box>

        {!customer.mobileVerified && (
          <>
             <Box
      sx={{
        mt: 2,
        display: "flex",
        justifyContent: "center",
        minHeight: "78px",
        overflow: "hidden",
      }}
    >
      <div id="profile-recaptcha-container" />
    </Box>

   <div
  id="profile-recaptcha-container"
  className="mt-4 flex justify-center"
></div>

<Typography
  sx={{
    mt: 1,
    textAlign: "center",
    color: isRecaptchaVerified
      ? "success.main"
      : "text.secondary",
    fontSize: "13px",
    fontWeight: 600,
  }}
>
  {isRecaptchaVerified
    ? "reCAPTCHA verified. You can send OTP."
    : "Complete reCAPTCHA before sending OTP."}
</Typography>
           <Button
  fullWidth
  variant="outlined"
  sx={{ mt: 2 }}
  disabled={
    sendingOtp ||
    !isRecaptchaVerified
  }
  onClick={handleSendOtp}
>
  {sendingOtp
    ? "Sending OTP..."
    : "Send OTP"}
</Button>

            {confirmationResult && (
              <>
                <TextField
                  fullWidth
                  label="Enter OTP"
                  value={otp}
                  sx={{ mt: 2 }}
                  inputProps={{
                    maxLength: 6,
                    inputMode: "numeric",
                  }}
                  onChange={(e) =>
                    setOtp(
                      e.target.value.replace(
                        /\D/g,
                        "",
                      ),
                    )
                  }
                />

                <Button
                  fullWidth
                  variant="contained"
                  sx={{ mt: 2 }}
                  disabled={verifyingOtp}
                  onClick={handleVerifyOtp}
                >
                  {verifyingOtp
                    ? "Verifying..."
                    : "Verify OTP"}
                </Button>
              </>
            )}
          </>
        )}
      </Box>

      <Box
  sx={{
    border: "1px solid",
    borderColor: customer.aadhaarVerified
      ? "success.light"
      : "warning.light",
    borderRadius: "18px",
    p: 2.5,
    backgroundColor: customer.aadhaarVerified
      ? "#f0fdf4"
      : "#fff7ed",
  }}
>
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
    <Typography fontWeight={800}>
      Aadhaar Verification
    </Typography>

    <Chip
      label={
        customer.aadhaarVerified
          ? "Verified"
          : "Not Verified"
      }
      color={
        customer.aadhaarVerified
          ? "success"
          : "warning"
      }
      size="small"
    />
  </Box>

  {customer.aadhaarVerified ? (
    <Box
      sx={{
        mt: 2,
        p: 2,
        borderRadius: "14px",
        backgroundColor: "#dcfce7",
        textAlign: "center",
      }}
    >
      <Typography
        sx={{
          fontWeight: 800,
          color: "success.dark",
        }}
      >
        Aadhaar has already been verified.
      </Typography>

      <Typography
        sx={{
          mt: 1,
          fontSize: "13px",
          color: "text.secondary",
        }}
      >
        Customer name and Aadhaar number are locked
        and cannot be changed.
      </Typography>
    </Box>
  ) : (
    <>
      <Button
        component="label"
        fullWidth
        variant="outlined"
        sx={{ mt: 2 }}
      >
        {aadhaarFile
          ? aadhaarFile.name
          : "Upload Aadhaar Image"}

        <input
          hidden
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) =>
            setAadhaarFile(
              e.target.files?.[0] || null,
            )
          }
        />
      </Button>

      <Button
        fullWidth
        variant="contained"
        sx={{ mt: 2 }}
        disabled={
          verifyingAadhaar ||
          !aadhaarFile ||
          nameHasUnsavedChange
        }
        onClick={handleVerifyAadhaar}
      >
        {verifyingAadhaar
          ? "Verifying Aadhaar..."
          : nameHasUnsavedChange
            ? "Save Changed Name First"
            : "Verify Aadhaar"}
      </Button>

      {nameHasUnsavedChange && (
        <Typography
          sx={{
            mt: 1.5,
            color: "warning.main",
            fontSize: "13px",
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          The customer name was changed. Save the
          profile before verifying Aadhaar.
        </Typography>
      )}
    </>
  )}
</Box>
    </Box>
  </DialogContent>

  <DialogActions
    sx={{
      px: 4,
      py: 3,
      backgroundColor: "white",
    }}
  >
    <Button
      variant="outlined"
      disabled={
        savingProfile ||
        sendingOtp ||
        verifyingOtp ||
        verifyingAadhaar
      }
      onClick={handleCloseEdit}
    >
      Close
    </Button>

    <Button
      variant="contained"
      disabled={savingProfile}
      onClick={handleUpdateCustomer}
    >
      {savingProfile
        ? "Saving..."
        : "Save Profile"}
    </Button>
  </DialogActions>
</Dialog>
     
    </div>
  );
};

export default BillData;
