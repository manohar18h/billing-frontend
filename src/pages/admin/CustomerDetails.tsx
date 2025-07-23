// Final Updated CustomerDetails.tsx
import React, { useEffect, useState } from "react";
import {
  TextField,
  Grid,
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
  MenuItem,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { IconButton } from "@mui/material";

interface Order {
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
  name: string;
  village: string;
  phoneNumber: string;
  emailId: string;
  numberOfOrders: number;
  finalAmount: number;
  totalDueAmount: number;
  version: number;
  orders: Order[]; // <== Ensure this line exists
}

interface Worker {
  workerId: number;
  fullName: string;
}

const CustomerDetails: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [workerList, setWorkerList] = useState<Worker[]>([]);

  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | "">("");
  const [workerPayAmount, setWorkerPayAmount] = useState("");
  const [assignOrderId, setAssignOrderId] = useState<number | null>(null);

  const token = localStorage.getItem("token");
  const apiBase = "http://15.207.98.116:8081";
  const phoneNumber = localStorage.getItem("phnNumber");
  console.log("phoneNumber   ::        " + phoneNumber);

  useEffect(() => {
    if (!phoneNumber || !token) return;

    const fetchCustomerDetails = async () => {
      try {
        const res = await axios.get(
          `${apiBase}/admin/getByCusPhnNumber/${phoneNumber}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const customerData = res.data as Customer;
        setCustomer(customerData);
        setOrders(customerData.orders || []);
        sessionStorage.setItem("customer", JSON.stringify(customerData));
        sessionStorage.setItem(
          "orders",
          JSON.stringify(customerData.orders || [])
        );
      } catch (err) {
        console.error("Error fetching customer details:", err);
        toast.error("Failed to load customer data");
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
    sessionStorage.setItem("customer", JSON.stringify(customer));
    sessionStorage.setItem("orders", JSON.stringify(orders));
    navigate(`/admin/order-details/${orderId}`, {
      state: { customer, orders },
    });
  };

  const handleBackClick = () => {
    navigate("/admin/customers");
  };

  const handleAddOrder = () => {
    localStorage.removeItem("from");
    localStorage.setItem("CusDetailsCustomerId", String(customer?.customerId));
    sessionStorage.setItem("customer", JSON.stringify(customer));
    sessionStorage.setItem("orders", JSON.stringify(orders));
    localStorage.setItem("from", "customerDetails");
    navigate("/admin/orders", {
      replace: true,
      state: { fromCustomerDetails: true, customerId: customer?.customerId },
    });
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleString("en-IN", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

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
              Customer Details
            </Typography>
          </div>

          <Button variant="outlined" onClick={handleAddOrder}>
            Add Order
          </Button>
        </div>

        <Grid container spacing={3}>
          {["name", "village", "phoneNumber", "emailId"].map((key) => (
            <Grid item xs={12} sm={6} key={key}>
              <TextField
                label={key.charAt(0).toUpperCase() + key.slice(1)}
                value={(customer as any)[key] || "-"}
                fullWidth
                InputProps={{ readOnly: true, style: { fontWeight: 500 } }}
              />
            </Grid>
          ))}

          {[
            "customerId",
            "numberOfOrders",
            "finalAmount",
            "totalDueAmount",
          ].map((key) => (
            <Grid item xs={12} sm={6} key={key}>
              <TextField
                label={key.replace(/([A-Z])/g, " $1")}
                value={(customer as any)[key] || "-"}
                fullWidth
                InputProps={{ readOnly: true, style: { fontWeight: 500 } }}
              />
            </Grid>
          ))}
        </Grid>
      </Paper>

      {orders.length > 0 && (
        <Paper className="p-6 rounded-3xl w-full max-w-6xl bg-white/75 backdrop-blur-lg border border-[#d0b3ff] shadow-md">
          <Typography variant="h5" fontWeight="bold" gutterBottom>
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
                  <TableCell>{order.dueAmount}</TableCell>
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
                    {order.dueAmount > 0 ? (
                      <Button
                        variant="outlined"
                        size="small"
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Pay Dialog */}
      <Dialog open={payDialogOpen} onClose={() => setPayDialogOpen(false)}>
        <DialogTitle>Enter Payment Amount</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Amount"
            type="number"
            fullWidth
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (!selectedOrderId || !payAmount) return;
              try {
                await axios.post(
                  `${apiBase}/admin/payCustomer/${selectedOrderId}?amount=${payAmount}`,
                  {},
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                const updatedOrders = orders.map((o) =>
                  o.orderId === selectedOrderId
                    ? {
                        ...o,
                        paidAmount: o.paidAmount + Number(payAmount),
                        dueAmount: Math.max(o.dueAmount - Number(payAmount), 0),
                      }
                    : o
                );
                setOrders(updatedOrders);
                setPayDialogOpen(false);
              } catch (error) {
                alert("Payment failed");
              }
            }}
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

export default CustomerDetails;
