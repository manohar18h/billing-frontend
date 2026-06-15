import React, { useRef, useState, useEffect } from "react";
import {
  TextField,
  Box,
  Grid,
  Button,
  Typography,
  Stack,
  MenuItem,
  styled,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useWorkers } from "@/contexts/WorkersContext";
import api from "@/services/api";

import WorkerStock from "./WorkerStock";

import WorkerTransaction from "./WorkerTransaction";
import LotWork from "./LotWork";
import RepairWork from "./RepairWork";

type Section = "add" | "lot" | "repair" | "tx";

const TabBtn = styled(Button, {
  shouldForwardProp: (prop) => prop !== "active",
})<{ active?: boolean }>(({ active, theme }) => ({
  position: "relative",
  fontWeight: 600,
  color: active ? theme.palette.primary.main : theme.palette.text.secondary,
  "&:after": {
    content: '""',
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -4,
    height: 3,
    borderRadius: 3,
    background: active ? theme.palette.primary.main : "transparent",
    transition: "background .3s",
  },
}));

const Workers: React.FC = () => {
  const addRef = useRef<HTMLDivElement>(null);
  const lotRef = useRef<HTMLDivElement>(null);
  const repairRef = useRef<HTMLDivElement>(null);
  const txRef = useRef<HTMLDivElement>(null);

  const [active, setActive] = useState<Section>("add");

  const scrollTo = (ref: React.RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const options = { root: null, rootMargin: "-50% 0px -50% 0px" }; // trigger roughly when section is centred
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const id = e.target.getAttribute("data-section") as Section;
          setActive(id);
        }
      });
    }, options);

    [addRef, lotRef, repairRef, txRef].forEach(
      (r) => r.current && io.observe(r.current)
    );
    return () => io.disconnect();
  }, []);
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
  const handleClearFields = () => {
    setWorker({
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
  };
  const [fieldErrors, setFieldErrors] = useState<{ [k: string]: string }>({});

  const handleChange = (field: string, value: string | number) => {
    let newValue = value;
    if (field === "fullName" && typeof value === "string") {
      newValue = value
        .split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");
    }

    setWorker((prev) => ({
      ...prev,
      [field]: newValue,
    }));
  };

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

      handleClearFields();
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
    <div className="w-full overflow-x-hidden px-3 pb-[90px] md:px-0 md:pb-0">
<div className="mt-4 flex flex-col items-center rounded-[20px] border border-[#d0b3ff] bg-white/80 p-3 backdrop-blur-md md:mt-10 md:min-h-[500px] md:p-4">
        <Box sx={{ p: { xs: 0, md: 4 }, width: "100%", maxWidth: 820 }}>
<div className="flex w-full flex-col items-center rounded-[20px] border border-[#d0b3ff] bg-white p-4 shadow-[0_10px_30px_rgba(136,71,255,0.18)] md:min-h-[500px] md:rounded-[24px]">
             <Box sx={{ p: { xs: 0, md: 4 }, width: "100%", maxWidth: 820 }}>
              <Typography
                variant="h5"
                fontWeight="bold"
                sx={{
                  background: "linear-gradient(90deg, #8B4513, #000000)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
                mb={4}
              >
                Search Worker
              </Typography>

              <Stack
  direction={{ xs: "column", sm: "row" }}
  spacing={2}
  mb={5}
  alignItems="stretch"
>
                <TextField
                  select
                  size="small"
                  label="Select worker"
                  value={selectedId}
                  onChange={(e) =>
                    setSelectedId(e.target.value ? Number(e.target.value) : "")
                  }
                  sx={{
  width: { xs: "100%", sm: 260 },
  "& .MuiOutlinedInput-root": {
    borderRadius: "14px",
    backgroundColor: "#fff",
  },
}}
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
  width: { xs: "100%", sm: "auto" },
  height: "40px",
  background: "#8847FF",
  fontWeight: 600,
  textTransform: "none",
  borderRadius: "12px",
  "&:hover": { background: "#6c30cc" },
}}
                >
                  View
                </Button>
              </Stack>

              <Typography
                variant="h5"
                fontWeight="bold"
                sx={{
                  background: "linear-gradient(90deg, #8B4513, #000000)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
                mb={4}
              >
                Add Worker
              </Typography>

              <Grid container spacing={{ xs: 2, md: 3 }}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <TextField
                    label="Full Name"
                    value={worker.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    error={!!fieldErrors.fullName}
                    helperText={fieldErrors.fullName}
                  />
                </Grid>

               <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <TextField
                    label="Username"
                    value={worker.userName}
                    onChange={(e) => handleChange("userName", e.target.value)}
                    error={!!fieldErrors.userName}
                    helperText={fieldErrors.userName}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <TextField
                    type="password"
                    label="Password"
                    value={worker.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    error={!!fieldErrors.password}
                    helperText={fieldErrors.password}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <TextField
                    label="Phone Number"
                    value={worker.phnNumber}
                    onChange={(e) => handleChange("phnNumber", e.target.value)}
                    error={!!fieldErrors.phnNumber}
                    helperText={fieldErrors.phnNumber}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <TextField
                    label="Village"
                    value={worker.village}
                    onChange={(e) => handleChange("village", e.target.value)}
                    error={!!fieldErrors.village}
                    helperText={fieldErrors.village}
                  />
                </Grid>
              </Grid>

              <Box display="flex" justifyContent={{ xs: "center", md: "flex-end" }} mt={4}>
                <Button
                  onClick={addWorker}
                  variant="outlined"
                sx={{
  width: { xs: "100%", md: "auto" },
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
        </Box>
      </div>
<div className="mt-5 flex flex-col items-center rounded-[20px] border border-[#d0b3ff] bg-white/80 p-3 backdrop-blur-md md:min-h-[500px] md:p-4">
        <Box sx={{ p: { xs: 0, md: 4 }, width: "100%", maxWidth: 820 }}>
<div className="flex w-full flex-col items-center rounded-[20px] border border-[#d0b3ff] bg-white p-4 shadow-[0_10px_30px_rgba(136,71,255,0.18)] md:min-h-[500px] md:rounded-[24px]">
              <Box sx={{ p: { xs: 0, md: 4 }, width: "100%", maxWidth: 820 }}>
              <Box sx={{ p: { xs: 0, md: 3 } }}>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  textAlign="center"
                  sx={{ color: "brown" }}
                  mb={4}
                >
                  Services
                </Typography>
                <Box
  display="grid"
  gridTemplateColumns={{ xs: "1fr 1fr", sm: "repeat(4, 1fr)" }}
  gap={{ xs: 1.5, md: 6 }}
  mb={3}
>
                  <TabBtn
                    active={active === "add"}
                    onClick={() => scrollTo(addRef)}
                    sx={{
  fontSize: { xs: "12px", md: "14px" },
  minWidth: 0,
  px: { xs: 1, md: 2 },
}}
                  >
                    Add Stock
                  </TabBtn>
                  <TabBtn
                    active={active === "lot"}
                    onClick={() => scrollTo(lotRef)}
                    sx={{
  fontSize: { xs: "12px", md: "14px" },
  minWidth: 0,
  px: { xs: 1, md: 2 },
}}
                  >
                    Lot Work
                  </TabBtn>
                  <TabBtn
                    active={active === "repair"}
                    onClick={() => scrollTo(repairRef)}
                    sx={{
  fontSize: { xs: "12px", md: "14px" },
  minWidth: 0,
  px: { xs: 1, md: 2 },
}}
                  >
                    Repair Work
                  </TabBtn>
                  <TabBtn
                    active={active === "tx"}
                    onClick={() => scrollTo(txRef)}
                    sx={{
  fontSize: { xs: "12px", md: "14px" },
  minWidth: 0,
  px: { xs: 1, md: 2 },
}}
                  >
                    Transaction
                  </TabBtn>
                </Box>

                <Box display="flex" flexDirection="column" gap={{ xs: 5, md: 12 }}>
                  <Box ref={addRef} data-section="add">
                    <WorkerStock />
                  </Box>

                  <Box ref={lotRef} data-section="lot">
                    <LotWork />
                  </Box>

                  <Box ref={repairRef} data-section="repair">
                    <RepairWork />
                  </Box>

                  <Box ref={txRef} data-section="tx">
                    <WorkerTransaction />
                  </Box>
                </Box>
              </Box>
            </Box>
          </div>
        </Box>
      </div>
    </div>
  );
};

export default Workers;
