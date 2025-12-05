// src/pages/admin/ShowroomMetalStock.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Grid,
  Table,
  TableHead,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Button,
  TableRow,
  TableCell,
  TableBody,
  MenuItem,
  IconButton,
} from "@mui/material";
import api from "@/services/api"; // ✅ adjust path if needed
import DeleteIcon from "@mui/icons-material/Delete";

// Types
interface WorkerStock {
  workerName: string;
  metalType: string;
  weightAssigned: number;
  date: string; // could be "YYYY-MM-DDTHH..." or "MM/DD/YYYY, ..." etc.
}

interface ShowroomHistory {
  metalStockHisId: number;
  metal: string;
  metalWeight: number;
  date: string;
}

interface SellingMetal {
  metalSellingId: number;
  sellingMetal: string;
  sellingMetalWeight: string;
  sellingMetalTotalAmount: string;
  sellingMetalPhnPayAmount: string;
  sellingMetalCashAmount: string;
  date: string;
}

interface Wallet {
  walletId: number;
  walletType: string;
  personName: string;
  description: string;
  paymentType: string;
  amount: string;
  date: string;
}

interface OldReturnMetals {
  oldMetalReturnId: number;
  onlyExchangeMetal: string;
  onlyExchange_metal_name: string;
  onlyExchange_metal_weight: string;
  onlyExchange_metal_purity_weight: string;
  onlyExchange_total_amount: string;
  onlyExchange_item_cash_amount: string;
  onlyExchange_item_phnpay_amount: string;
  active: boolean;
  date: string;
}

interface MetalStock {
  metalStockId: number;
  total24GoldStock: number;
  total999SilverStock: number;
  totalGoldStock: number;
  totalSilverStock: number;
  totalOldGoldStock: number;
  totalOldSilverStock: number;
  totalOldPuritySilverWeight: number;
  totalOldPurityGoldWeight: number;
  metalStockHistoryData: ShowroomHistory[];
  sellingMetals: SellingMetal[];
  oldReturnMetals: OldReturnMetals[];
}

/** Normalize many possible date strings to YYYY-MM-DD (no timezone shifts). */
function normalizeYMD(raw: unknown): string | null {
  if (raw == null) return null;

  if (typeof raw === "string") {
    const s = raw.trim();

    // 1) "YYYY-MM-DD" at start (e.g., "2025-09-02", "2025-09-02T00:00:00Z")
    const m1 = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m1) return `${m1[1]}-${m1[2]}-${m1[3]}`;

    // 2) "MM/DD/YYYY" (optionally followed by ", time")
    const first = s.split(",")[0]?.trim();
    const parts = first?.split("/");
    if (parts && parts.length === 3) {
      const mm = String(Number(parts[0])).padStart(2, "0");
      const dd = String(Number(parts[1])).padStart(2, "0");
      const yy = String(Number(parts[2]));
      if (
        !Number.isNaN(Number(mm)) &&
        !Number.isNaN(Number(dd)) &&
        yy.length === 4
      ) {
        return `${yy}-${mm}-${dd}`;
      }
    }
  }

  // 3) Last resort: parse as Date and extract local Y-M-D (only if needed)
  const d = new Date(raw as any);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return null;
}

/** Exact-day and/or inclusive range logic used for both tables. */
function inRangeExact(
  rawDate: unknown,
  fromDate: string,
  toDate: string
): boolean {
  const day = normalizeYMD(rawDate);
  if (!day) return false;

  const f = fromDate.trim();
  const t = toDate.trim();

  if (!f && !t) return true; // no filter → include all
  if (f && t) return day >= f && day <= t; // inclusive range
  if (f && !t) return day === f; // exact single-day
  if (!f && t) return day === t; // exact single-day
  return true;
}

