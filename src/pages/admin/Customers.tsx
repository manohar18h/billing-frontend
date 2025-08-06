import React, { useState } from "react";
import {
  TextField,
  Box,
  Grid,
  Button,
  InputAdornment,
  Typography,
  MenuItem,
  Paper,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const SearchAddCustomer: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("");
  const navigate = useNavigate();

  localStorage.removeItem("billNumber");
  localStorage.removeItem("bill-phnNumber");
  localStorage.removeItem("phnNumber");

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
    const trimmedQuery = searchQuery.trim();

    if (!searchType) {
      toast.error("Please select a search type.");
      return;
    }

    if (!trimmedQuery) {
      toast.error("Please enter a value to search.");
      return;
    }

    if (searchType === "Bill Number") {
      if (trimmedQuery.toUpperCase().startsWith("HJ-")) {
        localStorage.removeItem("billNumber");
        localStorage.setItem("billNumber", trimmedQuery);
        navigate("/admin/bill-details");
      } else if (/^\d{10}$/.test(trimmedQuery)) {
        localStorage.removeItem("bill-phnNumber");
        localStorage.setItem("bill-phnNumber", trimmedQuery);
        navigate("/admin/bill-Data");
      }
    } else if (searchType === "Phone Number") {
      localStorage.removeItem("phnNumber");
      localStorage.setItem("phnNumber", trimmedQuery);
      navigate("/admin/customer-details");
    }
  };

  const handleAddCustomer = async () => {
    try {
      const token = localStorage.getItem("token");
      localStorage.removeItem("CusDetailsCustomerId");
      localStorage.removeItem("customerId");
      localStorage.removeItem("from");

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
      localStorage.setItem("from", "customer");
      console.log("customerid in customer  :  " + result.customerId);

      navigate("/admin/orders", {
        replace: true,
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
            select
            label="Search Type"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
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
              <em>Select Search Type</em>
            </MenuItem>
            <MenuItem value="Bill Number">Bill Number</MenuItem>
            <MenuItem value="Phone Number">Phone Number</MenuItem>
          </TextField>
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
