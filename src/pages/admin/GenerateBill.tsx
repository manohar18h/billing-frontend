// @charset "UTF-8";
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "@/services/api";
import hjlogoo from "../../assets/hjlogoo.png";
import ashadamOffer from "../../assets/ashadamoffer.jpeg"

const GenerateBill: React.FC = () => {
  const printRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const selectedOrders = location.state?.selectedOrders || [];
  const token = localStorage.getItem("token");
  const billNumber =
    location.state?.billNumber || localStorage.getItem("billNumber");
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [msgTitle, SetMsgTitle] = useState("");
  const openWhatsAppModal = () => setShowWhatsAppModal(true);

  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payMethod, setPayMethod] = useState("Phone Pay");
  const [payAmount, setPayAmount] = useState("");
  const [payLoading, setPayLoading] = useState(false);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [discountAmount, setDiscountAmount] = useState("");
  const [discountLoading, setDiscountLoading] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState("");
  const [schemeCouponData, setSchemeCouponData] =
  useState<any>(null);

const [schemeCouponsLoading, setSchemeCouponsLoading] =
  useState(false);

const [schemeRedeemWeight, setSchemeRedeemWeight] =
  useState("");

const [schemePreview, setSchemePreview] =
  useState<any>(null);

const [schemePreviewLoading, setSchemePreviewLoading] =
  useState(false);


  const isSchemeCouponSelected =
  selectedCoupon.startsWith("SCHEME:");

const isQuickBuyCouponSelected =
  selectedCoupon.startsWith("QUICK_BUY:");



  const navigate = useNavigate();




  // Transaction model
  interface Transaction {
    transactionId: number;
    paymentMethod: string;
    paymentType: string;
    paidAmount: number;
    paymentDate: string;
    orderId: number;
  }

  // Old item model
  interface OldItem {
    oldItemId: number;
    exchange_metal: string;
    exchange_metal_name: string;
    exchange_metal_weight: string;
    exchange_purity_weight: string;
    exchange_metal_price: number;
    exchange_item_amount: number;
    orderId: number;
  }

  interface Order {
    orderId: number;
    orderDate: string;
    metal: string;
    metalPrice: number;
    itemName: string;
    catalogue: string | null;
    design: string;
    size: string;
    metal_weight: number;
    wastage: number;
    making_charges: number;
    stone_weight: number;
    stone_amount: number;
    wax_weight: number;
    wax_amount: number;
    diamond_weight: number;
    diamond_amount: number;
    bits_weight: number;
    bits_amount: number;
    enamel_weight: number;
    enamel_amount: number;
    pearls_weight: number;
    pearls_amount: number;
    other_weight: number;
    other_amount: number;
    stock_box: number;
    itemCode: string;
    gross_weight: number;
    total_item_amount: number;
    discount: number;
    oldExItemPrice: number;
    paidAmount: number;
    dueAmount: number;
    receivedAmount: number | null;
    deliveryStatus: string;
    workerPay: number | null;
    transactions: Transaction[];
    oldItems: OldItem[];
    version: number;
    [key: string]:
      | string
      | number
      | number[]
      | null
      | Transaction[]
      | OldItem[];
  }

  interface Bill {
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
    billResAmount: number;
    billDueAmount: number;
    selectedOrderIds: string;
    billingDate: string;
    orderDate: string;
    selectedOrders: Order[]; // keep string since it’s coming in this format
  }

  const [bill, setBill] = useState<Bill | null>(null);

  const dynamicWeightKeys = [
    "stone",
    "wax",
    "diamond",
    "bits",
    "enamel",
    "pearls",
    "other",
  ];

  // Updated getWhatsAppMessage to include all orders
  const getWhatsAppMessage = (bill: Bill, msgTitle: string) => {
    if (!bill.selectedOrders || bill.selectedOrders.length === 0) return "";

    const orderLines = bill.selectedOrders.map((order, idx) => {
      return `🛍️ Product Name ${idx + 1}: ${order.itemName}`;
    });

    return `
👋 Hello ${bill.name},

✨ Thank you, ${msgTitle} 🎁🥳
We appreciate your trust in Hambire Jewellery 💎

🧾 Invoice Bill No: ${bill.billNumber}
📅 Date: ${bill.billingDate}

${orderLines.join("\n\n")}

💰 Total Bill Amount: ₹${bill.billTotalAmount.toFixed(2)}
💰 Exchange Amount: ₹${bill.exchangeAmount.toFixed(2)}
✅ Paid: ₹${bill.billPaidAmount.toFixed(2)}
🎉 Discount: ₹${bill.billDiscountAmount.toFixed(2)}
⚠️ Due: ₹${bill.billDueAmount.toFixed(2)}
🎯 Delivery Status: ${bill.deliveryStatus}

Thank you for your purchase! 💎
We hope to serve you again soon!
-- Hambire Jewellery 💍
  `;
  };


  const normalizeBillMetal = (metal?: string) => {
  const value = String(metal || "")
    .trim()
    .toLowerCase();

  if (
    value.includes("plated") ||
    value.includes("coated")
  ) {
    return "";
  }

  if (value.includes("gold")) {
    return "Gold";
  }

  if (
    value === "999 silver" ||
    value === "kamal silver" ||
    value === "kamal"
  ) {
    return "Kamal Silver";
  }

  if (
    value === "995 silver" ||
    value === "swastik silver" ||
    value === "swastik" ||
    value === "satwik silver" ||
    value === "satwik"
  ) {
    return "Swastik Silver";
  }

  return "";
};


const billMetals = React.useMemo(() => {
  const metals = new Set<string>();

  bill?.selectedOrders?.forEach((order) => {
    if (
      String(order.deliveryStatus || "")
        .toLowerCase() === "canceled"
    ) {
      return;
    }

    const metal =
      normalizeBillMetal(order.metal);

    if (metal) {
      metals.add(metal);
    }
  });

  return metals;
}, [bill?.selectedOrders]);


