// Updated order.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  TextField,
  Box,
  Grid,
  Button,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { IconButton } from "@mui/material";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
} from "@mui/material";

type AppWorker = {
  workerId: number;
  fullName: string;
};

const Orders: React.FC = () => {
  const [order, setOrder] = useState({
    metal: "",
    metalPrice: 0.0,
    itemName: "",
    occasion: "",
    design: "",
    size: "",
    metal_weight: 0.0,
    wastage: 0.0,
    making_charges: 0.0,
    stone_weight: 0.0,
    diamond_weight: 0.0,
    bits_weight: 0.0,
    enamel_weight: 0.0,
    pearls_weight: 0.0,
    other_weight: 0.0,
    stock_box: 0.0,
    gross_weight: 0.0,
    total_item_amount: 5000.0,
    discount: 0.0,
    paidAmount: 0.0,
    dueAmount: 0.0,
    delivery_status: "",
    deliveryDate: "06-25-2025",
  });

  const [orderErrors, setOrderErrors] = useState<{ [key: string]: string }>({});
  const [exchangeErrors, setExchangeErrors] = useState<{
    [key: string]: string;
  }>({});

  const navigate = useNavigate();
  const location = useLocation();
  const showOrdersList = location.state?.showOrdersList || false;
  const fromCustomer = location.state?.fromCustomer || false;
  const fromCustomerDetails = location.state?.fromCustomerDetails || false;
  const from = location.state?.from || localStorage.getItem("from");

  const customerId =
    location.state?.customerId ||
    localStorage.getItem("CusDetailsCustomerId") ||
    localStorage.getItem("customerId");

  const token = localStorage.getItem("token");
  const apiBase = "http://15.207.98.116:8081";

  const [exchange, setExchange] = useState({
    exchange_metal: "",
    exchange_metal_name: "",
    exchange_metal_weight: 0,
    exchange_purity_weight: 0,
    exchange_item_amount: 0,
  });

  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
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
    axios
      .get<AppWorker[]>(`${apiBase}/admin/getAllWorkers`, {
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

  const handleOrderSubmit = async () => {
    console.log("customerid  in order  :  " + customerId);
    console.log("Token id: " + token);
    console.log("Request Body:", JSON.stringify(order, null, 2));

    try {
      const response = await axios.post(
        `${apiBase}/admin/addOrder/${customerId}`,
        order,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedOrders = [...ordersList, response.data];

      setOrdersList([...ordersList, response.data]);
      setOrderErrors({});
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

      const response = await axios.post(
        `${apiBase}/admin/addOldExItem/${orderId}`,
        exchange,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newExchangeList = [...exchangeList, response.data];
      setExchangeList(newExchangeList);

      const updatedOrders = ordersList.map((order) => {
        if (order.orderId === orderId) {
          const newDue = Math.max(order.dueAmount - exchangeItemAmount, 0);
          return { ...order, dueAmount: newDue };
        }
        return order;
      });

      setOrdersList(updatedOrders);

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
            <Grid item xs={12} sm={6} key={key}>
              {key === "metal" ? (
                <TextField
                  select
                  label="Metal"
                  value={order.metal}
                  onChange={(e) =>
                    setOrder({
                      ...order,
                      metal: e.target.value,
                    })
                  }
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
              ) : key === "occasion" ? (
                <TextField
                  select
                  label="Occasion"
                  value={order.occasion}
                  onChange={(e) =>
                    setOrder({
                      ...order,
                      occasion: e.target.value,
                    })
                  }
                  error={!!orderErrors.occasion}
                  helperText={orderErrors.occasion || ""}
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
                    <em>Select Occasion</em>
                  </MenuItem>
                  <MenuItem value="Wedding and Engagement">
                    Wedding and Engagement
                  </MenuItem>
                  <MenuItem value="Party wear">Party wear</MenuItem>
                  <MenuItem value="Religious">Religious</MenuItem>
                  <MenuItem value="Work wear">Work wear</MenuItem>
                  <MenuItem value="Daily wear">Daily wear</MenuItem>
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
                  type={
                    typeof value === "number"
                      ? "number"
                      : key.includes("date")
                      ? "date"
                      : "text"
                  }
                  InputLabelProps={
                    key.includes("date") ? { shrink: true } : undefined
                  }
                  value={value}
                  error={!!orderErrors[key]}
                  helperText={orderErrors[key] || ""}
                  onChange={(e) => {
                    const newValue =
                      typeof value === "number"
                        ? Number(e.target.value)
                        : e.target.value;
                    setOrder({ ...order, [key]: newValue });

                    if (orderErrors[key]) {
                      setOrderErrors((prev) => ({ ...prev, [key]: "" }));
                    }
                  }}
                />
              )}
            </Grid>
          ))}
        </Grid>

        <Box display="flex" justifyContent="flex-end" mt={4}>
          <Button onClick={handleOrderSubmit}>Submit</Button>
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
                  <TableCell>{ord.dueAmount}</TableCell>
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
                    {ord.dueAmount > 0 ? (
                      <Button
                        variant="outlined"
                        size="small"
                        color="secondary"
                        onClick={() => {
                          setSelectedOrderId(ord.orderId);
                          setPayAmount(""); // reset input
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
                </TableRow>
              ))}
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
                <Grid item xs={12} sm={12} key={key}>
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
                      type={
                        typeof value === "number"
                          ? "number"
                          : key.includes("date")
                          ? "date"
                          : "text"
                      }
                      InputLabelProps={
                        key.includes("date") ? { shrink: true } : undefined
                      }
                      value={value}
                      error={!!exchangeErrors[key]}
                      helperText={exchangeErrors[key] || ""}
                      onChange={(e) => {
                        const newValue =
                          typeof value === "number"
                            ? Number(e.target.value)
                            : e.target.value;

                        setExchange({ ...exchange, [key]: newValue });
                      }}
                    />
                  )}
                </Grid>
              ))}
            </Grid>
            <Box display="flex" justifyContent="flex-end" mt={4}>
              <Button onClick={handleExchangeSubmit}>Submit Exchange</Button>
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
                <TableCell>Amount</TableCell>
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
                  <TableCell>{ex.exchange_item_amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
      <Box display="flex" justifyContent="flex-end" mt={3}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            sessionStorage.setItem(
              "ordersState",
              JSON.stringify({ ordersList, exchangeList, customerId })
            );
            navigate("/admin/generate-bill", {
              state: {
                selectedOrders: ordersList.map((order) => order.orderId),
              },
            });
            // navigate("/admin/generate-bill", {
            //   state: {
            //     ordersList,
            //     exchangeList,
            //     customerId,
            //   },
            // });
          }}
        >
          Bill Generate
        </Button>
      </Box>
      <Dialog open={payDialogOpen} onClose={() => setPayDialogOpen(false)}>
        <DialogTitle>Enter Payment Amount</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Amount"
            type="number"
            fullWidth
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (!selectedOrderId || !payAmount) return;
              try {
                const response = await axios.post(
                  `${apiBase}/admin/payCustomer/${selectedOrderId}?amount=${payAmount}`,
                  {},
                  { headers: { Authorization: `Bearer ${token}` } }
                );

                const updatedOrders = ordersList.map((o) =>
                  o.orderId === selectedOrderId
                    ? {
                        ...o,
                        paidAmount: o.paidAmount + Number(payAmount),
                        dueAmount: Math.max(o.dueAmount - Number(payAmount), 0),
                      }
                    : o
                );

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
