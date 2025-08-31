import React, { useState } from "react";
import {
  TextField,
  Box,
  Grid,
  Button,
  Typography,
  Stack,
  MenuItem,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useWorkers } from "@/contexts/WorkersContext";
import api from "@/services/api";

const Workers: React.FC = () => {
  const navigate = useNavigate();
  const { workers, refresh, invalidate } = useWorkers();

  const [selectedId, setSelectedId] = useState<number | "">("");

  const handleView = () => {
    if (!selectedId) {
      alert("Please choose a worker first.");
      return;
    }
    navigate(`/admin/worker-details/${selectedId}`);
  };

  const [worker, setWorker] = useState({
    fullName: "",
    userName: "",
    password: "",
    phnNumber: "",
    village: "",
    earnedAmount: 0.0,
    receivedAmount: 0.0,
    pendingAmount: 0.0,
    goldStock: 0.0,
    silverStock: 0.0,
  });
  const [fieldErrors, setFieldErrors] = useState<{ [k: string]: string }>({});

  const handleChange = (field: string, value: string) =>
    setWorker({ ...worker, [field]: value });

  const addWorker = async () => {
    try {
      setFieldErrors({});
      const token = localStorage.getItem("token");

      await api.post("/admin/addWorker", worker, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Worker added successfully!");
      await invalidate();
      await refresh();
      navigate("/admin/dashboard");
    } catch (err: any) {
      console.error(err);

      if (err.response?.data && typeof err.response.data === "object") {
        setFieldErrors(err.response.data);
      } else {
        alert(err.response?.data?.message || "Failed to add worker");
      }
    }
  };

  return (
    <div className="mt-10 p-4 rounded-[24px] bg-white/80 backdrop-blur-md border border-[#d0b3ff] shadow-[0_10px_30px_rgba(136,71,255,0.3)] min-h-[500px] flex flex-col items-center">
      {/* ─── Add-worker Form ─── */}
      <Box sx={{ p: 4, mt: 4, width: "100%", maxWidth: 820 }}>
        <Typography
          variant="h4"
          fontWeight="bold"
          color="primary"
          textAlign="center"
          mb={4}
        >
          Worker
        </Typography>
        <Stack direction="row" spacing={1} mb={5} alignItems="center">
          <TextField
            select
            size="small"
            label="Select worker"
            value={selectedId}
            onChange={(e) =>
              setSelectedId(e.target.value ? Number(e.target.value) : "")
            }
            sx={{ width: 260 }}
          >
            <MenuItem value="" disabled>
              -- choose name --
            </MenuItem>
            {workers.map((w) => (
              <MenuItem key={w.workerId} value={w.workerId}>
                {w.fullName}
              </MenuItem>
            ))}
          </TextField>

          <Button
            onClick={handleView}
            variant="contained"
            sx={{
              background: "#8847FF",
              fontWeight: 600,
              textTransform: "none",
              "&:hover": { background: "#6c30cc" },
            }}
          >
            View
          </Button>
        </Stack>

        <Grid container spacing={3}>
          <Grid size={{ xs: 6, sm: 4 }}>
            <TextField
              label="Full Name"
              value={worker.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              error={!!fieldErrors.fullName}
              helperText={fieldErrors.fullName}
            />
          </Grid>

          <Grid size={{ xs: 6, sm: 4 }}>
            <TextField
              label="Username"
              value={worker.userName}
              onChange={(e) => handleChange("userName", e.target.value)}
              error={!!fieldErrors.userName}
              helperText={fieldErrors.userName}
            />
          </Grid>

          <Grid size={{ xs: 6, sm: 4 }}>
            <TextField
              type="password"
              label="Password"
              value={worker.password}
              onChange={(e) => handleChange("password", e.target.value)}
              error={!!fieldErrors.password}
              helperText={fieldErrors.password}
            />
          </Grid>

          <Grid size={{ xs: 6, sm: 4 }}>
            <TextField
              label="Phone Number"
              value={worker.phnNumber}
              onChange={(e) => handleChange("phnNumber", e.target.value)}
              error={!!fieldErrors.phnNumber}
              helperText={fieldErrors.phnNumber}
            />
          </Grid>

          <Grid size={{ xs: 6, sm: 4 }}>
            <TextField
              label="Village"
              value={worker.village}
              onChange={(e) => handleChange("village", e.target.value)}
              error={!!fieldErrors.village}
              helperText={fieldErrors.village}
            />
          </Grid>
        </Grid>

        <Box display="flex" justifyContent="flex-end" mt={4}>
          <Button
            onClick={addWorker}
            variant="outlined"
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
              fontWeight: "bold",
              borderColor: "#8847FF",
              color: "#8847FF",
              boxShadow: "0px 4px 10px rgba(136,71,255,0.5)",
              "&:hover": { background: "#8847FF", color: "#fff" },
            }}
          >
            Add
          </Button>
        </Box>
      </Box>
    </div>
  );
};

export default Workers;