const loadSchemeCoupons = async () => {
  if (!bill?.phoneNumber) {
    console.error(
      "SCHEME COUPON: Bill phone number missing"
    );

    setSchemeCouponData(null);
    return;
  }

  const phone = String(
    bill.phoneNumber
  ).replace(/\D/g, "");

  console.log(
    "SCHEME COUPON: loading for phone:",
    phone
  );

  try {
    setSchemeCouponsLoading(true);

    const response = await api.get(
      `/scheme/redeemable/by-phone/${encodeURIComponent(
        phone
      )}`
    );

    console.log(
      "SCHEME COUPON API FULL RESPONSE:",
      response
    );

    console.log(
      "SCHEME COUPON API DATA:",
      response.data
    );

   console.log(
  "SCHEME COUPONS:",
  response.data?.schemeCoupons
);

console.log(
  "QUICK BUY WALLETS:",
  response.data?.quickBuyWallets
);

    setSchemeCouponData(
      response.data || null
    );

  } catch (error: any) {

    console.error(
      "SCHEME COUPON API ERROR:",
      error
    );

    console.error(
      "STATUS:",
      error?.response?.status
    );

    console.error(
      "ERROR RESPONSE:",
      error?.response?.data
    );

    setSchemeCouponData(null);

    alert(
      error?.response?.data?.message ||
      error?.response?.data ||
      "Failed to load customer scheme coupons"
    );

  } finally {
    setSchemeCouponsLoading(false);
  }
};



useEffect(() => {
  if (!discountDialogOpen) return;

  loadSchemeCoupons();
}, [
  discountDialogOpen,
  bill?.phoneNumber,
]);

const selectedRedeemableScheme =
  React.useMemo(() => {
    if (!isSchemeCouponSelected) {
      return null;
    }

    const schemeId = Number(
      selectedCoupon.split(":")[1],
    );

    return (
     schemeCouponData?.schemeCoupons?.find(
        (item: any) =>
          Number(item.schemeId) === schemeId,
      ) || null
    );
  }, [
    selectedCoupon,
    schemeCouponData,
  ]);

  const selectedQuickBuyWallet =
  React.useMemo(() => {
    if (!isQuickBuyCouponSelected) {
      return null;
    }

    const metal =
      selectedCoupon.substring(
        "QUICK_BUY:".length,
      );

    return (
      schemeCouponData?.quickBuyWallets?.find(
        (item: any) =>
          String(item.metalName) === metal,
      ) || null
    );
  }, [
    selectedCoupon,
    schemeCouponData,
  ]);

  const previewSchemeCoupon = async () => {
  if (!bill?.billId) return;

  const redeemWeight =
    Number(schemeRedeemWeight || 0);

  if (redeemWeight <= 0) {
    setSchemePreview(null);
    return;
  }

  try {
    setSchemePreviewLoading(true);

    let payload: any;

    if (isSchemeCouponSelected) {
      if (!selectedRedeemableScheme) {
        return;
      }

      payload = {
        couponType: "SCHEME",
        schemeId:
          selectedRedeemableScheme.schemeId,
        metalName:
          selectedRedeemableScheme.metalName,
        redeemWeight,
      };
    } else if (isQuickBuyCouponSelected) {
      if (!selectedQuickBuyWallet) {
        return;
      }

      payload = {
        couponType: "QUICK_BUY",
        schemeId: null,
        metalName:
          selectedQuickBuyWallet.metalName,
        redeemWeight,
      };
    } else {
      return;
    }

    const response = await api.post(
      `/scheme/admin/bill-coupon/${bill.billId}/preview`,
      payload,
    );

    setSchemePreview(response.data);

    setDiscountAmount(
      Number(
        response.data.discountAmount || 0,
      ).toFixed(2),
    );
  } catch (error: any) {
    setSchemePreview(null);
    setDiscountAmount("");

    alert(
      error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        "Scheme coupon preview failed",
    );
  } finally {
    setSchemePreviewLoading(false);
  }
};


