// src/pages/admin/StockBoxData.tsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Paper,
  Typography,
  CircularProgress,
  TextField,
  Box,
} from "@mui/material";
import api from "@/services/api";
import { IconButton } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";

type StockBoxDataEntry = {
  stockBoxDataId: number;
  pieces: number;
  methodType: string;
  metalWeight: number;
  date: string;
};

type StockDataBox = {
  stockBoxId: number;
  stockBoxName: string;
  totalStockBoxCount: number;
  totalStockBoxWeight: number;
  stockBoxData: StockBoxDataEntry[];
};

const StockBoxData: React.FC = () => {
  const [rows, setRows] = useState<StockDataBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState<string>(""); // 👈 search state
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const token = localStorage.getItem("token") ?? "";
        const { data } = await api.get<StockDataBox[]>(
          `/admin/getALlStockBox`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }
        );
        if (!alive) return;
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!alive) return;
        console.error("Failed to fetch all StockBox Data:", e);
        setErr("Failed to load all StockBox Data.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 👇 Filter rows by stockBoxName
  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    return rows.filter((box) =>
      box.stockBoxName.toLowerCase().includes(search.toLowerCase())
    );
  }, [rows, search]);

  return (
    <div className="mt-10 p-3 flex flex-col items-center justify-center">
      <Paper
        elevation={0}
        sx={{
          p: 6,
          width: "100%",
          maxWidth: "80rem",
          borderRadius: "24px",
          backgroundColor: "rgba(255,255,255,0.75)",
          backdropFilter: "blur(12px)",
          border: "1px solid #d0b3ff",
          boxShadow: "0 10px 30px rgba(136,71,255,0.3)",
        }}
      >
        <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
          All Stock Box Data
        </Typography>

        {/* 🔍 Search Bar */}
        <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 2 }}>
          <TextField
            label="Search by Stock Box Name"
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: 250 }}
          />
        </Box>

        {loading ? (
          <div className="flex items-center gap-3 py-6">
            <CircularProgress size={22} />
            <span>Loading…</span>
          </div>
        ) : err ? (
          <p className="text-red-600 py-4">{err}</p>
        ) : filteredRows.length === 0 ? (
          <p className="py-4">No stock boxes found.</p>
        ) : (
          <div className="mt-4">
            <table className="w-full border-collapse border border-gray-300 rounded-xl overflow-hidden">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border px-3 py-2 text-center">
                    <div className="flex justify-center items-center">
                      Stock Box Name
                    </div>
                  </th>
                  <th className="border px-3 py-2 text-center">
                    <div className="flex justify-center items-center">
                      Total Stock Box Count
                    </div>
                  </th>

                  <th className="border px-3 py-2 text-center">
                    <div className="flex justify-center items-center">
                      Total Stock Box Weight
                    </div>
                  </th>

                  <th className="border px-3 py-2 text-center">
                    <div className="flex justify-center items-center">
                      Action
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((box) => (
                  <tr key={box.stockBoxId} className="bg-white/90">
                    <td className="border px-3 py-2 text-center">
                      <div className="flex justify-center items-center">
                        {box.stockBoxName}
                      </div>
                    </td>

                    <td className="border px-3 py-2 text-center">
                      <div className="flex justify-center items-center">
                        {box.totalStockBoxCount}
                      </div>
                    </td>

                    <td className="border px-3 py-2 text-center">
                      <div className="flex justify-center items-center">
                        {box.totalStockBoxWeight}
                      </div>
                    </td>

                    <td className="border px-3 py-2 text-center">
                      <div className="flex justify-center items-center">
                        <IconButton
                          size="medium"
                          color="primary"
                          sx={{
                            "&:hover": { backgroundColor: "#E0E0E0" },
                          }}
                          onClick={() => {
                            localStorage.setItem(
                              "selectedStockBox",
                              JSON.stringify(box)
                            );
                            navigate(
                              `/admin/StockBoxDetails/${box.stockBoxId}`
                            );
                          }}
                        >
                          <VisibilityIcon fontSize="medium" />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Paper>
    </div>
  );
};

export default StockBoxData;
