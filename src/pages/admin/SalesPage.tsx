import React, { useState, useEffect } from "react";
import {
  TextField,
  Box,
  Button,
  InputAdornment,
  Paper,
  Typography,
  Grid,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import api from "@/services/api";
import { useNavigate } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";

type BarcodeProduct = {
  stockProductId: number;
  metal: string;
  itemName: string;
  catalogue: string;
  design: string;
  size: string;
  metal_weight: number;
  wastage: number;
  making_charges: number;
  stone_weight: number;
  stone_amount: number;
  wax_weight: number;
  wax_amount: number;
  diamond_weight: number;
  diamond_amount: number;
  bits_weight: number;
  bits_amount: number;
  enamel_weight: number;
  enamel_amount: number;
  pearls_weight: number;
  pearls_amount: number;
  other_weight: number;
  other_amount: number;
  gross_weight: number;
  stockBox: string;
  barcodeValue: string;
};

type MetalRates = {
  metalPriceId: number;
  goldRate: number;
  silverRate: number;
};

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

const SalesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [order, setOrder] = useState<BarcodeProduct | null>(null);
  const [metalPrice, setMetalPrice] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [rates, setRates] = useState<MetalRates | null>(null);
  const [showEstimation, setShowEstimation] = useState(false);

  const token = localStorage.getItem("token");

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
        const { data } = await api.get<StockDataBox[]>(
          `/sales/getALlStockBox`,
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

  // ⬇️ Fetch gold & silver rates on mount
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await api.get<MetalRates>("/sales/getRates", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRates(response.data);
      } catch (error) {
        console.error("Failed to fetch metal rates:", error);
      }
    };

    fetchRates();
  }, [token]);

  // 🧾 Calculation Logic
  const calculateTotal = (data: BarcodeProduct, price: number) => {
    const wastageWeight = (data.wastage / 100) * data.metal_weight;
    const metalValue = (data.metal_weight + wastageWeight) * (price / 10);

    const extras =
      data.stone_amount +
      data.wax_amount +
      data.diamond_amount +
      data.bits_amount +
      data.enamel_amount +
      data.pearls_amount +
      data.other_amount;

    return Math.round(metalValue + data.making_charges + extras);
  };

  // 🔍 Handle Search
  const handleSearch = async () => {
    if (!searchQuery) {
      alert("Please enter barcode value");
      return;
    }

    try {
      const response = await api.get<BarcodeProduct>(
        `/sales/getDataByBarcode?barcodeValue=${searchQuery}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = response.data;

      let price = 0;
      if (rates) {
        if (data.metal === "24 Gold" || data.metal === "22 Gold") {
          price = rates.goldRate;
        } else if (data.metal === "999 Silver" || data.metal === "995 Silver") {
          price = rates.silverRate;
        }
      }

      setOrder(data);
      setMetalPrice(price);
      setTotalAmount(calculateTotal(data, price));
    } catch (error) {
      console.error("Failed to fetch barcode data:", error);
      alert("Barcode not found or error occurred");
    }
  };

  return (
    <div className="p-6 bg-white text-black">
      {/* PRINT CSS */}
      <style>
        {`
  @media print {
  @page {
    size: 80mm auto;   /* Thermal paper width */
    margin: 0;
  }

  body {
    margin: 0;
    padding: 0;
    background: white;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;

  }

  body * {
    visibility: hidden;
  }

  
  #print-section, #print-section * {
    visibility: visible;
  }

  #print-section {
    width: 80mm;
    font-family: "Courier New", monospace;
    font-size: 13px;
    line-height: 1.3;
    margin: 0 auto;
    padding: 0;
    position: static;
    font-weight: bold;
  }
}

  `}
      </style>

      <Box>
        {/* 🔍 Search Bar */}
        <Box
          display="flex"
          gap={2}
          alignItems="center"
          mb={4}
          maxWidth={600}
          mx="auto"
        >
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Enter Barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              style: {
                borderRadius: "25px",
                backgroundColor: "#fff",
                paddingLeft: 8,
              },
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            sx={{ borderRadius: "12px", fontWeight: "bold" }}
          >
            Search
          </Button>
        </Box>

        {/* 📋 Show Data Only After Search */}
        {order && (
          <Paper
            sx={{
              p: 4,
              borderRadius: "24px",
              backgroundColor: "rgba(255,255,255,0.95)",
              boxShadow: "0px 10px 30px rgba(136,71,255,0.2)",
            }}
          >
            <Typography variant="h5" mb={3} fontWeight="bold" color="primary">
              Product Details
            </Typography>

            <Grid container spacing={3}>
              {/* Show all fields except stockProductId & barcodeValue */}
              {Object.entries(order).map(([key, value]) => {
                if (key === "stockProductId" || key === "barcodeValue") {
                  return null;
                }
                return (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={key}>
                    <TextField
                      label={key.replace(/_/g, " ")}
                      value={value}
                      fullWidth
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                );
              })}

              {/* Metal Price */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  label="Metal Price"
                  value={metalPrice}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
              </Grid>

              {/* Total Amount */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  label="Total Amount"
                  value={totalAmount}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
              </Grid>
            </Grid>
          </Paper>
        )}
        {order && (
          <Box mt={3} textAlign="center">
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setShowEstimation(true)}
            >
              Generate Estimation
            </Button>
          </Box>
        )}
        {showEstimation && order && (
          <div id="print-section">
            <Paper
              sx={{
                mt: 3,
                p: 2,
                maxWidth: 380,
                mx: "auto",
                fontFamily: "monospace",
              }}
            >
              <Typography align="center" fontWeight="bold">
                ESTIMATION
              </Typography>
              <Typography align="center" fontSize="0.75rem" mb={2}>
                {new Date().toLocaleString()}
              </Typography>
              {/* Item Section */}
              <Typography>RT: {(metalPrice / 10).toFixed(2)}/gm</Typography>
              <Box my={1}>
                <Typography>
                  --------------------------------------------
                </Typography>{" "}
                <Typography fontWeight="bold">{order.itemName}</Typography>
                <Typography>
                  --------------------------------------------
                </Typography>{" "}
              </Box>
              {/* Weights Section */}
              <Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Gr Wt</Typography>
                  <Typography>{order.gross_weight.toFixed(3)}</Typography>
                </Box>
                {order.stone_weight > 0 && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography>St Wt</Typography>
                    <Typography>-{order.stone_weight.toFixed(3)}</Typography>
                  </Box>
                )}
                {order.wax_weight > 0 && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Wx Wt</Typography>
                    <Typography>-{order.wax_weight.toFixed(3)}</Typography>
                  </Box>
                )}
                {order.diamond_weight > 0 && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Dmd Wt</Typography>
                    <Typography>-{order.diamond_weight.toFixed(3)}</Typography>
                  </Box>
                )}
                {order.bits_weight > 0 && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Bts Wt</Typography>
                    <Typography>-{order.bits_weight.toFixed(3)}</Typography>
                  </Box>
                )}
                {order.enamel_weight > 0 && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Enml Wt</Typography>
                    <Typography>-{order.enamel_weight.toFixed(3)}</Typography>
                  </Box>
                )}
                {order.pearls_weight > 0 && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Prls Wt</Typography>
                    <Typography>-{order.pearls_weight.toFixed(3)}</Typography>
                  </Box>
                )}
                {order.other_weight > 0 && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Oth Wt</Typography>
                    <Typography>-{order.other_weight.toFixed(3)}</Typography>
                  </Box>
                )}
                <Typography>
                  --------------------------------------------
                </Typography>{" "}
                <Box display="flex" justifyContent="space-between">
                  <Typography>Nt Wt</Typography>
                  <Typography>{order.metal_weight.toFixed(3)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Wst</Typography>
                  <Typography>{order.wastage}%</Typography>
                </Box>
              </Box>
              {/* Amounts Section */}
              <Box mt={2}>
                {order.stone_amount > 0 && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography>St Rt</Typography>
                    <Typography>{order.stone_amount}</Typography>
                  </Box>
                )}
                {order.wax_amount > 0 && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Wx Rt</Typography>
                    <Typography>{order.wax_amount}</Typography>
                  </Box>
                )}
                {order.diamond_amount > 0 && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Dmd Rt</Typography>
                    <Typography>{order.diamond_amount}</Typography>
                  </Box>
                )}

                {order.bits_amount > 0 && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Bts Rt</Typography>
                    <Typography>{order.bits_amount}</Typography>
                  </Box>
                )}
                {order.enamel_amount > 0 && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Enml Rt</Typography>
                    <Typography>{order.diamond_amount}</Typography>
                  </Box>
                )}

                {order.pearls_amount > 0 && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Prls Rt</Typography>
                    <Typography>{order.pearls_amount}</Typography>
                  </Box>
                )}

                {order.other_amount > 0 && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Oth Rt</Typography>
                    <Typography>{order.other_amount}</Typography>
                  </Box>
                )}
                {/* Repeat for Bts Rt, En Rt, Prls Rt, Oth Rt */}

                <Box display="flex" justifyContent="space-between">
                  <Typography>MC</Typography>
                  <Typography>{order.making_charges}</Typography>
                </Box>
              </Box>
              <Typography>
                --------------------------------------------
              </Typography>
              {/* Final Amount */}
              <Box mt={2} display="flex" justifyContent="space-between">
                <Typography fontWeight="bold">FINAL AMOUNT</Typography>
                <Typography fontWeight="bold">{totalAmount}</Typography>
              </Box>
              {/* Footer */}
              <Box mt={2} textAlign="center">
                <Typography fontSize="0.75rem">
                  Final will be applied at the time of Billing
                </Typography>
                <Typography fontSize="0.75rem">
                  Certified BIS Hallmark Jewellery
                </Typography>
              </Box>
              =
            </Paper>
          </div>
        )}
      </Box>
      <div className="text-center mt-6 print:hidden">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-4"
        >
          🖨️ Print Estimation
        </button>
      </div>

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
          <Typography
            variant="h4"
            fontWeight="bold"
            color="primary"
            gutterBottom
          >
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
                    <th className="border px-3 py-2 text-left">
                      Stock Box Name
                    </th>
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
                            navigate(
                              `/admin/StockBoxDetails/${box.stockBoxId}`
                            );
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
    </div>
  );
};

export default SalesPage;
