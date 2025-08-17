import React, { useEffect, useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  MenuItem,
  Grid,
} from "@mui/material";

import { useWorkers } from "@/contexts/WorkersContext";

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
  const token = localStorage.getItem("token");

  const handleChange = (field: string, value: string) =>
    setStockData((s) => ({ ...s, [field]: value }));

  const handleSubmit = async () => {
    if (!selectedWorkerId) {
      alert("Please select a worker name.");
      return;
    }
    try {
      console.log(
        "requestBody",
        JSON.stringify({
          metal: stockData.metal,
          metalWeight: Number(stockData.weight),
          todaysDate: stockData.date,
        })
      );
      const res = await fetch(
        `http://15.207.98.116:8081/admin/addWorkerStock/${selectedWorkerId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            metal: stockData.metal,
            metalWeight: Number(stockData.weight),
            todaysDate: stockData.date,
          }),
        }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to submit");

      alert("Stock successfully added!");
      setStockData({ metal: "", weight: "", date: "" });
      setSelectedWorkerId("");
      await invalidate();
      await refresh();
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Check console for details.");
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
            <Grid item xs={12} sm={6} md={3}>
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
            <Grid item xs={12} sm={6} md={3}>
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
                <MenuItem value="Copper">Copper</MenuItem>
              </TextField>
            </Grid>

            {/* Metal Weight */}
            <Grid item xs={12} sm={6} md={3}>
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
            <Grid item xs={12} sm={6} md={3}>
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
