import React, { useState } from "react";
import {
  TextField,
  Box,
  Grid,
  Button,
  InputAdornment,
  Paper,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";

const Customers: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const [customer, setCustomer] = useState({
    customerId: "",
    name: "",
    village: "",
    phoneNumber: "",
    emailId: "",
    numberOfOrders: 0,
    finalAmount: 0.0,
    totalDueAmount: 0.0,
    password: "",
  });

  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const handleChange = (field: string, value: string | number) => {
    setCustomer({ ...customer, [field]: value });
  };

  const thickTextFieldProps = {
    variant: "outlined" as const,
    fullWidth: true,
    slotProps: {
      input: { style: { fontWeight: "500" } },
      notchedOutline: { style: { borderWidth: "2px", borderColor: "#8847FF" } },
      label: { style: { fontWeight: "bold", color: "#333" } },
    },
  };

  return (
    <div className="mt-10 p-3 rounded-[24px] bg-white/75 backdrop-blur-lg border border-[#d0b3ff] shadow-[0_10px_30px_rgba(136,71,255,0.3)] h-[500px] flex items-center justify-center">
      <Box
        sx={{
          padding: 4,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <Typography
          variant="h4"
          fontWeight="bold"
          color="primary"
          textAlign="center"
          gutterBottom
        >
          Customer
        </Typography>

        {/* Search Bar */}
        <Paper
          elevation={3}
          sx={{
            padding: 1,
            borderRadius: 8,
            maxWidth: 400,
            marginBottom: 2,
            alignSelf: "center",
            width: "100%",
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search customers..."
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
        </Paper>

        {/* Customer Details Form */}
        <Box flexGrow={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                {...thickTextFieldProps}
                label="Customer ID"
                value={customer.customerId}
                onChange={(e) => handleChange("customerId", e.target.value)}
                error={!!fieldErrors.customerId}
                helperText={fieldErrors.customerId}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...thickTextFieldProps}
                label="Name"
                value={customer.name}
                onChange={(e) => handleChange("name", e.target.value)}
                error={!!fieldErrors.name}
                helperText={fieldErrors.name}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...thickTextFieldProps}
                label="Village"
                value={customer.village}
                onChange={(e) => handleChange("village", e.target.value)}
                error={!!fieldErrors.village}
                helperText={fieldErrors.village}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...thickTextFieldProps}
                label="Phone Number"
                value={customer.phoneNumber}
                onChange={(e) => handleChange("phoneNumber", e.target.value)}
                error={!!fieldErrors.phoneNumber}
                helperText={fieldErrors.phoneNumber}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...thickTextFieldProps}
                label="Email ID"
                value={customer.emailId}
                onChange={(e) => handleChange("emailId", e.target.value)}
                error={!!fieldErrors.emailId}
                helperText={fieldErrors.emailId}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...thickTextFieldProps}
                label="Password"
                value={customer.password}
                onChange={(e) => handleChange("password", e.target.value)}
                error={!!fieldErrors.password}
                helperText={fieldErrors.password}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...thickTextFieldProps}
                label="Number of Orders"
                type="number"
                value={customer.numberOfOrders}
                onChange={(e) =>
                  handleChange("numberOfOrders", Number(e.target.value))
                }
                error={!!fieldErrors.numberOfOrders}
                helperText={fieldErrors.numberOfOrders}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...thickTextFieldProps}
                label="Final Amount"
                type="number"
                value={customer.finalAmount}
                onChange={(e) =>
                  handleChange("finalAmount", Number(e.target.value))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...thickTextFieldProps}
                label="Total Due Amount"
                type="number"
                value={customer.totalDueAmount}
                onChange={(e) =>
                  handleChange("totalDueAmount", Number(e.target.value))
                }
              />
            </Grid>
          </Grid>
          {/* Next Button */}
          <Box
            display="flex"
            justifyContent="flex-end"
            alignItems="center"
            mt={4}
            width="100%"
          >
            <Button
              onClick={async () => {
                try {
                  setFieldErrors({}); // clear previous errors
                  const token = localStorage.getItem("token");
                  const response = await fetch(
                    "http://15.207.98.116:8080/admin/addCustomer",
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        name: customer.name,
                        village: customer.village,
                        phoneNumber: customer.phoneNumber,
                        password: customer.password,
                        emailId: customer.emailId,
                        numberOfOrders: customer.numberOfOrders,
                      }),
                    }
                  );

                  const result = await response.json();

                  if (!response.ok) {
                    if (typeof result === "object" && !Array.isArray(result)) {
                      // set individual field errors
                      setFieldErrors(result);
                    } else {
                      throw new Error(
                        result.message || "Failed to add customer"
                      );
                    }
                    return;
                  }

                  console.log("Customer added successfully:", result);
                  localStorage.setItem("customerId", result.customerId);
                  navigate("/admin/orders");
                } catch (error) {
                  console.error("Error adding customer:", error);
                }
              }}
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
              Nexttt
            </Button>
          </Box>
        </Box>
      </Box>
    </div>
  );
};

export default Customers;
