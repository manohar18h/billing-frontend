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

const RepairWork: React.FC = () => {
  const { workers, invalidate, refresh } = useWorkers();
  const [repairData, setRepairData] = useState({
    metal: "",
    itemName: "",
    metalWeight: "",
    deliveryDate: "",
    customerPay: "",
    workerPay: "",
  });
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | "">("");

  const handleChange = (field: string, val: string) =>
    setRepairData((prev) => ({ ...prev, [field]: val }));
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}-${d.getFullYear()}`;
  };

  const handleSubmit = async () => {
    if (!selectedWorkerId) {
      alert("Please select a worker first.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://15.207.98.116:8081/admin/saveRepairWork/${selectedWorkerId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            metal: repairData.metal || "",
            itemName: repairData.itemName,
            metalWeight: parseFloat(repairData.metalWeight) || 0.0,
            customerPay: parseFloat(repairData.customerPay),
            workerPay: parseFloat(repairData.workerPay),
            deliveryDate: formatDate(repairData.deliveryDate),
          }),
        }
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result?.message || "Failed to submit");

      alert("Repair work submitted successfully.");
      setRepairData({
        metal: "",
        itemName: "",
        metalWeight: "",
        deliveryDate: "",
        customerPay: "",
        workerPay: "",
      });
      setSelectedWorkerId("");
      await invalidate();
      await refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to add repair work.");
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
        Repair Work
      </Typography>

      <Box component="form" noValidate autoComplete="off">
        <Grid container spacing={3}>
          {/* Worker Name */}
          <Grid item xs={12} sm={6} md={3}>
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
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              label="Metal Type"
              value={repairData.metal}
              onChange={(e) => handleChange("metal", e.target.value)}
              required
              InputLabelProps={{ shrink: true }}
              SelectProps={{ displayEmpty: true }}
            >
              <MenuItem value="" disabled>
                -- Select Metal --
              </MenuItem>
              <MenuItem value="Non Metal">Non Metal</MenuItem>
              <MenuItem value="Gold">Gold</MenuItem>
              <MenuItem value="Silver">Silver</MenuItem>
              <MenuItem value="Copper">Copper</MenuItem>
            </TextField>
          </Grid>

          {/* Item name */}
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Item Name"
              value={repairData.itemName}
              onChange={(e) => handleChange("itemName", e.target.value)}
              required
            />
          </Grid>

          {/* Weight */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="number"
              label="Metal Weight (g)"
              value={repairData.metalWeight}
              onChange={(e) => handleChange("metalWeight", e.target.value)}
              required
            />
          </Grid>

          {/* Delivery date */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Delivery Date"
              value={repairData.deliveryDate}
              onChange={(e) => handleChange("deliveryDate", e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>

          {/* Pays */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="number"
              label="Customer Pay"
              value={repairData.customerPay}
              onChange={(e) => handleChange("customerPay", e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="number"
              label="Worker Pay"
              value={repairData.workerPay}
              onChange={(e) => handleChange("workerPay", e.target.value)}
              required
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
  );
};

export default RepairWork;
