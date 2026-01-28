// Final Updated BillDetails.tsx
import React, { useEffect, useState } from "react";
import {
  TextField,
  Table,
  TableRow,
  TableCell,
  TableBody,
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
import Grid from "@mui/material/Grid";
import api from "@/services/api"; // ← import your api.ts
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
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
}

export interface Customer {
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

  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | "">("");
  const [workerPayAmount, setWorkerPayAmount] = useState("");
  const [workerPayWastage, setWorkerPayWastage] = useState("");

  const [assignOrderId, setAssignOrderId] = useState<number | null>(null);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [, setEditingOrderId] = useState<number | null>(null);
  const [payMethod, setPayMethod] = useState("");

  const token = localStorage.getItem("token");
  const billNumber = localStorage.getItem("billNumber");
  console.log("billNumber   ::        " + billNumber);

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

  const handleEditOrder = (orderId: number) => {
    localStorage.removeItem("editBillFromBillDetails");
    if (!orderId) {
      console.error("❌ editingOrderId is missing before navigation");
      return;
    }

    console.log("✅ Navigating to Orders page with orderId:", orderId);

    localStorage.setItem("editBillFromBillDetails", "editBill");

    navigate(`/admin/orders/`, {
      replace: true,
      state: {
        fromBillDetails: true,
        customerId: customer?.customerId,
        orderId: orderId, // pass orderId directly
      },
    });
  };

  const asNumber = (v: string | number | null | undefined): number =>
    v == null || v === "" ? 0 : Number(v);

  const formatMoney = (v: string | number | null | undefined): string =>
    asNumber(v).toLocaleString("en-IN", {
      maximumFractionDigits: 0, // no decimals
    });

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
                Generate Bill
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
                <span className="text-gray-300 font-medium">Email:</span>
                <span className="text-orange-300 font-semibold">
                  {customer.emailId || "—"}
                </span>
              </p>
            </div>

            {/* Right column */}
            <div className="space-y-4 pl-4">
              <p className="flex justify-between">
                <span className="text-gray-300 font-medium">Total Amount:</span>
                <span className="text-green-400 font-semibold">
                  {customer.billTotalAmount}
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
            <h3 className=" text-3xl font-bold mb-10 text-blue-600">
              Billing History
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
                    <th className="border px-3 py-2">Date</th>
                    <th className="border px-3 py-2">Item</th>
                    <th className="border px-3 py-2">Metal</th>
                    <th className="border px-3 py-2">Weight</th>
                    <th className="border px-3 py-2">Status</th>
                    <th className="border px-3 py-2">Total</th>
                    <th className="border px-3 py-2">Paid</th>

                    <th className="border px-3 py-2">Due</th>
                    <th className="border px-3 py-2">Worker</th>
                    <th className="border px-3 py-2">Pay</th>
                    <th className="border px-3 py-2">View</th>
                    <th className="border px-3 py-2">Edit</th>
                    <th className="border px-3 py-2">Cancel</th>
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
                        {order.itemName}
                      </TableCell>
                      <TableCell className={`border px-3 py-2 `}>
                        {order.metal}
                      </TableCell>
                      <TableCell className={`border px-3 py-2 `}>
                        {order.metal_weight}
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

                      <TableCell
                        className={`border px-3 py-2 `}
                        sx={{
                          color: "#ca8a04",
                        }}
                      >
                        {order.total_item_amount.toFixed(2)}
                      </TableCell>

                      <TableCell
                        className={`border px-3 py-2 `}
                        sx={{
                          color: "#15803d",
                        }}
                      >
                        {order.paidAmount}
                      </TableCell>
                      <TableCell
                        className={`border px-3 py-2 ${
                          order.dueAmount !== 0
                            ? "text-red-600 font-semibold"
                            : ""
                        }`}
                      >
                        {formatMoney(order.dueAmount)}
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

                      <TableCell className={`border px-3 py-2 `}>
                        {asNumber(order.dueAmount) !== 0 ? (
                          <IconButton
                            size="medium"
                            sx={{
                              color: "#4CAF50", // solid green background
                              "&:hover": { backgroundColor: "#E0E0E0" },
                            }}
                            onClick={() => {
                              setSelectedOrderId(order.orderId);
                              setPayAmount("");
                              setPayDialogOpen(true);
                            }}
                          >
                            <CurrencyRupeeIcon fontSize="medium" />
                          </IconButton>
                        ) : (
                          "-"
                        )}
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
                      <TableCell className={`border px-3 py-2 `}>
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
                      </TableCell>
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
                    </TableRow>
                  ))}
                  <Dialog open={orderOpen} onClose={handleOrderClose}>
                    <DialogTitle>Confirm Cancelation</DialogTitle>
                    <DialogContent>
                      <DialogContentText>
                        Are you sure you want to Cancel this order item with ID:
                        {slectOrderId}
                        <strong>{selectedOrderId}</strong>?
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

      {/* Pay Dialog */}
      <Dialog open={payDialogOpen} onClose={() => setPayDialogOpen(false)}>
        <DialogTitle>Enter Payment Amount</DialogTitle>
        <DialogContent
          sx={{
            px: 4,
            py: 3,
          }}
        >
          <Grid container spacing={3} direction="column">
            {/* Payment Type */}
            <Grid size={{ xs: 12 }}>
              <TextField
                select
                label="Payment Type"
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                fullWidth
              >
                <MenuItem value="">
                  <em>Select Payment Method</em>
                </MenuItem>
                <MenuItem value="Phone Pay">Phone Pay</MenuItem>
                <MenuItem value="Cash">Cash</MenuItem>
              </TextField>
            </Grid>

            {/* Amount */}
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Amount"
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
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setPayDialogOpen(false)}>Cancel</Button>

          <Button
            onClick={async () => {
              if (!selectedOrderId || !payAmount) return;

              console.log("selectedOrderId :", selectedOrderId);
              console.log("payMethod :", payMethod);
              console.log("payAmount :", payAmount);
              console.log("token :", token);

              try {
                await api.post(
                  `/admin/payCustomer/${selectedOrderId}/${payMethod}?amount=${payAmount}`,
                  {},
                  { headers: { Authorization: `Bearer ${token}` } },
                );

                const updatedOrders = orders.map((o) => {
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
                fetchCustomerDetails();

                setOrders(updatedOrders);

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

                requestBody.workPay = Number(workerPayAmount);

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
    </div>
  );
};

export default BillDetails;
