import React, { useEffect, useState, useRef } from "react";

import {
  TextField,
  Table,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  IconButton,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import api from "@/services/api"; // ← import your api.ts
import VisibilityIcon from "@mui/icons-material/Visibility";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import { Box } from "@mui/system";
import SignatureCanvas from "./SignatureCanvas";

interface selectedItems {
  loanId: number;
  loanDate: string;
  itemName: string;
  metal: string;
  gross_weight: number;
  total_amount: number;
  paid_amount: number;
  deliveryStatus: string;
  due_amount: number;
  paid_interest_amount: number;
  due_interest_amount: number;
  active_month_count: number;
}

export interface LoanCustomer {
  customerLoanId: number;
  loanBillNumber: string;
  name: string;
  village: string;
  phoneNumber: string;
  emailId: string;
  aadharCard: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paidInterestAmount: number;
  dueInterestAmount: number;
  version: number;
  selectedItems: selectedItems[]; // <== Ensure this line exists
}

export interface Signature {
  id: number;
  loanBillId: number;
  loanBillNumber: string;
  signatureType: string; // START or END
  signatureData: string; // base64 string
  signedAt: string;
}

export interface LoanBillResponse {
  loanBill: LoanCustomer;
  signatures: Signature[];
}

const BillLoanDetails: React.FC = () => {
  const navigate = useNavigate();
  const [loanCustomer, setLoanCustomer] = useState<LoanCustomer | null>(null);
  const [items, setItems] = useState<selectedItems[]>([]);
  const token = localStorage.getItem("token");
  const billLoanNumber = localStorage.getItem("billLoanNumber");
  const [loanCustomerId, setLoanCustomerId] = useState<number | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("");
  const [payType, setPayType] = useState("");
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [signType, setSignType] = useState(""); // start or end
  const [selectedBillNo, setSelectedBillNo] = useState("");

  const signPad = useRef<any>(null);
  const [startSignature, setStartSignature] = useState<string | null>(null);
  const [endSignature, setEndSignature] = useState<string | null>(null);

  const checkBackFrom = localStorage.getItem("checkBackFrom");

  const handleBackClick = () => {
    if (checkBackFrom === "billLoanNumber" || checkBackFrom === "Loan") {
      navigate("/admin/Loan");
    } else if (checkBackFrom === "DashBoard") {
      navigate("/admin/dashboard");
    } else {
      navigate("/admin/bill-loan-data");
    }
  };

  useEffect(() => {
    fetchLoanCustomerDetails();
  }, []);

  const fetchLoanCustomerDetails = async () => {
    localStorage.removeItem("checkEditLoanBill");
    localStorage.removeItem("loanItemsFrom");

    try {
      const res = await api.get(
        `/admin/getDataByLoanBillNumber/${billLoanNumber}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = res.data as LoanBillResponse;

      // Extract loan bill
      const loanBill = data.loanBill;

      // Extract signatures
      const signatures = data.signatures;

      // Set Start & End signatures
      signatures.forEach((sign) => {
        if (sign.signatureType === "START") {
          setStartSignature(sign.signatureData);
        }
        if (sign.signatureType === "END") {
          setEndSignature(sign.signatureData);
        }
      });

      // Validate
      if (!loanBill || !loanBill.customerLoanId) {
        navigate("/admin/Loan", {
          replace: true,
          state: {
            errorMessage: `No data found for Bill Number: ${billLoanNumber}`,
          },
        });
        return;
      }

      // Clear old data
      sessionStorage.removeItem("loanCustomer");
      sessionStorage.removeItem("items");
      sessionStorage.removeItem("billingLoanFrom");

      // Set state
      setLoanCustomerId(loanBill.customerLoanId);
      setLoanCustomer(loanBill);
      setItems(loanBill.selectedItems || []);

      // Store in session
      sessionStorage.setItem("loanCustomer", JSON.stringify(loanBill));
      sessionStorage.setItem(
        "items",
        JSON.stringify(loanBill.selectedItems || [])
      );
    } catch (err) {
      console.error("Error fetching bill details:", err);
      navigate("/admin/Loan", {
        replace: true,
        state: {
          errorMessage: `No data found for Bill Number: ${billLoanNumber}`,
        },
      });
    }
  };

  useEffect(() => {
    if (signDialogOpen) {
      document.body.style.overflow = "hidden"; // lock scroll
    } else {
      document.body.style.overflow = "auto"; // unlock scroll
    }
  }, [signDialogOpen]);

  const formatDate = (isoString: string) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleString("en-IN", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const handleViewMore = (loanId: number) => {
    sessionStorage.removeItem("itemsState");
    localStorage.removeItem("from");
    sessionStorage.setItem("itemsState", JSON.stringify({ items }));
    localStorage.setItem("from", "BillLoanDetails");

    // Navigate to order details
    navigate(`/admin/loanItem-details/${loanId}`, {
      replace: true,
      state: { from: "BillLoanDetails" },
    });
  };

  const handleEditItem = (loanId: number) => {
    localStorage.removeItem("loanItemsFrom");

    localStorage.removeItem("editBillFromBillLoanDetails");
    if (!loanId) {
      console.error("❌ editingItemId is missing before navigation");
      return;
    }

    console.log("✅ Navigating to Orders page with  Item Id:", loanId);

    localStorage.setItem("editBillFromBillLoanDetails", "editBill");

    localStorage.removeItem("billLoanNumber");
    localStorage.removeItem("loanCustomerId");

    localStorage.setItem("billLoanNumber", billLoanNumber ?? "");
    localStorage.setItem(
      "loanCustomerId",
      (loanCustomer?.customerLoanId ?? "").toString()
    );
    navigate("/admin/loanItems", {
      replace: true,
      state: {
        loanFrom: "BillLoanDetails",
        fromBillLoanDetails: true,
        billLoanNumber: billLoanNumber,
        loanCustomerId: loanCustomer?.customerLoanId,
        loanId: loanId,
      },
    });

    localStorage.setItem("loanItemsFrom", "BillLoanDetails");
  };

  const asNumber = (v: string | number | null | undefined): number =>
    v == null || v === "" ? 0 : Number(v);

  const formatMoney = (v: string | number | null | undefined): string =>
    asNumber(v).toLocaleString("en-IN", {
      maximumFractionDigits: 0, // no decimals
    });

  if (!loanCustomer) return null;

  return (
    <div>
      <div className="mt-10 flex flex-col items-center justify-center">
        <div
          className="w-full max-w-4xl rounded-2xl shadow-xl p-4 md:p-6"
          style={{
            background: "linear-gradient(135deg, #1e293b, #0f172a)", // dark gradient
            color: "#fff",
          }}
        >
          {/* Header */}
          <div className="flex items-center mb-6">
            <IconButton
              onClick={handleBackClick}
              sx={{
                backgroundColor: "rgba(255,255,255,0.1)",
                color: "#fbbf24",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.25)" },
              }}
            >
              <ArrowBackIcon />
            </IconButton>

            <h2 className="text-2xl font-bold text-amber-300 ml-2">
              Loan Bill Details
            </h2>

            {/* ✅ Generate Bill Button (top right) */}
            <div className="ml-auto">
              <Button
                variant="contained"
                sx={{
                  background: "linear-gradient(135deg, #f59e0b, #ef4444)", // orange-red
                  borderRadius: "12px",
                  textTransform: "none",
                  fontWeight: "600",
                  boxShadow: "0 8px 20px rgba(239,68,68,0.35)",
                  px: 3,
                  py: 1,
                  "&:hover": {
                    background: "linear-gradient(135deg, #ef4444, #f59e0b)",
                  },
                }}
                onClick={() => {
                  sessionStorage.removeItem("itemsState");
                  sessionStorage.setItem(
                    "itemsState",
                    JSON.stringify({ items, loanCustomerId })
                  );
                  sessionStorage.setItem("billingLoanFrom", "BillLoanDetails");
                  console.log("Ids :" + items.map((item) => item.loanId));

                  localStorage.setItem("checkEditLoanBill", "YesEdit");

                  navigate("/admin/generate-loan-bill", {
                    replace: true,
                    state: {
                      selectedItems: items.map((item) => item.loanId),
                      billingLoanFrom: "BillLoanDetails",
                      billLoanNumber: billLoanNumber,
                    },
                  });
                }}
              >
                Generate Bill
              </Button>
            </div>
          </div>

          {/* Grid Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-4 pr-0 md:pr-4 border-r-0 md:border-r border-white/20">
              <p className="flex justify-between">
                <span className="text-gray-300 font-medium">Bill Number:</span>
                <span className="text-emerald-300 font-semibold">
                  {loanCustomer?.loanBillNumber}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-300 font-medium">Name:</span>
                <span className="text-purple-300 font-semibold">
                  {loanCustomer?.name}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-300 font-medium">Village:</span>
                <span className="text-indigo-300 font-semibold">
                  {loanCustomer?.village}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-300 font-medium">Phone:</span>
                <span className="text-teal-300 font-semibold">
                  {loanCustomer?.phoneNumber}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-300 font-medium">Email:</span>
                <span className="text-orange-300 font-semibold">
                  {loanCustomer?.emailId || "—"}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-300 font-medium">Aadhar Card:</span>
                <span className="text-orange-300 font-semibold">
                  {loanCustomer?.aadharCard || "—"}
                </span>
              </p>
            </div>

            {/* Right column */}
            <div className="space-y-4 pl-0 md:pl-4">
              <p className="flex justify-between">
                <span className="text-gray-300 font-medium">Total Amount:</span>
                <span className="text-green-400 font-semibold">
                  {loanCustomer?.totalAmount}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-300 font-medium">Paid Amount :</span>
                <span className="text-blue-400 font-semibold">
                  {loanCustomer?.paidAmount}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-300 font-medium">Due Amount :</span>
                <span className="text-sky-400 font-semibold">
                  {loanCustomer?.dueAmount}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-300 font-medium">
                  Paid Interest Amount:
                </span>
                <span className="text-purple-400 font-semibold">
                  {loanCustomer?.paidInterestAmount}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-300 font-medium">
                  Due Interest Amount:
                </span>
                <span className="text-red-400 font-semibold">
                  {loanCustomer?.dueInterestAmount}
                </span>
              </p>
              <div className="flex gap-4 pt-2">
                {/* START SIGN BUTTON */}
                {startSignature ? (
                  <img
                    src={startSignature}
                    alt="Start Signature"
                    className="w-24 h-16 md:w-28 md:h-20 object-contain border rounded-md bg-gray-100 p-1"
                  />
                ) : (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => {
                      setSelectedBillNo(loanCustomer.loanBillNumber);
                      setSignType("START");
                      setSignDialogOpen(true);
                    }}
                  >
                    Start Sign
                  </Button>
                )}

                {/* END SIGN BUTTON */}
                {endSignature ? (
                  <img
                    src={endSignature}
                    alt="End Signature"
                    className="w-28 h-20 object-contain border rounded-md bg-gray-100 p-1"
                  />
                ) : (
                  <Button
                    variant="contained"
                    size="small"
                    color="secondary"
                    onClick={() => {
                      setSelectedBillNo(loanCustomer.loanBillNumber);
                      setSignType("END");
                      setSignDialogOpen(true);
                    }}
                  >
                    End Sign
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-10 p-3 flex flex-col items-center justify-center">
        {items.length > 0 && (
          <div className="p-6 rounded-3xl w-full max-w-6xl bg-white/75 backdrop-blur-lg border border-[#d0b3ff] shadow-[0_10px_30px_rgba(136,71,255,0.3)]">
            <h3 className=" text-3xl font-bold mb-10 text-blue-600">
              Billing History
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
                    <th className="border px-3 py-2">Item ID</th>
                    <th className="border px-3 py-2">Date</th>
                    <th className="border px-3 py-2">Item</th>
                    <th className="border px-3 py-2">Metal</th>
                    <th className="border px-3 py-2">Weight</th>
                    <th className="border px-3 py-2">Status</th>
                    <th className="border px-3 py-2">Total</th>
                    <th className="border px-3 py-2">Due</th>
                    <th className="border px-3 py-2">I.Due</th>
                    <th className="border px-3 py-2">Pay</th>
                    <th className="border px-3 py-2">View</th>
                    <th className="border px-3 py-2">Edit</th>
                  </tr>
                </thead>

                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.loanId}>
                      <TableCell className={`border px-3 py-2 `}>
                        {item.loanId}
                      </TableCell>
                      <TableCell className={`border px-3 py-2 `}>
                        {formatDate(item.loanDate)}
                      </TableCell>
                      <TableCell className={`border px-3 py-2 `}>
                        {item.itemName}
                      </TableCell>
                      <TableCell className={`border px-3 py-2 `}>
                        {item.metal}
                      </TableCell>
                      <TableCell className={`border px-3 py-2 `}>
                        {item.gross_weight}
                      </TableCell>
                      <TableCell
                        className={`border px-3 py-2 `}
                        sx={{
                          color:
                            item.deliveryStatus === "Delivered"
                              ? "#2e7d32" // green
                              : item.deliveryStatus === "Pending"
                              ? "#ed6c02" // orange/yellow
                              : item.deliveryStatus === "Canceled"
                              ? "#d32f2f" // red
                              : "inherit",
                          fontWeight: "bold",
                        }}
                      >
                        {item.deliveryStatus}
                      </TableCell>

                      <TableCell
                        className={`border px-3 py-2 `}
                        sx={{
                          color: "#ca8a04",
                        }}
                      >
                        {item.total_amount.toFixed(2)}
                      </TableCell>

                      <TableCell
                        className={`border px-3 py-2 ${
                          item.due_amount !== 0
                            ? "text-red-600 font-semibold"
                            : ""
                        }`}
                      >
                        {formatMoney(item.due_amount)}
                      </TableCell>
                      <TableCell
                        className={`border px-3 py-2 `}
                        sx={{
                          color: "#15803d",
                        }}
                      >
                        {item.due_interest_amount}
                      </TableCell>
                      <TableCell
                        className="border px-3 py-2 text-center"
                        sx={{ fontSize: "0.95rem" }}
                      >
                        <div className="flex justify-center items-center">
                          {asNumber(item.due_amount) !== 0 ||
                          asNumber(item.due_interest_amount) !== 0 ? (
                            <IconButton
                              size="medium"
                              sx={{
                                color: "#4CAF50", // solid green background
                                "&:hover": { backgroundColor: "#E0E0E0" },
                              }}
                              onClick={() => {
                                setSelectedItemId(item.loanId);
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

                      <TableCell className={`border px-3 py-2 `}>
                        <IconButton
                          size="medium"
                          color="primary"
                          sx={{
                            "&:hover": { backgroundColor: "#E0E0E0" },
                          }}
                          onClick={() => handleViewMore(item.loanId)}
                        >
                          <VisibilityIcon fontSize="medium" />
                        </IconButton>
                      </TableCell>
                      <TableCell className={`border px-3 py-2 `}>
                        {item.deliveryStatus === "Canceled" ? (
                          <>-</>
                        ) : (
                          <IconButton
                            size="small"
                            color="warning"
                            sx={{
                              "&:hover": { backgroundColor: "#E0E0E0" },
                            }}
                            onClick={() => {
                              handleEditItem(item.loanId);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </div>
        )}
      </div>

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
              <MenuItem value="Adding Principle">Adding Principle</MenuItem>
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

              console.log("pay Item Id:", selectedItemId);
              console.log("payMethod:", payMethod);
              console.log("payType:", payType);
              console.log("payAmount:", payAmount);

              try {
                await api.post(
                  `/admin/loanTransaction/${selectedItemId}/${payMethod}/${payType}/${payAmount}`,
                  {},
                  { headers: { Authorization: `Bearer ${token}` } }
                );

                const updatedItems = items.map((o) => {
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
                  } else if (payType === "Adding Principle") {
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

                setItems(updatedItems);

                sessionStorage.setItem(
                  "intemsState",
                  JSON.stringify({
                    itemsList: updatedItems,
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

      {/* SIGNATURE DIALOG */}
      <Dialog open={signDialogOpen} onClose={() => setSignDialogOpen(false)}>
        <DialogTitle>
          {signType === "START" ? "Start-Sign" : "End-Sign"}
        </DialogTitle>

        <DialogContent
          sx={{
            overflow: "hidden",
            touchAction: "none",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "400px",
              height: "200px",
              border: "2px solid black",
              touchAction: "none", // IMPORTANT: prevents scrolling while drawing
            }}
          >
            <SignatureCanvas
              ref={signPad}
              canvasProps={{ style: { width: "100%", height: "100%" } }}
            />{" "}
          </div>

          <Button
            variant="outlined"
            color="warning"
            sx={{ mt: 2 }}
            onClick={() => signPad.current?.clear()}
          >
            Clear
          </Button>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setSignDialogOpen(false)}>Cancel</Button>

          <Button
            variant="contained"
            onClick={async () => {
              const signatureBase64 = signPad.current?.toDataURL();

              if (!signatureBase64) return;

              const token = localStorage.getItem("token");

              const url =
                signType === "START"
                  ? `/admin/start-sign/${selectedBillNo}`
                  : `/admin/end-sign/${selectedBillNo}`;

              await api.post(
                url,
                { signature: signatureBase64 },
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              alert("Signature saved!");
              await fetchLoanCustomerDetails();

              setSignDialogOpen(false);
            }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default BillLoanDetails;
