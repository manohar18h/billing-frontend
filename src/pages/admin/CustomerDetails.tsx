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
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";

const CustomerDetails: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const storedCustomer = sessionStorage.getItem("customer");
    const storedOrders = sessionStorage.getItem("orders");
    if (storedCustomer) setCustomer(JSON.parse(storedCustomer));
    if (storedOrders) setOrders(JSON.parse(storedOrders));
  }, [location]);

  const handleViewMore = (orderId: number) => {
    sessionStorage.setItem("customer", JSON.stringify(customer));
    sessionStorage.setItem("orders", JSON.stringify(orders));
    navigate(`/admin/order-details/${orderId}`, {
      state: { customer, orders },
    });
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const handleAddOrder = () => {
    const customerId =
      customer?.customerId || localStorage.getItem("customerId");
    navigate("/admin/orders", {
      state: { fromCustomerDetails: true, customerId },
    });
  };

  if (!customer) return null;

  return (
    <div className="mt-10 p-3 flex flex-col items-center justify-center gap-6">
      <Paper
        elevation={4}
        className="p-6 rounded-3xl w-full max-w-6xl bg-white/75 backdrop-blur-lg border border-[#d0b3ff] shadow-[0_10px_30px_rgba(136,71,255,0.3)]"
      >
        <div className="flex justify-between items-center mb-5">
          <Typography variant="h4" fontWeight="bold" color="primary">
            Customer Details
          </Typography>

          <Button
            size="small"
            onClick={handleAddOrder}
            sx={{
              fontWeight: "bold",
              borderRadius: "12px",
              paddingX: 2,
              borderColor: "#8847FF",
              color: "#8847FF",
              "&:hover": {
                backgroundColor: "#8847FF",
                color: "#fff",
              },
            }}
            variant="outlined"
          >
            Add Order
          </Button>
        </div>
        <div style={{ marginBottom: "60px" }} />
        <Grid container spacing={3}>
          {["name", "village", "phoneNumber", "emailId"].map((key) => (
            <Grid item xs={12} sm={6} key={key}>
              <TextField
                fullWidth
                variant="outlined"
                label={
                  key === "phoneNumber"
                    ? "Phone Number"
                    : key === "emailId"
                    ? "Email ID"
                    : key.charAt(0).toUpperCase() + key.slice(1)
                }
                value={customer[key]}
                InputLabelProps={{ shrink: true }}
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
                fullWidth
                variant="outlined"
                label={
                  key === "customerId"
                    ? "Customer ID"
                    : key === "numberOfOrders"
                    ? "Number of Orders"
                    : key === "finalAmount"
                    ? "Final Amount"
                    : "Total Due Amount"
                }
                value={customer[key] || ""}
                InputLabelProps={{ shrink: true }}
                InputProps={{ readOnly: true, style: { fontWeight: 500 } }}
              />
            </Grid>
          ))}
        </Grid>
      </Paper>

      {orders.length > 0 && (
        <Paper
          elevation={4}
          className="p-6 rounded-3xl w-full max-w-6xl bg-white/75 backdrop-blur-lg border border-[#d0b3ff] shadow-[0_10px_30px_rgba(136,71,255,0.3)]"
        >
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
                      <Button variant="outlined" size="small" color="primary">
                        Assign Worker
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    {order.dueAmount > 0 ? (
                      <Button variant="outlined" size="small" color="secondary">
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
    </div>
  );
};

export default CustomerDetails;
