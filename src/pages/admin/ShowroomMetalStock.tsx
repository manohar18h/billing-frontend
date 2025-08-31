import React, { useState, useEffect } from "react";
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
  date: string;
}

interface ShowroomHistory {
  metalStockHisId: number;
  metal: string;
  metalWeight: number;
  date: string;
}

interface MetalStock {
  metalStockId: number;
  totalGoldStock: number;
  totalSilverStock: number;
  totalCopperStock: number;
  metalStockHistoryData: ShowroomHistory[];
}

const ShowroomMetalStock: React.FC = () => {
  // Form fields
  const [metal, setMetal] = useState<string>("");
  const [weight, setWeight] = useState<number | "">("");

  // Results
  const [workerResults, setWorkerResults] = useState<WorkerStock[]>([]);
  const [historyResults, setHistoryResults] = useState<ShowroomHistory[]>([]);
  const [metalStock, setMetalStock] = useState<MetalStock | null>(null);

  // ✅ Fetch both tables on page load
  useEffect(() => {
    fetchWorkerStock();
    fetchShowroomHistory();
    fetchMetalStock();
  }, []);

  const fetchWorkerStock = async () => {
    try {
      const token = localStorage.getItem("token"); // ✅ get token
      const res = await api.get<WorkerStock[]>("/admin/worker", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWorkerResults(res.data);
    } catch (error) {
      console.error("Error fetching worker stock:", error);
    }
  };
  const fetchMetalStock = async () => {
    try {
      const token = localStorage.getItem("token"); // ✅ get token
      const res = await api.get<MetalStock[]>("/admin/getAllMetalStock", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.length > 0) {
        setMetalStock(res.data[0]); // take the first element
      }
    } catch (error) {
      console.error("Error fetching metal stock:", error);
    }
  };

  const fetchShowroomHistory = async () => {
    try {
      const token = localStorage.getItem("token"); // ✅ get token
      const res = await api.get<ShowroomHistory[]>("/admin/history/showroom", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistoryResults(res.data);
    } catch (error) {
      console.error("Error fetching showroom history:", error);
    }
  };

  // ✅ Handle Add Submit
  const handleAddSubmit = async () => {
    if (!metal || !weight) {
      alert("Please select metal and enter weight");
      return;
    }

    try {
      const token = localStorage.getItem("token"); // ✅ get token
      await api.post(
        `/admin/add?metal=${metal}&weight=${weight}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Stock added successfully!");

      // refresh both tables
      fetchWorkerStock();
      fetchShowroomHistory();
      fetchMetalStock();

      // clear fields
      setMetal("");
      setWeight("");
    } catch (error) {
      console.error("Error adding stock:", error);
      alert("Failed to add stock");
    }
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
            <Grid container spacing={4} maxWidth={400} textAlign="center">
              {/* Row 1: Gold & Silver */}
              <Grid size={{ xs: 3 }}>
                <Typography variant="subtitle1">
                  <span style={{ color: "#8847FF", fontWeight: 600 }}>
                    Gold:{" "}
                  </span>
                  <span style={{ color: "#FF8C00", fontWeight: 700 }}>
                    {metalStock.totalGoldStock} g
                  </span>
                </Typography>
              </Grid>
              <Grid size={{ xs: 3 }}>
                <Typography variant="subtitle1">
                  <span style={{ color: "#8847FF", fontWeight: 600 }}>
                    Silver:{" "}
                  </span>
                  <span style={{ color: "#FF8C00", fontWeight: 700 }}>
                    {metalStock.totalSilverStock} g
                  </span>
                </Typography>
              </Grid>

              {/* Row 2: Copper */}
              <Grid size={{ xs: 3 }}>
                <Typography variant="subtitle1">
                  <span style={{ color: "#8847FF", fontWeight: 600 }}>
                    Copper:{" "}
                  </span>
                  <span style={{ color: "#FF8C00", fontWeight: 700 }}>
                    {metalStock.totalCopperStock} g
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
              <MenuItem value="Gold">Gold</MenuItem>
              <MenuItem value="Silver">Silver</MenuItem>
              <MenuItem value="Copper">Copper</MenuItem>
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

      {/* ---------- Worker Stock Table ---------- */}

      <div className="mt-10 p-3 flex flex-col items-center justify-center gap-6 w-full">
        {workerResults.length > 0 && (
          <Paper
            elevation={4}
            className="relative p-8 rounded-3xl w-full max-w-6xl bg-white/75 backdrop-blur-lg border border-[#d0b3ff] shadow-[0_10px_30px_rgba(136,71,255,0.3)]"
          >
            <Typography
              variant="h5"
              fontWeight={700}
              color="primary"
              mb={6}
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
                {workerResults.map((p, idx) => (
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
                    <TableCell sx={{ fontSize: "0.95rem" }}>{p.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}
      </div>

      {/* ---------- Showroom History Table ---------- */}
      {historyResults.length > 0 && (
        <div className="mt-10 p-3 flex flex-col items-center justify-center gap-6 w-full">
          <Paper
            elevation={4}
            className="relative p-8 rounded-3xl w-full max-w-6xl bg-white/75 backdrop-blur-lg border border-[#d0b3ff] shadow-[0_10px_30px_rgba(136,71,255,0.3)]"
          >
            <Typography
              variant="h5"
              fontWeight={700}
              color="primary"
              mb={6}
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
                {historyResults.map((r) => (
                  <TableRow key={r.metalStockHisId}>
                    <TableCell sx={{ fontSize: "0.95rem" }}>
                      {r.metal}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.95rem" }}>
                      {r.metalWeight}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.95rem" }}>{r.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </div>
      )}
    </div>
  );
};

export default ShowroomMetalStock;
