import React, { useEffect, useState } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
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
  const [billingData, setBillingData] = useState<Billing[]>([]);
  const navigate = useNavigate();



  const [openEdit, setOpenEdit] = useState(false);

const [editName, setEditName] = useState("");
const [editVillage, setEditVillage] = useState("");
const [editPhone, setEditPhone] = useState("");
const [editEmail, setEditEmail] = useState("");

const [villageSearch, setVillageSearch] = useState("");
const [villageResults, setVillageResults] = useState<string[]>([]);
const [villageLoading, setVillageLoading] = useState(false);
const [schemeDashboard, setSchemeDashboard] = useState<any>(null);
const overviewRef = React.useRef<HTMLDivElement | null>(null);
const preBookingRef = React.useRef<HTMLDivElement | null>(null);
const flexi11Ref = React.useRef<HTMLDivElement | null>(null);
const quickBuyRef = React.useRef<HTMLDivElement | null>(null);

const [showActiveSchemes, setShowActiveSchemes] = useState(false);
const [showSchemeDashboard, setShowSchemeDashboard] = useState(false);
const [schemeTab, setSchemeTab] = useState<
  "overview" | "preBooking" | "flexi11" | "quickBuy"
>("overview");


const [selectedScheme, setSelectedScheme] = useState<any>(null);
const [selectedSchemeType, setSelectedSchemeType] = useState<
  "PRE_BOOKING" | "FLEXI_11" | "QUICK_BUY" | null
>(null);



const preBookingCards = schemeDashboard?.preBookingSchemes || [];
const flexi11Cards = schemeDashboard?.flexi11Schemes || [];
const quickBuyCards = schemeDashboard?.quickBuySummaries || [];

const totalSchemeCards =
  preBookingCards.length + flexi11Cards.length + quickBuyCards.length;

const openSchemeDetails = (
  type: "PRE_BOOKING" | "FLEXI_11" | "QUICK_BUY",
  data: any
) => {
  setSelectedSchemeType(type);
  setSelectedScheme(data);
};

const closeSchemeDetails = () => {
  setSelectedScheme(null);
  setSelectedSchemeType(null);
};

const clickable = "clickable-ui";

const [preBookingType, setPreBookingType] = useState("Advance Gold Booking");
const [holdMonths, setHoldMonths] = useState("5");
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