useEffect(() => {
  if (
    !isSchemeCouponSelected &&
    !isQuickBuyCouponSelected
  ) {
    return;
  }

  if (
    !schemeRedeemWeight ||
    Number(schemeRedeemWeight) <= 0
  ) {
    setSchemePreview(null);
    setDiscountAmount("");
    return;
  }

  const timeout =
    window.setTimeout(() => {
      previewSchemeCoupon();
    }, 350);

  return () =>
    window.clearTimeout(timeout);
}, [
  schemeRedeemWeight,
  selectedCoupon,
]);



  // Updated copyWhatsAppMessage function
  const copyWhatsAppMessage = () => {
    if (!bill) return;

    const phone = bill.phoneNumber?.replace(/\D/g, "");
    if (!phone) return alert("Customer phone number missing!");

    const msg = getWhatsAppMessage(bill, msgTitle);

    navigator.clipboard.writeText(msg).then(() => {
      const url = `https://web.whatsapp.com/send?phone=91${phone}`;
      window.open(url, "_blank");

      alert(
        "Message copied to clipboard ✅ \nWhatsApp Web opened. You can paste and send manually.",
      );
    });
  };

  const refreshBill = async () => {
    if (!bill?.billNumber) return;

    try {
      const res = await api.get<Bill>(
        `/admin/getDataByBillNumber/${bill.billNumber}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setBill(res.data);
    } catch (error) {
      console.error("Failed to refresh bill:", error);
    }
  };

const handleDiscountSubmit = async () => {
  if (!bill?.billId) return;

  /*
   * ====================================
   * SCHEME / QUICK BUY COUPON
   * ====================================
   */
  if (
    isSchemeCouponSelected ||
    isQuickBuyCouponSelected
  ) {
    const redeemWeight =
      Number(schemeRedeemWeight || 0);

    if (redeemWeight <= 0) {
      alert(
        "Please enter valid redeem weight",
      );
      return;
    }

    try {
      setDiscountLoading(true);

      let payload: any;

      if (isSchemeCouponSelected) {
        if (!selectedRedeemableScheme) {
          alert(
            "Selected scheme not found",
          );
          return;
        }

        payload = {
          couponType: "SCHEME",
          schemeId:
            selectedRedeemableScheme.schemeId,
          metalName:
            selectedRedeemableScheme.metalName,
          redeemWeight,
        };
      } else {
        if (!selectedQuickBuyWallet) {
          alert(
            "Selected Quick Buy wallet not found",
          );
          return;
        }

        payload = {
          couponType: "QUICK_BUY",
          schemeId: null,
          metalName:
            selectedQuickBuyWallet.metalName,
          redeemWeight,
        };
      }

      const response = await api.post(
        `/scheme/admin/bill-coupon/${bill.billId}/apply`,
        payload,
      );

      await refreshBill();

      /*
       * Refresh available schemes/wallets.
       *
       * Fully redeemed coupon disappears.
       * Partial redemption shows new balance.
       */
      await loadSchemeCoupons();

      alert(
        `${response.data.message}\n\n` +
          `Redeemed: ${Number(
            response.data.redeemedWeight || 0,
          ).toFixed(3)} gm\n` +
          `Discount: ₹${Number(
            response.data.discountAmount || 0,
          ).toFixed(2)}\n` +
          `Remaining: ${Number(
            response.data.availableWeightAfter ||
              0,
          ).toFixed(3)} gm`,
      );

      setDiscountDialogOpen(false);
      setDiscountAmount("");
      setSelectedCoupon("");
      setSchemeRedeemWeight("");
      setSchemePreview(null);
    } catch (error: any) {
      console.error(
        "Scheme coupon failed:",
        error,
      );

      alert(
        error?.response?.data?.message ||
          error?.response?.data ||
          error?.message ||
          "Scheme coupon failed",
      );
    } finally {
      setDiscountLoading(false);
    }

    return;
  }

  /*
   * ====================================
   * EXISTING MANUAL / ASHADAM
   * ====================================
   */

  if (
    !discountAmount ||
    Number(discountAmount) <= 0
  ) {
    alert(
      "Please enter valid discount amount",
    );
    return;
  }

  try {
    setDiscountLoading(true);

    await api.post(
      `/admin/applyBillDiscount/${bill.billId}`,
      null,
      {
        params: {
          discountAmount:
            Number(discountAmount),
        },
      },
    );

    await refreshBill();

    setDiscountDialogOpen(false);
    setDiscountAmount("");
    setSelectedCoupon("");
    setSchemeRedeemWeight("");
    setSchemePreview(null);
  } catch (error: any) {
    console.error(
      "Discount update failed:",
      error,
    );

    alert(
      error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        "Discount update failed",
    );
  } finally {
    setDiscountLoading(false);
  }
};

  const handlePaySubmit = async () => {
    if (!bill?.billId) return;

    if (!payAmount || Number(payAmount) <= 0) {
      alert("Please enter valid amount");
      return;
    }

    try {
      setPayLoading(true);

      await api.post(`/admin/payCustomer/${bill.billId}/${payMethod}`, null, {
        params: { amount: Number(payAmount) },
        headers: { Authorization: `Bearer ${token}` },
      });

      await refreshBill();

      setPayDialogOpen(false);
      setPayAmount("");
      setPayMethod("Phone Pay");
    } catch (error: any) {
      console.error("Payment failed:", error);
      alert(error?.response?.data || "Payment failed");
    } finally {
      setPayLoading(false);
    }
  };

  useEffect(() => {
    if (selectedOrders.length === 0) return;

    const fetchBillSummary = async () => {
      const checkEdit = localStorage.getItem("checkEditBill");

      try {
        console.log("checkEditBill : ", checkEdit);
        if (checkEdit === "YesEdit" && billNumber) {
          console.log("Updating existing bill with billNumber:", billNumber);

          const res = await api.put<Bill>(
            `/admin/bill-updateData/${billNumber}`,
            { orderId: selectedOrders },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            },
          );

          setBill(res.data);
          SetMsgTitle(`Your order updated Successfully`);
        } else {
          console.log("Creating new bill...");

          const response = await api.post<Bill>(
            "/admin/bill-summary",
            { orderId: selectedOrders },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            },
          );

          setBill(response.data);
          SetMsgTitle(`Your order placed Successfully`);
        }
      } catch (error) {
        console.error("Error fetching bill summary/update:", error);
      }
    };

    fetchBillSummary();
  }, [selectedOrders, token]);

  function getNumericField(item: Order, field: keyof Order): number | null {
    return (item[field] as number | null) ?? null;
  }

  const handleEditBillOrders = () => {
    if (!bill) return;

    localStorage.setItem("checkEditBill", "YesEdit");
    localStorage.setItem("billNumber", bill.billNumber);
    localStorage.setItem("editBillFromBillDetails", "editBill");

    sessionStorage.setItem(
      "ordersState",
      JSON.stringify({
        ordersList: bill.selectedOrders || [],
        exchangeList:
          bill.selectedOrders?.flatMap((order) => order.oldItems || []) || [],
        customerId: bill.customerId,
        billNumber: bill.billNumber,
      }),
    );

    navigate("/admin/orders", {
      state: {
        showOrdersList: true,
        fromBillEdit: true,
        fromBillDetails: true,
        customerId: bill.customerId,
        billNumber: bill.billNumber,
        selectedOrders: bill.selectedOrders?.map((o) => o.orderId) || [],
      },
    });
  };

  const shortLabels: Record<string, { weight: string; amount: string }> = {
    stone: { weight: "S.W", amount: "S.A" },
    wax: { weight: "W.W", amount: "W.A" },
    diamond: { weight: "D.W", amount: "D.A" },
    bits: { weight: "B.W", amount: "B.A" },
    enamel: { weight: "E.W", amount: "E.A" },
    pearls: { weight: "P.W", amount: "P.A" },
    other: { weight: "O.W", amount: "O.A" },
  };

  const isValidItemCode = (code?: string) =>
    code && code.trim() !== "" && code.trim() !== "0";

  const showOtherWeightColumn =
    bill?.selectedOrders?.some((item) => Number(item.other_weight || 0) > 0) ||
    false;

  const activeWeightKeys = React.useMemo(() => {
    if (!bill || !bill.selectedOrders) return [];

    // Custom logic for each key
    return dynamicWeightKeys.filter((key) => {
      // if this is "other", we handle it specially
      if (key === "other") {
        // show column only if either weight > 0 or amount > 0
        return bill.selectedOrders.some(
          (item) =>
            (item[`${key}_weight`] as number) > 0 ||
            (item[`${key}_amount`] as number) > 0,
        );
      }
      // normal logic for others
      return bill.selectedOrders.some(
        (item) =>
          (item[`${key}_weight`] as number) > 0 ||
          (item[`${key}_amount`] as number) > 0,
      );
    });
  }, [bill]);

  // 🔹 Open WhatsApp with message

  const dynamicColumnCount = activeWeightKeys.reduce((count, key) => {
    if (key === "other") {
      return count + (showOtherWeightColumn ? 2 : 1);
    }
    return count + 2;
  }, 0);

  const nonZeroColCount = dynamicColumnCount;

  const parseDDMMYYYY = (dateValue?: string): Date | null => {
  if (!dateValue) return null;

  const parts = dateValue.trim().split("/");

  if (parts.length !== 3) return null;

  const day = Number(parts[0]);
  const month = Number(parts[1]);
  const year = Number(parts[2]);

  if (
    !Number.isInteger(day) ||
    !Number.isInteger(month) ||
    !Number.isInteger(year)
  ) {
    return null;
  }

  const parsedDate = new Date(year, month - 1, day);

  // Protect against invalid dates such as 32/07/2026
  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  parsedDate.setHours(0, 0, 0, 0);

  return parsedDate;
};

const isOfferEligible = React.useMemo(() => {
  const orderDate = parseDDMMYYYY(bill?.orderDate);

  if (!orderDate) return false;

  // JavaScript month numbers start from 0:
  // July = 6, August = 7
  const offerStartDate = new Date(2026, 6, 14);
  const offerEndDate = new Date(2026, 7, 15);

  offerStartDate.setHours(0, 0, 0, 0);
  offerEndDate.setHours(23, 59, 59, 999);

  return (
    orderDate.getTime() >= offerStartDate.getTime() &&
    orderDate.getTime() <= offerEndDate.getTime()
  );
}, [bill?.orderDate]);

const totalMakingCharges = React.useMemo(() => {
  if (!bill?.selectedOrders) return 0;

  return bill.selectedOrders.reduce((total, order) => {
    const isCanceled =
      order.deliveryStatus?.toLowerCase() === "canceled";

    if (isCanceled) {
      return total;
    }

    return total + Number(order.making_charges || 0);
  }, 0);
}, [bill?.selectedOrders]);

const offerCouponDiscount = React.useMemo(() => {
  return Math.round(totalMakingCharges * 0.2 * 100) / 100;
}, [totalMakingCharges]);

  if (!bill) return <p className="p-6">Loading Bill Summary...</p>;

  return (
    <div className="bg-white px-2 py-4 pb-24 text-black md:p-6">
      {/* PRINT CSS */}
      <style>
        {`
  @media print {
  body {
   -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    margin: 0;
    zoom: 0.75; /* Shrink content to fit horizontally */
            visibility: hidden;

  }


  .invoice-table {
    width: 100% !important;
    transform: scale(1) !important;
    table-layout: fixed;
    font-size: 10px; /* Slightly smaller text for fitting */
  }

  .invoice-header {
    margin: 0 !important;
  }

  .invoice-container {
    display: flex !important;
    justify-content: space-between !important;
    align-items: flex-start !important;
    flex-direction: row !important;
    width: 100% !important;
  }
      .invoice-container > div {
    width: 48% !important;
  }


  /* Avoid clipping large tables */
  .invoice-table-wrapper {
    width: 100%;
    overflow: visible !important;
  }

  /* Make print layout use full page height */
  body, html {
    width: 100%;
    height: 100%;
    -webkit-print-color-adjust: exact !important;
  }


             @page {
    size: A4 portrait;   /* Or A5 portrait */
    margin: 10mm;        /* Adjust as needed */
  }

  .no-print-scroll {
    overflow: visible !important;
  }

  #print-section, #print-section * {
        visibility: visible;
      }
          #print-section {
    zoom: 1 !important;
    transform: none !important;
  }
      #print-section {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        margin: 0;
        padding: 10;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }

 

  table {
  min-width: 100% !important;
  font-size: 13px !important; /* Bigger and clearer */
}



  th, td {
  padding: 6px 4px !important; /* more breathing space */
}
}



  `}
      </style>

      <style>
        {`
