// Final Updated BillDetails.tsx
import React, { useEffect, useState } from "react";
import {
  TextField,
  Table,
  TableRow,
  TableCell,
  TableBody,
  TableHead,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  MenuItem,
  IconButton,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import api from "@/services/api"; // ← import your api.ts
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { Box } from "@mui/system";

interface selectedOrders {
  orderId: number;
  orderDate: string;
  itemName: string;
  metal: string;
  metal_weight: number;
  total_item_amount: number;
  paidAmount: number;
  deliveryStatus: string;
  dueAmount: number;
  workerPay?: { fullName: string };
  workAssigned?: { workerName: string };
}
interface TransactionHistory {
  transactionId: number;
  paymentMethod: string;
  paymentType: string;
  paidAmount: number;
  paymentDate: string;
  orderId: number | null;
  billId: number;
}
export interface Customer {
  billId: number;
  customerId: number;
  billNumber: string;
  name: string;
  village: string;
  phoneNumber: string;
  emailId: string;
  billTotalAmount: number;
  billDiscountAmount: number;
  exchangeAmount: number;
  billPaidAmount: number;
  billResAmount: number;
  billDueAmount: number;
  version: number;
  selectedOrders: selectedOrders[]; // <== Ensure this line exists
}

interface Worker {
  workerId: number;
  fullName: string;
}

const BillDetails: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<selectedOrders[]>([]);
  const [workerList, setWorkerList] = useState<Worker[]>([]);

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | "">("");
  const [workerPayAmount, setWorkerPayAmount] = useState("");
  const [workerPayWastage, setWorkerPayWastage] = useState("");

  const [assignOrderId, setAssignOrderId] = useState<number | null>(null);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [, setEditingOrderId] = useState<number | null>(null);

  const token = localStorage.getItem("token");
  const billNumber = localStorage.getItem("billNumber");
  console.log("billNumber   ::        " + billNumber);

  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [transactions, setTransactions] = useState<TransactionHistory[]>([]);
  const [transactionLoading, setTransactionLoading] = useState(false);

  const handleViewTransactions = async () => {
    if (!customer?.billId) {
      alert("Bill ID not found");
      return;
    }

    setTransactionDialogOpen(true);
    setTransactionLoading(true);

    try {
      const res = await api.get<TransactionHistory[]>(
        `/admin/transactionHistoryCustomer/${customer.billId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setTransactions(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Transaction history fetch failed:", error);
      alert("Failed to fetch transaction history");
    } finally {
      setTransactionLoading(false);
    }
  };

  const fetchCustomerDetails = async () => {
    localStorage.removeItem("checkEditBill");

    try {
      const res = await api.get(`/admin/getDataByBillNumber/${billNumber}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const customerData = res.data as Customer;

      // ✅ check if no valid data
      if (!customerData || !customerData.customerId) {
        navigate("/admin/customers", {
          replace: true,
          state: {
            errorMessage: `No data found for Bill Number: ${billNumber}`,
          },
        });
        return;
      }

      sessionStorage.removeItem("customer");
      sessionStorage.removeItem("orders");
      sessionStorage.removeItem("billingFrom");

      setCustomerId(customerData.customerId);
      setCustomer(customerData);
      setOrders(customerData.selectedOrders || []);

      sessionStorage.setItem("customer", JSON.stringify(customerData));
      sessionStorage.setItem(
        "orders",
        JSON.stringify(customerData.selectedOrders || []),
      );
    } catch (err) {
      console.error("Error fetching bill details:", err);
      navigate("/admin/customers", {
        replace: true,
        state: {
          errorMessage: `No data found for Bill Number: ${billNumber}`,
        },
      });
    }
  };
  const formatTransactionDate = (dateString: string) => {
    if (!dateString) return "-";

    const date = new Date(dateString);

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  useEffect(() => {
    if (!billNumber || !token) return;

    fetchCustomerDetails();

    api
      .get(`/admin/getAllWorkers`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (Array.isArray(res.data)) setWorkerList(res.data);
      })
      .catch((err) => console.error("Worker fetch failed:", err));
  }, []);

  useEffect(() => {
    navigate(location.pathname, { replace: true });
    const shouldPush = !sessionStorage.getItem("preventPushBack");
    if (shouldPush) {
      window.history.pushState(null, "", "/admin/customers");
      sessionStorage.setItem("preventPushBack", "true");
    }
    const handlePopState = () =>
      navigate("/admin/customers", { replace: true });
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleViewMore = (orderId: number) => {
    sessionStorage.removeItem("ordersState");
    sessionStorage.removeItem("from");
    sessionStorage.setItem("ordersState", JSON.stringify({ orders }));
    sessionStorage.setItem("from", "BillDetails");

    // Navigate to order details
    navigate(`/admin/order-details/${orderId}`, {
      replace: true,
      state: { from: "BillDetails" },
    });
  };

  const handleBackClick = () => {
    const CheckBack = localStorage.getItem("CheckBack");

    if (CheckBack === "AllBillBack") {
      navigate("/admin/billing-orders");
    } else {
      navigate("/admin/bill-Data");
    }
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleString("en-IN", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const [orderOpen, setOrderOpen] = useState(false);
  const [slectOrderId, setSlectOrderId] = useState<number | null>(null);

  const handleClickOrderOpen = (id: number) => {
    setSlectOrderId(id);
    setOrderOpen(true);
  };

  const handleOrderClose = () => {
    setOrderOpen(false);
    setSlectOrderId(null);
  };

  const handleOrderDelete = async () => {
    console.log("selectedId  :" + slectOrderId);
    if (slectOrderId === null) return;

    try {
      const response = await api.put(
        `/admin/cancelOrder/${slectOrderId}`,
        {}, // no body
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.status === 200) {
        const message = response.data; // The backend message
        console.log("Server message:", message);

        if (message === "Order canceled successfully and billing updated") {
          fetchCustomerDetails();
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

  // const handleEditOrder = (orderId: number) => {
  //   localStorage.removeItem("editBillFromBillDetails");
  //   if (!orderId) {
  //     console.error("❌ editingOrderId is missing before navigation");
  //     return;
  //   }

  //   console.log("✅ Navigating to Orders page with orderId:", orderId);

  //   localStorage.setItem("editBillFromBillDetails", "editBill");

  //   navigate(`/admin/orders/`, {
  //     replace: true,
  //     state: {
  //       fromBillDetails: true,
  //       customerId: customer?.customerId,
  //       orderId: orderId, // pass orderId directly
  //     },
  //   });
  // };

  const [assignWorkDialogOpen, setAssignWorkDialogOpen] = useState(false);
  const [workerNameInput, setWorkerNameInput] = useState("");

  const handleSaveWorkerName = async () => {
    try {
      if (!assignOrderId) return;

      console.log("assignOrderId", { assignOrderId });
      console.log("workerNameInput", workerNameInput.trim().toString());
      console.log("token", token);

      await api.post(
        `/admin/order/${assignOrderId}/workAssigned`,
        { workerName: workerNameInput.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      await fetchCustomerDetails(); // refresh table

      setAssignWorkDialogOpen(false); // ✅ correct state
      setWorkerNameInput("");
      setAssignOrderId(null);
    } catch (err) {
      console.log("Worker assign failed", err);
    }
  };

  if (!customer) return null;

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
              Bill Details
            </h2>

            {/* ✅ Generate Bill Button (top right) */}
            <div className="ml-auto">
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
                onClick={() => {
                  sessionStorage.removeItem("ordersState");
                  sessionStorage.setItem(
                    "ordersState",
                    JSON.stringify({ orders, customerId }),
                  );
                  sessionStorage.setItem("billingFrom", "BillDetails");
                  console.log("Ids :" + orders.map((order) => order.orderId));

                  localStorage.setItem("checkEditBill", "YesEdit");

                  navigate("/admin/generate-bill", {
                    replace: true,
                    state: {
                      selectedOrders: orders.map((order) => order.orderId),
                      billingFrom: "BillDetails",
                      billNumber: billNumber,
                    },
                  });
                }}
              >
                View Bill
              </Button>
            </div>
          </div>

          {/* Grid Info */}
          <div className="grid grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-4 pr-4 border-r border-white/20">
              <p className="flex justify-between">
                <span className="text-gray-300 font-medium">Bill Number:</span>
                <span className="text-emerald-300 font-semibold">
                  {customer.billNumber}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-300 font-medium">Name:</span>
                <span className="text-purple-300 font-semibold">
                  {customer.name}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-300 font-medium">Village:</span>
                <span className="text-indigo-300 font-semibold">
                  {customer.village}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-300 font-medium">Phone:</span>
                <span className="text-teal-300 font-semibold">
                  {customer.phoneNumber}
                </span>
              </p>

              <p className="flex justify-between">
                <span className="text-gray-300 font-medium">Total Amount:</span>
                <span className="text-green-400 font-semibold">
                  {customer.billTotalAmount}
                </span>
              </p>
            </div>

            {/* Right column */}
            <div className="space-y-4 pl-4">
              <p className="flex justify-between">
                <span className="text-gray-300 font-medium">Discount:</span>
                <span className="text-green-400 font-semibold">
                  {customer.billDiscountAmount}
                </span>
              </p>

              <p className="flex justify-between">
                <span className="text-gray-300 font-medium">
                  Exchange Amount:
                </span>
                <span className="text-blue-400 font-semibold">
                  {customer.exchangeAmount}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-300 font-medium">Paid Amount:</span>
                <span className="text-sky-400 font-semibold">
                  {customer.billPaidAmount}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-300 font-medium">
                  Received Amount:
                </span>
                <span className="text-purple-400 font-semibold">
                  {customer.billResAmount}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-300 font-medium">Due Amount:</span>
                <span className="text-red-400 font-semibold">
                  {customer.billDueAmount}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-10 p-3 flex flex-col items-center justify-center">
        {orders.length > 0 && (
          <div className="p-6 rounded-3xl w-full max-w-6xl bg-white/75 backdrop-blur-lg border border-[#d0b3ff] shadow-[0_10px_30px_rgba(136,71,255,0.3)]">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-3xl font-bold text-blue-600">
                Billing History
              </h3>

              <Button
                variant="contained"
                onClick={handleViewTransactions}
                sx={{
                  background: "linear-gradient(135deg, #7c3aed, #ec4899)",
                  borderRadius: "999px",
                  textTransform: "none",
                  fontWeight: "700",
                  px: 3,
                  py: 1,
                  boxShadow: "0 8px 18px rgba(124,58,237,0.35)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #6d28d9, #db2777)",
                  },
                }}
              >
                View Transactions
              </Button>
            </div>
            <Box
              sx={{
                width: "100%",
                overflowX: "auto", // allows horizontal scrolling on small screens
              }}
            >
              <Table sx={{ minWidth: 800 /* ensure table doesn’t collapse */ }}>
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border px-3 py-2 text-center">
                      <div className="flex justify-center items-center">
                        Order ID
                      </div>
                    </th>
                    <th className="border px-3 py-2 text-center">
                      <div className="flex justify-center items-center">
                        Date
                      </div>
                    </th>
                    <th className="border px-3 py-2 text-center">
                      <div className="flex justify-center items-center">
                        Metal
                      </div>
                    </th>
                    <th className="border px-3 py-2 text-center">
                      <div className="flex justify-center items-center">
                        Item
                      </div>
                    </th>

                    <th className="border px-3 py-2 text-center">
                      <div className="flex justify-center items-center">
                        Weight
                      </div>
                    </th>

                    <th className="border px-3 py-2 text-center">
                      <div className="flex justify-center items-center">
                        Total
                      </div>
                    </th>
                    <th className="border px-3 py-2 text-center">
                      <div className="flex justify-center items-center">
                        Worker
                      </div>
                    </th>
                    <th className="border px-3 py-2 text-center">
                      <div className="flex justify-center items-center">
                        Wrk.A
                      </div>
                    </th>
                    <th className="border px-3 py-2 text-center">
                      <div className="flex justify-center items-center">
                        View
                      </div>
                    </th>
                    {/* <th className="border px-3 py-2 text-center">
                      <div className="flex justify-center items-center">
                        Edit
                      </div>
                    </th> */}
                    <th className="border px-3 py-2 text-center">
                      <div className="flex justify-center items-center">
                        Cancel
                      </div>
                    </th>
                    <th className="border px-3 py-2 text-center">
                      <div className="flex justify-center items-center">
                        Status
                      </div>
                    </th>
                  </tr>
                </thead>

                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.orderId}>
                      <TableCell className={`border px-3 py-2 `}>
                        {order.orderId}
                      </TableCell>
                      <TableCell className={`border px-3 py-2 `}>
                        {formatDate(order.orderDate)}
                      </TableCell>
                      <TableCell className={`border px-3 py-2 `}>
                        {order.metal}
                      </TableCell>
                      <TableCell className={`border px-3 py-2 `}>
                        {order.itemName}
                      </TableCell>

                      <TableCell className={`border px-3 py-2 `}>
                        {order.metal_weight}
                      </TableCell>
                      <TableCell
                        className={`border px-3 py-2 `}
                        sx={{
                          color: "#ca8a04",
                        }}
                      >
                        {order.total_item_amount.toFixed(2)}
                      </TableCell>

                      <TableCell className={`border px-3 py-2 `}>
                        {order.workerPay ? (
                          order.workerPay.fullName
                        ) : (
                          <IconButton
                            size="medium"
                            sx={{
                              color: "#9C27B0",
                              "&:hover": { backgroundColor: "#E0E0E0" },
                              borderRadius: "50%", // ✅ ensures round hover effect
                            }}
                            onClick={() => {
                              setAssignOrderId(order.orderId);
                              setSelectedWorkerId("");
                              setWorkerPayAmount("");
                              setWorkerPayWastage("");
                              setAssignDialogOpen(true);
                            }}
                          >
                            <PersonAddIcon fontSize="medium" />
                          </IconButton>
                        )}
                      </TableCell>

                      <TableCell className="border px-3 py-2">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          {/* Show name if exists else show "-" */}
                          <span
                            style={{
                              cursor: "pointer",
                              fontWeight: 600,
                              color: order.workAssigned?.workerName
                                ? "#222"
                                : "#999",
                            }}
                            onClick={() => {
                              setAssignOrderId(order.orderId);
                              setWorkerNameInput(
                                order.workAssigned?.workerName || "",
                              );
                              setAssignWorkDialogOpen(true);
                            }}
                          >
                            {order.workAssigned?.workerName || "Add"}
                          </span>

                          {/* Always show icon */}
                          <IconButton
                            size="small"
                            sx={{
                              color: "#9C27B0",
                              "&:hover": { backgroundColor: "#E0E0E0" },
                              borderRadius: "50%",
                            }}
                            onClick={() => {
                              setAssignOrderId(order.orderId);
                              setWorkerNameInput(
                                order.workAssigned?.workerName || "",
                              );
                              setAssignWorkDialogOpen(true);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </div>
                      </TableCell>

                      <TableCell className={`border px-3 py-2 `}>
                        <IconButton
                          size="medium"
                          color="primary"
                          sx={{
                            "&:hover": { backgroundColor: "#E0E0E0" },
                          }}
                          onClick={() => handleViewMore(order.orderId)}
                        >
                          <VisibilityIcon fontSize="medium" />
                        </IconButton>
                      </TableCell>
                      {/* <TableCell className={`border px-3 py-2 `}>
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
                              setEditingOrderId(order.orderId);
                              handleEditOrder(order.orderId);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        )}
                      </TableCell> */}
                      <TableCell className={`border px-3 py-2 `}>
                        {order.deliveryStatus === "Canceled" ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <IconButton
                            size="small"
                            sx={{
                              color: "#A0522D",
                              "&:hover": { backgroundColor: "#E0E0E0" },
                            }}
                            onClick={() => handleClickOrderOpen(order.orderId)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </TableCell>
                      <TableCell
                        className={`border px-3 py-2 `}
                        sx={{
                          color:
                            order.deliveryStatus === "Delivered"
                              ? "#2e7d32" // green
                              : order.deliveryStatus === "Pending"
                                ? "#ed6c02" // orange/yellow
                                : order.deliveryStatus === "Canceled"
                                  ? "#d32f2f" // red
                                  : "inherit",
                          fontWeight: "bold",
                        }}
                      >
                        {order.deliveryStatus}
                      </TableCell>
                    </TableRow>
                  ))}

                  <Dialog open={orderOpen} onClose={handleOrderClose}>
                    <DialogTitle>Confirm Cancelation</DialogTitle>
                    <DialogContent>
                      <DialogContentText>
                        Are you sure you want to Cancel this order item with ID:
                        {slectOrderId}
                        <strong>{slectOrderId}</strong>?
                      </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={handleOrderClose} color="primary">
                        No
                      </Button>
                      <Button
                        onClick={handleOrderDelete}
                        color="error"
                        autoFocus
                      >
                        Yes, Cancel
                      </Button>
                    </DialogActions>
                  </Dialog>
                </TableBody>
              </Table>
            </Box>
          </div>
        )}
      </div>

      {/* Assign Worker Dialog */}
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
            inputProps={{
              step: "any",
              onKeyDown: (e) => {
                if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                  e.preventDefault();
                }
              },
            }}
            onWheel={(e) => (e.target as HTMLInputElement).blur()}
            fullWidth
            value={workerPayAmount}
            onChange={(e) => setWorkerPayAmount(e.target.value)}
            sx={{ mb: 2 }} // 👈 margin-bottom = spacing(2)
          />
          <TextField
            label="Worker Pay Wastage"
            type="number"
            inputProps={{
              step: "any",
              onKeyDown: (e) => {
                if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                  e.preventDefault();
                }
              },
            }}
            onWheel={(e) => (e.target as HTMLInputElement).blur()}
            fullWidth
            value={workerPayWastage}
            onChange={(e) => setWorkerPayWastage(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (
                !assignOrderId ||
                !selectedWorkerId ||
                (!workerPayAmount && !workerPayWastage) // both empty
              ) {
                alert(
                  "Please fill all required fields (enter either amount or wastage)",
                );
                return;
              }

              try {
                // ✅ 1. Make API call
                const requestBody: any = {
                  workerId: selectedWorkerId,
                };

                if (workerPayAmount)
                  requestBody.workPay = Number(workerPayAmount);
                if (workerPayWastage)
                  requestBody.wastage = Number(workerPayWastage);

                const res = await api.post(
                  `/admin/addWorkerPay/${assignOrderId}`,
                  requestBody,
                  {
                    headers: { Authorization: `Bearer ${token}` },
                  },
                );

                const worker = workerList.find(
                  (w) => w.workerId === selectedWorkerId,
                );
                const updatedOrders = orders.map((o) =>
                  o.orderId === assignOrderId
                    ? {
                        ...o,
                        workerPay: {
                          fullName: worker?.fullName || "Assigned",
                        },
                      }
                    : o,
                );
                setOrders(updatedOrders);
                setAssignDialogOpen(false);
              } catch (error) {
                console.error("Assign worker failed:", error);
                alert("Failed to assign worker");
              }
            }}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={assignWorkDialogOpen}
        onClose={() => setAssignWorkDialogOpen(false)}
      >
        <DialogTitle>
          {workerNameInput ? "Update Worker Name" : "Assign Worker Name"}
        </DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            label="Worker Name"
            value={workerNameInput}
            onChange={(e) => setWorkerNameInput(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setAssignWorkDialogOpen(false)}>Cancel</Button>

          <Button
            variant="contained"
            onClick={handleSaveWorkerName}
            disabled={!workerNameInput.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={transactionDialogOpen}
        onClose={() => setTransactionDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ fontWeight: "bold", color: "#6d28d9" }}>
          Billing Transaction History
        </DialogTitle>

        <DialogContent>
          {transactionLoading ? (
            <div className="text-gray-500 p-4">Loading transactions...</div>
          ) : transactions.length > 0 ? (
            <Table>
              <TableHead className="bg-purple-100">
                <TableRow>
                  <TableCell>
                    <strong>ID</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Method</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Type</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Amount</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Date</strong>
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.transactionId}>
                    <TableCell>{tx.transactionId}</TableCell>
                    <TableCell>{tx.paymentMethod}</TableCell>
                    <TableCell>{tx.paymentType}</TableCell>
                    <TableCell>₹{tx.paidAmount}</TableCell>
                    <TableCell>
                      {formatTransactionDate(tx.paymentDate)}
                    </TableCell>{" "}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-gray-500 p-4">No transactions found</div>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setTransactionDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default BillDetails;
