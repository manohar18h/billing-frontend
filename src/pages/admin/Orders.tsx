// Updated order.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  TextField,
  Box,
  Grid,
  Button,
  InputAdornment,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { Order } from "@/models/Order";
import api from "@/services/api";

interface WorkerPay {
  workPay: number;
  date: string;
  wpid: number;
  workerId: number;
  fullName: string;
  orderId: number;
  metal: string;
  metal_weight: number;
}

interface Transaction {
  transactionId: number;
  paymentMethod: string | null;
  paymentType: string | null;
  paidAmount: number;
  paymentDate: string;
  orderId: number;
}

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
  catalogue: string;
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
  gross_weight: number;
  total_item_amount: number;
  discount: number;
  oldExItemPrice: number;
  paidAmount: number;
  dueAmount: number;
  receivedAmount: number | null;
  delivery_status: string;
  workerPay?: WorkerPay | null;
  transactions: Transaction[];
  oldItems?: OldItem[];
  version: number;
}

type BarcodeProduct = {
  metal: string;
  itemName: string;
  catalogue: string;
  design: string;
  size: number;
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
  gross_weight: number;
};

type AppWorker = {
  workerId: number;
  fullName: string;
};

const Orders: React.FC = () => {
  const handleClearExchange = () => {
    setExchange({
      exchange_metal: "",
      exchange_metal_name: "",
      exchange_metal_weight: 0,
      exchange_purity_weight: 0,
      exchange_metal_price: 0,
      exchange_item_amount: 0,
    });
    setExchangeErrors({});
    setIsPrefilled(false);
  };

  const handleClearOrder = () => {
    setOrder({
      metal: "",
      metalPrice: 0.0,
      itemName: "",
      catalogue: "",
      design: "",
      size: "",
      metal_weight: 0.0,
      wastage: 0.0,
      making_charges: 0.0,
      stone_weight: 0.0,
      stone_amount: 0.0,
      wax_weight: 0.0,
      wax_amount: 0.0,
      diamond_weight: 0.0,
      diamond_amount: 0.0,
      bits_weight: 0.0,
      bits_amount: 0.0,
      enamel_weight: 0.0,
      enamel_amount: 0.0,
      pearls_weight: 0.0,
      pearls_amount: 0.0,
      other_weight: 0.0,
      other_amount: 0.0,
      stock_box: 0.0,
      gross_weight: 0.0,
      discount: 0.0,
      delivery_status: "",
      total_item_amount: 0,
    });
    setOrderErrors({});
    setIsPrefilled(false);
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  const [editingExchangeId, setEditingExchangeId] = useState<number | null>(
    null
  );

  const [order, setOrder] = useState({
    metal: "",
    metalPrice: 0.0,
    itemName: "",
    catalogue: "",
    design: "",
    size: "",
    metal_weight: 0.0,
    wastage: 0.0,
    making_charges: 0.0,
    stone_weight: 0.0,
    stone_amount: 0.0,
    wax_weight: 0.0,
    wax_amount: 0.0,
    diamond_weight: 0.0,
    diamond_amount: 0.0,
    bits_weight: 0.0,
    bits_amount: 0.0,
    enamel_weight: 0.0,
    enamel_amount: 0.0,
    pearls_weight: 0.0,
    pearls_amount: 0.0,
    other_weight: 0.0,
    other_amount: 0.0,
    stock_box: 0.0,
    gross_weight: 0.0,
    discount: 0.0,
    delivery_status: "",
    total_item_amount: 0,
  });

  const [orderErrors, setOrderErrors] = useState<{ [key: string]: string }>({});
  const [exchangeErrors, setExchangeErrors] = useState<{
    [key: string]: string;
  }>({});

  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const showOrdersList = location.state?.showOrdersList || false;
  const fromCustomer = location.state?.fromCustomer || false;
  const fromCustomerDetails = location.state?.fromCustomerDetails || false;
  const from = location.state?.from || localStorage.getItem("from");
  const [isPrefilled, setIsPrefilled] = useState(false);

  const customerId =
    location.state?.customerId ||
    localStorage.getItem("CusDetailsCustomerId") ||
    localStorage.getItem("BillCustomerId") ||
    localStorage.getItem("customerId");

  const fromBillDetails = location.state?.fromBillDetails || false;
  const numericOrderId = location.state?.orderId || null; // read from state

  console.log("📦 Received numericOrderId from navigation:", numericOrderId);

  const token = localStorage.getItem("token");

  const [exchange, setExchange] = useState({
    exchange_metal: "",
    exchange_metal_name: "",
    exchange_metal_weight: 0,
    exchange_purity_weight: 0,
    exchange_metal_price: 0,
    exchange_item_amount: 0,
  });

  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("");

  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [workerList, setWorkerList] = useState<AppWorker[]>([]);

  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [exchangeList, setExchangeList] = useState<any[]>([]);
  const [showExchangeForm, setShowExchangeForm] = useState(false);
  const exchangeFormRef = useRef<HTMLDivElement | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | "">("");
  const [workerPayAmount, setWorkerPayAmount] = useState("");
  const [assignOrderId, setAssignOrderId] = useState<number | null>(null);

  useEffect(() => {
    api
      .get<AppWorker[]>(`/admin/getAllWorkers`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setWorkerList(res.data);
      })
      .catch((err) => console.error("Failed to fetch workers:", err));
  }, []);

  useEffect(() => {
    const savedState = sessionStorage.getItem("ordersState");

    if (fromCustomerDetails || fromCustomer) {
      // Clear state when coming from CustomerDetails or Customers
      setOrdersList([]);
      setExchangeList([]);
      sessionStorage.removeItem("ordersState");
    } else if (showOrdersList && savedState) {
      // Restore state when showOrdersList flag is true
      const { ordersList, exchangeList } = JSON.parse(savedState);
      setOrdersList(ordersList || []);
      setExchangeList(exchangeList || []);
    } else if (!showOrdersList && savedState) {
      // Coming back from generate-bill or browser back
      const { ordersList, exchangeList } = JSON.parse(savedState);
      setOrdersList(ordersList || []);
      setExchangeList(exchangeList || []);
    }
  }, [location.key]);

  useEffect(() => {
    if (fromBillDetails && numericOrderId) {
      fetchOrderDetails();
    }
  }, [location.key]);

  const fetchOrderDetails = async (): Promise<void> => {
    try {
      if (!numericOrderId) return;

      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return;
      }

      const response = await api.get<Order>(
        `/admin/getOrderByOrdId/${numericOrderId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = response.data;

      setOrdersList([data]);
      setExchangeList(data.oldItems ?? []);
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error fetching order:", err.message);
      } else {
        console.error("Unexpected error:", err);
      }
    }
  };

  const handleOrderSubmit = async () => {
    console.log("customerid  in order  :  " + customerId);
    console.log("Token id: " + token);
    console.log("Request Body:", JSON.stringify(order, null, 2));

    try {
      const response = await api.post(`/admin/addOrder/${customerId}`, order, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedOrders = [...ordersList, response.data];

      setOrdersList([...ordersList, response.data]);
      setOrderErrors({});

      handleClearOrder();

      sessionStorage.setItem(
        "ordersState",
        JSON.stringify({
          ordersList: updatedOrders,
          exchangeList,
        })
      );
    } catch (error: any) {
      if (error.response && error.response.data) {
        setOrderErrors(error.response.data); // assumes { field: "error message" }
      } else {
        alert("Failed to submit order");
        console.error("Order submission failed:", error);
      }
    }
  };
  const handleExchangeSubmit = async () => {
    try {
      localStorage.removeItem("exchangeItemAmount");
      localStorage.removeItem("exchangeOrderId");

      const exchangeItemAmount = exchange.exchange_item_amount;
      const orderId = ordersList[ordersList.length - 1]?.orderId;

      if (!orderId) return alert("Submit order first");

      localStorage.setItem("exchangeItemAmount", exchangeItemAmount.toString());
      localStorage.setItem("exchangeOrderId", orderId.toString());

      const response = await api.post(
        `/admin/addOldExItem/${orderId}`,
        exchange,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newExchangeList = [...exchangeList, response.data];
      setExchangeList(newExchangeList);

      const updatedOrders = ordersList.map((o) => {
        if (o.orderId === orderId) {
          const newDue = Number(o.dueAmount) - Number(exchangeItemAmount); // allow negative
          return { ...o, dueAmount: newDue };
        }
        return o;
      });

      setOrdersList(updatedOrders);

      handleClearExchange();

      setShowExchangeForm(false);

      sessionStorage.setItem(
        "ordersState",
        JSON.stringify({
          ordersList: updatedOrders,
          exchangeList: newExchangeList,
        })
      );

      setExchangeErrors({});
    } catch (error: any) {
      if (error.response && error.response.data) {
        setExchangeErrors(error.response.data);
      } else {
        alert("Failed to submit exchange");
        console.error("Exchange error:", error);
      }
    }
  };

  const handleViewMore = (orderId: number) => {
    sessionStorage.removeItem("ordersState");
    // Save current state
    sessionStorage.setItem(
      "ordersState",
      JSON.stringify({ ordersList, exchangeList })
    );

    navigate(`/admin/order-details/${orderId}`, {
      replace: true,
      state: {
        customerId,
        from: "orders",
      },
    });
  };

  const thickTextFieldProps = {
    variant: "outlined" as const,
    fullWidth: true,
    slotProps: {
      input: { style: { fontWeight: "500" } },
      notchedOutline: {
        style: { borderWidth: "2px", borderColor: "#8847FF" },
      },
      label: { style: { fontWeight: "bold", color: "#333" } },
    },
  };

  const handleBackClick = () => {
    localStorage.removeItem("from");

    if (from === "customerDetails") {
      navigate("/admin/customer-details", {
        state: { customerId: location.state?.customerId }, // optionally pass back
        replace: true,
      });
    } else if (from === "customer") {
      navigate("/admin/customers", { replace: true });
    } else {
      navigate("/admin"); // fallback
    }
  };

  const goldItems = [
    "Pusthela Thadu",
    "Mattalu",
    "Ring",
    "Finger Ring",
    "Vaddanam",
    "Bracelet",
    "Bangles",
    "Vathulu",
    "Gundla Mala",
    "Papidi Billa",
    "Necklace",
    "Nose Ring",
    "Neck Chains",
    "Jhumkas",
    "Earring",
  ];

  const silverItems = [
    "Kadiyam",
    "Finger Ring",
    "Ring",
    "Ring2",
    "Neck Chains",
    "Pattilu",
    "Bangles",
    "Bracelet",
    "Mettalu",
    "Pilenlu",
  ];

  const getItemOptions = () => {
    if (order.metal === "Gold") return goldItems;
    if (order.metal === "Silver") return silverItems;
    return [];
  };

  const [orderOpen, setOrderOpen] = useState(false);
  const [slectOrderId, setSlectOrderId] = useState<number | null>(null);

  const [oldItemOpen, setOldItemOpen] = useState(false);
  const [slectOldItemId, setSlectOldItemId] = useState<number | null>(null);

  const handleClickOrderOpen = (id: number) => {
    setSlectOrderId(id);
    setOrderOpen(true);
  };

  const handleClickOldItemOpen = (id: number) => {
    setSlectOldItemId(id);
    setOldItemOpen(true);
  };

  const handleOrderClose = () => {
    setOrderOpen(false);
    setSlectOrderId(null);
  };

  const handleOldItemClose = () => {
    setOldItemOpen(false);
    setSlectOldItemId(null);
  };

  const calculateTotals = (data: typeof order) => {
    let metalPrice = 0;

    // Pick price based on selected metal
    if (data.metal === "Gold") {
      metalPrice = Number(localStorage.getItem("GoldPrice")) || 0;
    } else if (data.metal === "Silver") {
      metalPrice = Number(localStorage.getItem("SilverPrice")) || 0;
    }

    // Calculate wastage weight
    const wastageWeight = (data.wastage / 100) * data.metal_weight;

    let total_item_amount = 0;

    if (
      data.wastage === 0 &&
      data.stone_amount === 0 &&
      data.wax_amount === 0 &&
      data.diamond_amount === 0 &&
      data.bits_amount === 0 &&
      data.enamel_amount === 0 &&
      data.pearls_amount === 0 &&
      data.other_amount === 0
    ) {
      total_item_amount =
        (data.metal_weight * metalPrice) / 10 + data.making_charges;
    } else {
      total_item_amount =
        ((data.metal_weight + wastageWeight) * metalPrice) / 10 +
        data.making_charges +
        (data.stone_amount +
          data.wax_amount +
          data.diamond_amount +
          data.bits_amount +
          data.enamel_amount +
          data.pearls_amount +
          data.other_amount);
    }

    // Remove decimals → integer only
    total_item_amount = Math.round(total_item_amount);

    return { total_item_amount };
  };

  const handleOrderDelete = async () => {
    console.log("selectedId  :" + slectOrderId);
    if (slectOrderId === null) return;

    try {
      const response = await api.delete(`/admin/deleteOrder/${slectOrderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        const message = response.data; // The backend message
        console.log("Server message:", message);

        if (message === "Yes, It's Deleted") {
          // Remove deleted item from the state
          setOrdersList((prev) =>
            prev.filter((item) => item.orderId !== slectOrderId)
          );
        }

        // Show message on the screen
        alert(message);
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Error deleting order. Please try again.");
    } finally {
      handleOrderClose();
    }
  };

  const handleOldDelete = async () => {
    console.log("selectedId  :" + slectOldItemId);
    if (slectOldItemId === null) return;

    try {
      const response = await api.delete(
        `/admin/deleteOldExItem/${slectOldItemId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200) {
        console.log(response.data); // "Yes Its Deleted"

        // Remove deleted item from the state
        setExchangeList((prev) =>
          prev.filter((item) => item.oldItemId !== slectOldItemId)
        );
      }
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      handleOldItemClose();
    }
  };

  // const calculateDueAmount = (order: any) => {
  //   const totalItemAmount = Number(order.totalItemAmount) || 0;
  //   const paidAmount = Number(order.paidAmount) || 0;
  //   const discount = Number(order.discount) || 0;
  //   const exchangeAmount = Number(order.exchange_item_amount) || 0;

  //   return totalItemAmount - paidAmount - discount - exchangeAmount;
  // };

  const handleUpdateExchange = async () => {
    if (!editingExchangeId) return;

    const orderId = ordersList[ordersList.length - 1]?.orderId;

    try {
      await api.put(
        `/admin/updateExchangeOrder/${editingExchangeId}`,
        exchange,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update table in UI without reload
      const updatedExchange = exchangeList.map((o) =>
        o.oldItemId === editingExchangeId ? { ...o, ...exchange } : o
      );

      setExchangeList(updatedExchange);

      // 🔹 Get updated order from backend again (since dueAmount changes after exchange)
      const { data: updatedOrderFromBackend } = await api.get<Order>(
        `/admin/getOrderByOrdId/${orderId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // find the exchange just updated
      const newExchange = updatedExchange.find(
        (ex) => ex.oldItemId === editingExchangeId
      );

      let recalculatedDue = updatedOrderFromBackend.dueAmount;

      if (exchange && newExchange) {
        recalculatedDue =
          updatedOrderFromBackend.dueAmount +
          (exchange.exchange_item_amount || 0) -
          (newExchange.exchange_item_amount || 0);
      }

      const orderWithDue = {
        ...updatedOrderFromBackend,
        dueAmount: recalculatedDue,
      };

      const updatedOrders = ordersList.map((order) =>
        order.orderId === orderId ? { ...order, ...orderWithDue } : order
      );

      setOrdersList(updatedOrders);

      sessionStorage.setItem(
        "ordersState",
        JSON.stringify({
          ordersList: updatedOrders,
          exchangeList: updatedExchange,
        })
      );

      setShowExchangeForm(false);
      setIsEditing(false);
      setEditingExchangeId(null);

      alert("Exchange Data updated successfully");
    } catch (error: any) {
      if (error.response?.data) {
        setExchangeErrors(error.response.data);
      } else {
        alert("Failed to update exchange");
      }
    }
  };

  const handleUpdateOrder = async () => {
    if (!editingOrderId) return;

    try {
      const { data: updatedOrderFromBackend } = await api.put(
        `/admin/updateOrder/${editingOrderId}`,
        order,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const updatedOrder: any = updatedOrderFromBackend; // 👈 cast

      const updatedOrders = ordersList.map((o) =>
        o.orderId === editingOrderId
          ? { ...updatedOrder, dueAmount: updatedOrder.dueAmount }
          : o
      );

      setOrdersList(updatedOrders);
      sessionStorage.setItem(
        "ordersState",
        JSON.stringify({ ordersList: updatedOrders, exchangeList })
      );

      handleClearOrder();
      setIsEditing(false);
      setEditingOrderId(null);
      alert("Order updated successfully");
    } catch (error: any) {
      if (error.response?.data) {
        setOrderErrors(error.response.data);
      } else {
        alert("Failed to update order");
      }
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) {
      alert("Please enter barcode value");
      return;
    }

    try {
      const response = await api.get<BarcodeProduct>(
        `/admin/getByBarcode?barcodeValue=${searchQuery}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = response.data;

      // ✅ figure out metal price from localStorage
      let getMetalPrice = 0;
      if (data.metal === "Gold") {
        getMetalPrice = Number(localStorage.getItem("GoldPrice")) || 0;
      } else if (data.metal === "Silver") {
        getMetalPrice = Number(localStorage.getItem("SilverPrice")) || 0;
      }

      // ✅ calculate total item amount
      const metalWeight = data.metal_weight || 0;
      const wastage = data.wastage || 0;
      const makingCharges = data.making_charges || 0;

      const stoneAmount = data.stone_amount || 0;
      const waxAmount = data.wax_amount || 0;
      const diamondAmount = data.diamond_amount || 0;
      const bitsAmount = data.bits_amount || 0;
      const enamelAmount = data.enamel_amount || 0;
      const pearlsAmount = data.pearls_amount || 0;
      const otherAmount = data.other_amount || 0;

      let total_item_amount = 0;

      if (
        wastage ||
        stoneAmount ||
        waxAmount ||
        diamondAmount ||
        bitsAmount ||
        enamelAmount ||
        pearlsAmount ||
        otherAmount
      ) {
        total_item_amount =
          (metalWeight + (wastage / 100) * metalWeight) * getMetalPrice +
          makingCharges +
          (stoneAmount +
            waxAmount +
            diamondAmount +
            bitsAmount +
            enamelAmount +
            pearlsAmount +
            otherAmount);
      } else {
        total_item_amount = metalWeight * getMetalPrice + makingCharges;
      }

      // ✅ now update state with metal_price and total_item_amount too
      setOrder((prev) => ({
        ...prev,
        metal: data.metal ?? prev.metal,
        metalPrice: getMetalPrice,
        itemName: data.itemName ?? prev.itemName,
        catalogue: data.catalogue ?? prev.catalogue,
        design: data.design ?? prev.design,
        size: String(data.size ?? prev.size),
        metal_weight: data.metal_weight ?? prev.metal_weight,
        wastage: data.wastage ?? prev.wastage,
        making_charges: data.making_charges ?? prev.making_charges,
        stone_weight: data.stone_weight ?? prev.stone_weight,
        stone_amount: data.stone_amount ?? prev.stone_amount,
        wax_weight: data.wax_weight ?? prev.wax_weight,
        wax_amount: data.wax_amount ?? prev.wax_amount,
        diamond_weight: data.diamond_weight ?? prev.diamond_weight,
        diamond_amount: data.diamond_amount ?? prev.diamond_amount,
        bits_weight: data.bits_weight ?? prev.bits_weight,
        bits_amount: data.bits_amount ?? prev.bits_amount,
        enamel_weight: data.enamel_weight ?? prev.enamel_weight,
        enamel_amount: data.enamel_amount ?? prev.enamel_amount,
        pearls_weight: data.pearls_weight ?? prev.pearls_weight,
        pearls_amount: data.pearls_amount ?? prev.pearls_amount,
        other_weight: data.other_weight ?? prev.other_weight,
        other_amount: data.other_amount ?? prev.other_amount,
        gross_weight: data.gross_weight ?? prev.gross_weight,

        // ✅ newly added

        total_item_amount: total_item_amount,
      }));

      setIsPrefilled(true);
      setOrderErrors({});
    } catch (error) {
      console.error("Failed to fetch barcode data:", error);
      alert("Barcode not found or error occurred");
    }
  };

  const [formData, setFormData] = useState({
    metal_weight: "",
    stone_weight: "",
    wax_weight: "",
    diamond_weight: "",
    bits_weight: "",
    enamel_weight: "",
    pearls_weight: "",
    other_weight: "",
    gross_weight: "",
  });

  const parseNumber = (val: string | number | null | undefined): number =>
    val === "" || val == null || isNaN(Number(val)) ? 0 : Number(val);

  const formatWeight = (value: number): string => {
    const rounded = Math.round(value * 1000) / 1000; // max 3 decimals
    return Number.isInteger(rounded) ? rounded.toString() : rounded.toString();
  };

  // Auto-calculate gross weight whenever dependencies change
  useEffect(() => {
    const {
      metal_weight,
      stone_weight,
      wax_weight,
      diamond_weight,
      bits_weight,
      enamel_weight,
      pearls_weight,
      other_weight,
    } = formData;

    const total =
      parseNumber(metal_weight) +
      parseNumber(stone_weight) +
      parseNumber(wax_weight) +
      parseNumber(diamond_weight) +
      parseNumber(bits_weight) +
      parseNumber(enamel_weight) +
      parseNumber(pearls_weight) +
      parseNumber(other_weight);

    setFormData((prev) => ({
      ...prev,
      gross_weight: formatWeight(total),
    }));
  }, [
    formData.metal_weight,
    formData.stone_weight,
    formData.wax_weight,
    formData.diamond_weight,
    formData.bits_weight,
    formData.enamel_weight,
    formData.pearls_weight,
    formData.other_weight,
  ]);

  const asNumber = (v: number | string | null | undefined): number =>
    v == null || v === "" ? 0 : Number(v);
  const formatMoney = (v: number | string): string => {
    const num = Number(v);

    if (isNaN(num)) return "0"; // fallback if not a valid number

    return num.toLocaleString("en-IN", {
      maximumFractionDigits: 0, // no decimals
    });
  };

  const calculateGrossWeight = (updatedOrder: typeof order) => {
    const total =
      parseNumber(updatedOrder.metal_weight) +
      parseNumber(updatedOrder.stone_weight) +
      parseNumber(updatedOrder.wax_weight) +
      parseNumber(updatedOrder.diamond_weight) +
      parseNumber(updatedOrder.bits_weight) +
      parseNumber(updatedOrder.enamel_weight) +
      parseNumber(updatedOrder.pearls_weight) +
      parseNumber(updatedOrder.other_weight);

    return Math.round(total * 1000) / 1000;
  };

  useEffect(() => {
    const { total_item_amount } = calculateTotals(order);
    setOrder((prev) => ({
      ...prev,
      total_item_amount,
    }));
  }, [
    order.metal,
    order.metal_weight,
    order.wastage,
    order.making_charges,
    order.stone_amount,
    order.wax_amount,
    order.diamond_amount,
    order.bits_amount,
    order.enamel_amount,
    order.pearls_amount,
    order.other_amount,
  ]);

  useEffect(() => {
    let price = 0;
    if (exchange.exchange_metal === "Gold") {
      price = Number(localStorage.getItem("GoldPrice") || 0) - 500;
    } else if (exchange.exchange_metal === "Silver") {
      price = Number(localStorage.getItem("SilverPrice") || 0) - 15;
    }

    setExchange((prev) => ({
      ...prev,
      exchange_metal_price: price,
      exchange_item_amount: Math.round(
        (price * prev.exchange_purity_weight) / 10
      ),
    }));
  }, [exchange.exchange_metal, exchange.exchange_purity_weight]);

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          mt: 4,
          padding: 4,
          borderRadius: "24px",
          backgroundColor: "rgba(255, 255, 255, 0.75)",
          backdropFilter: "blur(12px)",
          border: "1px solid #d0b3ff",
          boxShadow: "0px 10px 30px rgba(136, 71, 255, 0.3)",
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={6}
        >
          <Box display="flex">
            <IconButton color="primary" onClick={handleBackClick}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" fontWeight="bold" color="primary">
              Orders
            </Typography>
          </Box>
          <Box
            mt={6}
            display="flex"
            gap={2}
            maxWidth={600}
            alignSelf="center"
            mb={4}
          >
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search Product..."
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

          <Button
            variant="outlined"
            onClick={() => {
              setShowExchangeForm((prev) => !prev);
              setTimeout(() => {
                exchangeFormRef.current?.scrollIntoView({ behavior: "smooth" });
              }, 100);
            }}
          >
            Exchange / Return
          </Button>
        </Box>

        <Grid container spacing={3}>
          {Object.entries(order).map(([key, value]) => (
            <Grid size={{ xs: 4, sm: 2 }} key={key}>
              {key === "metal" ? (
                <TextField
                  select
                  label="Metal"
                  value={order.metal}
                  onChange={(e) => {
                    const selectedMetal = e.target.value;
                    let metalPrice = 0;

                    if (selectedMetal === "Gold") {
                      metalPrice = parseFloat(
                        localStorage.getItem("GoldPrice") || "0"
                      );
                    } else if (selectedMetal === "Silver") {
                      metalPrice = parseFloat(
                        localStorage.getItem("SilverPrice") || "0"
                      );
                    }
                    setOrder({
                      ...order,
                      metal: selectedMetal,
                      metalPrice: metalPrice,
                    });
                  }}
                  disabled={isPrefilled && (key as string) !== "discount"} // ✅ add this
                  error={!!orderErrors.metal}
                  helperText={orderErrors.metal || ""}
                  fullWidth
                  variant="outlined"
                  InputLabelProps={{
                    style: { color: "#333" },
                    shrink: true, // ✅ ensures label is always visible
                  }}
                  InputProps={{
                    style: { fontWeight: 500 },
                  }}
                  sx={{
                    minWidth: "200px",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderWidth: "2px",
                      borderColor: "gray",
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>Select Metal</em>
                  </MenuItem>
                  <MenuItem value="Gold">Gold</MenuItem>
                  <MenuItem value="Silver">Silver</MenuItem>
                </TextField>
              ) : key === "catalogue" ? (
                <TextField
                  select
                  label="Catalogue"
                  value={order.catalogue}
                  onChange={(e) =>
                    setOrder({
                      ...order,
                      catalogue: e.target.value,
                    })
                  }
                  error={!!orderErrors.catalogue}
                  helperText={orderErrors.catalogue || ""}
                  fullWidth
                  variant="outlined"
                  InputLabelProps={{
                    style: { color: "#333" },
                    shrink: true, // ✅ ensures label is always visible
                  }}
                  InputProps={{
                    style: { fontWeight: 500 },
                  }}
                  sx={{
                    minWidth: "200px",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderWidth: "2px",
                      borderColor: "gray",
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>Select Catalogue</em>
                  </MenuItem>
                  <MenuItem value="Royal Gold">Royal Gold</MenuItem>
                  <MenuItem value="Star">Star</MenuItem>
                  <MenuItem value="SSP">SSP</MenuItem>
                </TextField>
              ) : key === "delivery_status" ? (
                <TextField
                  select
                  label="Delivery Status"
                  value={order.delivery_status}
                  onChange={(e) =>
                    setOrder({
                      ...order,
                      delivery_status: e.target.value,
                    })
                  }
                  error={!!orderErrors.delivery_status}
                  helperText={orderErrors.delivery_status || ""}
                  fullWidth
                  variant="outlined"
                  InputLabelProps={{
                    style: { color: "#333" },
                    shrink: true, // ✅ ensures label is always visible
                  }}
                  InputProps={{
                    style: { fontWeight: 500 },
                  }}
                  sx={{
                    minWidth: "200px",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderWidth: "2px",
                      borderColor: "gray",
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>Select Delivery Status</em>
                  </MenuItem>
                  <MenuItem value="Deliverd">Deliverd</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                </TextField>
              ) : key === "itemName" ? (
                <TextField
                  select
                  label="Item Name"
                  value={order.itemName}
                  onChange={(e) =>
                    setOrder({
                      ...order,
                      itemName: e.target.value,
                    })
                  }
                  disabled={isPrefilled && (key as string) !== "discount"} // ✅ add this
                  error={!!orderErrors.itemName}
                  helperText={orderErrors.itemName || ""}
                  fullWidth
                  variant="outlined"
                  InputLabelProps={{
                    style: { color: "#333" },
                    shrink: true, // ✅ ensures label is always visible
                  }}
                  InputProps={{
                    style: { fontWeight: 500 },
                  }}
                  sx={{
                    minWidth: "200px",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderWidth: "2px",
                      borderColor: "gray",
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>Select Item</em>
                  </MenuItem>
                  {getItemOptions().map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </TextField>
              ) : (
                <TextField
                  {...thickTextFieldProps}
                  label={key
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                  type={typeof value === "number" ? "number" : "text"}
                  InputLabelProps={
                    key.includes("date") ? { shrink: true } : undefined
                  }
                  value={
                    typeof value === "number" && value === 0
                      ? "" // show empty instead of 0
                      : value
                  }
                  error={!!orderErrors[key]}
                  helperText={orderErrors[key] || ""}
                  onChange={(e) => {
                    const newValue =
                      typeof value === "number"
                        ? e.target.value === "" // allow clearing
                          ? 0
                          : Number(e.target.value)
                        : e.target.value;

                    const updatedOrder = { ...order, [key]: newValue };

                    // If one of the weight fields changes → recalc gross_weight
                    if (
                      [
                        "metal_weight",
                        "stone_weight",
                        "wax_weight",
                        "diamond_weight",
                        "bits_weight",
                        "enamel_weight",
                        "pearls_weight",
                        "other_weight",
                      ].includes(key)
                    ) {
                      updatedOrder.gross_weight =
                        calculateGrossWeight(updatedOrder);
                    }

                    setOrder(updatedOrder);

                    if (orderErrors[key]) {
                      setOrderErrors((prev) => ({ ...prev, [key]: "" }));
                    }
                  }}
                  disabled={
                    key === "gross_weight" ||
                    (isPrefilled && key !== "discount")
                  }
                  InputProps={{
                    readOnly: key === "gross_weight",
                  }}
                />
              )}
            </Grid>
          ))}
        </Grid>

        <Box display="flex" justifyContent="flex-end" mt={4} gap={2}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleClearOrder}
          >
            Clear
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              window.scrollBy({ top: window.innerHeight, behavior: "smooth" });

              if (isEditing) {
                handleUpdateOrder();
              } else {
                handleOrderSubmit();
              }
              // 👇 scroll down after action
            }}
          >
            {isEditing ? "Update" : "Submit"}
          </Button>
        </Box>
      </Paper>

      {ordersList.length > 0 && (
        <Paper
          elevation={4}
          className="p-6 mt-6 rounded-3xl bg-white/75 backdrop-blur-lg border border-[#d0b3ff] shadow-[0_10px_30px_rgba(136,71,255,0.3)]"
        >
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Order Summary
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Item</TableCell>
                <TableCell>Metal</TableCell>
                <TableCell>Weight</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Paid</TableCell>
                <TableCell>Due</TableCell>
                <TableCell>Worker</TableCell>
                <TableCell>Pay</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Edit</TableCell>
                <TableCell>Delete</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ordersList.map((ord) => (
                <TableRow key={ord.orderId}>
                  <TableCell>{ord.orderId}</TableCell>
                  <TableCell>{ord.itemName}</TableCell>
                  <TableCell>{ord.metal}</TableCell>
                  <TableCell>{ord.metal_weight}</TableCell>
                  <TableCell>{ord.total_item_amount}</TableCell>
                  <TableCell>{ord.paidAmount}</TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 400,
                      color:
                        asNumber(ord.dueAmount) < 0 ? "error.main" : "inherit",
                    }}
                  >
                    {formatMoney(ord.dueAmount)}
                  </TableCell>
                  <TableCell>
                    {ord.workerPay ? (
                      ord.workerPay.fullName
                    ) : (
                      <Button
                        variant="outlined"
                        size="small"
                        color="primary"
                        onClick={() => {
                          setAssignOrderId(ord.orderId);
                          setSelectedWorkerId("");
                          setWorkerPayAmount("");
                          setAssignDialogOpen(true);
                        }}
                      >
                        Assign Worker
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    {asNumber(ord.dueAmount) !== 0 ? (
                      <Button
                        variant="outlined"
                        size="small"
                        color="secondary"
                        onClick={() => {
                          setSelectedOrderId(ord.orderId);
                          setPayAmount("");
                          setPayDialogOpen(true);
                        }}
                      >
                        Pay
                      </Button>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <Button onClick={() => handleViewMore(ord.orderId)}>
                      View More
                    </Button>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="warning"
                      onClick={() => {
                        setOrder({
                          metal: ord.metal || "",
                          metalPrice:
                            ord.metal === "Gold"
                              ? parseFloat(
                                  localStorage.getItem("GoldPrice") || "0"
                                )
                              : ord.metal === "Silver"
                              ? parseFloat(
                                  localStorage.getItem("SilverPrice") || "0"
                                )
                              : 0,
                          itemName: ord.itemName || "",
                          catalogue: ord.catalogue || "",
                          design: ord.design || "",
                          size: String(ord.size || ""),
                          metal_weight: ord.metal_weight || 0,
                          wastage: ord.wastage || 0,
                          making_charges: ord.making_charges || 0,
                          stone_weight: ord.stone_weight || 0,
                          stone_amount: ord.stone_amount || 0,
                          wax_weight: ord.wax_weight || 0,
                          wax_amount: ord.wax_amount || 0,
                          diamond_weight: ord.diamond_weight || 0,
                          diamond_amount: ord.diamond_amount || 0,
                          bits_weight: ord.bits_weight || 0,
                          bits_amount: ord.bits_amount || 0,
                          enamel_weight: ord.enamel_weight || 0,
                          enamel_amount: ord.enamel_amount || 0,
                          pearls_weight: ord.pearls_weight || 0,
                          pearls_amount: ord.pearls_amount || 0,
                          other_weight: ord.other_weight || 0,
                          other_amount: ord.other_amount || 0,
                          gross_weight: ord.gross_weight || 0,
                          stock_box: ord.stock_box || 0,
                          discount: ord.discount || 0,
                          delivery_status: ord.delivery_status || "",
                          total_item_amount:
                            calculateTotals(ord).total_item_amount,
                        });

                        setIsEditing(true);
                        setEditingOrderId(ord.orderId); // still keep the orderId in a separate state
                        setOrderErrors({});
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="warning"
                      onClick={() => handleClickOrderOpen(ord.orderId)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              <Dialog open={orderOpen} onClose={handleOrderClose}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                  <DialogContentText>
                    Are you sure you want to delete this order item with ID:
                    {slectOrderId}
                    <strong>{selectedOrderId}</strong>?
                  </DialogContentText>
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleOrderClose} color="primary">
                    No
                  </Button>
                  <Button onClick={handleOrderDelete} color="error" autoFocus>
                    Yes, Delete
                  </Button>
                </DialogActions>
              </Dialog>
            </TableBody>
          </Table>
        </Paper>
      )}

      {showExchangeForm && (
        <div ref={exchangeFormRef}>
          <Paper
            elevation={0}
            sx={{
              mt: 6,
              padding: 4,
              borderRadius: "24px",
              backgroundColor: "rgba(255, 255, 255, 0.75)",
              backdropFilter: "blur(12px)",
              border: "1px solid #d0b3ff",
              boxShadow: "0px 10px 30px rgba(136, 71, 255, 0.3)",
            }}
          >
            <Typography
              variant="h5"
              fontWeight="bold"
              color="primary"
              gutterBottom
              mb={4}
            >
              Exchange / Return
            </Typography>
            <Grid container spacing={3}>
              {Object.entries(exchange).map(([key, value]) => (
                <Grid size={{ xs: 4, sm: 2 }} key={key}>
                  {key === "exchange_metal" ? (
                    <TextField
                      select
                      label="Exchange Metal"
                      value={exchange.exchange_metal}
                      onChange={(e) =>
                        setExchange({
                          ...exchange,
                          exchange_metal: e.target.value,
                        })
                      }
                      error={!!exchangeErrors.exchange_metal}
                      helperText={exchangeErrors.exchange_metal || ""}
                      fullWidth
                      variant="outlined"
                      InputLabelProps={{
                        style: { color: "#333" },
                        shrink: true, // ✅ ensures label is always visible
                      }}
                      InputProps={{
                        style: { fontWeight: 500 },
                      }}
                      sx={{
                        minWidth: "200px",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderWidth: "2px",
                          borderColor: "gray",
                        },
                      }}
                    >
                      <MenuItem value="">
                        <em>Select Metal</em>
                      </MenuItem>
                      <MenuItem value="Gold">Gold</MenuItem>
                      <MenuItem value="Silver">Silver</MenuItem>
                    </TextField>
                  ) : (
                    <TextField
                      {...thickTextFieldProps}
                      label={key
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                      type={typeof value === "number" ? "number" : "text"}
                      InputLabelProps={
                        key.includes("date") ? { shrink: true } : undefined
                      }
                      value={
                        typeof value === "number" && value === 0
                          ? "" // show empty instead of 0
                          : value
                      }
                      error={!!exchangeErrors[key]}
                      helperText={exchangeErrors[key] || ""}
                      onChange={(e) => {
                        const newValue =
                          typeof value === "number"
                            ? e.target.value === "" // allow clearing
                              ? 0
                              : Number(e.target.value)
                            : e.target.value;

                        setExchange({ ...exchange, [key]: newValue });
                      }}
                    />
                  )}
                </Grid>
              ))}
            </Grid>
            <Box display="flex" justifyContent="flex-end" mt={4}>
              <Button
                variant="contained"
                onClick={
                  isEditing ? handleUpdateExchange : handleExchangeSubmit
                }
              >
                {isEditing ? "Update Exchange" : "Submit Exchange"}
              </Button>
            </Box>
          </Paper>
        </div>
      )}

      {exchangeList.length > 0 && (
        <Paper
          elevation={4}
          className="p-6 mt-6 rounded-3xl bg-white/75 backdrop-blur-lg border border-[#d0b3ff] shadow-[0_10px_30px_rgba(136,71,255,0.3)]"
        >
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Exchange / Return Summary
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Order Id</TableCell>
                <TableCell>Metal</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Weight</TableCell>
                <TableCell>Purity</TableCell>
                <TableCell>Metal Price</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Edit</TableCell>
                <TableCell>Delete</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {exchangeList.map((ex) => (
                <TableRow key={ex.oldItemId}>
                  <TableCell>{ex.oldItemId}</TableCell>
                  <TableCell>{ex.orderId}</TableCell>
                  <TableCell>{ex.exchange_metal}</TableCell>
                  <TableCell>{ex.exchange_metal_name}</TableCell>
                  <TableCell>{ex.exchange_metal_weight}</TableCell>
                  <TableCell>{ex.exchange_purity_weight}</TableCell>
                  <TableCell>{ex.exchange_metal_price}</TableCell>
                  <TableCell>{ex.exchange_item_amount}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="warning"
                      onClick={() => {
                        setExchange({
                          ...ex, // ensure dropdown works if needed
                        });
                        setShowExchangeForm((prev) => !prev);
                        setIsEditing(true);
                        setEditingExchangeId(ex.oldItemId);
                        setExchangeErrors({});
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="warning"
                      onClick={() => handleClickOldItemOpen(ex.oldItemId)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              <Dialog open={oldItemOpen} onClose={handleOldItemClose}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                  <DialogContentText>
                    Are you sure you want to delete this exchange / old item
                    with ID: <strong>{slectOldItemId}</strong>?
                  </DialogContentText>
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleOldItemClose} color="primary">
                    No
                  </Button>
                  <Button onClick={handleOldDelete} color="error" autoFocus>
                    Yes, Delete
                  </Button>
                </DialogActions>
              </Dialog>
            </TableBody>
          </Table>
        </Paper>
      )}
      <Box display="flex" justifyContent="flex-end" mt={3}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            sessionStorage.removeItem("billingFrom");
            sessionStorage.removeItem("ordersState");
            sessionStorage.setItem(
              "ordersState",
              JSON.stringify({ ordersList, exchangeList, customerId })
            );
            navigate("/admin/generate-bill", {
              state: {
                fromBillDetails: location.state?.fromBillDetails || false,
                selectedOrders: ordersList.map((order) => order.orderId),
                billNumber:
                  location.state?.billNumber ||
                  localStorage.getItem("billNumber"),
              },
            });
          }}
        >
          Bill Generate
        </Button>
      </Box>
      <Dialog open={payDialogOpen} onClose={() => setPayDialogOpen(false)}>
        <DialogTitle>Enter Payment Amount</DialogTitle>
        <DialogContent>
          <Box
            display="flex"
            flexDirection="column"
            gap={3} // ✅ space between inputs
          >
            <TextField
              select
              label="Payment Type"
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
              fullWidth
              variant="outlined"
              InputLabelProps={{
                style: { color: "#333" },
                shrink: true, // ✅ ensures label is always visible
              }}
              InputProps={{
                style: { fontWeight: 500 },
              }}
              sx={{
                minWidth: "200px",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderWidth: "2px",
                  borderColor: "gray",
                },
              }}
            >
              <MenuItem value="">
                <em>Select Payment Method</em>
              </MenuItem>
              <MenuItem value="Phone Pay">Phone Pay</MenuItem>
              <MenuItem value="Cash">Cash</MenuItem>
            </TextField>

            <TextField
              autoFocus
              margin="dense"
              label="Amount"
              type="number"
              fullWidth
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (!selectedOrderId || !payAmount) return;
              try {
                await api.post(
                  `/admin/payCustomer/${selectedOrderId}/${payMethod}?amount=${payAmount}`,
                  {},
                  { headers: { Authorization: `Bearer ${token}` } }
                );

                const updatedOrders = ordersList.map((o) => {
                  if (o.orderId === selectedOrderId) {
                    const existingDue = Number(o.dueAmount);
                    const paid = Number(payAmount);

                    let newDue;
                    if (existingDue < 0) {
                      // Negative = advance → paying back increases due towards 0
                      newDue = existingDue + paid;
                    } else {
                      // Positive = customer owes → normal subtraction
                      newDue = existingDue - paid;
                    }

                    // Fix floating point rounding (-0.0001 → 0)
                    if (Math.abs(newDue) < 0.01) newDue = 0;

                    return {
                      ...o,
                      paidAmount: Number(o.paidAmount) + paid,
                      dueAmount: newDue,
                    };
                  }
                  return o;
                });

                setOrdersList(updatedOrders);
                sessionStorage.setItem(
                  "ordersState",
                  JSON.stringify({
                    ordersList: updatedOrders,
                    exchangeList,
                  })
                );

                setPayDialogOpen(false);
              } catch (err) {
                console.error("Payment failed:", err);
                alert("Payment failed");
              }
            }}
            color="primary"
            variant="contained"
          >
            Pay Now
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
      >
        <DialogTitle>Assign Worker</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="Select Worker"
            fullWidth
            value={selectedWorkerId}
            onChange={(e) => setSelectedWorkerId(Number(e.target.value))}
            sx={{ mb: 2, mt: 1 }}
          >
            {workerList.map((worker) => (
              <MenuItem key={worker.workerId} value={worker.workerId}>
                {worker.fullName}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Worker Pay Amount"
            type="number"
            fullWidth
            value={workerPayAmount}
            onChange={(e) => setWorkerPayAmount(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (!assignOrderId || !selectedWorkerId || !workerPayAmount) {
                alert("Please fill all fields");
                return;
              }

              try {
                // ✅ 1. Make API call
                await api.post(
                  `/admin/addWorkerPay/${assignOrderId}`,
                  {
                    workPay: Number(workerPayAmount),
                    workerId: selectedWorkerId,
                  },
                  {
                    headers: { Authorization: `Bearer ${token}` },
                  }
                );

                // ✅ 2. Find the selected worker name from workerList
                const selectedWorker = workerList.find(
                  (w) => w.workerId === selectedWorkerId
                );

                // ✅ 3. Update the ordersList state manually to show the name
                const updatedOrders = ordersList.map((order) =>
                  order.orderId === assignOrderId
                    ? {
                        ...order,
                        workerPay: {
                          fullName: selectedWorker?.fullName || "Assigned",
                        },
                      }
                    : order
                );

                setOrdersList(updatedOrders);

                // ✅ 4. Persist updated state
                sessionStorage.setItem(
                  "ordersState",
                  JSON.stringify({ ordersList: updatedOrders, exchangeList })
                );

                // ✅ 5. Close dialog
                setAssignDialogOpen(false);
              } catch (error) {
                console.error("Failed to assign worker:", error);
                alert("Failed to assign worker");
              }
            }}
            color="primary"
            variant="contained"
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Orders;