@media print {
  body.print-tablet #print-section {
    width: 148mm !important;
    height: 210mm !important;
    padding: 5mm !important;
    margin: 0 auto !important;

    transform: scale(1.35);
    transform-origin: top left;
  }

  body.print-tablet {
    zoom: 1 !important;
  }

  body.print-tablet @page {
    size: A5 portrait;
    margin: 0;
  }
}
`}
      </style>

      <style>
        {`
     .invoice-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  table-layout: fixed;
}

.invoice-table th,
.invoice-table td {
  padding: 4px 6px;
  word-wrap: break-word;
  white-space: normal;
  text-align: center;
  vertical-align: middle;
}
.invoice-table th:nth-child(1),
.invoice-table td:nth-child(1) {
  width: 15%; 
}

.invoice-table th:nth-child(2),
.invoice-table td:nth-child(2) {
  width: 10%; 
}
.invoice-table th:nth-child(3),
.invoice-table td:nth-child(3) {
  width: 7%; 
}
.invoice-table th:nth-child(4),
.invoice-table td:nth-child(4) {
  width: 7%; 
}
  .invoice-table th:nth-child(5),
.invoice-table td:nth-child(5) {
  width: 7%; 
}
   
     .invoice-table th:nth-child(6),
.invoice-table td:nth-child(6) {
  width: 7%;
}   .invoice-table th:nth-child(7),
.invoice-table td:nth-child(7) {
  width: 8%; 
}

  .invoice-table th:nth-last-child(3),
.invoice-table td:nth-last-child(3) {
  width: 8%;
}
    .invoice-table th:nth-last-child(4),
.invoice-table td:nth-last-child(4) {
  width: 8%;
}
  .invoice-table th:nth-last-child(2),