const fetchSchemeDashboard = async (phoneNumber: string) => {
  try {
    const res = await api.get(`/scheme/dashboard/by-phone/${phoneNumber}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    setSchemeDashboard(res.data);
  } catch (error) {
    setSchemeDashboard(null);
  }
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

const formatDate = (value: any) =>
  value ? new Date(value).toLocaleDateString("en-IN") : "-";


  useEffect(() => {
    const phnNumber = localStorage.getItem("bill-phnNumber");

    console.log("phn number :" + phnNumber);
    console.log("token :" + localStorage.getItem("token"));

    if (phnNumber) {
      api
        .get<Billing[]>(`/admin/by-phone/${phnNumber}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        .then((response) => {
          if (response.data.length === 0) {
            navigate("/admin/customers", {
              replace: true,
              state: {
                errorMessage: "No billing data found for this phone number.",
              },
            });
          } else {
            setBillingData(response.data);
           fetchSchemeDashboard(phnNumber);
          }
        })
        .catch((error) => {
          console.error("Error fetching billing data:", error);
          navigate("/admin/customers", {
            replace: true,
            state: {
              errorMessage: "No billing data found for this phone number.",
            },
          });
        });
    } else {
      navigate("/admin/customers", {
        replace: true,
        state: { errorMessage: "Phone number is missing." },
      });
    }
  }, [navigate]);

  if (billingData.length === 0) {
    return <p className="p-4">No billing data found for this phone number.</p>;
  }

  const customer = billingData[0]; // all bills belong to same customer

  // ✅ Aggregate values
  const totalOrders = billingData.reduce(
    (sum, bill) => sum + bill.numberOfOrders,
    0,
  );
  const totalDueAmount = billingData.reduce(
    (sum, bill) => sum + bill.billDueAmount,
    0,
  );




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
    const customer = billingData[0]; // same customer for all bills
    const orders = billingData.flatMap((bill) => bill.selectedOrders); // collect all existing orders

    localStorage.removeItem("from");
    localStorage.removeItem("editBillFromBillDetails");
    localStorage.setItem("CusDetailsCustomerId", String(customer?.customerId));
    sessionStorage.setItem("customer", JSON.stringify(customer));
    sessionStorage.setItem("orders", JSON.stringify(orders));
    localStorage.setItem("from", "customerDetails");

    navigate("/admin/orders", {
      replace: true,
      state: { fromCustomerDetails: true, customerId: customer?.customerId },
    });
  };

  const handleOpenEdit = () => {
  setEditName(customer.name || "");
  setEditVillage(customer.village || "");
  setEditPhone(customer.phoneNumber || "");
  setEditEmail(customer.emailId || "");

  setOpenEdit(true);
};
const handleUpdateCustomer = async () => {
  try {
    await api.put(
      `/admin/customer/update/${customer.customerId}`,
      {
        name: editName,
        village: editVillage,
        phoneNumber: editPhone,
        emailId: editEmail,
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    // ✅ important: update old phone number storage
    localStorage.setItem("bill-phnNumber", editPhone);

    alert("Customer Updated Successfully");

    setOpenEdit(false);

    // ✅ now reload will search with new phone number
    window.location.reload();

  } catch (error) {
    console.error(error);
    alert("Update Failed");
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

const handleAdminCreatePreBooking = async () => {
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
        metalName: preBookingType.includes("Silver") ? "Silver" : "Gold",

        itemName: isOldExchange ? itemName : null,

        ratePerGram: isAdvanceBooking ? selectedRate / 10 : null,
        metalWeight: isAdvanceBooking
          ? Number(metalWeight || 0)
          : Number(oldPurity || 0),

        amount: isAdvanceBooking
          ? Number(metalAmount || 0)
          : Number(oldExchangeAmount || 0),

        holdMonths: Number(holdMonths),

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

    fetchSchemeDashboard(customer.phoneNumber);
    setSchemeTab("overview");
setShowActiveSchemes(true);
  } catch (error: any) {
  alert(getApiErrorMessage(error, "Failed to add Pre-Booking scheme"));
}
};

const handleAdminCreateFlexi11 = async () => {
  if (!goldRate) return alert("Gold rate not loaded");
  try {
    await api.post(
      "/scheme/admin/flexi11",
      {
        customerId: customer.customerId,
        monthlyAmount: Number(monthlyAmount),
        durationMonths: 11,
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

    alert("Flexi 11 scheme added successfully");
    fetchSchemeDashboard(customer.phoneNumber);
   setSchemeTab("overview");
setShowActiveSchemes(true);
  } catch (error: any) {
  alert(getApiErrorMessage(error, "Failed to add Pre-Booking scheme"));
}
};

const handleAdminCreateQuickBuy = async () => {
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
    fetchSchemeDashboard(customer.phoneNumber);
   setSchemeTab("overview");
setShowActiveSchemes(true);
  } catch (error: any) {
  alert(getApiErrorMessage(error, "Failed to add Pre-Booking scheme"));
}
};
const getApiErrorMessage = (error: any, fallback: string) => {
  const data = error?.response?.data;

  if (typeof data === "string") return data;
  if (data?.message) return data.message;
  if (data?.error) return data.error;

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
      "/scheme/pay-flexi-month",
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
    fetchSchemeDashboard(customer.phoneNumber);
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
            value: schemeDashboard?.activeSchemes || 0,
            used: null,
          },
          {
            title: "Gold Wallet",
            value: formatWeight(schemeDashboard?.goldWallet),
            used: `Used: ${formatWeight(schemeDashboard?.goldUsedWeight)}`,
          },
          {
            title: "Old Exchange Gold",
            value: formatWeight(schemeDashboard?.oldExchangeGoldPurityWeight),
            used: "Purity weight",
          },
          {
            title: "Kamal Silver",
            value: formatWeight(schemeDashboard?.kamalSilverWallet),
            used: `Used: ${formatWeight(schemeDashboard?.kamalSilverUsedWeight)}`,
          },
          {
            title: "Swastik Silver",
            value: formatWeight(schemeDashboard?.swastikSilverWallet),
            used: `Used: ${formatWeight(schemeDashboard?.swastikSilverUsedWeight)}`,
          },
          {
            title: "Total Amount",
            value: formatMoney(schemeDashboard?.totalSavings),
            used: "Scheme value",
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
              <p className="mt-1 text-[11px] font-semibold text-gray-500">
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
          ["flexi11", "Flexi 11"],
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

      {/* VIEW ALL SCHEMES COLLAPSE */}
      <div className="mt-8 overflow-hidden rounded-[30px] border border-[#f5c542]/40 bg-[#111] shadow-2xl">
        <button
          onClick={() => setShowActiveSchemes((prev) => !prev)}
          className={`${clickable} flex w-full items-center justify-between gap-4 px-8 py-6 text-left max-md:px-4 max-md:py-5`}
        >
          <div>
            <p className="text-[13px] font-bold uppercase tracking-[4px] text-[#f5c542]">
              View All Schemes & Transactions
            </p>

            <h3 className="mt-2 font-serif text-[32px] text-white max-md:text-[24px]">
              Customer Running Gold & Silver Benefits
            </h3>

            <p className="mt-2 text-white/60">
              Check Pre-Booking, Flexi 11 and Quick Buy transactions.
            </p>
          </div>

          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#f5c542] text-[28px] font-bold text-black transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              showActiveSchemes ? "rotate-180" : ""
            }`}
          >
            ↓
          </div>
        </button>

        <div
          className={`grid transition-all duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
            showActiveSchemes
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="border-t border-white/10 px-8 py-8 max-md:px-4">
              {totalSchemeCards === 0 ? (
                <div className="rounded-[24px] bg-white/10 p-8 text-center text-white">
                  No active schemes found.
                </div>
              ) : (
                <div
                  className={`grid grid-cols-3 gap-6 transition-all duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] max-md:grid-cols-1 ${
                    showActiveSchemes
                      ? "translate-y-0 scale-100 opacity-100"
                      : "translate-y-8 scale-[0.98] opacity-0"
                  }`}
                >
                {preBookingCards.map((item: any, index: number) => {
    const isOldExchange =
      item.schemeSubType === "OLD_GOLD_EXCHANGE" ||
      item.schemeSubType === "OLD_SILVER_EXCHANGE";

    return (
      <div
        key={`pre-${item.schemeId}`}
  className="
    cursor-pointer
    transition-all
    duration-300
    hover:-translate-y-1
    hover:shadow-2xl
    active:scale-[0.98]
    rounded-[26px]
    bg-white/[0.07]
    p-6
    text-white
    shadow-xl
  "      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-bold text-[#f5c542]">
              Pre-Booking #{index + 1}
            </p>
            <h4 className="mt-2 text-[22px] font-bold">
              {item.schemeSubType?.replaceAll("_", " ")}
            </h4>
          </div>

          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
            {item.status}
          </span>
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-white/50">Metal</span>
            <b>{item.metalName || "-"}</b>
          </div>

          {isOldExchange ? (
            <>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/50">Item Name</span>
                <b>{item.itemName || "Old Jewellery"}</b>
              </div>

              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/50">Exchange Amount</span>
                <b>{formatMoney(item.oldExchangeAmount)}</b>
              </div>

              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/50">Purity Weight</span>
                <b>{item.oldPurityWeight || 0} gm</b>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/50">Amount</span>
                <b>{formatMoney(item.amount)}</b>
              </div>

              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/50">Weight</span>
                <b>{item.metalWeight || 0} gm</b>
              </div>

              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/50">Booked Rate</span>
                <b>₹{item.ratePerGram || 0}/gm</b>
              </div>
            </>
          )}

          <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-white/50">Hold Months</span>
            <b>
  {getCompletedMonths(item)}/{item.holdMonths || 0} Months
</b>
          </div>

          <div className="flex justify-between">
            <span className="text-white/50">Maturity</span>
            <b>{formatDate(item.maturityDate)}</b>
          </div>
        </div>

       <button
  onClick={() => openSchemeDetails("PRE_BOOKING", item)}
  className={detailButtonClass}
>
  View Details
</button>
      </div>
    );
  })}

  {flexi11Cards.map((item: any, index: number) => (
    <div
      key={`flexi-${item.schemeId}`}
  className="
    cursor-pointer
    transition-all
    duration-300
    hover:-translate-y-1
    hover:shadow-2xl
    active:scale-[0.98]
    rounded-[26px]
    bg-white/[0.07]
    p-6
    text-white
    shadow-xl
  "    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-[#f5c542]">
            Flexi 11 #{index + 1}
          </p>
          <h4 className="mt-2 text-[22px] font-bold">
            Monthly Gold Savings
          </h4>
        </div>

        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
          {item.status}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex justify-between border-b border-white/10 pb-2">
          <span className="text-white/50">Metal</span>
          <b>{item.metalName || "Gold"}</b>
        </div>

        <div className="flex justify-between border-b border-white/10 pb-2">
          <span className="text-white/50">Monthly Amount</span>
          <b>{formatMoney(item.monthlyAmount)}</b>
        </div>

        <div className="flex justify-between border-b border-white/10 pb-2">
          <span className="text-white/50">Total Paid</span>
          <b>{formatMoney(item.totalPaidAmount)}</b>
        </div>

        <div className="flex justify-between border-b border-white/10 pb-2">
          <span className="text-white/50">Gold Collected</span>
          <b>{Number(item.totalGoldWeight || 0).toFixed(4)} gm</b>
        </div>

        <div className="flex justify-between border-b border-white/10 pb-2">
          <span className="text-white/50">Next Due Date</span>
          <b>{formatDate(item.nextDueDate)}</b>
        </div>

        <div className="flex justify-between">
          <span className="text-white/50">Paid Months</span>
          <b>
            {item.paidMonths || 0}/{item.durationMonths || 11}
          </b>
        </div>
      </div>

     <div className="mt-5 flex gap-3">
 {item.showPayButton && (
  <button
    onClick={(e) => {
      e.preventDefault();
      handleAdminPayFlexiMonth(item);
    }}
    className={`${clickable} flex-1 rounded-xl bg-[#f5c542] py-3 font-bold text-black shadow-lg`}
  >
    Pay Now
  </button>
)}

 <button
  onClick={() => openSchemeDetails("FLEXI_11", item)}
  className={`${detailButtonClass} ${
    item.showPayButton ? "" : "col-span-2"
  }`}
>
  View Details
</button>
</div>
    </div>
  ))}

  {quickBuyCards.map((item: any) => (
    <div
      key={`quick-${item.metalName}`}
  className="
    cursor-pointer
    transition-all
    duration-300
    hover:-translate-y-1
    hover:shadow-2xl
    active:scale-[0.98]
    rounded-[26px]
    bg-white/[0.07]
    p-6
    text-white
    shadow-xl
  "    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-[#f5c542]">
            Quick Buy {item.metalName}
          </p>
          <h4 className="mt-2 text-[22px] font-bold">
            {item.transactionCount} Transactions
          </h4>
        </div>

        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
          COMPLETED
        </span>
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex justify-between border-b border-white/10 pb-2">
          <span className="text-white/50">Metal</span>
          <b>{item.metalName}</b>
        </div>

        <div className="flex justify-between border-b border-white/10 pb-2">
          <span className="text-white/50">Total Amount</span>
          <b>{formatMoney(item.totalAmount)}</b>
        </div>

        <div className="flex justify-between border-b border-white/10 pb-2">
          <span className="text-white/50">Total Weight</span>
          <b>{Number(item.totalWeight || 0).toFixed(4)} gm</b>
        </div>

        <div className="flex justify-between">
          <span className="text-white/50">Transactions</span>
          <b>{item.transactionCount}</b>
        </div>
      </div>

      <button
  onClick={() => openSchemeDetails("QUICK_BUY", item)}
  className={detailButtonClass}
>
  View Transactions
</button>
    </div>
  ))}
  
</div>        )}
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
                title: "Flexi 11 Month Plan",
                desc: "Pay monthly amount for 11 months and track amount + gold grams.",
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
    <label className="mb-2 block text-white/70">Hold Period</label>
    <select
      value={holdMonths}
      onChange={(e) => setHoldMonths(e.target.value)}
      className="w-full rounded-xl border border-white/20 bg-black/40 px-4 py-4 outline-none"
    >
      <option value="5">5 Months - 5% VA Benefit</option>
      <option value="6">6 Months - 6% VA Benefit</option>
      <option value="7">7 Months - 7% VA Benefit</option>
      <option value="8">8 Months - 8% VA Benefit</option>
      <option value="9">9 Months - 9% VA Benefit</option>
      <option value="10">10 Months - 10% VA Benefit</option>
      <option value="11">11 Months - Full Eligible VA Benefit</option>
      <option value="12">12 Months - Full Eligible VA Benefit</option>
    </select>
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
            <h3 className="font-serif text-[38px] text-[#f5c542]">Flexi 11 Month Plan</h3>

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
            <h3 className="font-serif text-[38px] text-[#f5c542]">Quick Buy Gold & Silver</h3>

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
                {billingData.map((bill) => (
                  <tr key={bill.billId} className="text-center">
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
                ))}
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
  </>
)}

    {selectedSchemeType === "FLEXI_11" && selectedScheme && (
  <>
    <p className="text-[13px] font-bold uppercase tracking-[4px] text-[#b98213]">
      Flexi 11 Scheme Details
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
          `${selectedScheme.paidMonths || 0}/${selectedScheme.durationMonths || 11}`,
        ],
        ["Remaining Months", selectedScheme.remainingMonths || 0],
        ["Next Due Date", formatDate(selectedScheme.nextDueDate)],
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
          {Array.from({ length: selectedScheme?.durationMonths || 11 }).map(
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

          <div className="mt-8 grid grid-cols-3 gap-5 max-md:grid-cols-2">
            <div className="rounded-2xl bg-[#fbf7ef] p-5">
              <p className="text-gray-500">Total Transactions</p>
              <h4 className="mt-2 text-[20px] font-bold text-[#b98213]">
                {selectedScheme.transactionCount}
              </h4>
            </div>

            <div className="rounded-2xl bg-[#fbf7ef] p-5">
              <p className="text-gray-500">Total Amount</p>
              <h4 className="mt-2 text-[20px] font-bold text-[#b98213]">
                {formatMoney(selectedScheme.totalAmount)}
              </h4>
            </div>

            <div className="rounded-2xl bg-[#111] p-5 text-center text-white max-md:col-span-2">
              <p className="text-white/60">Total Weight</p>
              <h4 className="mt-2 text-[20px] font-bold text-[#f5c542]">
                {Number(selectedScheme.totalWeight || 0).toFixed(4)} gm
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
                  <th className="px-2 py-3">Weight</th>
                  <th className="px-2 py-3">Status</th>
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
                    <td className="px-2 py-3">{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  </div>
)}
      <Dialog
  open={openEdit}
  onClose={() => setOpenEdit(false)}
  maxWidth="sm"
  fullWidth
>
  <DialogTitle>Edit Customer</DialogTitle>

  <DialogContent>

    <TextField
  margin="dense"
  label="Name"
  fullWidth
  value={editName}
  onChange={(e) => {

    const formatted = e.target.value
      .split(" ")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1).toLowerCase()
      )
      .join(" ");

    setEditName(formatted);
  }}
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

    <TextField
      margin="dense"
      label="Phone Number"
      fullWidth
      value={editPhone}
      onChange={(e) => setEditPhone(e.target.value)}
    />

    <TextField
      margin="dense"
      label="Email"
      fullWidth
      value={editEmail}
      onChange={(e) => setEditEmail(e.target.value)}
    />

  </DialogContent>

  <DialogActions>

    <Button onClick={() => setOpenEdit(false)}>
      Cancel
    </Button>

    <Button
      variant="contained"
      onClick={handleUpdateCustomer}
    >
      Save
    </Button>

  </DialogActions>
</Dialog>
    </div>
  );
};

export default BillData;
