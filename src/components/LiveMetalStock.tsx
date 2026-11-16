
import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  MenuItem,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import api from "@/services/api";

type MetalStock = {
  showroom: number;
  metal: string;
  remainingPieces: number;
  remainingWeightGrams: number;
};

type StockResponse = {
  showroom: number | "ALL";
  metals: MetalStock[];
  totalGoldWeightGrams: number;
  totalSilverWeightGrams: number;
  totalGoldPieces: number;
  totalSilverPieces: number;
};

type Props = {
  token: string | null;
};


const METALS = [
  "22 Gold",
  "24 Gold",
  "995 Silver",
  "999 Silver",
];

const formatWeight = (value: number) =>
  value.toLocaleString("en-IN", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

const LiveMetalStock: React.FC<Props> = ({ token }) => {
  const [showroom, setShowroom] = useState("ALL");
  const [data, setData] = useState<StockResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setData(null);
      setLoading(false);
      setError("Admin login required.");
      return;
    }

    const controller = new AbortController();

    const fetchStock = async () => {
      try {
        const query =
          showroom === "ALL" ? "" : `?showroom=${showroom}`;

        const response = await api.get<StockResponse>(
  "/admin/analytics/stock/current",
  {
    params: showroom === "ALL" ? {} : {
      showroom: Number(showroom),
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

const result = response.data;

        if (!controller.signal.aborted) {
          setData(result);
          setError("");
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error ? err.message : "Unable to load stock"
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    setLoading(true);
    setData(null);
    fetchStock();

    const interval = window.setInterval(fetchStock, 30000);

    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [showroom, token]);

  return (
    <Card sx={{ borderRadius: 3, mt: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={2}
          mb={3}
        >
          <Typography variant="h6" fontWeight={700}>
            Live Gold & Silver Stock
          </Typography>

          <TextField
            select
            size="small"
            label="Showroom"
            value={showroom}
            onChange={(e) => setShowroom(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="ALL">Both Showrooms</MenuItem>
            <MenuItem value="1">1# Showroom</MenuItem>
            <MenuItem value="2">2# Showroom</MenuItem>
          </TextField>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        {loading && !data && <CircularProgress />}

        {data && (
          <Box
            display="grid"
            gridTemplateColumns={{
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(4, 1fr)",
            }}
            gap={2}
          >
            {METALS.map((metal) => {
              const entries = data.metals.filter(
                (item) => item.metal === metal
              );

              const weight = entries.reduce(
                (sum, item) => sum + item.remainingWeightGrams,
                0
              );

              const pieces = entries.reduce(
                (sum, item) => sum + item.remainingPieces,
                0
              );

              const isGold = metal.includes("Gold");

              return (
                <Box
                  key={metal}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    backgroundColor: isGold
                      ? "rgba(218,165,32,0.07)"
                      : "rgba(100,130,160,0.07)",
                  }}
                >
                  <Typography fontWeight={700}>
                    {metal}
                  </Typography>

                  <Typography
                    variant="h5"
                    fontWeight={800}
                    sx={{ my: 1 }}
                  >
                    {formatWeight(weight)} g
                  </Typography>

                  <Typography color="text.secondary">
                    {pieces.toLocaleString("en-IN")} pieces
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveMetalStock;
