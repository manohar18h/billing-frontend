import React, { useState, useEffect, useRef } from "react";
import {
  TextField,
  Box,
  Grid,
  Button,
  InputAdornment,
  Autocomplete,
  Typography,
  MenuItem,
  Paper,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useLocation } from "react-router-dom";
import api from "@/services/api";
import debounce from "lodash/debounce";

interface VillageCustomer {
  phoneNumber: string;
  name: string;
}

const SearchAddCustomer: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [villageCustomers, setVillageCustomers] = useState<VillageCustomer[]>(
    []
  );
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [deleteMessage, setDeleteMessage] = useState("");

  localStorage.removeItem("editBillFromBillDetails");

  localStorage.removeItem("billNumber");
  localStorage.removeItem("bill-phnNumber");
  localStorage.removeItem("phnNumber");

  interface Customer {
    customerId: string;
    name: string;
    village: string;
    phoneNumber: string;
    emailId: string;
    numberOfOrders: number;
    finalAmount: number;
    totalDueAmount: number;
    password: string;
  }

  const emptyCustomer: Customer = {
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

  // Debounced API call
  const fetchData = debounce(async (query: string) => {
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }

    console.log("🔍 Calling API for:", query);

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.get<string[]>(
        `/admin/searchVillage?query=${query}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("✅ API Response:", res.data);
      setResults(res.data || []);
    } catch (err) {
      console.error("❌ Error fetching villages:", err);
    } finally {
      setLoading(false);
    }
  }, 500);

  // Trigger when user types 3+ chars
  useEffect(() => {
    if (search.trim().length >= 3) {
      fetchData(search);
    } else {
      setResults([]);
    }

    // cancel debounce on unmount
    return () => fetchData.cancel();
  }, [search]);

  const [customer, setCustomer] = useState<Customer>({ ...emptyCustomer });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof Customer, string>>
  >({});

  const handleChange = (field: string, value: string | number) => {
    let newValue = value;
    if (field === "name" && typeof value === "string") {
      newValue = value
        .split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");
    }

    setCustomer((prev) => ({
      ...prev,
      [field]: newValue,
    }));
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
      localStorage.removeItem("billNumber");
      localStorage.setItem("billNumber", "HJ-" + trimmedQuery);
      navigate("/admin/bill-details");
    } else if (searchType === "Phone Number") {
      localStorage.removeItem("bill-phnNumber");
      localStorage.setItem("bill-phnNumber", trimmedQuery);
      navigate("/admin/bill-Data");
    } else if (searchType === "Village") {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get(
          `/admin/customers/by-village?village=${trimmedQuery}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setVillageCustomers(res.data as VillageCustomer[]);
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      } catch (err) {
        toast.error("Failed to fetch customers");
      }
    } else if (searchType === "Delete Phone Number") {
      try {
        const token = localStorage.getItem("token");

        const res = await api.delete<string>(
          `/admin/deleteCustomerByPhone/${trimmedQuery}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // show API response in screen
        setVillageCustomers([]); // optional reset
        toast.success(res.data); // show success message

        // ALSO display output on screen
        setDeleteMessage(res.data);
      } catch (err: any) {
        const errorMessage = err?.response?.data || "Something went wrong";

        toast.error(errorMessage);
        setDeleteMessage(errorMessage);
      }
    }
  };

  const handleAddCustomer = async () => {
    try {
      const token = localStorage.getItem("token");
      localStorage.removeItem("CusDetailsCustomerId");
      localStorage.removeItem("customerId");
      localStorage.removeItem("from");

      setFieldErrors({});

      // --- Add village if not empty ---
      if (customer.village?.trim()) {
        await api.post(
          "/admin/addVillage",
          { name: customer.village.trim() },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      console.log("requestbody : ", JSON.stringify(customer));

      const response = await api.post<Customer>(
        "/admin/addCustomer",
        customer,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = response.data;

      if (result?.customerId) {
        localStorage.setItem("customerId", result.customerId);
        localStorage.setItem("from", "customer");
        console.log("customerId in customer:", result.customerId);

        navigate("/admin/orders", {
          replace: true,
          state: { fromCustomer: true },
        });
      } else {
        toast.error("Failed to add customer");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        // covers both network errors and general JS errors
        console.error("Error adding customer:", error.message);
        toast.error(error.message);
      } else {
        // fallback for unexpected error shapes
        console.error("Unexpected error:", error);
        toast.error("Something went wrong");
      }
    }
  };
  useEffect(() => {
    localStorage.removeItem("editBillFromBillDetails");
    if (location.state?.errorMessage) {
      toast.error(location.state.errorMessage);

      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  return (
    <div>
      <div className="mt-10 p-3 flex flex-col items-center justify-center gap-6 ">
        <Paper
          elevation={4}
          sx={{ borderRadius: "24px" }}
          className="relative p-6 rounded-xl w-full  max-w-6xl bg-white/75 backdrop-blur-lg border border-[#d0b3ff] shadow-[0_10px_30px_rgba(136,71,255,0.3)]"
        >
          <Typography
            variant="h4"
            fontWeight="bold"
            color="primary"
            gutterBottom
          >
            Search Customer
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
              <MenuItem value="Village">Village</MenuItem>
              <MenuItem value="Delete Phone Number">
                Delete Phone Number
              </MenuItem>
            </TextField>
            {searchType === "Village" ? (
              <Autocomplete
                fullWidth
                options={results}
                value={searchQuery}
                loading={loading}
                onChange={(event, newValue) => {
                  handleChange("village", newValue || "");
                  setSearchQuery(newValue || ""); // IMPORTANT
                }}
                onInputChange={(event, newInputValue) => {
                  setSearchQuery(newInputValue); // triggers typing
                  setSearch(newInputValue); // triggers API search
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    placeholder="Type village name..."
                    InputProps={{
                      ...params.InputProps,
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
                )}
              />
            ) : (
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
            )}

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
        </Paper>
      </div>

      <div className="mt-10 p-3 flex flex-col items-center justify-center gap-6">
        <Paper
          elevation={4}
          sx={{ borderRadius: "24px" }}
          className="relative p-6 rounded-xl w-full max-w-6xl bg-white/75 backdrop-blur-lg border border-[#d0b3ff] shadow-[0_10px_30px_rgba(136,71,255,0.3)]"
        >
          <Typography
            variant="h4"
            fontWeight="bold"
            color="primary"
            gutterBottom
          >
            Add Customer
          </Typography>
          <Grid container spacing={3} mt={6}>
            {(
              [
                "name",
                "village",
                "phoneNumber",
                "emailId",
                "password",
              ] as (keyof Customer)[]
            ).map((key) => (
              <Grid key={key} size={{ xs: 6, sm: 4 }}>
                {key === "village" ? (
                  <Autocomplete
                    freeSolo
                    disableClearable
                    options={results || []}
                    loading={loading}
                    value={customer.village || ""}
                    onInputChange={(event, newInputValue) => {
                      setSearch(newInputValue); // triggers API
                      handleChange("village", newInputValue); // updates customer state
                    }}
                    onChange={(event, newValue) => {
                      handleChange("village", newValue || "");
                    }}
                    renderOption={(props, option) => (
                      <li {...props} key={option}>
                        {option}
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        {...thickTextFieldProps}
                        label="Village"
                        placeholder="Type 3 letters to search..."
                        helperText={
                          search.length >= 3
                            ? results.length > 0
                              ? "Select from list or type new"
                              : "No villages found, you can add new"
                            : ""
                        }
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loading ? (
                                <span className="text-gray-400 text-sm pr-2">
                                  Loading...
                                </span>
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                ) : (
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
                )}
              </Grid>
            ))}
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
      <div
        className="mt-10 p-3 flex flex-col items-center  gap-1"
        style={{ paddingBottom: "300px" }}
        ref={bottomRef}
      >
        {searchType === "Village" && villageCustomers.length > 0 && (
          <Paper
            elevation={4}
            sx={{ borderRadius: "20px" }}
            className="p-6 mt-6 w-full max-w-4xl bg-white/80 backdrop-blur-lg shadow-lg"
          >
            <Typography
              variant="h5"
              fontWeight="bold"
              color="primary"
              gutterBottom
            >
              Customers in Village
            </Typography>

            <table className="w-full mt-4 border border-gray-300 rounded-lg overflow-hidden">
              <thead className="bg-purple-200">
                <tr>
                  <th className="p-3 text-left font-bold">Name</th>
                  <th className="p-3 text-left font-bold">Phone Number</th>
                </tr>
              </thead>
              <tbody>
                {villageCustomers.map((c: any, index) => (
                  <tr
                    key={index}
                    className="border-b hover:bg-purple-50 transition-all"
                  >
                    <td className="p-3">{c.name}</td>
                    <td className="p-3">{c.phoneNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Paper>
        )}
      </div>
      {deleteMessage && (
        <div className="mt-4 p-3 bg-gray-100 text-black rounded-md shadow">
          {deleteMessage}
        </div>
      )}
    </div>
  );
};

export default SearchAddCustomer;