.invoice-table td:nth-last-child(2) {
  width: 8%;
}
.invoice-table th:last-child,
.invoice-table td:last-child {
  width: 8%; 
}

      /* Auto-shrink on smaller screens */
      @media (max-width: 1400px) {
        .invoice-table {
          transform: scale(0.9);
        }
      }
      @media (max-width: 1200px) {
        .invoice-table {
          transform: scale(0.8);
        }
      }
      @media (max-width: 1000px) {
        .invoice-table {
          transform: scale(0.7);
        }
      }
     @media screen and (max-width: 767px) {
  .invoice-table {
    transform: none !important;
    table-layout: fixed;
  }

  #print-section {
    box-shadow: none;
  }
}
    `}
      </style>

      {/* Printable Content */}
      <div
        id="print-section"
        ref={printRef}
className="mx-auto mt-4 max-w-[800px] rounded-md bg-white p-3 shadow-2xl md:mt-15 md:p-6 print:mt-0 print:rounded-none print:bg-white print:p-4 print:shadow-none"
      >
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 pb-4 mb-4 mt-20">
          <div>
            <h1 className="text-2xl font-bold text-[#813801]">
              HAMBIRE JEWELLERY
            </h1>
            <strong className="text-[#374151]">Since 1977</strong>
            <p className=" text-[#1a1d23]">
              Ramayampet, Subhash Road, Medak, Telangana, 502101
            </p>
            <p className=" text-[#1a1d23]">
              Phone: 9703738824 | www.hambirejewellery.com
            </p>
            <p className=" text-[#1a1d23]">
              Date: {new Date().toLocaleDateString("en-GB")}
            </p>
          </div>
          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-md border border-gray-200 mr-10">
            <img
              src={hjlogoo}
              alt="HJ Logo"
              className="w-20 h-20 object-contain"
            />
          </div>
        </div>

        {/* Customer Info */}
        <div className="invoice-container flex justify-between items-start border-b-2 pb-4 mb-4">
          <div className="mb-4 invoice-header">
            <p>
              <strong className="text-[#B45309] ">Name : </strong>
              <span className="text-[#111827] font-semibold ">{bill.name}</span>
            </p>
            <p>
              <strong className="text-[#B45309]">Village : </strong>
              <span className="text-[#000000]  font-semibold ">
                {bill.village}
              </span>
            </p>
            <p>
              <strong className="text-[#B45309]">Phone : </strong>
              <span className="text-[#000000] font-semibold ">
                {bill.phoneNumber}
              </span>
            </p>
            {/* <p>
              <strong className="text-[#B45309]">Email : </strong>
              <span className="text-[#000000] font-semibold  ">
                {bill.emailId}
              </span>
            </p> */}
          </div>
          <div className="text-right text-[#000000]">
            <p>
              <strong className="text-[#B45309]">Bill No : </strong>
              <span className="text-[#034c33] font-bold">
                {" "}
                {bill.billNumber}
              </span>
            </p>
            <p>
              <strong className="text-[#B45309]">Order DATE : </strong>{" "}
              <span className="font-bold text-[#000000]">{bill.orderDate}</span>
            </p>

            {Array.isArray(bill.selectedOrders) &&
              bill.selectedOrders.some((order) =>
                isValidItemCode(order.itemCode),
              ) && (
                <div className="mt-1">
                  {bill.selectedOrders
                    .filter((order) => isValidItemCode(order.itemCode))
                    .map((order: Order, index: number) => (
                      <p
                        key={index}
                        className="text-[#361d1d] font-bold text-[14px]"
                      >
                        {bill.selectedOrders.length > 1
                          ? `Item ${index + 1} code : ${order.itemCode}`
                          : `Item code : ${order.itemCode}`}
                      </p>
                    ))}
                </div>
              )}
          </div>
        </div>

        {/* Table */}
       <div className="w-full overflow-x-auto md:flex md:justify-center invoice-table-wrapper">
<table className="invoice-table min-w-[900px] border border-collapse text-sm mb-6">
              <thead>
              <tr className="bg-[#B45309] text-[#ffffff]">
                <th className="border px-2 py-1 text-white font-bold  text-center align-middle text-xs">
                  Name
                </th>
                <th className="border px-2 py-1 text-white font-bold  text-center align-middle text-xs">
                  Metal
                </th>
                <th className="border px-2 py-1 text-white font-bold  text-center align-middle text-xs">
                  RT
                </th>
                <th className="border px-2 py-1 text-white font-bold  text-center align-middle text-xs">
                  G.Wt
                </th>
                <th className="border px-2 py-1 text-white font-bold  text-center align-middle text-xs">
                  N.Wt
                </th>
                {activeWeightKeys.map((key) => (
                  <React.Fragment key={key}>
                    {/* Weight Header */}
                    {!(key === "other") && (
                      <th className="border px-2 py-1 capitalize">
                        {shortLabels[key]?.weight ||
                          `${key[0].toUpperCase()}.Wt`}
                      </th>
                    )}

                    {key === "other" &&
                      bill.selectedOrders.some(
                        (item) => item.other_weight && item.other_weight > 0,
                      ) && (
                        <th className="border px-2 py-1 capitalize">
                          {shortLabels[key]?.weight || "O.Wt"}
                        </th>
                      )}

                    {/* Amount Header */}
                    <th className="border px-2 py-1 capitalize">
                      {shortLabels[key]?.amount ||
                        `${key[0].toUpperCase()}.Amt`}
                    </th>
                  </React.Fragment>
                ))}

                <th className="border px-2 py-1 text-white font-bold  text-center align-middle text-xs">
                  WST
                </th>
                <th className="border px-2 py-1 text-white font-bold  text-center align-middle text-xs">
                  MC
                </th>

                <th className="border px-2 py-1 text-white font-bold  text-center align-middle text-xs">
                  Total
                </th>
                <th className="border px-2 py-1 text-white font-bold  text-center align-middle text-xs">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {bill.selectedOrders.map((item: Order, index: number) => (
                <tr
                  key={index}
                  className="border "
                  style={{
                    backgroundColor: "#d3c0cc",

                    color: "#fff",
                  }}
                >
                  {" "}
                  <td className="border px-2 py-1 text-[#361d1d] font-bold  text-center align-middle text-[14px]">
                    {item.itemName}
                  </td>
                  <td className="border px-2 py-1 text-[#af0058] font-bold  text-center align-middle text-[13px]">
                    {item.metal === "22 Gold"
                      ? "22k-916"
                      : item.metal === "24 Gold"
                        ? "Gold"
                        : item.metal === "Gold Plated"
                        ? "Gold Coated"
                        : item.metal === "Gold Plated"
                        ? "Gold Coated"
                        : item.metal === "Silver Plated"
                          ? "Silver Coated"
                          : item.metal === "999 Silver"
                            ? "Kamal 999"
                            : item.metal}
                  </td>
                  <td className="border px-2 py-1 text-[#004848] font-bold text-center align-middle text-[13px]">
                    {item.metalPrice || "-"}
                  </td>
                  <td className="border px-2 py-1 text-[#070065] font-bold text-center align-middle text-[13px]">
                    {item.gross_weight ?? "-"}
                  </td>
                  <td className="border px-2 py-1 text-[#00457d] font-bold text-center align-middle text-[13px]">
                    {item.metal_weight ?? "-"}
                  </td>
                  {activeWeightKeys.map((key) => {
                    const showWeightColumn =
                      key !== "other" ||
                      bill.selectedOrders.some(
                        (order) => Number(order.other_weight || 0) > 0,
                      );

                    const weightValue = Number(item[`${key}_weight`] || 0);
                    const amountValue = Number(item[`${key}_amount`] || 0);

                    return (
                      <React.Fragment key={key}>
                        {showWeightColumn && (
                          <td className="border px-2 py-1 text-[#1f1f1f] font-bold text-center align-middle">
                            {weightValue > 0 ? weightValue : "-"}
                          </td>
                        )}

                        <td className="border px-2 py-1 text-[#1f1f1f] font-bold text-center align-middle">
                          {amountValue > 0 ? amountValue : "-"}
                        </td>
                      </React.Fragment>
                    );
                  })}
                  <td className="border px-2 py-1 text-[#51016c] font-bold text-center align-middle text-[13px]">
                     {Number(item.wastage || 0)}%
                  </td>
                  <td className="border px-2 py-1 text-[#965205] font-bold text-center align-middle text-[13px]">
                    {item.making_charges}
                  </td>
                  <td className="border px-2 py-1 text-[#00479f] font-bold text-center align-middle text-[13px]">
                    ₹{item.total_item_amount}
                  </td>
                  <td className="border px-2 py-1 text-[#00479f] font-bold text-center align-middle text-[13px]">
                    {item.deliveryStatus}
                  </td>
                </tr>
              ))}

              {bill.selectedOrders.flatMap(
                (item: Order) =>
                  item.oldItems?.map((ex: OldItem, index: number) => (
                    <tr
                      key={`ex-${index}`}
                      className="border"
                      style={{
                        backgroundColor: "#e7d8e2",
                      }}
                    >
                      <td className="border px-2 py-1 text-[#361d1d] font-bold text-center align-middle text-[14px]">
                        {ex.exchange_metal_name}
                      </td>

                      <td className="border px-2 py-1 text-[#af0058]  font-bold text-center align-middle text-[11px]">
                        {ex.exchange_metal === "22 Gold"
                          ? "22k"
                          : ex.exchange_metal === "24 Gold"
                            ? "24k"
                            : ex.exchange_metal === "995 Silver"
                              ? "999 S"
                              : ex.exchange_metal === "999 Silver"
                                ? "999 K"
                                : ex.exchange_metal}
                      </td>

                      <td className="border px-2 py-1 text-[#004848] font-bold text-center align-middle text-[13px]">
                        {ex.exchange_metal_price}
                      </td>

                      <td className="border px-2 py-1 text-[#070065] font-bold text-center align-middle text-[13px]">
                        {ex.exchange_metal_weight}
                      </td>

                      <td className="border px-2 py-1  text-[#00457d] font-bold text-center align-middle text-[13px]">
                        {ex.exchange_purity_weight}
                      </td>

                      {/* ✅ Dynamic dash cells based on parent order */}
                      {Array.from({ length: nonZeroColCount }).map((_, i) => (
                        <td
                          key={`dash-${index}-${i}`}
                          className="border px-2 py-1 text-center align-middle"
                        >
                          -
                        </td>
                      ))}
                      <td className="border px-2 py-1 text-center align-middle">
                        -
                      </td>
                      <td className="border px-2 py-1 text-center align-middle">
                        -
                      </td>
                      <td className="border px-2 py-1  text-[#00479f] font-bold text-center align-middle text-[13px]">
                        ₹{ex.exchange_item_amount}
                      </td>
                      <td className="border px-2 py-1 text-[#00479f] font-bold text-center align-middle text-[13px]">
                        {"Exchange"}
                      </td>
                    </tr>
                  )) || [],
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-between  items-start mt-10">

<div className="w-[420px] flex justify-center mt-3">
  {isOfferEligible && (
    <img
      src={ashadamOffer}
      alt="Ashadam Offer"
      className="w-[190px] h-auto object-contain"
    />
  )}
</div>

          <div className=" p-4 rounded-3xl border border-orange-900 mr-10">
            <table className="text-sm w-64 table-fixed">
              <tbody>
                <tr>
                  <td className="px-3 py-2 text-black  font-bold text-[15px]">
                    Bill Total :
                  </td>
                  <td className="text-right font-bold px-3 py-2 text-[#5e2a03] text-[15px] ">
                    ₹{bill.billTotalAmount}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-black  font-bold text-[15px]">
                    Exchange Amount :
                  </td>
                  <td className="text-right px-3 py-2 font-bold  text-[#022754] text-[15px]">
                    ₹{bill.exchangeAmount}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-black  font-bold text-[15px]">
                    Discount :
                  </td>
                  <td className="text-right px-3 py-2 font-bold  text-[#93094e] text-[15px]">
                    ₹{bill.billDiscountAmount}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-black  font-bold text-[15px]">
                    Total Paid :
                  </td>
                  <td className="text-right px-3 py-2 font-bold  text-[#0b4e06] text-[15px]">
                    ₹{bill.billPaidAmount}
                  </td>
                </tr>
                {/* ✅ Conditionally render Received row */}
                {bill.billResAmount > 0 && (
                  <tr>
                    <td className="px-3 py-2 text-black  font-bold text-[15px]">
                      Received :
                    </td>
                    <td className="text-right px-3 py-2 font-bold text-[#5f034e] text-[15px]">
                      ₹{bill.billResAmount}
                    </td>
                  </tr>
                )}
                <tr className="border-t border-[#D97706] mt-5">
                  <td className="px-3 py-2 text-black  font-bold mt-5 text-[15px]">
                    Total Due:
                  </td>
                  <td className="text-right font-bold text-[#ff0000] px-3 py-2 text-[15px]">
                    ₹{bill.billDueAmount}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-xs text-gray-900 text-[16px] ml-10">
          <div className="p-5 text-center inline-block border-b border-gray-500 pb-1 ">
            <h6 className="text-base">
              మా వద్ద చేయించిన{" "}
              <span className="font-bold text-[#045a1b]">91.6 హాల్‌మార్క్</span>{" "}
              గోల్డ్ ఆభరణాలు తిరిగి{" "}
              <span className="font-bold text-[#045a1b]"> 90% </span> సోక్కం
              ఇవ్వబడును.
            </h6>
            <h6 className="text-base">
              మా వద్ద చెయించిన్న{" "}
              <span className="font-bold text-[#045a1b]">☆</span> మరియు{" "}
              <span className="font-bold text-[#045a1b]">HJ</span> పట్టీలు{" "}
              తిరిగి <span className="font-bold text-[#045a1b]">80%</span>{" "}
              సోక్కం ఇవ్వబడును.
            </h6>
          </div>
          <h5 className="text-base mt-4 ml-14">
            Thank you for your order! We appreciate your trust.
          </h5>
        </div>
      </div>

      <div className="max-w-[800px] mx-auto mt-6 print:hidden">
        <div className="rounded-2xl border border-orange-300 bg-orange-50 p-5 shadow-sm">
          <h3 className="text-lg font-bold text-[#7c2d12] mb-4">
            Payment Summary
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="bg-white rounded-xl p-3 border">
              <div className="text-gray-600">Total Amount</div>
              <div className="font-bold text-base">₹{bill.billTotalAmount}</div>
            </div>

            <div className="bg-white rounded-xl p-3 border">
              <div className="text-gray-600">Exchange Amount</div>
              <div className="font-bold text-base">₹{bill.exchangeAmount}</div>
            </div>

            <div className="bg-white rounded-xl p-3 border">
              <div className="text-gray-600">Total Paid</div>
              <div className="font-bold text-base text-green-700">
                ₹{bill.billPaidAmount}
              </div>
            </div>

            <div className="bg-white rounded-xl p-3 border">
              <div className="text-gray-600">Total Received</div>
              <div className="font-bold text-base text-purple-700">
                ₹{bill.billResAmount}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4 print:hidden">
              <button
               onClick={() => {
  setSelectedCoupon("");
  setDiscountAmount("");
  setDiscountDialogOpen(true);
}}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
              >
                Add Discount
              </button>

              <button
                onClick={handleEditBillOrders}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Edit
              </button>
            </div>

            <div className="bg-white rounded-xl p-3 border sm:col-span-2">
              <div className="text-gray-600">Total Due</div>
              <div className="font-bold text-base text-red-600">
                ₹{bill.billDueAmount}
              </div>
            </div>
          </div>

          {bill.billDueAmount !== 0 && (
            <div className="mt-4 text-right">
              <button
                onClick={() => setPayDialogOpen(true)}
                className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700"
              >
                Pay
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Print Button (Hidden during print) */}
      <div className="text-center mt-6 print:hidden">
        {/* Laptop Print (OLD WORKING) */}
        <button
          onClick={() => {
            document.body.classList.remove("print-tablet");
            window.print();
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-2"
        >
          🖥️ Print Laptop
        </button>

        {/* Tablet Print */}
        <button
          onClick={() => {
            document.body.classList.add("print-tablet");
            setTimeout(() => window.print(), 100);
          }}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mt-2 ml-2"
        >
          📱 Print Tablet
        </button>
      </div>
      <div className="text-center mt-4 print:hidden">
        <button
          onClick={openWhatsAppModal} // Now defined
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          📲 Send WhatsApp Message
        </button>
      </div>

      {/* WhatsApp Modal */}
      {showWhatsAppModal && bill && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4">WhatsApp Message Preview</h2>
            <pre className="whitespace-pre-wrap mb-4">
              {getWhatsAppMessage(bill, msgTitle)}
            </pre>
            <div className="flex justify-end gap-2">
              <button
                className="bg-blue-500 text-white px-3 py-1 rounded"
                onClick={copyWhatsAppMessage}
              >
                Copy to Clipboard
              </button>
              <button
                className="bg-gray-300 px-3 py-1 rounded"
                onClick={() => setShowWhatsAppModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {payDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 print:hidden">
          <div className="bg-white rounded-xl shadow-xl w-[90%] max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">Make Payment</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Payment Type
              </label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="Phone Pay">Phone Pay</option>
                <option value="Cash">Cash</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Amount</label>
              <input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Enter amount"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPayDialogOpen(false)}
                className="bg-gray-300 px-4 py-2 rounded-lg"
                disabled={payLoading}
              >
                Cancel
              </button>
              <button
                onClick={handlePaySubmit}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                disabled={payLoading}
              >
                {payLoading ? "Saving..." : "Pay"}
              </button>
            </div>
          </div>
        </div>
      )}
      {discountDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 print:hidden">
          <div className="bg-white rounded-xl shadow-xl w-[90%] max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">Add Extra Discount</h2>
<div className="mb-4">
  <label className="block text-sm font-medium mb-1">
    Coupon / Offer
  </label>

  <select
    value={selectedCoupon}
    onChange={(e) => {
  const selectedValue =
    e.target.value;

  setSelectedCoupon(
    selectedValue,
  );

  setSchemeRedeemWeight("");
  setSchemePreview(null);

  if (
    selectedValue ===
    "ASHADAM_20_MC"
  ) {
    setDiscountAmount(
      offerCouponDiscount.toFixed(2),
    );
  } else {
    setDiscountAmount("");
  }
}}
    className="w-full border rounded-lg px-3 py-2 bg-white"
  >
    <option value="">No Coupon / Manual Discount</option>

    {isOfferEligible && (
      <option value="ASHADAM_20_MC">
        Ashadam Sales – 20% Off Making Charges
      </option>
    )}

    {schemeCouponData?.schemeCoupons?.some(
  (item: any) =>
    Number(item.remainingMetalWeight || 0) > 0 &&
    billMetals.has(
  normalizeBillMetal(item.metalName),
),
) && (
  <optgroup label="Customer Schemes">
    {schemeCouponData.schemeCoupons
      .filter(
        (item: any) =>
          Number(
            item.remainingMetalWeight || 0,
          ) > 0 &&
         billMetals.has(
  normalizeBillMetal(item.metalName),
),
      )
      .map((item: any) => (
        <option
          key={`SCHEME-${item.schemeId}`}
          value={`SCHEME:${item.schemeId}`}
        >
          {item.schemeType === "FLEXI_11"
            ? "Flexi 12"
            : "Pre-Booking"}{" "}
          #{item.schemeId} —{" "}
          {item.metalName} —{" "}
          {Number(
            item.remainingMetalWeight || 0,
          ).toFixed(3)}
          g — {item.benefitText}
        </option>
      ))}
  </optgroup>
)}

{schemeCouponData?.quickBuyWallets?.some(
  (item: any) =>
    Number(item.remainingWeight || 0) > 0 &&
   billMetals.has(
  normalizeBillMetal(item.metalName),
),
) && (
  <optgroup label="Quick Buy Wallets">
    {schemeCouponData.quickBuyWallets
      .filter(
        (item: any) =>
          Number(
            item.remainingWeight || 0,
          ) > 0 &&
         billMetals.has(
  normalizeBillMetal(item.metalName),
),
      )
      .map((item: any) => (
        <option
          key={`QUICK-${item.metalName}`}
          value={`QUICK_BUY:${item.metalName}`}
        >
          Quick Buy {item.metalName} —{" "}
          {Number(
            item.remainingWeight || 0,
          ).toFixed(3)}
          g Available
        </option>
      ))}
  </optgroup>
)}
  </select>

{schemeCouponsLoading && (
  <p className="mt-2 text-xs text-gray-500">
    Loading customer schemes...
  </p>
)}

{!schemeCouponsLoading && schemeCouponData && (
  <div className="mt-2 rounded-lg bg-gray-100 p-2 text-xs text-gray-700">
    <div>
     Scheme coupons received:{" "}
<b>
  {Array.isArray(
    schemeCouponData?.schemeCoupons
  )
    ? schemeCouponData.schemeCoupons.length
    : 0}
</b>
    </div>

    <div>
      Quick Buy wallets received:{" "}
<b>
  {Array.isArray(
    schemeCouponData?.quickBuyWallets
  )
    ? schemeCouponData.quickBuyWallets.length
    : 0}
</b>
    </div>

    <div>
      Bill metals:{" "}
      <b>
        {Array.from(billMetals).join(", ") || "None"}
      </b>
    </div>
  </div>
)}


  {schemeCouponsLoading && (
  <p className="mt-2 text-xs text-gray-500">
    Loading customer schemes...
  </p>
)}
{selectedRedeemableScheme && (
  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
    <div className="flex justify-between">
      <span>Scheme</span>

      <strong>
        {selectedRedeemableScheme.schemeType ===
        "FLEXI_11"
          ? "Flexi 12"
          : "Pre-Booking"}{" "}
        #{selectedRedeemableScheme.schemeId}
      </strong>
    </div>

    <div className="mt-2 flex justify-between">
      <span>Metal</span>

      <strong>
        {selectedRedeemableScheme.metalName}
      </strong>
    </div>

    <div className="mt-2 flex justify-between">
      <span>Available Weight</span>

      <strong className="text-amber-700">
        {Number(
          selectedRedeemableScheme
            .remainingMetalWeight || 0,
        ).toFixed(3)}{" "}
        gm
      </strong>
    </div>

    <div className="mt-2 flex justify-between">
      <span>Benefit</span>

      <strong className="text-green-700">
        {selectedRedeemableScheme
          .benefitText || "-"}
      </strong>
    </div>
  </div>
)}

{selectedQuickBuyWallet && (
  <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm">
    <div className="flex justify-between">
      <span>Wallet</span>

      <strong>
        Quick Buy{" "}
        {selectedQuickBuyWallet.metalName}
      </strong>
    </div>

    <div className="mt-2 flex justify-between">
      <span>Purchased</span>

      <strong>
        {Number(
          selectedQuickBuyWallet.totalWeight ||
            0,
        ).toFixed(3)}{" "}
        gm
      </strong>
    </div>

    <div className="mt-2 flex justify-between">
      <span>Used</span>

      <strong>
        {Number(
          selectedQuickBuyWallet
            .redeemedWeight || 0,
        ).toFixed(3)}{" "}
        gm
      </strong>
    </div>

    <div className="mt-2 flex justify-between">
      <span>Available</span>

      <strong className="text-blue-700">
        {Number(
          selectedQuickBuyWallet
            .remainingWeight || 0,
        ).toFixed(3)}{" "}
        gm
      </strong>
    </div>

    <p className="mt-3 text-xs text-gray-500">
      Quick Buy redeems metal value only.
      No wastage benefit is applied.
    </p>
  </div>
)}

</div>

{selectedCoupon === "ASHADAM_20_MC" && (
  <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm">
    <div className="flex justify-between">
      <span>Total Making Charges:</span>

      <strong>
        ₹{totalMakingCharges.toFixed(2)}
      </strong>
    </div>

    <div className="mt-1 flex justify-between text-green-700">
      <span>Ashadam Discount (20%):</span>

      <strong>
        ₹{offerCouponDiscount.toFixed(2)}
      </strong>
    </div>
  </div>
)}
{(
  isSchemeCouponSelected ||
  isQuickBuyCouponSelected
) && (
  <div className="mb-4 mt-4">
    <label className="mb-1 block text-sm font-medium">
      Redeem Metal Weight
    </label>

    <div className="relative">
      <input
        type="number"
        min="0"
        step="0.001"
        value={schemeRedeemWeight}
        onChange={(e) =>
          setSchemeRedeemWeight(
            e.target.value,
          )
        }
        className="w-full rounded-lg border px-3 py-2 pr-12"
        placeholder="Example: 3.000"
      />

      <span className="absolute right-3 top-2.5 text-sm font-semibold text-gray-500">
        gm
      </span>
    </div>
  </div>
)}

{schemePreviewLoading && (
  <div className="mb-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-500">
    Calculating scheme discount...
  </div>
)}

{schemePreview && (
  <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm">
    <div className="flex justify-between">
      <span>Redeem Weight</span>

      <strong>
        {Number(
          schemePreview.redeemedWeight || 0,
        ).toFixed(3)}{" "}
        gm
      </strong>
    </div>

    <div className="mt-2 flex justify-between">
      <span>Bill Metal Available</span>

      <strong>
        {Number(
          schemePreview
            .billMetalWeightAvailable || 0,
        ).toFixed(3)}{" "}
        gm
      </strong>
    </div>

    <div className="mt-2 flex justify-between">
      <span>Benefit</span>

      <strong>
        {schemePreview.benefitText}
      </strong>
    </div>

    <div className="mt-2 flex justify-between">
      <span>Scheme Balance After</span>

      <strong>
        {Number(
          schemePreview
            .availableWeightAfter || 0,
        ).toFixed(3)}{" "}
        gm
      </strong>
    </div>

    <div className="mt-3 border-t border-green-200 pt-3">
      <div className="flex justify-between text-green-800">
        <span className="font-bold">
          Scheme Discount
        </span>

        <strong className="text-lg">
          ₹
          {Number(
            schemePreview.discountAmount ||
              0,
          ).toFixed(2)}
        </strong>
      </div>
    </div>
  </div>
)}

           <div className="mb-4">
  <label className="block text-sm font-medium mb-1">
    Discount Amount
  </label>

  <input
    type="number"
    min="0"
    step="0.01"
    value={discountAmount}

    onChange={(e) => setDiscountAmount(e.target.value)}
     readOnly={
    isSchemeCouponSelected ||
    isQuickBuyCouponSelected
  }
    className="w-full border rounded-lg px-3 py-2"
    placeholder="Enter discount amount"
  />

  {selectedCoupon === "ASHADAM_20_MC" && (
    <p className="mt-1 text-xs text-gray-500">
      The 20% coupon amount was calculated automatically.
      You can adjust or round it before applying.
    </p>
  )}
</div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDiscountDialogOpen(false)}
                className="bg-gray-300 px-4 py-2 rounded-lg"
                disabled={discountLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDiscountSubmit}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
                disabled={discountLoading}
              >
                {discountLoading ? "Saving..." : "Apply Discount"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateBill;