const ShowroomMetalStock: React.FC = () => {
  // Add Metal Stock form
  const [addMetal, setAddMetal] = useState<string>("");
  const [addWeight, setAddWeight] = useState<string>("");

  // Selling form
  const [sellMetal, setSellMetal] = useState<string>("");
  const [sellWeight, setSellWeight] = useState<string>("");
  const [sellTotalAmount, setsellTotalAmount] = useState<string>("");
  const [sellCashAmount, setSellCashAmount] = useState<string>("");
  const [sellPhnPayAmount, setSellPhnPayAmount] = useState<string>("");

  // Old Return form
  const [returnMetal, setReturnMetal] = useState<string>("");
  const [returnMetalName, setReturnMetalName] = useState<string>("");
  const [returnWeight, setReturnWeight] = useState<string>("");
  const [returnPurityWeight, setreturnPurityWeight] = useState<string>("");
  const [returnTotalAmount, setReturnTotalAmount] = useState<string>("");

  const [returnCashAmount, setReturnCashAmount] = useState<string>("");
  const [returnPhnPayAmount, setReturnPhnPayAmount] = useState<string>("");

  // Wallet form
  const [walletType, setWalletType] = useState<string>("");
  const [personName, setPersonName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [paymentType, setPaymentType] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

  // Results
  const [workerResults, setWorkerResults] = useState<WorkerStock[]>([]);
  const [historyResults, setHistoryResults] = useState<ShowroomHistory[]>([]);
  const [sellingData, setSellingData] = useState<SellingMetal[]>([]);
  const [oldReturnData, setOldReturnData] = useState<OldReturnMetals[]>([]);
  const [walletData, setWalletData] = useState<Wallet[]>([]);

  const [metalStock, setMetalStock] = useState<MetalStock | null>(null);

  // Date filter (YYYY-MM-DD)
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // Fetch both tables on page load
  useEffect(() => {
    fetchWorkerStock();
    fetchShowroomHistory();
    fetchMetalStock();
    fetchOldReturnData();
    fetchSellingData();
    fetchWalletData();
  }, []);

  const fetchWorkerStock = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get<WorkerStock[]>("/admin/worker", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWorkerResults(res.data || []);
    } catch (error) {
      console.error("Error fetching worker stock:", error);
    }
  };
  const fetchSellingData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get<SellingMetal[]>("/admin/sellingData", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSellingData(res.data || []);
    } catch (error) {
      console.error("Error fetching worker stock:", error);
    }
  };
  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get<Wallet[]>("/admin/getAllWallets", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWalletData(res.data || []);
    } catch (error) {
      console.error("Error fetching worker stock:", error);
    }
  };
  const fetchOldReturnData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get<OldReturnMetals[]>("/admin/oldReturnData", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const activeItems = (res.data || []).filter(
        (item) => item.active === true
      );

      setOldReturnData(activeItems);
    } catch (error) {
      console.error("Error fetching worker stock:", error);
    }
  };
  const fetchMetalStock = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get<MetalStock[]>("/admin/getAllMetalStock", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (Array.isArray(res.data) && res.data.length > 0) {
        setMetalStock(res.data[0]); // take the first element
      }
    } catch (error) {
      console.error("Error fetching metal stock:", error);
    }
  };

  const fetchShowroomHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api
        .get<ShowroomHistory[]>("/admin/history/showroom", {
          headers: {
            Authorization: { Authorization: `Bearer ${token}` } as any,
          }, // fallback if your api wrapper expects different shape
        })
        .catch(async () => {
          // Retry with normal header if the wrapper above doesn't like nested Authorization
          const res2 = await api.get<ShowroomHistory[]>(
            "/admin/history/showroom",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          return res2;
        });
      setHistoryResults(res.data || []);
    } catch (error) {
      console.error("Error fetching showroom history:", error);
    }
  };

  // Add Submit
  const handleWalletSubmit = async () => {
    if (!walletType || !amount || !personName || !paymentType) {
      alert(
        "Please select Wallet Type and enter Amount and Person and Payment Type"
      );
      return;
    }

    try {
      const token = localStorage.getItem("token");

      await api.post(
        `/admin/addWallet?walletType=${walletType}&personName=${personName}&desc=${description}&paymentType=${paymentType}&amount=${amount}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Submitted successfully!");

      // refresh
      fetchWalletData();

      setWalletType("");
      setPersonName("");
      setDescription("");
      setPaymentType("");
      setAmount("");
    } catch (error) {
      console.error("Error adding stock:", error);
      alert("Failed to add stock");
    }
  };

  // Add Submit
  const handleSellingSubmit = async () => {
    if (!sellMetal || !sellWeight || !sellTotalAmount) {
      alert("Please select metal and enter weight and amount");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      // Convert empty or null to 0.0 before sending
      const phnPay = sellPhnPayAmount ? parseFloat(sellPhnPayAmount) : 0.0;
      const cashPay = sellCashAmount ? parseFloat(sellCashAmount) : 0.0;
      const totalAmount = sellTotalAmount ? parseFloat(sellTotalAmount) : 0.0;

      console.log("Phn Pay amount:", phnPay);
      console.log("Cash amount:", cashPay);
      console.log("Total amount:", totalAmount);

      await api.post(
        `/admin/sellingMetal?sellingMetal=${sellMetal}&sellingMetalWeight=${sellWeight}&sellingMetalTotalAmount=${totalAmount}&sellingMetalPhnPayAmount=${cashPay}&sellingMetalCashAmount=${phnPay}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Submitted successfully!");

      // refresh
      fetchMetalStock();
      fetchSellingData();

      setSellMetal("");
      setSellWeight("");
      setsellTotalAmount("");
      setSellCashAmount("");
      setSellPhnPayAmount("");
    } catch (error) {
      console.error("Error adding stock:", error);
      alert("Failed to add stock");
    }
  };

  // Add Submit
  const handleOldReturnSubmit = async () => {
    if (
      !returnMetal ||
      !returnWeight ||
      !returnTotalAmount ||
      !returnMetalName
    ) {
      alert("Please select metal and enter weight");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      // Convert empty or null to 0.0 before sending
      const returnPhnPay = returnPhnPayAmount
        ? parseFloat(returnPhnPayAmount)
        : 0.0;
      const returnCashPay = returnCashAmount
        ? parseFloat(returnCashAmount)
        : 0.0;
      const returnTotalAmt = returnTotalAmount
        ? parseFloat(returnTotalAmount)
        : 0.0;

      console.log("Phn Pay amount:", returnPhnPay);
      console.log("Cash amount:", returnCashPay);
      console.log("Total amount:", returnTotalAmt);

      const fullUrl =
        `/admin/oldReturnMetal?` +
        `onlyExchange_metal=${encodeURIComponent(returnMetal)}&` +
        `onlyExchange_metal_name=${encodeURIComponent(returnMetalName)}&` +
        `onlyExchange_metal_weight=${encodeURIComponent(returnWeight)}&` +
        `onlyExchange_metal_purity_weight=${encodeURIComponent(
          returnPurityWeight
        )}&` +
        `onlyExchange_total_amount=${encodeURIComponent(returnTotalAmt)}&` +
        `onlyExchange_item_cash_amount=${encodeURIComponent(returnCashPay)}&` +
        `onlyExchange_item_phnpay_amount=${encodeURIComponent(returnPhnPay)}`;

      // ✅ Print full URL to console
      console.log("📡 Full request URL:", fullUrl);
      await api.post(
        fullUrl,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Submitted successfully!");

      fetchMetalStock();
      fetchOldReturnData();

      // clear
      setReturnMetal("");
      setReturnWeight("");
      setReturnMetalName("");
      setreturnPurityWeight("");
      setReturnTotalAmount("");
      setReturnCashAmount("");
      setReturnPhnPayAmount("");
    } catch (error) {
      console.error("Error adding stock:", error);
      alert("Failed to add stock");
    }
  };

  // Add Submit
  const handleAddSubmit = async () => {
    if (!addMetal || !addWeight) {
      alert("Please select metal and enter weight");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await api.post(
        `/admin/add?metal=${addMetal}&weight=${addWeight}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Stock added successfully!");

      fetchShowroomHistory();
      fetchMetalStock();

      // clear
      setAddMetal("");
      setAddWeight("");
    } catch (error) {
      console.error("Error adding stock:", error);
      alert("Failed to add stock");
    }
  };

  // FILTERED VIEWS (applied to both tables)
  const filteredWorkerResults = useMemo(
    () =>
      (workerResults || []).filter((w) =>
        inRangeExact(w.date, fromDate, toDate)
      ),
    [workerResults, fromDate, toDate]
  );

  const filteredHistoryResults = useMemo(
    () =>
      (historyResults || [])
        .filter((h) => inRangeExact(h.date, fromDate, toDate))
        .sort((a, b) => b.metalStockHisId - a.metalStockHisId),
    [historyResults, fromDate, toDate]
  );

  const filteredSellingResult = useMemo(
    () =>
      (sellingData || []).filter((h) => inRangeExact(h.date, fromDate, toDate)),
    [sellingData, fromDate, toDate]
  );

  const filteredWalletResult = useMemo(
    () =>
      (walletData || []).filter((h) => inRangeExact(h.date, fromDate, toDate)),
    [walletData, fromDate, toDate]
  );

  const filteredOldReturnData = useMemo(
    () =>
      (oldReturnData || []).filter((h) =>
        inRangeExact(h.date, fromDate, toDate)
      ),
    [oldReturnData, fromDate, toDate]
  );

  const clearDates = () => {
    setFromDate("");
    setToDate("");
  };

  const [showAllOldReturn, setShowAllOldReturn] = useState(false);

  const visibleOldReturnData = showAllOldReturn
    ? filteredOldReturnData
    : filteredOldReturnData.slice(0, 4); // show only 5 rows initially

  const [showAllSelling, setShowAllSelling] = useState(false);

  const visibleSellingResult = showAllSelling
    ? filteredSellingResult
    : filteredSellingResult.slice(0, 4); // 👈 show only 4 initially

  const [showAllWallet, setShowAllWallet] = useState(false);

  const visibleWalletResult = showAllSelling
    ? filteredWalletResult
    : filteredWalletResult.slice(0, 4); // 👈 show only 4 initially

  const [showAllWorker, setShowAllWorker] = useState(false);

  // 👇 Control visible rows
  const visibleWorkerResults = showAllWorker
    ? filteredWorkerResults
    : filteredWorkerResults.slice(0, 4);

  // State to control expand/collapse
  const [showAllHistory, setShowAllHistory] = useState(false);

  // Only show 4 rows initially
  const visibleHistoryResults = showAllHistory
    ? filteredHistoryResults
    : filteredHistoryResults.slice(0, 4);

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedMetal, setSelectedMetal] = useState("");
  const [confirmStep, setConfirmStep] = useState(false);

  const handleDelete = async () => {
    const token = localStorage.getItem("token");
    try {
      await api.delete(`/admin/deleteOldReturn/${selectedMetal}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert(`${selectedMetal} old return metals deleted successfully ✅`);
      fetchMetalStock();
      fetchOldReturnData();
      setOpenDeleteDialog(false);
      setSelectedMetal("");
      setConfirmStep(false);
    } catch (error) {
      console.error("Delete failed:", error);
      alert(`❌ Failed to delete ${selectedMetal} old return metals`);
    }
  };

  return (
    <div className="mt-10 p-3 flex flex-col items-center justify-center gap-6">
      {/* ---------- Add Stock Form ---------- */}
      <Paper
        elevation={4}
        className="relative p-6 rounded-3xl w-full max-w-6xl bg-white/75 backdrop-blur-lg border border-[#d0b3ff] shadow-[0_10px_30px_rgba(136,71,255,0.3)]"
      >
        {metalStock && (
          <div className="mb-12 flex justify-center">
            <div
              className="w-full max-w-3xl rounded-2xl shadow-xl p-6"
              style={{
                background: "linear-gradient(135deg, #1e293b, #0f172a)", // dark gradient
                color: "#fff",
              }}
            >
              {/* Title */}
              <h2 className="text-2xl font-bold text-center mb-6 text-amber-300">
                Showroom Metal Stock
              </h2>

              {/* Grid */}
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-3 pr-4 border-r border-white/20">
                  <p className="flex justify-between">
                    <span className="text-gray-300 font-medium">24 Gold:</span>
                    <span className="text-emerald-300 font-bold">
                      {metalStock.total24GoldStock} g
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-300 font-medium">22 Gold:</span>
                    <span className="text-orange-300 font-bold">
                      {metalStock.totalGoldStock} g
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-300 font-medium">Old Gold:</span>
                    <span className="text-yellow-400 font-bold">
                      {metalStock.totalOldGoldStock} g
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-300 font-medium">
                      Old Purity Gold:
                    </span>
                    <span className="text-red-400 font-bold">
                      {metalStock.totalOldPurityGoldWeight} g
                    </span>
                  </p>
                </div>

                {/* Right Column */}
                <div className="space-y-3 pl-4">
                  <p className="flex justify-between">
                    <span className="text-gray-300 font-medium">
                      999 Silver:
                    </span>
                    <span className="text-emerald-300 font-bold">
                      {metalStock.total999SilverStock} g
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-300 font-medium">
                      995 Silver:
                    </span>
                    <span className="text-orange-300 font-bold">
                      {metalStock.totalSilverStock} g
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-300 font-medium">
                      Old Silver:
                    </span>
                    <span className="text-yellow-400 font-bold">
                      {metalStock.totalOldSilverStock} g
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-300 font-medium">
                      Old Purity Silver:
                    </span>
                    <span className="text-red-400 font-bold">
                      {metalStock.totalOldPuritySilverWeight} g
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <Box display="flex" mt={4}>
          <Typography variant="h6" fontWeight={200} color="primary" mb={3}>
            Add Metal Stock
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {/* Metal Select */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              select
              label="Metal"
              value={addMetal}
              onChange={(e) => setAddMetal(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              SelectProps={{
                displayEmpty: true,
                renderValue: (val: unknown): React.ReactNode =>
                  val ? (
                    <>{val as string}</>
                  ) : (
                    <span style={{ color: "#9aa0a6" }}>Select metal</span>
                  ),
                MenuProps: {
                  PaperProps: { sx: { borderRadius: 2, maxHeight: 320 } },
                },
              }}
            >
              <MenuItem value="">
                <em>Select Metal</em>
              </MenuItem>
              <MenuItem value="24 Gold">24 Gold </MenuItem>
              <MenuItem value="999 Silver">999 Silver</MenuItem>
              <MenuItem value="22 Gold">22 Gold</MenuItem>
              <MenuItem value="995 Silver">995 Silver</MenuItem>
            </TextField>
          </Grid>

          {/* Weight */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              type="number"
              label="Metal Weight (g)"
              value={addWeight}
              onChange={(e) => setAddWeight(e.target.value)}
              required
            />
          </Grid>
        </Grid>

        {/* Submit Button */}
        <Box display="flex" justifyContent="center" mt={4}>
          <Button
            onClick={handleAddSubmit}
            variant="outlined"
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: "12px",
              fontWeight: "bold",
              boxShadow: "0px 4px 10px rgba(136,71,255,0.5)",
              borderColor: "#8847FF",
              color: "#8847FF",
              transition: "all 0.3s",
              "&:hover": { backgroundColor: "#8847FF", color: "#fff" },
            }}
          >
            ADD Stock
          </Button>
        </Box>

        <Box display="flex" mt={4}>
          <Typography variant="h6" fontWeight={200} color="primary" mb={3}>
            Selling Metal
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {/* Metal Select */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              select
              label="Selling Metal"
              value={sellMetal}
              onChange={(e) => setSellMetal(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              SelectProps={{
                displayEmpty: true,
                renderValue: (val: unknown): React.ReactNode =>
                  val ? (
                    <>{val as string}</>
                  ) : (
                    <span style={{ color: "#9aa0a6" }}>Select metal</span>
                  ),
                MenuProps: {
                  PaperProps: { sx: { borderRadius: 2, maxHeight: 320 } },
                },
              }}
            >
              <MenuItem value="">
                <em>Select Metal</em>
              </MenuItem>
              <MenuItem value="24 Gold">24 Gold </MenuItem>
              <MenuItem value="999 Silver">999 Silver</MenuItem>
              <MenuItem value="22 Gold">22 Gold</MenuItem>
              <MenuItem value="995 Silver">995 Silver</MenuItem>
            </TextField>
          </Grid>

          {/* Weight */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              type="number"
              label="Metal Weight (g)"
              value={sellWeight}
              onChange={(e) => setSellWeight(e.target.value)}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              type="number"
              label="Total Amount"
              value={sellTotalAmount}
              onChange={(e) => setsellTotalAmount(e.target.value)}
              required
            />
          </Grid>

          {/*Cash Amount */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              type="number"
              label="Cash Amount"
              value={sellCashAmount}
              onChange={(e) => setSellCashAmount(e.target.value)}
            />
          </Grid>
          {/* Amount */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              type="number"
              label="Phn Pay Amount"
              value={sellPhnPayAmount}
              onChange={(e) => setSellPhnPayAmount(e.target.value)}
            />
          </Grid>
        </Grid>

        {/* Submit Button */}
        <Box display="flex" justifyContent="center" mt={4}>
          <Button
            onClick={handleSellingSubmit}
            variant="outlined"
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: "12px",
              fontWeight: "bold",
              boxShadow: "0px 4px 10px rgba(136,71,255,0.5)",
              borderColor: "#8847FF",
              color: "#8847FF",
              transition: "all 0.3s",
              "&:hover": { backgroundColor: "#8847FF", color: "#fff" },
            }}
          >
            Submit
          </Button>
        </Box>

        <Box display="flex" mt={4}>
          <Typography variant="h6" fontWeight={200} color="primary" mb={3}>
            Old Return Metal
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {/* Metal Select */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              select
              label="Metal"
              value={returnMetal}
              onChange={(e) => setReturnMetal(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              SelectProps={{
                displayEmpty: true,
                renderValue: (val: unknown): React.ReactNode =>
                  val ? (
                    <>{val as string}</>
                  ) : (
                    <span style={{ color: "#9aa0a6" }}>Select metal</span>
                  ),
                MenuProps: {
                  PaperProps: { sx: { borderRadius: 2, maxHeight: 320 } },
                },
              }}
            >
              <MenuItem value="">
                <em>Select Metal</em>
              </MenuItem>
              <MenuItem value="Gold">Gold</MenuItem>
              <MenuItem value="Silver">Silver</MenuItem>
              <MenuItem value="24 gold">24 gold</MenuItem>
              <MenuItem value="22 gold">22 gold</MenuItem>
              <MenuItem value="999 silver">999 silver</MenuItem>
              <MenuItem value="995 silver">995 silver</MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              type="text"
              label="Metal Name"
              value={returnMetalName}
              onChange={(e) => {
                const formatted = e.target.value
                  .split(" ")
                  .map(
                    (word) =>
                      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                  )
                  .join(" ");

                setReturnMetalName(formatted);
              }}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              type="number"
              label="Metal Weight (g)"
              value={returnWeight}
              onChange={(e) => setReturnWeight(e.target.value)}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              type="number"
              label="Purity Metal Weight (g)"
              value={returnPurityWeight}
              onChange={(e) => setreturnPurityWeight(e.target.value)}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              type="number"
              label="Total Amount"
              value={returnTotalAmount}
              onChange={(e) => setReturnTotalAmount(e.target.value)}
            />
          </Grid>

          {/*Cash Amount */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              type="number"
              label="Cash Amount"
              value={returnCashAmount}
              onChange={(e) => setReturnCashAmount(e.target.value)}
              required
            />
          </Grid>
          {/* Online Amount */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              type="number"
              label="Phn Pay Amount"
              value={returnPhnPayAmount}
              onChange={(e) => setReturnPhnPayAmount(e.target.value)}
              required
            />
          </Grid>
        </Grid>

        {/* Submit Button */}
        <Box display="flex" justifyContent="center" mt={4}>
          <Button
            onClick={handleOldReturnSubmit}
            variant="outlined"
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: "12px",
              fontWeight: "bold",
              boxShadow: "0px 4px 10px rgba(136,71,255,0.5)",
              borderColor: "#8847FF",
              color: "#8847FF",
              transition: "all 0.3s",
              "&:hover": { backgroundColor: "#8847FF", color: "#fff" },
            }}
          >
            Submit Old Return
          </Button>
        </Box>

        <Box display="flex" mt={4}>
          <Typography variant="h6" fontWeight={200} color="primary" mb={3}>
            Showroom Wallet
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {/* Wallet Type Select */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              select
              label="Wallet Type"
              value={walletType}
              onChange={(e) => setWalletType(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              SelectProps={{
                displayEmpty: true,
                renderValue: (val: unknown): React.ReactNode =>
                  val ? (
                    <>{val as string}</>
                  ) : (
                    <span style={{ color: "#9aa0a6" }}>Select Type</span>
                  ),
                MenuProps: {
                  PaperProps: { sx: { borderRadius: 2, maxHeight: 320 } },
                },
              }}
            >
              <MenuItem value="">
                <em>Select Type</em>
              </MenuItem>
              <MenuItem value="With Draw">With Draw </MenuItem>
              <MenuItem value="Deposit">Deposit</MenuItem>
            </TextField>
          </Grid>

          {/* Person Name */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              label="Name"
              value={personName}
              onChange={(e) => {
                const formatted = e.target.value
                  .split(" ")
                  .map(
                    (word) =>
                      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                  )
                  .join(" ");

                setPersonName(formatted);
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              select
              label="Payment Type"
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              SelectProps={{
                displayEmpty: true,
                renderValue: (val: unknown): React.ReactNode =>
                  val ? (
                    <>{val as string}</>
                  ) : (
                    <span style={{ color: "#9aa0a6" }}>
                      Select Payment Type
                    </span>
                  ),
                MenuProps: {
                  PaperProps: { sx: { borderRadius: 2, maxHeight: 320 } },
                },
              }}
            >
              <MenuItem value="">
                <em>Select Payment Type</em>
              </MenuItem>
              <MenuItem value="Phone Pay">Phone Pay</MenuItem>
              <MenuItem value="Cash">Cash</MenuItem>
            </TextField>
          </Grid>
          {/* Amount */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              type="number"
              label="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Grid>
        </Grid>

        {/* Submit Button */}
        <Box display="flex" justifyContent="center" mt={4}>
          <Button
            onClick={handleWalletSubmit}
            variant="outlined"
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: "12px",
              fontWeight: "bold",
              boxShadow: "0px 4px 10px rgba(136,71,255,0.5)",
              borderColor: "#8847FF",
              color: "#8847FF",
              transition: "all 0.3s",
              "&:hover": { backgroundColor: "#8847FF", color: "#fff" },
            }}
          >
            Submit
          </Button>
        </Box>
      </Paper>
      {/* ---------- Date Filter ---------- */}
      <Paper
        elevation={4}
        sx={{
          p: 3,
          width: "85%",
          maxWidth: "96rem",
          borderRadius: 3,
          border: "1px solid #d0b3ff",
          bgcolor: "rgba(255,255,255,0.82)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 10px 30px rgba(136,71,255,0.15)",
          mb: 4,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            letterSpacing: 0.3,
            color: "primary.main",
            mb: 2,
          }}
        >
          Filter by Date
        </Typography>

        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              label="From"
              type="date"
              size="small"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{
                width: "100%",
                "& .MuiOutlinedInput-input": { py: 1.1 },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              label="To"
              type="date"
              size="small"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{
                width: "100%",
                "& .MuiOutlinedInput-input": { py: 1.1 },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 12, md: "auto" }}>
            <Button
              variant="outlined"
              onClick={clearDates}
              sx={{
                px: 3,
                borderRadius: 2,
                fontWeight: 700,
                borderColor: "#8847FF",
                color: "#8847FF",
                "&:hover": {
                  bgcolor: "#8847FF",
                  color: "#fff",
                  borderColor: "#8847FF",
                },
              }}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {filteredWorkerResults.length > 0 && (
        <Paper
          elevation={4}
          className="relative p-8 rounded-3xl w-full max-w-6xl bg-white/75 backdrop-blur-lg border border-[#d0b3ff] shadow-[0_10px_30px_rgba(136,71,255,0.3)]"
        >
          <Typography
            variant="h5"
            fontWeight={700}
            color="primary"
            mb={3}
            align="center"
          >
            Worker Stock
          </Typography>

          <Table
            size="medium"
            className="w-full border-collapse border border-gray-300 rounded-xl overflow-hidden"
          >
            <TableHead className="bg-gray-200">
              <TableRow>
                <TableCell
                  sx={{ color: "#1C1C1C", fontWeight: 600, fontSize: "1rem" }}
                >
                  <div className="flex justify-center items-center">
                    Worker Name
                  </div>
                </TableCell>

                <TableCell
                  sx={{ color: "#1C1C1C", fontWeight: 600, fontSize: "1rem" }}
                >
                  <div className="flex justify-center items-center">Metal</div>
                </TableCell>

                <TableCell
                  sx={{ color: "#1C1C1C", fontWeight: 600, fontSize: "1rem" }}
                >
                  <div className="flex justify-center items-center">
                    Weight Assigned
                  </div>
                </TableCell>

                <TableCell
                  sx={{ color: "#1C1C1C", fontWeight: 600, fontSize: "1rem" }}
                >
                  <div className="flex justify-center items-center">Date</div>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleWorkerResults.map((p: any, idx: number) => (
                <TableRow key={idx}>
                  <TableCell
                    className="border px-3 py-2 text-center"
                    sx={{ fontSize: "0.95rem" }}
                  >
                    <div className="flex justify-center items-center">
                      {p.workerName}
                    </div>
                  </TableCell>

                  <TableCell
                    className="border px-3 py-2 text-center"
                    sx={{ fontSize: "0.95rem" }}
                  >
                    <div className="flex justify-center items-center">
                      {p.metalType}
                    </div>
                  </TableCell>

                  <TableCell
                    className="border px-3 py-2 text-center"
                    sx={{ fontSize: "0.95rem" }}
                  >
                    <div className="flex justify-center items-center">
                      {p.weightAssigned}
                    </div>
                  </TableCell>

                  <TableCell
                    className="border px-3 py-2 text-center"
                    sx={{ fontSize: "0.95rem" }}
                  >
                    <div className="flex justify-center items-center">
                      {p.date}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* 👇 Toggle Expand/Collapse */}
          {filteredWorkerResults.length > 4 && (
            <Typography
              onClick={() => setShowAllWorker(!showAllWorker)}
              sx={{
                cursor: "pointer",
                textAlign: "center",
                marginTop: 2,
                color: "#8847FF",
                fontWeight: 600,
                textDecoration: "underline",
              }}
            >
              {showAllWorker ? "View Less" : "View More"}
            </Typography>
          )}
        </Paper>
      )}

      {/* ---------- Showroom History Table ---------- */}
      {filteredHistoryResults.length > 0 && (
        <Paper
          elevation={4}
          className="relative p-8 rounded-3xl w-full max-w-6xl bg-white/75 backdrop-blur-lg border border-[#d0b3ff] shadow-[0_10px_30px_rgba(136,71,255,0.3)]"
        >
          <Typography
            variant="h5"
            fontWeight={700}
            color="primary"
            mb={3}
            align="center"
          >
            Showroom History
          </Typography>

          <Table
            size="medium"
            className="w-full border-collapse border border-gray-300 rounded-xl overflow-hidden"
          >
            <TableHead className="bg-gray-200">
              <TableRow>
                <TableCell
                  sx={{ color: "#1C1C1C", fontWeight: 600, fontSize: "1rem" }}
                >
                  <div className="flex justify-center items-center">Metal</div>
                </TableCell>

                <TableCell
                  sx={{ color: "#1C1C1C", fontWeight: 600, fontSize: "1rem" }}
                >
                  <div className="flex justify-center items-center">Weight</div>
                </TableCell>

                <TableCell
                  sx={{ color: "#1C1C1C", fontWeight: 600, fontSize: "1rem" }}
                >
                  <div className="flex justify-center items-center">Date</div>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleHistoryResults.map((r) => (
                <TableRow key={r.metalStockHisId}>
                  <TableCell
                    className="border px-3 py-2 text-center"
                    sx={{ fontSize: "0.95rem" }}
                  >
                    <div className="flex justify-center items-center">
                      {r.metal}
                    </div>
                  </TableCell>

                  <TableCell
                    className="border px-3 py-2 text-center"
                    sx={{ fontSize: "0.95rem" }}
                  >
                    <div className="flex justify-center items-center">
                      {r.metalWeight}
                    </div>
                  </TableCell>

                  <TableCell
                    className="border px-3 py-2 text-center"
                    sx={{ fontSize: "0.95rem" }}
                  >
                    <div className="flex justify-center items-center">
                      {r.date}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Toggle Button */}
          {filteredHistoryResults.length > 4 && (
            <Typography
              onClick={() => setShowAllHistory(!showAllHistory)}
              sx={{
                cursor: "pointer",
                textAlign: "center",
                marginTop: 2,
                color: "#8847FF",
                fontWeight: 600,
                textDecoration: "underline",
              }}
            >
              {showAllHistory ? "View Less" : "View More"}
            </Typography>
          )}
        </Paper>
      )}

      {/* ---------- Selling Table ---------- */}
      {filteredSellingResult.length > 0 && (
        <Paper
          elevation={4}
          className="relative p-8 rounded-3xl w-full max-w-6xl bg-white/75 backdrop-blur-lg border border-[#d0b3ff] shadow-[0_10px_30px_rgba(136,71,255,0.3)]"
        >
          <Typography
            variant="h5"
            fontWeight={700}
            color="primary"
            mb={3}
            align="center"
          >
            Selling Data
          </Typography>

          <Table
            size="medium"
            className="w-full border-collapse border border-gray-300 rounded-xl overflow-hidden"
          >
            <TableHead className="bg-gray-200">
              <TableRow>
                <TableCell
                  sx={{ color: "#1C1C1C", fontWeight: 600, fontSize: "1rem" }}
                >
                  <div className="flex justify-center items-center">Metal</div>
                </TableCell>

                <TableCell
                  sx={{ color: "#1C1C1C", fontWeight: 600, fontSize: "1rem" }}
                >
                  <div className="flex justify-center items-center">Weight</div>
                </TableCell>

                <TableCell
                  sx={{ color: "#1C1C1C", fontWeight: 600, fontSize: "1rem" }}
                >
                  <div className="flex justify-center items-center">
                    Total Amount
                  </div>
                </TableCell>

                <TableCell
                  sx={{ color: "#1C1C1C", fontWeight: 600, fontSize: "1rem" }}
                >
                  <div className="flex justify-center items-center">
                    Cash Amount
                  </div>
                </TableCell>

                <TableCell
                  sx={{ color: "#1C1C1C", fontWeight: 600, fontSize: "1rem" }}
                >
                  <div className="flex justify-center items-center">
                    Online Amount
                  </div>
                </TableCell>
                <TableCell
                  sx={{ color: "#1C1C1C", fontWeight: 600, fontSize: "1rem" }}
                >
                  <div className="flex justify-center items-center">Date</div>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleSellingResult.map((r) => (
                <TableRow key={r.metalSellingId}>
                  <TableCell
                    className="border px-3 py-2 text-center"
                    sx={{ fontSize: "0.95rem" }}
                  >
                    <div className="flex justify-center items-center">
                      {r.sellingMetal}
                    </div>
                  </TableCell>

                  <TableCell
                    className="border px-3 py-2 text-center"
                    sx={{ fontSize: "0.95rem" }}
                  >
                    <div className="flex justify-center items-center">
                      {r.sellingMetalWeight}
                    </div>
                  </TableCell>

                  <TableCell
                    className="border px-3 py-2 text-center"
                    sx={{ fontSize: "0.95rem" }}
                  >
                    <div className="flex justify-center items-center">
                      {r.sellingMetalTotalAmount}
                    </div>
                  </TableCell>

                  <TableCell
                    className="border px-3 py-2 text-center"
                    sx={{ fontSize: "0.95rem" }}
                  >
                    <div className="flex justify-center items-center">
                      {r.sellingMetalCashAmount}
                    </div>
                  </TableCell>

                  <TableCell
                    className="border px-3 py-2 text-center"
                    sx={{ fontSize: "0.95rem" }}
                  >
                    <div className="flex justify-center items-center">
                      {r.sellingMetalPhnPayAmount}
                    </div>
                  </TableCell>

                  <TableCell
                    className="border px-3 py-2 text-center"
                    sx={{ fontSize: "0.95rem" }}
                  >
                    <div className="flex justify-center items-center">
                      {r.date}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredSellingResult.length > 4 && (
            <Typography
              onClick={() => setShowAllSelling(!showAllSelling)}
              sx={{
                cursor: "pointer",
                textAlign: "center",
                marginTop: 2,
                color: "#8847FF",
                fontWeight: 600,
                textDecoration: "underline",
              }}
            >
              {showAllSelling ? "View Less" : "View More"}
            </Typography>
          )}
        </Paper>
      )}

      <Paper
        elevation={4}
        className="relative p-8 rounded-3xl w-full max-w-6xl bg-white/75 backdrop-blur-lg border border-[#d0b3ff] shadow-[0_10px_30px_rgba(136,71,255,0.3)]"
      >
        {/* Delete Icon (top right) */}
        <IconButton
          onClick={() => setOpenDeleteDialog(true)}
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            color: "red",
            background: "#fef2f2",
            "&:hover": { background: "#fee2e2" },
          }}
        >
          <DeleteIcon />
        </IconButton>

        <Typography
          variant="h5"
          fontWeight={700}
          color="primary"
          mb={3}
          align="center"
        >
          Old Return Data
        </Typography>
        <Box
          sx={{
            width: "100%",
            overflowX: "auto", // allows horizontal scrolling on small screens
          }}
        >
          <Table
            sx={{ minWidth: 800 /* ensure table doesn’t collapse */ }}
            size="medium"
            className="w-full border-collapse border border-gray-300 rounded-xl overflow-hidden"
          >
            <TableHead className="bg-gray-200">
              <TableRow>
                <TableCell
                  sx={{ color: "#1C1C1C", fontWeight: 600, fontSize: "1rem" }}
                >
                  <div className="flex justify-center items-center">Metal</div>
                </TableCell>

                <TableCell
                  sx={{ color: "#1C1C1C", fontWeight: 600, fontSize: "1rem" }}
                >
                  <div className="flex justify-center items-center">
                    {" "}
                    Item Name
                  </div>
                </TableCell>

                <TableCell
                  sx={{ color: "#1C1C1C", fontWeight: 600, fontSize: "1rem" }}
                >
                  <div className="flex justify-center items-center">
                    Gross Weight
                  </div>
                </TableCell>

                <TableCell
                  sx={{ color: "#1C1C1C", fontWeight: 600, fontSize: "1rem" }}
                >
                  <div className="flex justify-center items-center">
                    {" "}
                    Purity Weight
                  </div>
                </TableCell>

                <TableCell
                  sx={{ color: "#1C1C1C", fontWeight: 600, fontSize: "1rem" }}
                >
                  <div className="flex justify-center items-center">
                    Total Amount
                  </div>
                </TableCell>

                <TableCell
                  sx={{ color: "#1C1C1C", fontWeight: 600, fontSize: "1rem" }}
                >
                  <div className="flex justify-center items-center">
                    {" "}
                    Cash Amount
                  </div>
                </TableCell>

                <TableCell
                  sx={{ color: "#1C1C1C", fontWeight: 600, fontSize: "1rem" }}
                >
                  <div className="flex justify-center items-center">
                    {" "}
                    Phn Pay Amount
                  </div>
                </TableCell>

                <TableCell
                  sx={{ color: "#1C1C1C", fontWeight: 600, fontSize: "1rem" }}
                >
                  <div className="flex justify-center items-center"> Date</div>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleOldReturnData.map((r) => (
                <TableRow key={r.oldMetalReturnId}>
                  <TableCell
                    className="border px-3 py-2 text-center"
                    sx={{ fontSize: "0.95rem" }}
                  >
                    <div className="flex justify-center items-center">
                      {r.onlyExchangeMetal}
                    </div>
                  </TableCell>

                  <TableCell
                    className="border px-3 py-2 text-center"
                    sx={{ fontSize: "0.95rem" }}
                  >
                    <div className="flex justify-center items-center">
                      {r.onlyExchange_metal_name}
                    </div>
                  </TableCell>

                  <TableCell
                    className="border px-3 py-2 text-center"
                    sx={{ fontSize: "0.95rem" }}
                  >
                    <div className="flex justify-center items-center">
                      {r.onlyExchange_metal_weight}
                    </div>
                  </TableCell>

                  <TableCell
                    className="border px-3 py-2 text-center"
                    sx={{ fontSize: "0.95rem" }}
                  >
                    <div className="flex justify-center items-center">
                      {r.onlyExchange_metal_purity_weight}
                    </div>
                  </TableCell>

                  <TableCell
                    className="border px-3 py-2 text-center"
                    sx={{ fontSize: "0.95rem" }}
                  >
                    <div className="flex justify-center items-center">
                      {r.onlyExchange_total_amount}
                    </div>
                  </TableCell>

                  <TableCell
                    className="border px-3 py-2 text-center"
                    sx={{ fontSize: "0.95rem" }}
                  >
                    <div className="flex justify-center items-center">
                      {r.onlyExchange_item_cash_amount}
                    </div>
                  </TableCell>

                  <TableCell
                    className="border px-3 py-2 text-center"
                    sx={{ fontSize: "0.95rem" }}
                  >
                    <div className="flex justify-center items-center">
                      {r.onlyExchange_item_phnpay_amount}
                    </div>
                  </TableCell>

                  <TableCell
                    className="border px-3 py-2 text-center"
                    sx={{ fontSize: "0.95rem" }}
                  >
                    <div className="flex justify-center items-center">
                      {r.date}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        {filteredOldReturnData.length > 5 && (
          <Typography
            onClick={() => setShowAllOldReturn(!showAllOldReturn)}
            sx={{
              cursor: "pointer",
              textAlign: "center",
              marginTop: 2,
              color: "#8847FF",
              fontWeight: 600,
              textDecoration: "underline",
            }}
          >
            {showAllOldReturn ? "View Less" : "View More"}
          </Typography>
        )}
      </Paper>

      {/* ---------- Wallet Table ---------- */}
      {filteredWalletResult.length > 0 && (
        <Paper
          elevation={4}
          className="relative p-8 rounded-3xl w-full max-w-6xl bg-white/75 backdrop-blur-lg border border-[#d0b3ff] shadow-[0_10px_30px_rgba(136,71,255,0.3)]"
        >
          <Typography
            variant="h5"
            fontWeight={700}
            color="primary"
            mb={3}
            align="center"
          >
            Wallet Data
          </Typography>

          <Table
            size="medium"
            className="w-full border-collapse border border-gray-300 rounded-xl overflow-hidden"
          >
            <TableHead className="bg-gray-200">
              <TableRow>
                <TableCell
                  sx={{ color: "#1C1C1C", fontWeight: 600, fontSize: "1rem" }}
                >
                  <div className="flex justify-center items-center">
                    Wallet Type
                  </div>
                </TableCell>

                <TableCell
                  sx={{ color: "#1C1C1C", fontWeight: 600, fontSize: "1rem" }}
                >
                  <div className="flex justify-center items-center">Person</div>
                </TableCell>

                <TableCell
                  sx={{ color: "#1C1C1C", fontWeight: 600, fontSize: "1rem" }}
                >
                  <div className="flex justify-center items-center">
                    Description
                  </div>
                </TableCell>

                <TableCell
                  sx={{ color: "#1C1C1C", fontWeight: 600, fontSize: "1rem" }}
                >
                  <div className="flex justify-center items-center">
                    Payment Type
                  </div>
                </TableCell>

                <TableCell
                  sx={{ color: "#1C1C1C", fontWeight: 600, fontSize: "1rem" }}
                >
                  <div className="flex justify-center items-center">Amount</div>
                </TableCell>
                <TableCell
                  sx={{ color: "#1C1C1C", fontWeight: 600, fontSize: "1rem" }}
                >
                  <div className="flex justify-center items-center">Date</div>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleWalletResult.map((r) => (
                <TableRow key={r.walletId}>
                  <TableCell
                    className="border px-3 py-2 text-center"
                    sx={{ fontSize: "0.95rem" }}
                  >
                    <div className="flex justify-center items-center">
                      {r.walletType}
                    </div>
                  </TableCell>

                  <TableCell
                    className="border px-3 py-2 text-center"
                    sx={{ fontSize: "0.95rem" }}
                  >
                    <div className="flex justify-center items-center">
                      {r.personName}
                    </div>
                  </TableCell>

                  <TableCell
                    className="border px-3 py-2 text-center"
                    sx={{ fontSize: "0.95rem" }}
                  >
                    <div className="flex justify-center items-center">
                      {r.description}
                    </div>
                  </TableCell>

                  <TableCell
                    className="border px-3 py-2 text-center"
                    sx={{ fontSize: "0.95rem" }}
                  >
                    <div className="flex justify-center items-center">
                      {r.paymentType}
                    </div>
                  </TableCell>

                  <TableCell
                    className="border px-3 py-2 text-center"
                    sx={{ fontSize: "0.95rem" }}
                  >
                    <div className="flex justify-center items-center">
                      {r.amount}
                    </div>
                  </TableCell>

                  <TableCell
                    className="border px-3 py-2 text-center"
                    sx={{ fontSize: "0.95rem" }}
                  >
                    <div className="flex justify-center items-center">
                      {r.date}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredWalletResult.length > 4 && (
            <Typography
              onClick={() => setShowAllWallet(!showAllWallet)}
              sx={{
                cursor: "pointer",
                textAlign: "center",
                marginTop: 2,
                color: "#8847FF",
                fontWeight: 600,
                textDecoration: "underline",
              }}
            >
              {showAllWallet ? "View Less" : "View More"}
            </Typography>
          )}
        </Paper>
      )}

      {/* Delete Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => {
          setOpenDeleteDialog(false);
          setSelectedMetal("");
          setConfirmStep(false);
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle
          sx={{ fontWeight: 600, textAlign: "center", color: "#8847FF" }}
        >
          Delete Old Return Metals
        </DialogTitle>

        <DialogContent sx={{ textAlign: "center", mt: 1 }}>
          {!confirmStep ? (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Select Metal</InputLabel>
              <Select
                value={selectedMetal}
                onChange={(e) => setSelectedMetal(e.target.value)}
                label="Select Metal"
              >
                <MenuItem value="Gold">Gold</MenuItem>
                <MenuItem value="Silver">Silver</MenuItem>
              </Select>
            </FormControl>
          ) : (
            <Typography sx={{ mt: 2 }}>
              Are you sure you want to delete all <b>{selectedMetal}</b> old
              return metals?
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ justifyContent: "center", mb: 2 }}>
          {!confirmStep ? (
            <>
              <Button
                onClick={() => {
                  setOpenDeleteDialog(false);
                  setSelectedMetal("");
                }}
                variant="outlined"
              >
                Cancel
              </Button>
              <Button
                onClick={() => setConfirmStep(true)}
                variant="contained"
                color="error"
                disabled={!selectedMetal}
              >
                OK
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setConfirmStep(false)} variant="outlined">
                Back
              </Button>
              <Button onClick={handleDelete} variant="contained" color="error">
                Yes, Delete
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* If filters selected but nothing matched */}
      {(fromDate || toDate) &&
        filteredWorkerResults.length === 0 &&
        filteredHistoryResults.length === 0 &&
        filteredSellingResult.length === 0 &&
        filteredOldReturnData.length === 0 && (
          <p className="text-center text-sm text-gray-600">
            No records found for the selected date{toDate ? " range" : ""}.
          </p>
        )}
    </div>
  );
};

export default ShowroomMetalStock;
