// Final Updated BillDetails.tsx
import React, { useEffect, useState } from "react";
import {
  TextField,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
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
import axios from "axios";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Grid from "@mui/material/Grid";

interface selectedOrders {
  orderId: number;
  orderDate: string;
  itemName: string;
  metal: string;
  metal_weight: number;
  total_item_amount: number;
  paidAmount: number;
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
  const [assignOrderId, setAssignOrderId] = useState<number | null>(null);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [, setEditingOrderId] = useState<number | null>(null);
  const [payMethod, setPayMethod] = useState("");

  const token = localStorage.getItem("token");
  const apiBase = "http://15.207.98.116:8081";
  const billNumber = localStorage.getItem("billNumber");
  console.log("billNumber   ::        " + billNumber);

  useEffect(() => {
    if (!billNumber || !token) return;

    const fetchCustomerDetails = async () => {
      try {
        const res = await axios.get(
          `${apiBase}/admin/getDataByBillNumber/${billNumber}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

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
          JSON.stringify(customerData.selectedOrders || [])
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

    fetchCustomerDetails();

    axios
      .get(`${apiBase}/admin/getAllWorkers`, {
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
    navigate("/admin/customers");
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
      const response = await axios.delete(
        `${apiBase}/admin/deleteDirectOrder/${slectOrderId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200) {
        const message = response.data; // The backend message
        console.log("Server message:", message);

        if (message === "Yes, It's Deleted") {
          // Remove deleted item from the state
          setOrders((prev) =>
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

  const handleEditOrder = (orderId: number) => {
    if (!orderId) {
      console.error("❌ editingOrderId is missing before navigation");
      return;
    }

    console.log("✅ Navigating to Orders page with orderId:", orderId);

    localStorage.setItem("editBill", "editBill");

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
    <div className="mt-10 p-3 flex flex-col items-center justify-center gap-6">
      <Paper className="p-6 rounded-3xl w-full max-w-6xl bg-white/75 backdrop-blur-lg border border-[#d0b3ff] shadow-md">
        <div className="flex justify-between items-center mb-5">
          <div className="flex">
            {" "}
            <IconButton color="primary" onClick={handleBackClick}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" fontWeight="bold" color="primary">
              Bill Details
            </Typography>
          </div>

          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              sessionStorage.removeItem("ordersState");
              sessionStorage.setItem(
                "ordersState",
                JSON.stringify({ orders, customerId })
              );
              sessionStorage.setItem("billingFrom", "BillDetails");
              console.log("Ids :" + orders.map((order) => order.orderId));
              localStorage.setItem("editBill", "editBill");

              navigate("/admin/generate-bill", {
                replace: true,
                state: {
                  selectedOrders: orders.map((order) => order.orderId),
                  billingFrom: "BillDetails",
                },
              });
            }}
          >
            Bill Generate
          </Button>
        </div>

        <Grid container spacing={3}>
          {["billNumber", "name", "village", "phoneNumber", "emailId"].map(
            (key) => (
              <Grid key={key} size={{ xs: 6, sm: 4 }}>
                <TextField
                  label={key.charAt(0).toUpperCase() + key.slice(1)}
                  value={(customer[key as keyof Customer] ?? "-").toString()}
                  fullWidth
                  InputProps={{ readOnly: true, style: { fontWeight: 500 } }}
                />
              </Grid>
            )
          )}

          {[
            "customerId",
            "billTotalAmount",
            "billDiscountAmount",
            "exchangeAmount",
            "billPaidAmount",
            "billDueAmount",
          ].map((key) => (
            <Grid key={key} size={{ xs: 6, sm: 4 }}>
              <TextField
                label={key.replace(/([A-Z])/g, " $1")}
                value={(customer[key as keyof Customer] ?? "-").toString()}
                fullWidth
                InputProps={{ readOnly: true, style: { fontWeight: 500 } }}
              />
            </Grid>
          ))}
        </Grid>
      </Paper>

      {orders.length > 0 && (
        <Paper className="p-6 rounded-3xl w-full max-w-6xl bg-white/75 backdrop-blur-lg border border-[#d0b3ff] shadow-md">
          <Typography
            variant="h5"
            fontWeight="bold"
            gutterBottom
            color="primary"
          >
            Orders
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Date</TableCell>
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
              {orders.map((order) => (
                <TableRow key={order.orderId}>
                  <TableCell>{order.orderId}</TableCell>
                  <TableCell>{formatDate(order.orderDate)}</TableCell>
                  <TableCell>{order.itemName}</TableCell>
                  <TableCell>{order.metal}</TableCell>
                  <TableCell>{order.metal_weight}</TableCell>
                  <TableCell>{order.total_item_amount}</TableCell>
                  <TableCell>{order.paidAmount}</TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 400,
                      color:
                        asNumber(order.dueAmount) < 0
                          ? "error.main"
                          : "inherit",
                    }}
                  >
                    {formatMoney(order.dueAmount)}
                  </TableCell>
                  <TableCell>
                    {order.workerPay ? (
                      order.workerPay.fullName
                    ) : (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setAssignOrderId(order.orderId);
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
                    {asNumber(order.dueAmount) !== 0 ? (
                      <Button
                        variant="outlined"
                        size="small"
                        color="secondary"
                        onClick={() => {
                          setSelectedOrderId(order.orderId);
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
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => handleViewMore(order.orderId)}
                    >
                      View More
                    </Button>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="warning"
                      onClick={() => {
                        setEditingOrderId(order.orderId);
                        handleEditOrder(order.orderId);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="warning"
                      onClick={() => handleClickOrderOpen(order.orderId)}
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
              try {
                await axios.post(
                  `${apiBase}/admin/payCustomer/${selectedOrderId}/${payMethod}?amount=${payAmount}`,
                  {},
                  { headers: { Authorization: `Bearer ${token}` } }
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
            fullWidth
            value={workerPayAmount}
            onChange={(e) => setWorkerPayAmount(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (!assignOrderId || !selectedWorkerId || !workerPayAmount)
                return;
              try {
                await axios.post(
                  `${apiBase}/admin/addWorkerPay/${assignOrderId}`,
                  {
                    workPay: Number(workerPayAmount),
                    workerId: selectedWorkerId,
                  },
                  {
                    headers: { Authorization: `Bearer ${token}` },
                  }
                );
                const worker = workerList.find(
                  (w) => w.workerId === selectedWorkerId
                );
                const updatedOrders = orders.map((o) =>
                  o.orderId === assignOrderId
                    ? {
                        ...o,
                        workerPay: { fullName: worker?.fullName || "Assigned" },
                      }
                    : o
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
