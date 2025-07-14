import { useLocation } from "react-router-dom";
import { Box, Typography, Paper } from "@mui/material";

const GenerateBill = () => {
  const location = useLocation();
  const {
    ordersList = [],
    exchangeList = [],
    customerId = "",
  } = location.state || {};

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Customer Bill
      </Typography>

      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="h6">Customer ID: {customerId}</Typography>

        <Typography variant="h5" mt={4}>
          Orders:
        </Typography>
        {ordersList.length === 0 ? (
          <Typography>No orders found.</Typography>
        ) : (
          ordersList.map((order: any) => (
            <Box
              key={order.orderId}
              sx={{ borderBottom: "1px solid #ccc", mb: 2, pb: 1 }}
            >
              <Typography>Order ID: {order.orderId}</Typography>
              <Typography>Item Name: {order.itemName}</Typography>
              <Typography>Total Amount: ₹{order.total_item_amount}</Typography>
            </Box>
          ))
        )}

        <Typography variant="h5" mt={4}>
          Exchange / Return:
        </Typography>
        {exchangeList.length === 0 ? (
          <Typography>No exchange items found.</Typography>
        ) : (
          exchangeList.map((item: any) => (
            <Box
              key={item.oldItemId}
              sx={{ borderBottom: "1px solid #ccc", mb: 2, pb: 1 }}
            >
              <Typography>Exchange ID: {item.oldItemId}</Typography>
              <Typography>Metal: {item.exchange_metal}</Typography>
              <Typography>Amount: ₹{item.exchange_item_amount}</Typography>
            </Box>
          ))
        )}
      </Paper>
    </Box>
  );
};

export default GenerateBill;
