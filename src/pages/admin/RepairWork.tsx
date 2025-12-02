import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  MenuItem,
  Grid,
} from "@mui/material";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

import { useWorkers } from "@/contexts/WorkersContext";
import api from "@/services/api";

const RepairWork: React.FC = () => {
  const { workers, invalidate, refresh } = useWorkers();
  const [repairData, setRepairData] = useState({
    metal: "",
    itemName: "",
    metalWeight: "",
    customerPay: "",
    workerPay: "",
  });
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | "">("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (field: string, val: string) =>
    setRepairData((prev) => ({ ...prev, [field]: val }));

  const handleSubmit = async () => {
    if (!selectedWorkerId) {
      alert("Please select a worker first.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found.");
      }

      const body = {
        metal: repairData.metal || "",
        itemName: repairData.itemName,
        metalWeight: parseFloat(repairData.metalWeight) || 0.0,
        customerPay: parseFloat(repairData.customerPay),
        workerPay: parseFloat(repairData.workerPay),
      };

      console.log("RequestBody Repair", body);

      await api.post(`/admin/saveRepairWork/${selectedWorkerId}`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setDialogMessage("Repair work submitted successfully.");
      setIsSuccess(true);
      setDialogOpen(true);
      setRepairData({
        metal: "",
        itemName: "",
        metalWeight: "",
        customerPay: "",
        workerPay: "",
      });
      setSelectedWorkerId("");
      await invalidate();
      await refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Repair work submit failed:", err.message);

        setDialogMessage(err.message);
        setIsSuccess(false);
        setDialogOpen(true);
      } else {
        console.error("Unexpected error:", err);
        alert("Failed to add repair work.");
      }
    }
  };

  return (
    <div className=" px-12 py-10 min-h-[300px] w-full max-w-[750px] mx-auto rounded-[24px] bg-white/80 backdrop-blur-md border border-[#d0b3ff] shadow-[0_10px_40px_rgba(136,71,255,0.3)]">
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
              <MenuItem value="22 Gold">22 Gold</MenuItem>
              <MenuItem value="995 Silver">995 Silver</MenuItem>
            </TextField>
          </Grid>

          {/* Item name */}
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Item Name"
              value={repairData.itemName}
              onChange={(e) => handleChange("itemName", e.target.value)}
              required
            />
          </Grid>

          {/* Weight */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              type="number"
              label="Metal Weight (g)"
              value={
                repairData.metal === "Non Metal" ? "" : repairData.metalWeight
              }
              onChange={(e) => handleChange("metalWeight", e.target.value)}
              required={repairData.metal !== "Non Metal"} // not required when Non Metal
              disabled={repairData.metal === "Non Metal"} // disable input
              InputProps={{
                readOnly: repairData.metal === "Non Metal",
              }}
            />
          </Grid>

          {/* Pays */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              type="number"
              label="Customer Pay"
              value={repairData.customerPay}
              onChange={(e) => handleChange("customerPay", e.target.value)}
              required
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle
              className={isSuccess ? "text-green-600" : "text-red-600"}
            >
              {isSuccess ? "Success" : "Error"}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-gray-600 mt-2">{dialogMessage}</p>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setDialogOpen(false)}
              className={
                isSuccess
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RepairWork;
