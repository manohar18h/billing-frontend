// Updated order.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  TextField,
  Button,
  InputAdornment,
  Paper,
  Typography,
  Table,
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
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import { Box } from "@mui/system";

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
  stockBox: string;
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
      exchange_metal_gross_weight: 0,
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
      stockBox: "",
      gross_weight: 0.0,
      discount: 0.0,
      deliveryStatus: "",
      total_item_amount: 0,
    });
    setOrderErrors({});
    setIsPrefilled(false);
  };

  const [isEditing, setIsEditing] = useState(false);
  const [isBillEditing, setIsBillEditing] = useState(false);

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
    stockBox: "",
    gross_weight: 0.0,
    discount: 0.0,
    deliveryStatus: "",
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
    localStorage.getItem("customerId");

  const fromBillDetails = location.state?.fromBillDetails || false;
  const numericOrderId = location.state?.orderId || null; // read from state

  console.log("📦 Received numericOrderId from navigation:", numericOrderId);

  const token = localStorage.getItem("token");

  const [exchange, setExchange] = useState({
    exchange_metal: "",
    exchange_metal_name: "",
    exchange_metal_gross_weight: 0,
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
  const [workerPayWastage, setWorkerPayWastage] = useState("");
  const [editBillDetails, setEditBillDetails] = useState<string | null>(null);

  const [assignOrderId, setAssignOrderId] = useState<number | null>(null);
  const billNumber =
    location.state?.billNumber || localStorage.getItem("billNumber");

  useEffect(() => {
    localStorage.removeItem("checkEditBill");
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

      setEditBillDetails(localStorage.getItem("editBillFromBillDetails"));

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
    localStorage.removeItem("AllowEdit");

    try {
      const response = await api.post(`/admin/addOrder/${customerId}`, order, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedOrders = [...ordersList, response.data];

      setOrdersList([...ordersList, response.data]);
      setOrderErrors({});

      handleClearOrder();

      localStorage.setItem("AllowEdit", "AllowEdit");

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

      console.log("requestBody :", exchange);
      console.log("orderId :", orderId);
      console.log("token :", token);

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
    if (from === "customerDetails") {
      navigate("/admin/bill-Data", {
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
    if (order.metal === "24 Gold" || order.metal === "22 Gold")
      return goldItems;
    if (order.metal === "999 Silver" || order.metal === "995 Silver")
      return silverItems;
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

    console.log("GoldPrice :", localStorage.getItem("Gold24Price"));
    console.log("SilverPrice :", localStorage.getItem("Silver999Price"));

    if (data.metal === "24 Gold") {
      metalPrice = Number(localStorage.getItem("Gold24Price")) || 0;
    } else if (data.metal === "22 Gold") {
      metalPrice = Number(localStorage.getItem("Gold22Price")) || 0;
    } else if (data.metal === "999 Silver") {
      metalPrice = Number(localStorage.getItem("Silver999Price")) || 0;
    } else if (data.metal === "995 Silver") {
      metalPrice = Number(localStorage.getItem("Silver995Price")) || 0;
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

  const handleBillGenerate = () => {
    sessionStorage.removeItem("ordersState");
    localStorage.removeItem("checkEditBill");

    // Save new data
    sessionStorage.setItem(
      "ordersState",
      JSON.stringify({ ordersList, exchangeList, customerId })
    );

    // Mark this as a NEW bill (not editing)
    localStorage.setItem("checkEditBill", "NoEdit");

    // Navigate to generate bill
    navigate("/admin/generate-bill", {
      state: {
        fromBillDetails: location.state?.fromBillDetails || false,
        selectedOrders: ordersList.map((order) => order.orderId),
        billNumber:
          location.state?.billNumber || localStorage.getItem("billNumber"),
      },
    });
  };

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
      setIsBillEditing(true);
      setEditingExchangeId(null);

      alert("Exchange Data updated successfully");

      localStorage.setItem("billNumber", billNumber);
      navigate(`/admin/bill-details`, {
        replace: true,
      });
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
      setIsBillEditing(true);

      setEditingOrderId(null);
      alert(
        "Order updated successfully, Dont forget to Genarate Updated Bill, Click Update Genarate Bill"
      );
      localStorage.setItem("billNumber", billNumber);

      const checkEditAllow = localStorage.getItem("AllowEdit");

      if (checkEditAllow !== "AllowEdit") {
        navigate(`/admin/bill-details`, {
          replace: true,
        });
      }
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

      let getMetalPrice = 0;

      if (data.metal === "24 Gold") {
        getMetalPrice = Number(localStorage.getItem("Gold24Price")) || 0;
      } else if (data.metal === "22 Gold") {
        getMetalPrice = Number(localStorage.getItem("Gold22Price")) || 0;
      } else if (data.metal === "999 Silver") {
        getMetalPrice = Number(localStorage.getItem("Silver999Price")) || 0;
      } else if (data.metal === "995 Silver") {
        getMetalPrice = Number(localStorage.getItem("Silver995Price")) || 0;
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
        stockBox: data.stockBox ?? prev.stockBox,
        gross_weight: data.gross_weight ?? prev.gross_weight,

        // ✅ newly added

        total_item_amount: total_item_amount,
      }));

      setIsPrefilled(true);
      setOrderErrors({});
    } catch (error: any) {
      console.error("Failed to fetch barcode data:", error);

      // Check if backend returned a response with error message
      if (error.response && error.response.data && error.response.data.error) {
        const backendError = error.response.data.error;
        alert(backendError); // or show in a UI component instead of alert
      } else {
        alert("Barcode not found or error occurred");
      }
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

  // 1️⃣ Set default price only when metal changes
  useEffect(() => {
    let price = 0;

    if (exchange.exchange_metal === "Gold") {
      price = Number(localStorage.getItem("Gold22Price") || 0) - 500;
    } else if (exchange.exchange_metal === "Silver") {
      price = Number(localStorage.getItem("Silver995Price") || 0) - 15;
    } else if (exchange.exchange_metal === "24 Gold") {
      price = Number(localStorage.getItem("Gold24Price") || 0);
    } else if (exchange.exchange_metal === "22 Gold") {
      price = Number(localStorage.getItem("Gold22Price") || 0);
    } else if (exchange.exchange_metal === "999 Silver") {
      price = Number(localStorage.getItem("Silver999Price") || 0);
    } else if (exchange.exchange_metal === "995 Silver") {
      price = Number(localStorage.getItem("Silver995Price") || 0);
    }

    // ✅ only set auto-price when metal is changed by user
    setExchange((prev) => ({
      ...prev,
      exchange_metal_price: price,
    }));
  }, [exchange.exchange_metal]);

  // 2️⃣ Recalculate amount whenever purity weight or metal price changes
  useEffect(() => {
    setExchange((prev) => ({
      ...prev,
      exchange_item_amount: Math.round(
        (prev.exchange_metal_price * prev.exchange_purity_weight) / 10
      ),
    }));
  }, [exchange.exchange_metal_price, exchange.exchange_purity_weight]);

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
          flexDirection={{ xs: "column", sm: "row" }}
          flexWrap="wrap"
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          mb={6}
          gap={2}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton color="primary" onClick={handleBackClick}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" fontWeight="bold" color="primary">
              Orders
            </Typography>
          </Box>
          <Box
            display="flex"
            flexDirection={{ xs: "column", sm: "row" }}
            gap={2}
            maxWidth={600}
            width="100%"
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
            sx={{ mt: { xs: 2, sm: 0 } }}
          >
            Exchange / Returnn
          </Button>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr", // 12 columns → 1 column on xs
              sm: "repeat(2, 1fr)", // 6 columns → 2 columns on sm
              md: "repeat(3, 1fr)", // 4 columns → 3 columns on md
              lg: "repeat(4, 1fr)", // 3 columns → 4 columns on lg
            },
            gap: 3, // spacing between items (like Grid spacing={3})
          }}
        >
          {Object.entries(order).map(([key, value]) => (
            <Box key={key}>
              {key === "metal" ? (
                <TextField
                  select
                  label="Metal"
                  value={order.metal}
                  onChange={(e) => {
                    const selectedMetal = e.target.value;

                    let metalPrice = 0;
                    if (selectedMetal === "24 Gold") {
                      metalPrice =
                        Number(localStorage.getItem("Gold24Price")) || 0;
                    } else if (selectedMetal === "22 Gold") {
                      metalPrice =
                        Number(localStorage.getItem("Gold22Price")) || 0;
                    } else if (selectedMetal === "999 Silver") {
                      metalPrice =
                        Number(localStorage.getItem("Silver999Price")) || 0;
                    } else if (selectedMetal === "995 Silver") {
                      metalPrice =
                        Number(localStorage.getItem("Silver995Price")) || 0;
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
                  <MenuItem value="22 Gold">22 Gold</MenuItem>
                  <MenuItem value="995 Silver">995 Silver</MenuItem>
                  <MenuItem value="24 Gold">24 Gold</MenuItem>
                  <MenuItem value="999 Silver">999 Silver</MenuItem>
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
              ) : key === "deliveryStatus" ? (
                <TextField
                  select
                  label="Delivery Status"
                  value={order.deliveryStatus}
                  onChange={(e) =>
                    setOrder({
                      ...order,
                      deliveryStatus: e.target.value,
                    })
                  }
                  error={!!orderErrors.deliveryStatus}
                  helperText={orderErrors.deliveryStatus || ""}
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
                  <MenuItem value="Delivered">Delivered</MenuItem>
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
                    key === "metalPrice" ||
                    (isPrefilled && key !== "discount")
                  }
                  InputProps={{
                    readOnly: key === "gross_weight" || key === "metalPrice",
                  }}
                />
              )}
            </Box>
          ))}
        </Box>

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
          <h3 className=" text-3xl font-bold mb-10 text-blue-600">
            Order Summary
          </h3>
          <Box
            sx={{
              width: "100%",
              overflowX: "auto", // allows horizontal scrolling on small screens
            }}
          >
            <Table sx={{ minWidth: 800 /* ensure table doesn’t collapse */ }}>
              <thead className="bg-gray-200">
                <tr>
                  <th className="border px-3 py-2">Order ID</th>
                  <th className="border px-3 py-2">Item</th>
                  <th className="border px-3 py-2">Metal</th>
                  <th className="border px-3 py-2">Weight</th>
                  <th className="border px-3 py-2">Total</th>
                  <th className="border px-3 py-2 ">Paid</th>
                  <th className="border px-3 py-2">Due</th>
                  <th className="border px-3 py-2">Worker</th>
                  <th className="border px-3 py-2">Pay</th>
                  <th className="border px-3 py-2">View</th>
                  <th className="border px-3 py-2">Edit</th>
                  <th className="border px-3 py-2">Delete</th>
                </tr>
              </thead>

              <TableBody>
                {ordersList.map((ord) => (
                  <TableRow key={ord.orderId}>
                    <TableCell
                      className="border px-3 py-2 text-center"
                      sx={{ fontSize: "0.95rem" }}
                    >
                      <div className="flex justify-center items-center">
                        {ord.orderId}
                      </div>
                    </TableCell>

                    <TableCell
                      className="border px-3 py-2 text-center"
                      sx={{ fontSize: "0.95rem" }}
                    >
                      <div className="flex justify-center items-center">
                        {ord.itemName}
                      </div>
                    </TableCell>

                    <TableCell
                      className="border px-3 py-2 text-center"
                      sx={{ fontSize: "0.95rem" }}
                    >
                      <div className="flex justify-center items-center">
                        {ord.metal}
                      </div>
                    </TableCell>

                    <TableCell
                      className="border px-3 py-2 text-center"
                      sx={{ fontSize: "0.95rem" }}
                    >
                      <div className="flex justify-center items-center">
                        {ord.metal_weight}
                      </div>
                    </TableCell>

                    <TableCell
                      className="border px-3 py-2 text-center"
                      sx={{ fontSize: "0.95rem" }}
                    >
                      <div className="flex justify-center items-center">
                        {ord.total_item_amount}
                      </div>
                    </TableCell>

                    <TableCell
                      className="border px-3 py-2 text-center"
                      sx={{ fontSize: "0.95rem" }}
                    >
                      <div className="flex justify-center items-center">
                        {ord.paidAmount}
                      </div>
                    </TableCell>

                    <TableCell
                      className={`border px-3 py-2  text-center ${
                        ord.dueAmount !== 0 ? "text-red-600 font-semibold" : ""
                      }`}
                    >
                      <div className="flex justify-center items-center">
                        {formatMoney(ord.dueAmount)}
                      </div>
                    </TableCell>

                    <TableCell
                      className="border px-3 py-2 text-center"
                      sx={{ fontSize: "0.95rem" }}
                    >
                      <div className="flex justify-center items-center">
                        {ord.workerPay ? (
                          ord.workerPay.fullName
                        ) : (
                          <IconButton
                            size="medium"
                            sx={{
                              color: "#9C27B0",
                              "&:hover": { backgroundColor: "#E0E0E0" },
                              borderRadius: "50%", // ✅ ensures round hover effect
                            }}
                            onClick={() => {
                              setAssignOrderId(ord.orderId);
                              setSelectedWorkerId("");
                              setWorkerPayAmount("");
                              setWorkerPayWastage("");
                              setAssignDialogOpen(true);
                            }}
                          >
                            <PersonAddIcon fontSize="medium" />
                          </IconButton>
                        )}
                      </div>
                    </TableCell>

                    <TableCell
                      className="border px-3 py-2 text-center"
                      sx={{ fontSize: "0.95rem" }}
                    >
                      <div className="flex justify-center items-center">
                        {asNumber(ord.dueAmount) !== 0 ? (
                          <IconButton
                            size="medium"
                            sx={{
                              color: "#4CAF50", // solid green background
                              "&:hover": { backgroundColor: "#E0E0E0" },
                            }}
                            onClick={() => {
                              setSelectedOrderId(ord.orderId);
                              setPayAmount("");
                              setPayDialogOpen(true);
                            }}
                          >
                            <CurrencyRupeeIcon fontSize="medium" />
                          </IconButton>
                        ) : (
                          "-"
                        )}
                      </div>
                    </TableCell>

                    <TableCell
                      className="border px-3 py-2 text-center"
                      sx={{ fontSize: "0.95rem" }}
                    >
                      <div className="flex justify-center items-center">
                        <IconButton
                          size="medium"
                          color="primary"
                          sx={{
                            "&:hover": { backgroundColor: "#E0E0E0" },
                          }}
                          onClick={() => handleViewMore(ord.orderId)}
                        >
                          <VisibilityIcon fontSize="medium" />
                        </IconButton>
                      </div>
                    </TableCell>

                    <TableCell
                      className="border px-3 py-2 text-center"
                      sx={{ fontSize: "0.95rem" }}
                    >
                      <div className="flex justify-center items-center">
                        {order.deliveryStatus === "Canceled" ? (
                          <>-</>
                        ) : (
                          <IconButton
                            size="small"
                            color="warning"
                            sx={{
                              "&:hover": { backgroundColor: "#E0E0E0" },
                            }}
                            onClick={() => {
                              setOrder({
                                metal: ord.metal || "",
                                metalPrice:
                                  ord.metal === "24 Gold"
                                    ? parseFloat(
                                        localStorage.getItem("Gold24Price") ||
                                          "0"
                                      )
                                    : ord.metal === "22 Gold"
                                    ? parseFloat(
                                        localStorage.getItem("Gold22Price") ||
                                          "0"
                                      )
                                    : ord.metal === "999 Silver"
                                    ? parseFloat(
                                        localStorage.getItem(
                                          "Silver999Price"
                                        ) || "0"
                                      )
                                    : ord.metal === "995 Silver"
                                    ? parseFloat(
                                        localStorage.getItem(
                                          "Silver995Price"
                                        ) || "0"
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
                                stockBox: ord.stockBox || 0,
                                discount: ord.discount || 0,
                                deliveryStatus:
                                  ord.deliveryStatus ||
                                  ord.delivery_status ||
                                  "",
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
                        )}
                      </div>
                    </TableCell>

                    <TableCell
                      className="border px-3 py-2 text-center"
                      sx={{ fontSize: "0.95rem" }}
                    >
                      <div className="flex justify-center items-center">
                        {order.deliveryStatus === "Canceled" ? (
                          <CheckCircleIcon color="success" />
                        ) : editBillDetails === "editBill" ? (
                          "-"
                        ) : (
                          <IconButton
                            size="small"
                            sx={{
                              color: "#A0522D",
                              "&:hover": { backgroundColor: "#E0E0E0" },
                            }}
                            onClick={() => handleClickOrderOpen(ord.orderId)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </div>
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
          </Box>
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
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr", // 12 columns → 1 column on xs
                  sm: "repeat(2, 1fr)", // 6 columns → 2 columns on sm
                  md: "repeat(3, 1fr)", // 4 columns → 3 columns on md
                  lg: "repeat(4, 1fr)", // 3 columns → 4 columns on lg
                },
                gap: 3, // spacing between items (like Grid spacing={3})
              }}
            >
              {Object.entries(exchange).map(([key, value]) => (
                <Box key={key}>
                  {key === "exchange_metal" ? (
                    // 🔸 Dropdown for metal type
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
                        shrink: true,
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
                      <MenuItem value="24 Gold">24 Gold</MenuItem>
                      <MenuItem value="22 Gold">22 Gold</MenuItem>
                      <MenuItem value="999 Silver">999 Silver</MenuItem>
                      <MenuItem value="995 Silver">995 Silver</MenuItem>
                      <MenuItem value="Gold">Gold</MenuItem>
                      <MenuItem value="Silver">Silver</MenuItem>
                    </TextField>
                  ) : key === "exchange_metal_price" ? (
                    // 🔸 Editable Exchange Metal Price field
                    <TextField
                      {...thickTextFieldProps}
                      label="Exchange Metal Price"
                      type="number"
                      value={
                        exchange.exchange_metal_price === 0
                          ? ""
                          : exchange.exchange_metal_price
                      }
                      onChange={(e) => {
                        const newPrice = Number(e.target.value) || 0;
                        setExchange((prev) => ({
                          ...prev,
                          exchange_metal_price: newPrice,
                          exchange_item_amount: Math.round(
                            (newPrice * prev.exchange_purity_weight) / 10
                          ),
                        }));
                      }}
                      fullWidth
                      variant="outlined"
                      error={!!exchangeErrors.exchange_metal_price}
                      helperText={exchangeErrors.exchange_metal_price || ""}
                    />
                  ) : (
                    // 🔸 Default for other fields
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
                        typeof value === "number" && value === 0 ? "" : value
                      }
                      error={!!exchangeErrors[key]}
                      helperText={exchangeErrors[key] || ""}
                      onChange={(e) => {
                        const newValue =
                          typeof value === "number"
                            ? e.target.value === ""
                              ? 0
                              : Number(e.target.value)
                            : e.target.value;

                        setExchange((prev) => ({
                          ...prev,
                          [key]: newValue,
                          // ✅ recalc item amount if purity weight changes
                          exchange_item_amount:
                            key === "exchange_purity_weight"
                              ? Math.round(
                                  (prev.exchange_metal_price *
                                    Number(e.target.value || 0)) /
                                    10
                                )
                              : prev.exchange_item_amount,
                        }));
                      }}
                    />
                  )}
                </Box>
              ))}
            </Box>

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
          <h3 className=" text-3xl font-bold mb-10 text-blue-600">
            Exchange / Return Summary
          </h3>
          <Box
            sx={{
              width: "100%",
              overflowX: "auto", // allows horizontal scrolling on small screens
            }}
          >
            <Table sx={{ minWidth: 800 /* ensure table doesn’t collapse */ }}>
              <thead className="bg-gray-200">
                <tr>
                  <th className="border px-3 py-2">ID</th>
                  <th className="border px-3 py-2">Order ID</th>
                  <th className="border px-3 py-2">Metal</th>
                  <th className="border px-3 py-2">Name</th>
                  <th className="border px-3 py-2">Gross Weight</th>
                  <th className="border px-3 py-2">Weight</th>
                  <th className="border px-3 py-2">Purity</th>
                  <th className="border px-3 py-2">Metal Price</th>
                  <th className="border px-3 py-2">Amount</th>
                  <th className="border px-3 py-2">Edit</th>
                  <th className="border px-3 py-2">Delete</th>
                </tr>
              </thead>

              <TableBody>
                {exchangeList.map((ex) => (
                  <TableRow key={ex.oldItemId}>
                    <TableCell
                      className="border px-3 py-2 text-center"
                      sx={{ fontSize: "0.95rem" }}
                    >
                      <div className="flex justify-center items-center">
                        {ex.oldItemId}
                      </div>
                    </TableCell>

                    <TableCell
                      className="border px-3 py-2 text-center"
                      sx={{ fontSize: "0.95rem" }}
                    >
                      <div className="flex justify-center items-center">
                        {ex.orderId}
                      </div>
                    </TableCell>

                    <TableCell
                      className="border px-3 py-2 text-center"
                      sx={{ fontSize: "0.95rem" }}
                    >
                      <div className="flex justify-center items-center">
                        {ex.exchange_metal}
                      </div>
                    </TableCell>

                    <TableCell
                      className="border px-3 py-2 text-center"
                      sx={{ fontSize: "0.95rem" }}
                    >
                      <div className="flex justify-center items-center">
                        {ex.exchange_metal_name}
                      </div>
                    </TableCell>

                    <TableCell
                      className="border px-3 py-2 text-center"
                      sx={{ fontSize: "0.95rem" }}
                    >
                      <div className="flex justify-center items-center">
                        {ex.exchange_metal_gross_weight}
                      </div>
                    </TableCell>

                    <TableCell
                      className="border px-3 py-2 text-center"
                      sx={{ fontSize: "0.95rem" }}
                    >
                      <div className="flex justify-center items-center">
                        {ex.exchange_metal_weight}
                      </div>
                    </TableCell>

                    <TableCell
                      className="border px-3 py-2 text-center"
                      sx={{ fontSize: "0.95rem" }}
                    >
                      <div className="flex justify-center items-center">
                        {ex.exchange_purity_weight}
                      </div>
                    </TableCell>

                    <TableCell
                      className="border px-3 py-2 text-center"
                      sx={{ fontSize: "0.95rem" }}
                    >
                      <div className="flex justify-center items-center">
                        {ex.exchange_metal_price}
                      </div>
                    </TableCell>

                    <TableCell
                      className="border px-3 py-2 text-center"
                      sx={{ fontSize: "0.95rem" }}
                    >
                      <div className="flex justify-center items-center">
                        {ex.exchange_item_amount}
                      </div>
                    </TableCell>

                    <TableCell
                      className="border px-3 py-2 text-center"
                      sx={{ fontSize: "0.95rem" }}
                    >
                      <div className="flex justify-center items-center">
                        <IconButton
                          size="small"
                          color="warning"
                          sx={{
                            "&:hover": { backgroundColor: "#E0E0E0" },
                          }}
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
                      </div>
                    </TableCell>

                    <TableCell
                      className="border px-3 py-2 text-center"
                      sx={{ fontSize: "0.95rem" }}
                    >
                      <div className="flex justify-center items-center">
                        <IconButton
                          size="small"
                          color="warning"
                          sx={{
                            "&:hover": { backgroundColor: "#E0E0E0" },
                          }}
                          onClick={() => handleClickOldItemOpen(ex.oldItemId)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </div>
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
          </Box>
        </Paper>
      )}
      <Box display="flex" justifyContent="flex-end" mt={3}>
        {!fromBillDetails && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleBillGenerate}
            sx={{
              position: "relative",
              overflow: "hidden",
              color: "#fff",
              fontWeight: "bold",
              textTransform: "none",
              borderRadius: "8px",
            }}
          >
            Bill Generate
          </Button>
        )}

        <style>
          {`
      @keyframes waveBright {
        0% {
          background-position: 0% 50%;
        }
        100% {
          background-position: 200% 50%;
        }
      }
    `}
        </style>
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

              console.log("pay orderId :", selectedOrderId);
              console.log("paymethod :", payMethod);
              console.log("pay amount :", payAmount);

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
                const checkPayEdit = localStorage.getItem(
                  "editBillFromBillDetails"
                );

                if (checkPayEdit === "editBill") {
                  setIsBillEditing(true);
                }
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
            sx={{ mb: 2 }} // 👈 margin-bottom = spacing(2)
          />
          <TextField
            label="Worker Pay Wastage"
            type="number"
            fullWidth
            value={workerPayWastage}
            onChange={(e) => setWorkerPayWastage(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (
                !assignOrderId ||
                !selectedWorkerId ||
                (!workerPayAmount && !workerPayWastage) // both empty
              ) {
                alert(
                  "Please fill all required fields (enter either amount or wastage)"
                );
                return;
              }

              try {
                // ✅ 1. Make API call
                const requestBody: any = {
                  workerId: selectedWorkerId,
                };

                // add only one of them
                if (workerPayAmount) {
                  requestBody.workPay = Number(workerPayAmount);
                } else if (workerPayWastage) {
                  requestBody.wastage = Number(workerPayWastage);
                }

                await api.post(
                  `/admin/addWorkerPay/${assignOrderId}`,
                  requestBody,
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
