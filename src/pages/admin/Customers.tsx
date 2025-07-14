import React, { useState, useEffect } from "react";
import {
  TextField,
  Box,
  Grid,
  Button,
  InputAdornment,
  Typography,
  Paper,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const SearchAddCustomer: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const emptyCustomer = {
    customerId: "",
    name: "",
    village: "",
    phoneNumber: "",
    emailId: "",
    numberOfOrders: 0,
    finalAmount: 0.0,
    totalDueAmount: 0.0,
    password: "",
  };

  const [customer, setCustomer] = useState({ ...emptyCustomer });
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const handleChange = (field: string, value: string | number) => {
    setCustomer({ ...customer, [field]: value });
  };

  const thickTextFieldProps = {
    variant: "outlined" as const,
    fullWidth: true,
    InputLabelProps: { shrink: true },
    InputProps: { style: { fontWeight: "500" } },
  };

  const handleSearch = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://15.207.98.116:8081/admin/getByCusPhnNumber/${searchQuery}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Fetch failed");

      sessionStorage.setItem("customer", JSON.stringify(data));
      sessionStorage.setItem("orders", JSON.stringify(data.orders || []));

      navigate("/admin/customer-details", {
        state: { customer: data, orders: data.orders || [] },
      });
    } catch (error) {
      console.error("Search failed:", error);
      toast.error("Customer not found");
    }
  };

  const handleAddCustomer = async () => {
    try {
      const token = localStorage.getItem("token");
      setFieldErrors({});

      const response = await fetch(
        "http://15.207.98.116:8081/admin/addCustomer",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(customer),
        }
      );

      const result = await response.json();
      if (!response.ok) {
        if (result.message?.includes("Phone number is already registered")) {
          toast.error(result.message);
        } else if (typeof result === "object") {
          setFieldErrors(result);
        } else {
          toast.error("Failed to add customer");
        }
        return;
      }

      localStorage.setItem("customerId", result.customerId);
      navigate("/admin/orders", {
        state: { fromCustomer: true },
      });
    } catch (error) {
      console.error("Error adding customer:", error);
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="mt-10 p-3 flex flex-col items-center justify-center gap-6">
      <Paper
        elevation={4}
        className="relative p-6 rounded-3xl w-full max-w-6xl bg-white/75 backdrop-blur-lg border border-[#d0b3ff] shadow-[0_10px_30px_rgba(136,71,255,0.3)]"
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

        <Box
          mt={6}
          display="flex"
          gap={2}
          maxWidth={600}
          alignSelf="center"
          mb={4}
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

        <Grid container spacing={3}>
          {["name", "village", "phoneNumber", "emailId", "password"].map(
            (key) => (
              <Grid item xs={12} sm={6} key={key}>
                <TextField
                  {...thickTextFieldProps}
                  label={
                    key === "phoneNumber"
                      ? "Phone Number"
                      : key === "emailId"
                      ? "Email ID"
                      : key.charAt(0).toUpperCase() + key.slice(1)
                  }
                  type={key === "password" ? "password" : "text"}
                  value={customer[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  error={!!fieldErrors[key]}
                  helperText={fieldErrors[key]}
                />
              </Grid>
            )
          )}
        </Grid>

        <Box display="flex" justifyContent="flex-end" mt={4}>
          <Button
            onClick={handleAddCustomer}
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
              "&:hover": { backgroundColor: "#8847FF", color: "#fff" },
            }}
          >
            Next
          </Button>
        </Box>
      </Paper>
    </div>
  );
};

export default SearchAddCustomer;
