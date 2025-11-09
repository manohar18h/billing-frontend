import React, { useState, useRef, useEffect } from "react";
import {
  TextField,
  Button,
  Paper,
  Typography,
  Table,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import api from "@/services/api";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import { Box } from "@mui/system";

const LoanItems: React.FC = () => {
  const [itemErrors, setItemErrors] = useState<{ [key: string]: string }>({});
  const [isEditing, setIsEditing] = useState(false);
  const [itemsList, setItemsList] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("");
  const [payType, setPayType] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const showItemsList = location.state?.showItemsList || false;

  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const token = localStorage.getItem("token");

  const loanCustomerId =
    location.state?.loanCusId || localStorage.getItem("loanCusId");

  const asNumber = (v: number | string | null | undefined): number =>
    v == null || v === "" ? 0 : Number(v);
  const formatMoney = (v: number | string): string => {
    const num = Number(v);
    if (isNaN(num)) return "0"; // fallback if not a valid number

    return num.toLocaleString("en-IN", {
      maximumFractionDigits: 0, // no decimals
    });
  };

  const handleClearitem = () => {
    setItem({
      metal: "",
      itemName: "",
      gross_weight: 0.0,
      net_weight: 0.0,
      rate_of_interest: 0.0,
      total_amount: 0.0,
      due_interest_amount: 0.0,
      deliveryStatus: "",
    });
    setItemErrors({});
  };

  const [item, setItem] = useState({
    metal: "",
    itemName: "",
    gross_weight: 0.0,
    net_weight: 0.0,
    rate_of_interest: 0.0,
    total_amount: 0.0,
    due_interest_amount: 0.0,
    deliveryStatus: "",
  });
  const goldItems = [
    "Pusthela Thadu",
    "Mattalu",
    "Ring",
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
    "Ring",
    "Ring2",
    "Neck Chains",
    "Pattilu",
    "Bangles",
    "Bracelet",
    "Mettalu",
    "Pilenlu",
  ];

  const getItemOptions = () => {
    if (item.metal === "24 Gold" || item.metal === "22 Gold") return goldItems;
    if (item.metal === "999 Silver" || item.metal === "995 Silver")
      return silverItems;
    return [];
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

  const [itemOpen, setItemOpen] = useState(false);
  const [selectItemId, setSlectItemId] = useState<number | null>(null);

  const handleClickItemOpen = (id: number) => {
    setSlectItemId(id);
    setItemOpen(true);
  };

  const handleItemClose = () => {
    setItemOpen(false);
    setSlectItemId(null);
  };

  const handleItemSubmit = async () => {
    console.log("customerid  in order  :  " + loanCustomerId);
    console.log("Token id: " + token);
    console.log("Request Body:", JSON.stringify(item, null, 2));

    try {
      const response = await api.post(
        `/admin/addLoanItem/${loanCustomerId}`,
        item,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const updatedItems = [...itemsList, response.data];

      setItemsList([...itemsList, response.data]);
      setItemErrors({});

      handleClearitem();

      sessionStorage.setItem(
        "itemsState",
        JSON.stringify({
          itemsList: updatedItems,
        })
      );
    } catch (error: any) {
      if (error.response && error.response.data) {
        setItemErrors(error.response.data); // assumes { field: "error message" }
      } else {
        alert("Failed to submit Item");
        console.error("Item submission failed:", error);
      }
    }
  };
  const handleUpdateItem = async () => {
    if (!editingItemId) return;

    try {
      const { data: updatedItemFromBackend } = await api.put(
        `/admin/updateItem/${editingItemId}`,
        item,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const updatedItem: any = updatedItemFromBackend; // 👈 cast

      const updatedItems = itemsList.map((o) =>
        o.loanId === editingItemId
          ? {
              ...updatedItem,
              due_interest_amount: updatedItem.due_interest_amount,
            }
          : o
      );

      setItemsList(updatedItems);
      sessionStorage.setItem(
        "itemsState",
        JSON.stringify({ itemsList: updatedItems })
      );

      handleClearitem();
      setIsEditing(false);

      setEditingItemId(null);
      alert(
        "Loan Item updated successfully, Dont forget to Genarate Updated Bill, Click Update Genarate Bill"
      );
    } catch (error: any) {
      if (error.response?.data) {
        setItemErrors(error.response.data);
      } else {
        alert("Failed to update order");
      }
    }
  };
  const handleViewMore = (loanId: number) => {
    sessionStorage.removeItem("itemsState");
    // Save current state
    sessionStorage.setItem("itemsState", JSON.stringify({ itemsList }));

    navigate(`/admin/loanItem-details/${loanId}`, {
      replace: true,
      state: {
        loanCustomerId,
        from: "loanItems",
      },
    });
  };

  useEffect(() => {
    const savedState = sessionStorage.getItem("itemsState");

    if (showItemsList && savedState) {
      const { itemsList } = JSON.parse(savedState);
      setItemsList(itemsList || []);
    } else if (!showItemsList && savedState) {
      const { itemsList } = JSON.parse(savedState);
      setItemsList(itemsList || []);
    }
  }, [location.key]);

  const handleBackClick = () => {};

  const handleItemDelete = async () => {};

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
          flexDirection={{ xs: "column", sm: "row" }}
          flexWrap="wrap"
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          mb={6}
          gap={2}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton color="primary" onClick={handleBackClick}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" fontWeight="bold" color="primary">
              Loan Item
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr", // 12 columns → 1 column on xs
              sm: "repeat(2, 1fr)", // 6 columns → 2 columns on sm
              md: "repeat(3, 1fr)", // 4 columns → 3 columns on md
              lg: "repeat(4, 1fr)", // 3 columns → 4 columns on lg
            },
            gap: 3, // spacing between items (like Grid spacing={3})
          }}
        >
          {Object.entries(item).map(([key, value]) => {
            // ✅ Hide due_interest_amount when adding new item
            if (key === "due_interest_amount" && !isEditing) {
              return null;
            }

            return (
              <Box key={key}>
                {key === "metal" ? (
                  <TextField
                    select
                    label="Metal"
                    value={item.metal}
                    onChange={(e) => {
                      const selectedMetal = e.target.value;
                      setItem({
                        ...item,
                        metal: selectedMetal,
                      });
                    }}
                    error={!!itemErrors.metal}
                    helperText={itemErrors.metal || ""}
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
                    <MenuItem value="22 Gold">22 Gold</MenuItem>
                    <MenuItem value="995 Silver">995 Silver</MenuItem>
                    <MenuItem value="24 Gold">24 Gold</MenuItem>
                    <MenuItem value="999 Silver">999 Silver</MenuItem>
                  </TextField>
                ) : key === "deliveryStatus" ? (
                  <TextField
                    select
                    label="Delivery Status"
                    value={item.deliveryStatus}
                    onChange={(e) =>
                      setItem({
                        ...item,
                        deliveryStatus: e.target.value,
                      })
                    }
                    error={!!itemErrors.deliveryStatus}
                    helperText={itemErrors.deliveryStatus || ""}
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
                    <MenuItem value="Delivered">Delivered</MenuItem>
                    <MenuItem value="Pending">Pending</MenuItem>
                  </TextField>
                ) : key === "itemName" ? (
                  <TextField
                    select
                    label="Item Name"
                    value={item.itemName}
                    onChange={(e) =>
                      setItem({
                        ...item,
                        itemName: e.target.value,
                      })
                    }
                    error={!!itemErrors.itemName}
                    helperText={itemErrors.itemName || ""}
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
                    type={typeof value === "number" ? "number" : "text"}
                    InputLabelProps={
                      key.includes("date") ? { shrink: true } : undefined
                    }
                    value={
                      typeof value === "number" && value === 0
                        ? "" // show empty instead of 0
                        : value
                    }
                    error={!!itemErrors[key]}
                    helperText={itemErrors[key] || ""}
                    onChange={(e) => {
                      const newValue =
                        typeof value === "number"
                          ? e.target.value === "" // allow clearing
                            ? 0
                            : Number(e.target.value)
                          : e.target.value;

                      const updatedOrder = { ...item, [key]: newValue };

                      setItem(updatedOrder);

                      if (itemErrors[key]) {
                        setItemErrors((prev) => ({ ...prev, [key]: "" }));
                      }
                    }}
                    disabled={isEditing && key === "total_amount"} // ✅ Disable only on edit
                  />
                )}
              </Box>
            );
          })}
        </Box>

        <Box display="flex" justifyContent="flex-end" mt={4} gap={2}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleClearitem}
          >
            Clear
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              window.scrollBy({ top: window.innerHeight, behavior: "smooth" });

              if (isEditing) {
                handleUpdateItem();
              } else {
                handleItemSubmit();
              }
              // 👇 scroll down after action
            }}
          >
            {isEditing ? "Update" : "Submit"}
          </Button>
        </Box>
      </Paper>

      {itemsList.length > 0 && (
        <Paper
          elevation={4}
          className="p-6 mt-6 rounded-3xl bg-white/75 backdrop-blur-lg border border-[#d0b3ff] shadow-[0_10px_30px_rgba(136,71,255,0.3)]"
        >
          <h3 className=" text-3xl font-bold mb-10 text-blue-600">
            Item Summary
          </h3>
          <Box
            sx={{
              width: "100%",
              overflowX: "auto", // allows horizontal scrolling on small screens
            }}
          >
            <Table sx={{ minWidth: 800 /* ensure table doesn’t collapse */ }}>
              <thead className="bg-gray-200">
                <tr>
                  <th className="border px-3 py-2">Loan ID</th>
                  <th className="border px-3 py-2">Item</th>
                  <th className="border px-3 py-2">Metal</th>
                  <th className="border px-3 py-2">G W</th>
                  <th className="border px-3 py-2">Total</th>
                  <th className="border px-3 py-2">Due</th>
                  <th className="border px-3 py-2 ">R O Interest</th>
                  <th className="border px-3 py-2 ">Due Interest</th>
                  <th className="border px-3 py-2">Pay</th>
                  <th className="border px-3 py-2">View</th>
                  <th className="border px-3 py-2">Edit</th>
                  <th className="border px-3 py-2">Delete</th>
                </tr>
              </thead>

              <TableBody>
                {itemsList.map((itm) => (
                  <TableRow key={itm.loanId}>
                    <TableCell
                      className="border px-3 py-2 text-center"
                      sx={{ fontSize: "0.95rem" }}
                    >
                      <div className="flex justify-center items-center">
                        {itm.loanId}
                      </div>
                    </TableCell>

                    <TableCell
                      className="border px-3 py-2 text-center"
                      sx={{ fontSize: "0.95rem" }}
                    >
                      <div className="flex justify-center items-center">
                        {itm.itemName}
                      </div>
                    </TableCell>

                    <TableCell
                      className="border px-3 py-2 text-center"
                      sx={{ fontSize: "0.95rem" }}
                    >
                      <div className="flex justify-center items-center">
                        {itm.metal}
                      </div>
                    </TableCell>

                    <TableCell
                      className="border px-3 py-2 text-center"
                      sx={{ fontSize: "0.95rem" }}
                    >
                      <div className="flex justify-center items-center">
                        {itm.gross_weight}
                      </div>
                    </TableCell>

                    <TableCell
                      className="border px-3 py-2 text-center"
                      sx={{ fontSize: "0.95rem" }}
                    >
                      <div className="flex justify-center items-center">
                        {itm.total_amount}
                      </div>
                    </TableCell>

                    <TableCell
                      className={`border px-3 py-2  text-center ${
                        itm.dueAmount !== 0 ? "text-red-600 font-semibold" : ""
                      }`}
                    >
                      <div className="flex justify-center items-center">
                        {formatMoney(itm.due_amount)}
                      </div>
                    </TableCell>

                    <TableCell
                      className="border px-3 py-2 text-center"
                      sx={{ fontSize: "0.95rem" }}
                    >
                      <div className="flex justify-center items-center">
                        {itm.rate_of_interest}
                      </div>
                    </TableCell>

                    <TableCell
                      className="border px-3 py-2 text-center"
                      sx={{ fontSize: "0.95rem" }}
                    >
                      <div className="flex justify-center items-center">
                        {itm.due_interest_amount}
                      </div>
                    </TableCell>

                    <TableCell
                      className="border px-3 py-2 text-center"
                      sx={{ fontSize: "0.95rem" }}
                    >
                      <div className="flex justify-center items-center">
                        {asNumber(itm.due_amount) !== 0 ||
                        asNumber(itm.due_interest_amount) !== 0 ? (
                          <IconButton
                            size="medium"
                            sx={{
                              color: "#4CAF50", // solid green background
                              "&:hover": { backgroundColor: "#E0E0E0" },
                            }}
                            onClick={() => {
                              setSelectedItemId(itm.loanId);
                              setPayAmount("");
                              setPayDialogOpen(true);
                            }}
                          >
                            <CurrencyRupeeIcon fontSize="medium" />
                          </IconButton>
                        ) : (
                          "-"
                        )}
                      </div>
                    </TableCell>

                    <TableCell
                      className="border px-3 py-2 text-center"
                      sx={{ fontSize: "0.95rem" }}
                    >
                      <div className="flex justify-center items-center">
                        <IconButton
                          size="medium"
                          color="primary"
                          sx={{
                            "&:hover": { backgroundColor: "#E0E0E0" },
                          }}
                          onClick={() => handleViewMore(itm.loanId)}
                        >
                          <VisibilityIcon fontSize="medium" />
                        </IconButton>
                      </div>
                    </TableCell>

                    <TableCell
                      className="border px-3 py-2 text-center"
                      sx={{ fontSize: "0.95rem" }}
                    >
                      <div className="flex justify-center items-center">
                        {itm.deliveryStatus === "Canceled" ? (
                          <>-</>
                        ) : (
                          <IconButton
                            size="small"
                            color="warning"
                            sx={{
                              "&:hover": { backgroundColor: "#E0E0E0" },
                            }}
                            onClick={() => {
                              setItem({
                                metal: itm.metal || "",
                                itemName: itm.itemName || "",
                                gross_weight: itm.gross_weight || 0,
                                net_weight: itm.net_weight || 0,
                                rate_of_interest: itm.rate_of_interest || 0,
                                total_amount: itm.total_amount || 0,
                                due_interest_amount:
                                  itm.due_interest_amount || 0,

                                deliveryStatus:
                                  itm.deliveryStatus ||
                                  itm.delivery_status ||
                                  "",
                              });

                              setIsEditing(true);
                              setEditingItemId(itm.loanId); // still keep the orderId in a separate state
                              setItemErrors({});
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        )}
                      </div>
                    </TableCell>

                    <TableCell
                      className="border px-3 py-2 text-center"
                      sx={{ fontSize: "0.95rem" }}
                    >
                      <div className="flex justify-center items-center">
                        {itm.deliveryStatus === "Canceled" ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <IconButton
                            size="small"
                            sx={{
                              color: "#A0522D",
                              "&:hover": { backgroundColor: "#E0E0E0" },
                            }}
                            onClick={() => handleClickItemOpen(itm.orderId)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                <Dialog open={itemOpen} onClose={handleItemClose}>
                  <DialogTitle>Confirm Deletion</DialogTitle>
                  <DialogContent>
                    <DialogContentText>
                      Are you sure you want to delete this order item with ID:
                      {selectItemId}
                      <strong>{selectedItemId}</strong>?
                    </DialogContentText>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={handleItemClose} color="primary">
                      No
                    </Button>
                    <Button onClick={handleItemDelete} color="error" autoFocus>
                      Yes, Delete
                    </Button>
                  </DialogActions>
                </Dialog>
              </TableBody>
            </Table>
          </Box>
        </Paper>
      )}

      <Dialog open={payDialogOpen} onClose={() => setPayDialogOpen(false)}>
        <DialogTitle>Enter Payment Amount</DialogTitle>
        <DialogContent>
          <Box
            display="flex"
            flexDirection="column"
            gap={3} // ✅ space between inputs
          >
            <TextField
              select
              label="Payment Type"
              value={payType}
              onChange={(e) => setPayType(e.target.value)}
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
                <em>Select Payment Type</em>
              </MenuItem>
              <MenuItem value="Paying Principle">Paying Principle</MenuItem>
              <MenuItem value="Giving Money">Giving Money</MenuItem>
              <MenuItem value="Paying Interest">Paying Interest</MenuItem>
            </TextField>
            <TextField
              select
              label="Payment Method"
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
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
                <em>Select Payment Method</em>
              </MenuItem>
              <MenuItem value="Phone Pay">Phone Pay</MenuItem>
              <MenuItem value="Cash">Cash</MenuItem>
            </TextField>

            <TextField
              autoFocus
              margin="dense"
              label="Amount"
              type="number"
              fullWidth
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (!selectedItemId || !payAmount) return;

              console.log("pay orderId:", selectedItemId);
              console.log("payMethod:", payMethod);
              console.log("payType:", payType);
              console.log("payAmount:", payAmount);

              try {
                await api.post(
                  `/admin/loanTransaction/${selectedItemId}/${payMethod}/${payType}/${payAmount}`,
                  {},
                  { headers: { Authorization: `Bearer ${token}` } }
                );

                const updatedItems = itemsList.map((o) => {
                  if (o.loanId !== selectedItemId) return o;

                  const paid = Number(payAmount);

                  let newTotal = o.total_amount ?? 0;
                  let newExistDue = o.due_amount ?? 0;
                  let newPaid = o.paid_amount ?? 0;
                  let newExistInterestDue = o.due_interest_amount ?? 0;
                  let newPaidInterestAmount = o.paid_interest_amount ?? 0;

                  if (payType === "Paying Interest") {
                    newPaidInterestAmount += paid;
                    newExistInterestDue = Math.max(
                      newExistInterestDue - paid,
                      0
                    );
                  } else if (payType === "Paying Principle") {
                    newExistDue = Math.max(newExistDue - paid, 0);
                    newPaid += paid;
                  } else if (payType === "Giving Money") {
                    newTotal += paid;
                    newExistDue += paid;
                  }

                  // rounding safety
                  if (Math.abs(newTotal) < 0.01) newTotal = 0;
                  if (Math.abs(newExistDue) < 0.01) newExistDue = 0;
                  if (Math.abs(newExistInterestDue) < 0.01)
                    newExistInterestDue = 0;

                  return {
                    ...o,
                    total_amount: newTotal,
                    paid_amount: newPaid,
                    due_amount: newExistDue,
                    paid_interest_amount: newPaidInterestAmount,
                    due_interest_amount: newExistInterestDue,
                  };
                });

                setItemsList(updatedItems);
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
    </Box>
  );
};

export default LoanItems;
