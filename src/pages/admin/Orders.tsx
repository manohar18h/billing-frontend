import React, { useState, useRef } from "react";
import { TextField, Box, Grid, Button, Paper, Typography } from "@mui/material";

const Orders: React.FC = () => {
  const [order, setOrder] = useState({
    orderDate: "2025-06-21T10:30:00",
    metal: "Gold",
    metalPrice: 5850.5,
    itemName: "Necklace",
    occasion: "Wedding",
    design: "3",
    size: "Medium",
    metal_weight: 12.5,
    wastage: 1.5,
    making_charges: 2500.0,
    stone_weight: 0.0,
    diamond_weight: 0.0,
    bits_weight: 0.0,
    enamel_weight: 0.0,
    pearls_weight: 0.0,
    other_weight: 0.0,
    stock_box: 0.0,
    gross_weight: 1.0,
    total_item_amount: 5000.0,
    discount: 2000.0,
    paidAmount: 0.0,
    dueAmount: 0.0,
    delivery_status: "Pending",
    deliveryDate: "2025-06-25",
  });

  const [exchange, setExchange] = useState({
    exchange_metal: "hgvkhg",
    exchange_metal_name: "Old Ring",
    exchange_metal_weight: "5g",
    exchange_purity_weight: "4.5g",
    exchange_item_amount: 150.0,
  });

  const [showExchangeForm, setShowExchangeForm] = useState(false);
  const exchangeFormRef = useRef<HTMLDivElement | null>(null);

  const handleChange = (field: string, value: string | number) => {
    setOrder({ ...order, [field]: value });
  };

  const handleExchangeChange = (field: string, value: string | number) => {
    setExchange({ ...exchange, [field]: value });
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

  return (
    <Box>
      {/* Order Form Card */}
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
        {/* Title and Button */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={6}
        >
          <Typography variant="h4" fontWeight="bold" color="primary">
            Orders
          </Typography>
          <Button
            variant="outlined"
            onClick={() => {
              setShowExchangeForm((prev) => !prev);
              setTimeout(() => {
                exchangeFormRef.current?.scrollIntoView({ behavior: "smooth" });
              }, 100);
            }}
            sx={{
              borderRadius: "12px",
              fontWeight: "bold",
              boxShadow: "0px 4px 10px rgba(136,71,255,0.2)",
              borderColor: "#8847FF",
              color: "#8847FF",
              textTransform: "none",
              "&:hover": {
                backgroundColor: "#8847FF",
                color: "#fff",
              },
            }}
          >
            Exchange / Return
          </Button>
        </Box>

        <Grid container spacing={3}>
          {Object.entries(order).map(([key, value]) => (
            <Grid item xs={12} sm={6} key={key}>
              <TextField
                {...thickTextFieldProps}
                label={key
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase())}
                type={
                  typeof value === "number"
                    ? "number"
                    : key.toLowerCase().includes("date")
                    ? "date"
                    : "text"
                }
                InputLabelProps={
                  key.toLowerCase().includes("date")
                    ? { shrink: true }
                    : undefined
                }
                value={value}
                onChange={(e) =>
                  handleChange(
                    key,
                    typeof value === "number"
                      ? Number(e.target.value)
                      : e.target.value
                  )
                }
              />
            </Grid>
          ))}
        </Grid>

        <Box display="flex" justifyContent="flex-end" mt={4}>
          <Button
            variant="outlined"
            sx={{
              paddingX: 4,
              paddingY: 1.5,
              borderRadius: "12px",
              fontWeight: "bold",
              boxShadow: "0px 4px 10px rgba(136,71,255,0.5)",
              borderColor: "#8847FF",
              color: "#8847FF",
              transition: "all 0.3s",
              "&:hover": {
                backgroundColor: "#8847FF",
                color: "#fff",
              },
            }}
          >
            Submit
          </Button>
        </Box>
      </Paper>

      {/* Exchange/Return Form */}
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
                <Grid item xs={12} sm={6} key={key}>
                  <TextField
                    {...thickTextFieldProps}
                    label={key
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                    value={value}
                    onChange={(e) => handleExchangeChange(key, e.target.value)}
                  />
                </Grid>
              ))}
            </Grid>

            <Box display="flex" justifyContent="flex-end" mt={4}>
              <Button
                variant="outlined"
                sx={{
                  paddingX: 4,
                  paddingY: 1.5,
                  borderRadius: "12px",
                  fontWeight: "bold",
                  boxShadow: "0px 4px 10px rgba(136,71,255,0.5)",
                  borderColor: "#8847FF",
                  color: "#8847FF",
                  transition: "all 0.3s",
                  "&:hover": {
                    backgroundColor: "#8847FF",
                    color: "#fff",
                  },
                }}
              >
                Submit Exchange
              </Button>
            </Box>
          </Paper>
        </div>
      )}
    </Box>
  );
};

export default Orders;
