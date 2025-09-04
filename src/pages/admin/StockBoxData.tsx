// src/pages/admin/StockBoxData.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Paper, Typography, CircularProgress, Button } from "@mui/material";
import api from "@/services/api";

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
        if (alive) {
          setLoading(false);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

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

        {loading ? (
          <div className="flex items-center gap-3 py-6">
            <CircularProgress size={22} />
            <span>Loading…</span>
          </div>
        ) : err ? (
          <p className="text-red-600 py-4">{err}</p>
        ) : (
          <div className="mt-4">
            <table className="w-full border-collapse border border-gray-300 rounded-xl overflow-hidden">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border px-3 py-2 text-left">Stock Box Name</th>
                  <th className="border px-3 py-2 text-left">
                    Total Stock Box Count
                  </th>
                  <th className="border px-3 py-2 text-left">
                    Total Stock Box Weight
                  </th>
                  <th className="border px-3 py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((box) => (
                  <tr key={box.stockBoxId} className="bg-white/90">
                    <td className="border px-3 py-2">{box.stockBoxName}</td>
                    <td className="border px-3 py-2">
                      {box.totalStockBoxCount}
                    </td>
                    <td className="border px-3 py-2">
                      {box.totalStockBoxWeight}
                    </td>
                    <td className="border px-3 py-2 text-center">
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => {
                          localStorage.setItem(
                            "selectedStockBox",
                            JSON.stringify(box)
                          );
                          navigate(`/admin/StockBoxDetails/${box.stockBoxId}`);
                        }}
                      >
                        View More
                      </Button>
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
