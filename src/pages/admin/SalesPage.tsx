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
  stone_rate: number;
  stone_amount: number;
  wax_weight: number;
  wax_rate: number;
  wax_amount: number;
  diamond_weight: number;
  diamond_rate: number;
  diamond_amount: number;
  bits_weight: number;
  bits_rate: number;
  bits_amount: number;
  enamel_weight: number;
  enamel_rate: number;
  enamel_amount: number;
  pearls_weight: number;
  pearls_rate: number;
  pearls_amount: number;
  other_weight: number;
  other_rate: number;
  other_amount: number;
  gross_weight: number;
  stockBox: string;
  barcodeValue: string;
};

type MetalRates = {
  gold24Rate: number;
  gold22Rate: number;
  silver999Rate: number;
  silver995Rate: number;
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
        if (data.metal === "24 Gold") {
          price = rates.gold24Rate;
        } else if (data.metal === "22 Gold") {
          price = rates.gold22Rate;
        } else if (data.metal === "999 Silver") {
          price = rates.silver999Rate;
        } else if (data.metal === "995 Silver") {
          price = rates.silver995Rate;
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
      <style>
        {`
  @media print {
    @page {
      size: 79mm auto;   /* Exact thermal paper width */
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
    position: absolute;
    top: 0;
    left: 0;
      width: 79mm;
      font-family: Arial, sans-serif;
      font-size: 16px;
      line-height: 1.5;
      padding: 4px 6px;
      font-weight: 600;
      color: #000;
      margin: 0;
    }

    html, body, #print-section {
   margin: 0;
    padding: 0;
    height: auto !important;
    width: 79mm;
}

    /* Headings */
    #print-section h1,
    #print-section h2,
    #print-section h3 {
      text-align: center;
      font-weight: bold;
      margin: 6px 0;
      font-size: 18px;
    }

    /* Horizontal line */
    #print-section .line {
      border-top: 1px dashed #000;
      margin: 6px 0;
    }

    #print-section .short-line {
  border-top: 1px dashed #000;
  width: 30%;          /* Adjust width (shorter line) */
  margin-left: auto;   /* Push line to the right */
  margin-right: 0;
}

#print-section .solid-line {
  border-top: 1px solid #000;
  width: 100%;
  margin: 6px 0;
}

    /* Key values */
    #print-section .row {
      display: flex;
      justify-content: space-between;
      margin: 2px 0;
    }

    /* Final Amount */
    #print-section .final {
      font-size: 18px;
      font-weight: bold;
      margin-top: 8px;
    }

    /* Footer */
    #print-section .footer {
      font-size: 12px;
      text-align: center;
      margin-top: 10px;
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
            <h2>ESTIMATION</h2>
            <div className="center">{new Date().toLocaleString()}</div>

            {/* Rate */}
            <div className="row">
              <span>RT</span>
              <span>{(metalPrice / 10).toFixed(2)}/gm</span>
            </div>

            <div className="solid-line"></div>
            {/* Item */}
            <div className="row">
              <span>Item</span>
              <span>{order.itemName}</span>
            </div>

            <div className="line"></div>

            {/* Weights */}
            <div className="row">
              <span>Gr Wt</span>
              <span>{order.gross_weight.toFixed(3)}</span>
            </div>
            {order.stone_weight > 0 && (
              <div className="row">
                <span>St Wt</span>
                <span>-{order.stone_weight.toFixed(3)}</span>
              </div>
            )}
            {order.wax_weight > 0 && (
              <div className="row">
                <span>Wx Wt</span>
                <span>-{order.wax_weight.toFixed(3)}</span>
              </div>
            )}
            {order.diamond_weight > 0 && (
              <div className="row">
                <span>Dmd Wt</span>
                <span>-{order.diamond_weight.toFixed(3)}</span>
              </div>
            )}
            {order.bits_weight > 0 && (
              <div className="row">
                <span>Bts Wt</span>
                <span>-{order.bits_weight.toFixed(3)}</span>
              </div>
            )}
            {order.enamel_weight > 0 && (
              <div className="row">
                <span>Enml Wt</span>
                <span>-{order.enamel_weight.toFixed(3)}</span>
              </div>
            )}
            {order.pearls_weight > 0 && (
              <div className="row">
                <span>Prls Wt</span>
                <span>-{order.pearls_weight.toFixed(3)}</span>
              </div>
            )}
            {order.other_weight > 0 && (
              <div className="row">
                <span>Oth Wt</span>
                <span>-{order.other_weight.toFixed(3)}</span>
              </div>
            )}

            <div className="row">
              <span>Nt Wt</span>
              <span>{order.metal_weight.toFixed(3)}</span>
            </div>

            <div className="row">
              <span>Wst</span>
              <span>
                {order.wastage}% ({(order.wastage / 100) * order.metal_weight} )
              </span>
            </div>
            <div className="short-line"></div>

            <div className="row">
              <span>T Wt</span>
              <span>
                {order.metal_weight +
                  (order.wastage / 100) * order.metal_weight}
              </span>
            </div>

            <div className="short-line"></div>

            <div className="row">
              <span>
                Cost of{" "}
                {order.metal.includes("Gold")
                  ? "Gold"
                  : order.metal.includes("Silver")
                  ? "Silver"
                  : ""}
                ({(metalPrice / 10).toFixed(2)}/gm)
              </span>
              <span>
                {(
                  (order.metal_weight +
                    (order.wastage / 100) * order.metal_weight) *
                  (metalPrice / 10)
                ).toFixed(2)}{" "}
              </span>
            </div>
            {
              <>
                <div className="solid-line"></div>
                <div className="row">
                  <span>Gems</span>
                  <span>Wt/pc</span>
                  <span>Rate</span>
                  <span>Amount</span>
                </div>
              </>
            }

            {order.stone_amount > 0 && (
              <>
                <div className="line"></div>

                <div className="row">
                  <span>Stone</span>
                  <span>{(order.stone_weight * 10) / 2} cts</span>
                  <span>{order.stone_rate}</span>
                  <span>{order.stone_amount}</span>
                </div>
              </>
            )}

            {order.wax_amount > 0 && (
              <>
                <div className="line"></div>
                <div className="row">
                  <span>Wax</span>
                  <span>{(order.wax_weight * 10) / 2} cts</span>
                  <span>{order.wax_rate}</span>
                  <span>{order.wax_amount}</span>
                </div>
              </>
            )}

            {order.diamond_amount > 0 && (
              <>
                <div className="line"></div>
                <div className="row">
                  <span>Diamond</span>
                  <span>{(order.diamond_weight * 10) / 2} cts</span>
                  <span>{order.diamond_rate}</span>
                  <span>{order.diamond_amount}</span>
                </div>
              </>
            )}

            {order.pearls_amount > 0 && (
              <>
                <div className="line"></div>
                <div className="row">
                  <span>Stone</span>
                  <span>{(order.pearls_weight * 10) / 2} cts</span>
                  <span>{order.pearls_rate}</span>
                  <span>{order.pearls_amount}</span>
                </div>
              </>
            )}
            {order.bits_amount > 0 && (
              <>
                <div className="line"></div>
                <div className="row">
                  <span>Bits</span>
                  <span>{(order.bits_weight * 10) / 2} cts</span>
                  <span>{order.bits_rate}</span>
                  <span>{order.bits_amount}</span>
                </div>
              </>
            )}

            {order.enamel_amount > 0 && (
              <>
                <div className="line"></div>
                <div className="row">
                  <span>Enamel</span>
                  <span>{(order.enamel_weight * 10) / 2} cts</span>
                  <span>{order.enamel_rate}</span>
                  <span>{order.enamel_amount}</span>
                </div>
              </>
            )}

            {order.other_amount > 0 && (
              <>
                <div className="line"></div>
                <div className="row">
                  <span>Other</span>
                  <span>{(order.other_weight * 10) / 2} cts</span>
                  <span>{order.other_rate}</span>
                  <span>{order.other_amount}</span>
                </div>
              </>
            )}

            <div className="solid-line"></div>

            <div className="row">
              <span>Gems Amount</span>
              <span>
                {order.stone_amount +
                  order.bits_amount +
                  order.wax_amount +
                  order.diamond_amount +
                  order.enamel_amount +
                  order.other_amount +
                  order.pearls_amount}
              </span>
            </div>

            <div className="row">
              <span>MC</span>
              <span>{order.making_charges}</span>
            </div>

            <div className="short-line"></div>

            {/* Final */}
            <div className="row final">
              <span>FINAL AMOUNT</span>
              <span>{totalAmount}</span>
            </div>

            <div className="short-line"></div>

            {/* Footer */}
            <div className="footer">
              <div>Final will be applied at the time of Billing</div>
              <div>Certified BIS Hallmark Jewellery</div>
            </div>
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
