import React, { useState } from "react";
import {
  Box,
  Grid,
  TextField,
  Button,
  Typography,
  MenuItem,
} from "@mui/material";
import { useWorkers } from "@/contexts/WorkersContext";

const LotWork: React.FC = () => {
  const { workers, invalidate, refresh } = useWorkers();
  const [lotData, setLotData] = useState({
    metal: "",
    itemName: "",
    weight: "",
    date: "",
    pieces: "",
    wastage: "",
    amount: "",
  });
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | "">("");

  const handleChange = (field: string, value: string) =>
    setLotData((prev) => ({ ...prev, [field]: value }));
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}-${d.getFullYear()}`;
  };
  const handleSubmit = async () => {
    if (!selectedWorkerId) {
      alert("Please select a worker.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      console.log(
        "requestBody",
        JSON.stringify({
          metal: lotData.metal,
          itemName: lotData.itemName,
          itemWeight: parseFloat(lotData.weight),
          deliveryDate: formatDate(lotData.date),
          pieces: parseInt(lotData.pieces),
          wastage: parseInt(lotData.wastage),
          amount: parseFloat(lotData.amount),
        })
      );

      const res = await fetch(
        `http://15.207.98.116:8081/admin/addLotWork/${selectedWorkerId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            metal: lotData.metal,
            itemName: lotData.itemName,
            itemWeight: parseFloat(lotData.weight),
            deliveryDate: formatDate(lotData.date),
            pieces: parseInt(lotData.pieces),
            wastage: parseInt(lotData.wastage),
            amount: parseFloat(lotData.amount),
          }),
        }
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result?.message || "Failed to submit");

      alert("Lot work added successfully.");
      await invalidate();
      await refresh();
      // optional: clear form
      setLotData({
        metal: "",
        itemName: "",
        weight: "",
        date: "",
        pieces: "",
        wastage: "",
        amount: "",
      });
      setSelectedWorkerId("");
    } catch (err) {
      console.error(err);
      alert("Failed to submit lot work.");
    }
  };

  return (
    <div className="mt-10 px-12 py-14 min-h-[500px] w-full max-w-[750px] mx-auto rounded-[24px] bg-white/80 backdrop-blur-md border border-[#d0b3ff] shadow-[0_10px_40px_rgba(136,71,255,0.3)]">
      <Typography
        variant="h4"
        fontWeight="bold"
        color="primary"
        textAlign="center"
        mb={4}
      >
        Lot Work
      </Typography>

      <Box component="form" noValidate autoComplete="off">
        <Grid container spacing={2}>
          {/* Worker */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              select
              fullWidth
              label="Full Name"
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(Number(e.target.value))}
              required
              InputLabelProps={{ shrink: true }}
              SelectProps={{ displayEmpty: true }}
            >
              <MenuItem value="" disabled>
                -- Select Worker --
              </MenuItem>
              {workers.map(({ workerId, fullName }) => (
                <MenuItem key={workerId} value={workerId}>
                  {fullName}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Metal */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              select
              fullWidth
              label="Metal"
              value={lotData.metal}
              onChange={(e) => handleChange("metal", e.target.value)}
              required
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

          {/* Item name */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              label="Item Name"
              value={lotData.itemName}
              onChange={(e) => handleChange("itemName", e.target.value)}
              required
            />
          </Grid>

          {/* Item weight */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              type="number"
              label="Item Weight (g)"
              value={lotData.weight}
              onChange={(e) => handleChange("weight", e.target.value)}
              required
            />
          </Grid>

          {/* Date */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              type="date"
              label="Date"
              value={lotData.date}
              onChange={(e) => handleChange("date", e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>

          {/* Pieces */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              type="number"
              label="Pieces"
              value={lotData.pieces}
              onChange={(e) => handleChange("pieces", e.target.value)}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              type="number"
              label="Wastage"
              value={lotData.wastage}
              onChange={(e) => handleChange("wastage", e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              type="number"
              label="Amount"
              value={lotData.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
            />
          </Grid>
        </Grid>

        {/* Submit button */}
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
              "&:hover": {
                backgroundColor: "#8847FF",
                color: "#fff",
              },
            }}
          >
            Submit
          </Button>
        </Box>
      </Box>
    </div>
  );
};

export default LotWork;
