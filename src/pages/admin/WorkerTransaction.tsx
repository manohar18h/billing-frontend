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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

type FormState = {
  workerId: string;
  amount: string;
  reason: string;
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
    reason: "",
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const selectedWorker = workers.find(
    (w) => w.workerId === Number(form.workerId)
  );

  const handleChange = (field: keyof FormState, val: string) =>
    setForm((prev) => ({ ...prev, [field]: val }));

  const handleSubmit = async () => {
    const { workerId, amount, reason } = form;
    if (!workerId || !amount || !reason) {
      alert("Please select a worker and enter an amount.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const res = await api.post<WorkerPaymentResponse>(
        `/admin/addAmountWorker/${workerId}?paidAmount=${amount}&reason=${encodeURIComponent(
          reason
        )}`,
        {}, // empty body since params are in URL
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const result = res.data;

      setDialogMessage(
        `✅ Transaction successful!\nPaid: ₹${
          result.paidAmount
        }\nDate: ${new Date(result.paymentDate).toLocaleString()}`
      );
      setIsSuccess(true);
      setDialogOpen(true);

      setForm({ workerId: "", amount: "", reason: "" });
      await invalidate();
      await refresh();
    } catch (err: any) {
      console.error(err);
      setDialogMessage(
        `❌ Error submitting transaction: ${
          err.response?.data?.message || err.message
        }`
      );
      setIsSuccess(false);
      setDialogOpen(true);
    }
  };

  return (
    <div className="px-12 py-10 min-h-[400px] w-full max-w-[750px] mx-auto rounded-[24px] bg-white/80 backdrop-blur-md border border-[#d0b3ff] shadow-[0_10px_40px_rgba(136,71,255,0.3)]">
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

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Enter Reason"
              value={form.reason}
              onChange={(e) => handleChange("reason", e.target.value)}
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
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle
              className={isSuccess ? "text-green-600" : "text-red-600"}
            >
              {isSuccess ? "Success" : "Error"}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-gray-600 mt-2 whitespace-pre-line">
            {dialogMessage}
          </p>
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

export default WorkerTransaction;
