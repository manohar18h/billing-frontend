// src/pages/admin/ShowroomMetalStock.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  MenuItem,
} from "@mui/material";
import api from "@/services/api"; // ✅ adjust path if needed

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

interface MetalStock {
  metalStockId: number;
  total24GoldStock: number;
  total999SilverStock: number;
  totalGoldStock: number;
  totalSilverStock: number;
  metalStockHistoryData: ShowroomHistory[];
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
  // Form fields
  const [metal, setMetal] = useState<string>("");
  const [weight, setWeight] = useState<number | "">("");

  // Results
  const [workerResults, setWorkerResults] = useState<WorkerStock[]>([]);
  const [historyResults, setHistoryResults] = useState<ShowroomHistory[]>([]);
  const [metalStock, setMetalStock] = useState<MetalStock | null>(null);

  // Date filter (YYYY-MM-DD)
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // Fetch both tables on page load
  useEffect(() => {
    fetchWorkerStock();
    fetchShowroomHistory();
    fetchMetalStock();
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
  const handleAddSubmit = async () => {
    if (!metal || !weight) {
      alert("Please select metal and enter weight");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await api.post(
        `/admin/add?metal=${metal}&weight=${weight}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Stock added successfully!");

      // refresh
      fetchWorkerStock();
      fetchShowroomHistory();
      fetchMetalStock();

      // clear
      setMetal("");
      setWeight("");
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
      (historyResults || []).filter((h) =>
        inRangeExact(h.date, fromDate, toDate)
      ),
    [historyResults, fromDate, toDate]
  );

  const clearDates = () => {
    setFromDate("");
    setToDate("");
  };

  // When clicking a date cell in table → set single-day exact filter
  const drillToExactDate = (rawDate: string) => {
    const ymd = normalizeYMD(rawDate);
    if (!ymd) return;
    setFromDate(ymd);
    setToDate("");
  };

  return (
    <div className="mt-10 p-3 flex flex-col items-center justify-center gap-6">
      {/* ---------- Add Stock Form ---------- */}
      <Paper
        elevation={4}
        className="relative p-6 rounded-3xl w-full max-w-6xl bg-white/75 backdrop-blur-lg border border-[#d0b3ff] shadow-[0_10px_30px_rgba(136,71,255,0.3)]"
      >
        <Typography variant="h5" fontWeight={700} color="primary" mb={3}>
          Showroom Metal Stock
        </Typography>

        {metalStock && (
          <Box mb={6} display="flex" justifyContent="center">
            <Grid container spacing={5} maxWidth={400} textAlign="center">
              <Grid size={{ xs: 5 }}>
                <Typography variant="subtitle1">
                  <span style={{ color: "#8847FF", fontWeight: 600 }}>
                    24 Gold:{" "}
                  </span>
                  <span style={{ color: "#00FF00", fontWeight: 700 }}>
                    {metalStock.total24GoldStock} g
                  </span>
                </Typography>
              </Grid>
              <Grid size={{ xs: 5 }}>
                <Typography variant="subtitle1">
                  <span style={{ color: "#8847FF", fontWeight: 600 }}>
                    999 Silver:{" "}
                  </span>
                  <span style={{ color: "#00FF00", fontWeight: 700 }}>
                    {metalStock.total999SilverStock} g
                  </span>
                </Typography>
              </Grid>
            </Grid>
            <Grid container spacing={4} maxWidth={400} textAlign="center">
              <Grid size={{ xs: 4 }}>
                <Typography variant="subtitle1">
                  <span style={{ color: "#8847FF", fontWeight: 600 }}>
                    Gold:{" "}
                  </span>
                  <span style={{ color: "#FF8C00", fontWeight: 700 }}>
                    {metalStock.totalGoldStock} g
                  </span>
                </Typography>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <Typography variant="subtitle1">
                  <span style={{ color: "#8847FF", fontWeight: 600 }}>
                    Silver:{" "}
                  </span>
                  <span style={{ color: "#FF8C00", fontWeight: 700 }}>
                    {metalStock.totalSilverStock} g
                  </span>
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}

        <Grid container spacing={2}>
          {/* Metal Select */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              select
              label="Metal"
              value={metal}
              onChange={(e) => setMetal(e.target.value)}
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
              <MenuItem value="Gold">Gold</MenuItem>
              <MenuItem value="Silver">Silver</MenuItem>
            </TextField>
          </Grid>

          {/* Weight */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              type="number"
              label="Metal Weight (g)"
              value={weight}
              onChange={(e) =>
                setWeight(e.target.value === "" ? "" : Number(e.target.value))
              }
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
            ADD
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

      {/* ---------- Worker Stock Table ---------- */}
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

          <Table size="medium">
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{ color: "#8847FF", fontWeight: 600, fontSize: "1rem" }}
                >
                  Worker Name
                </TableCell>
                <TableCell
                  sx={{ color: "#8847FF", fontWeight: 600, fontSize: "1rem" }}
                >
                  Metal
                </TableCell>
                <TableCell
                  sx={{ color: "#8847FF", fontWeight: 600, fontSize: "1rem" }}
                >
                  Weight Assigned
                </TableCell>
                <TableCell
                  sx={{ color: "#8847FF", fontWeight: 600, fontSize: "1rem" }}
                >
                  Date
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredWorkerResults.map((p, idx) => (
                <TableRow key={idx}>
                  <TableCell sx={{ fontSize: "0.95rem" }}>
                    {p.workerName}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.95rem" }}>
                    {p.metalType}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.95rem" }}>
                    {p.weightAssigned}
                  </TableCell>
                  <TableCell
                    sx={{
                      fontSize: "0.95rem",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                    title="Click to filter to this day"
                    onClick={() => drillToExactDate(p.date)}
                  >
                    {p.date}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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

          <Table size="medium">
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{ color: "#8847FF", fontWeight: 600, fontSize: "1rem" }}
                >
                  Metal
                </TableCell>
                <TableCell
                  sx={{ color: "#8847FF", fontWeight: 600, fontSize: "1rem" }}
                >
                  Weight
                </TableCell>
                <TableCell
                  sx={{ color: "#8847FF", fontWeight: 600, fontSize: "1rem" }}
                >
                  Date
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredHistoryResults.map((r) => (
                <TableRow key={r.metalStockHisId}>
                  <TableCell sx={{ fontSize: "0.95rem" }}>{r.metal}</TableCell>
                  <TableCell sx={{ fontSize: "0.95rem" }}>
                    {r.metalWeight}
                  </TableCell>
                  <TableCell
                    sx={{
                      fontSize: "0.95rem",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                    title="Click to filter to this day"
                    onClick={() => drillToExactDate(r.date)}
                  >
                    {r.date}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* If filters selected but nothing matched */}
      {(fromDate || toDate) &&
        filteredWorkerResults.length === 0 &&
        filteredHistoryResults.length === 0 && (
          <p className="text-center text-sm text-gray-600">
            No records found for the selected date{toDate ? " range" : ""}.
          </p>
        )}
    </div>
  );
};

export default ShowroomMetalStock;
