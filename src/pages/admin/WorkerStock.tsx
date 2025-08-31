import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  MenuItem,
  Grid,
} from "@mui/material";

import { useWorkers } from "@/contexts/WorkersContext";
import api from "@/services/api";

const WorkerStock: React.FC = () => {
  const [stockData, setStockData] = useState({
    metal: "",
    weight: "",
    date: "",
  });
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | "">("");

  const { invalidate, refresh } = useWorkers();
  const { workers, loading, error } = useWorkers();
  //console.log(workers);

  const handleChange = (field: string, value: string) =>
    setStockData((s) => ({ ...s, [field]: value }));

  interface AssignStockResponse {
    metal: string;
    metalWeight: number;
    goldMetalWeight: number;
    silverMetalWeight: number;
    todaysDate: string;
    wstockId: number;
  }

  const handleSubmit = async () => {
    if (!selectedWorkerId) {
      alert("Please select a worker name.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      console.log(
        "datacheck : " +
          stockData.metal +
          ", " +
          Number(stockData.weight) +
          ", " +
          stockData.date
      );

      // Updated API call
      const res = await api.post<AssignStockResponse>(
        `/admin/assign?workerId=${selectedWorkerId}&metal=${
          stockData.metal
        }&weight=${Number(stockData.weight)}`,
        null, // no body since backend uses query params
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Show the updated stock info from response
      const data = res.data;
      alert(
        `Stock assigned successfully!\nMetal: ${data.metal}\nWeight: ${data.metalWeight}\n`
      );

      // Reset form
      setStockData({ metal: "", weight: "", date: "" });
      setSelectedWorkerId("");

      await invalidate(); // refresh data if using react-query or custom logic
      await refresh();
    } catch (err: any) {
      if (err.response?.data) {
        alert("Failed to submit stock: " + JSON.stringify(err.response.data));
      } else {
        console.error(err);
        alert(
          err.message ?? "Something went wrong. Check console for details."
        );
      }
    }
  };

  /* -------------------------------- render ------------------------------------- */
  if (loading)
    return <p className="px-6 py-10 text-center">Loading workers…</p>;
  if (error)
    return (
      <p className="px-6 py-10 text-center text-red-600">
        Could not load workers.
      </p>
    );

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-12">
      <div className="mt-10 px-12 py-14 min-h-[500px] w-full max-w-[750px] mx-auto rounded-[24px] bg-white/80 backdrop-blur-md border border-[#d0b3ff] shadow-[0_10px_40px_rgba(136,71,255,0.3)]">
        <Typography
          variant="h4"
          fontWeight="bold"
          color="primary"
          textAlign="center"
          mb={6}
        >
          Add Stock
        </Typography>

        <Box component="form" noValidate autoComplete="off">
          <Grid container spacing={3}>
            {/* Full Name */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                select
                fullWidth
                required
                label="Full Name"
                value={selectedWorkerId}
                onChange={(e) => setSelectedWorkerId(Number(e.target.value))}
                InputLabelProps={{ shrink: true }}
                SelectProps={{ displayEmpty: true }}
              >
                <MenuItem value="" disabled>
                  -- Select Worker --
                </MenuItem>
                {workers.map((w) => (
                  <MenuItem key={w.workerId} value={w.workerId}>
                    {w.fullName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Metal Type */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                select
                fullWidth
                required
                label="Metal Type"
                value={stockData.metal}
                onChange={(e) => handleChange("metal", e.target.value)}
                InputLabelProps={{ shrink: true }}
                SelectProps={{ displayEmpty: true }}
              >
                <MenuItem value="" disabled>
                  -- Select Metal --
                </MenuItem>
                <MenuItem value="Gold">Gold</MenuItem>
                <MenuItem value="Silver">Silver</MenuItem>
              </TextField>
            </Grid>

            {/* Metal Weight */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                required
                type="number"
                label="Metal Weight (g)"
                value={stockData.weight}
                onChange={(e) => handleChange("weight", e.target.value)}
              />
            </Grid>

            {/* Date */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                required
                type="date"
                label="Date"
                value={stockData.date}
                onChange={(e) => handleChange("date", e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          {/* Submit */}
          <Box display="flex" justifyContent="center" mt={4}>
            <Button
              onClick={handleSubmit}
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
              SUBMIT
            </Button>
          </Box>
        </Box>
      </div>
    </div>
  );
};

export default WorkerStock;
