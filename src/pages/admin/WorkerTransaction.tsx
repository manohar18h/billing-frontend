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

type FormState = {
  workerId: string;
  amount: string;
};

interface WorkerPaymentResponse {
  paidAmount: number;
  paymentDate: string;
  wtid: number;
  message?: string;
}

const WorkerTransaction: React.FC = () => {
  const { workers, invalidate, refresh } = useWorkers();
  const [form, setForm] = useState<FormState>({
    workerId: "",
    amount: "",
  });

  const selectedWorker = workers.find(
    (w) => w.workerId === Number(form.workerId)
  );

  const handleChange = (field: keyof FormState, val: string) =>
    setForm((prev) => ({ ...prev, [field]: val }));

  const handleSubmit = async () => {
    const { workerId, amount } = form;
    if (!workerId || !amount) {
      alert("Please select a worker and enter an amount.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const res = await api.post<WorkerPaymentResponse>(
        `/admin/addAmountWorker/${workerId}?paidAmount=${amount}`,
        {}, // empty body since params are in URL
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const result = res.data;

      alert(
        `✅ Transaction successful!\nPaid: ₹${
          result.paidAmount
        }\nDate: ${new Date(
          result.paymentDate
        ).toLocaleString()}\nTransaction ID: ${result.wtid}`
      );

      setForm({ workerId: "", amount: "" });
      await invalidate();
      await refresh();
    } catch (err: any) {
      console.error(err);
      alert(
        `❌ Error submitting transaction: ${
          err.response?.data?.message || err.message
        }`
      );
    }
  };

  return (
    <div className="mt-10 px-12 py-14 min-h-[400px] w-full max-w-[750px] mx-auto rounded-[24px] bg-white/80 backdrop-blur-md border border-[#d0b3ff] shadow-[0_10px_40px_rgba(136,71,255,0.3)]">
      <Typography
        variant="h4"
        fontWeight="bold"
        color="primary"
        textAlign="center"
        mb={4}
      >
        Worker Transactions
      </Typography>

      <Box component="form" noValidate autoComplete="off">
        <Grid container spacing={3}>
          {/* Worker selector */}

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              fullWidth
              label="Full Name"
              value={form.workerId}
              onChange={(e) => handleChange("workerId", e.target.value)}
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

          {/* Pending amount (read-only) */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Pending Amount"
              value={selectedWorker?.pendingAmount ?? ""}
              InputProps={{ readOnly: true }}
            />
          </Grid>

          {/* Amount to pay */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              type="number"
              label="Enter Amount"
              value={form.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
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
            Submit
          </Button>
        </Box>
      </Box>
    </div>
  );
};

export default WorkerTransaction;
