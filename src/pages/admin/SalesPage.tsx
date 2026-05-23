import React, { useState, useEffect, useMemo } from "react";
import {
  TextField,
  Box,
  Button,
  InputAdornment,
  Paper,
  Typography,
  IconButton,
  Grid,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import api from "@/services/api";
import { useNavigate } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";


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
  description?: string;
  checked?: boolean;
  stockBoxData: StockBoxDataEntry[];
};

type SalesPageProps = {
  mode?: "stockBox" | "estimation";
};

const SalesPage: React.FC<SalesPageProps> = ({ mode }) => {
    const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
const basePath = role === "ADMIN" ? "/admin" : "/sales";
 const isAdmin = role === "ADMIN";
  const barcodeApi =
  role === "ADMIN"
    ? `${basePath}/getByBarcode`
    : `${basePath}/getDataByBarcode`;
  const isSales = role === "SALES";
const showEstimationSection = !isSales || mode === "estimation";
const showStockBoxSection = !isSales || mode === "stockBox";
  const [searchQuery, setSearchQuery] = useState("");
  const [order, setOrder] = useState<BarcodeProduct | null>(null);
  const [metalPrice, setMetalPrice] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [rates, setRates] = useState<MetalRates | null>(null);
  const [showEstimation, setShowEstimation] = useState(false);

const [descDialog, setDescDialog] = useState(false);
const [descriptionInput, setDescriptionInput] = useState("");
const [selectedDescBox, setSelectedDescBox] = useState<StockDataBox | null>(null);


  const [rows, setRows] = useState<StockDataBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();
  const [search, setSearch] = useState<string>(""); // 👈 search state


   

const [editBox, setEditBox] = useState<StockDataBox | null>(null);
const [editCount, setEditCount] = useState("");
const [editWeight, setEditWeight] = useState("");
const [editStockBoxName, setEditStockBoxName] = useState("");


const Secreat_code = "HambireJ@1977";

const [passwordDialog, setPasswordDialog] = useState(false);
const [passwordInput, setPasswordInput] = useState("");
const [pendingAction, setPendingAction] = useState<{
  type: "edit" | "delete";
  box: StockDataBox;
} | null>(null);



const handleProtectedAction = (
  type: "edit" | "delete",
  box: StockDataBox
) => {
  setPendingAction({ type, box });
  setPasswordInput("");
  setPasswordDialog(true);
};

const verifyPasswordAndProceed = async () => {
  if (passwordInput !== Secreat_code) {
    alert("Incorrect Password");
    return;
  }

  if (!pendingAction) return;

  if (pendingAction.type === "edit") {
    handleOpenEdit(pendingAction.box);
  } else if (pendingAction.type === "delete") {
    await handleDeleteStockBox(pendingAction.box);
  }

  setPasswordDialog(false);
  setPendingAction(null);
  setPasswordInput("");
};

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const { data } = await api.get<StockDataBox[]>(`${basePath}/getALlStockBox`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          },
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

  const handleUpdateChecked = async (box: StockDataBox, checked: boolean) => {
  await api.put(
    `${basePath}/stock-box/update-checked/${box.stockBoxId}`,
    { checked },
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }
  );

  fetchStockBoxes();
};

const handleClearSelected = async () => {
  const checkedRows = rows.filter((x) => x.checked === true);

  await Promise.all(
    checkedRows.map((box) =>
      api.put(
        `${basePath}/stock-box/update-checked/${box.stockBoxId}`,
        { checked: false },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      )
    )
  );

  fetchStockBoxes();
};

const handleSaveDescription = async () => {
  if (!selectedDescBox) return;

  await api.put(
    `${basePath}/stock-box/update-description/${selectedDescBox.stockBoxId}`,
    { description: descriptionInput },
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }
  );

  setDescDialog(false);
  setSelectedDescBox(null);
  setDescriptionInput("");
  fetchStockBoxes();
};

  // ⬇️ Fetch gold & silver rates on mount
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await api.get<MetalRates>(`${basePath}/getRates`, {
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
  `${barcodeApi}?barcodeValue=${searchQuery}`,
  { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
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

  const fetchStockBoxes = async () => {
  setLoading(true);
  setErr(null);

  try {
    const { data } = await api.get<StockDataBox[]>(`${basePath}/getALlStockBox`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    setRows(Array.isArray(data) ? data : []);
  } catch (e) {
    console.error("Failed to fetch all StockBox Data:", e);
    setErr("Failed to load all StockBox Data.");
  } finally {
    setLoading(false);
  }
};

const handleOpenEdit = (box: StockDataBox) => {
  setEditBox(box);

  setEditStockBoxName(box.stockBoxName ?? "");
  setEditCount(String(box.totalStockBoxCount ?? ""));
  setEditWeight(String(box.totalStockBoxWeight ?? ""));
};

const handleUpdateStockBox = async () => {
  if (!editBox) return;

  await api.put(
    `/admin/stock-box/update-count-weight/${editBox.stockBoxId}`,
    {
        stockBoxName: editStockBoxName,
      totalStockBoxCount: Number(editCount),
      totalStockBoxWeight: Number(editWeight),
    },
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }
  );

  setEditBox(null);
  fetchStockBoxes();
};

const handleDeleteStockBox = async (box: StockDataBox) => {
  const hasData = box.stockBoxData && box.stockBoxData.length > 0;

  if (hasData) {
    alert("Cannot delete. This stock box contains data.");
    return;
  }

const confirmDelete = window.confirm(
  `Are you sure want to delete?\n\n` +
  `Stock Box Name: ${box.stockBoxName}\n` +
  `Total Count: ${box.totalStockBoxCount}\n` +
  `Total Weight: ${box.totalStockBoxWeight}`
);

if (!confirmDelete) return;

  await api.delete(`/admin/stock-box/delete/${box.stockBoxId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  fetchStockBoxes();
};



  // 👇 Filter rows by stockBoxName
  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    return rows.filter((box) =>
      box.stockBoxName.toLowerCase().includes(search.toLowerCase()),
    );
  }, [rows, search]);

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

{showEstimationSection && (
  <Paper
    elevation={0}
    sx={{
      p: 5,
      mt: 4,
      borderRadius: "28px",
      backgroundColor: "rgba(255,255,255,0.9)",
      border: "1px solid #d0b3ff",
      boxShadow: "0 10px 30px rgba(136,71,255,0.18)",
    }}
  >
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
      <Typography variant="h4" fontWeight="bold" color="primary">
        Estimation
      </Typography>

      {isSales && (
        <Button
          variant="outlined"
          color="error"
          onClick={() => navigate("/sales")}
          sx={{ borderRadius: "12px", fontWeight: "bold" }}
        >
          Close
        </Button>
      )}
    </Box>
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

  endAdornment: searchQuery ? (
    <InputAdornment position="end">
      <IconButton
        size="small"
        onClick={() => setSearchQuery("")}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </InputAdornment>
  ) : null,

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
  <div className="mt-8 rounded-[28px] bg-gradient-to-br from-[#091020] via-[#2b0b57] to-[#3d0068] p-8 text-white shadow-2xl">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-3xl font-extrabold text-purple-300">
        Product Details
      </h2>

      <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-yellow-300">
        Barcode: {order.barcodeValue}
      </span>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-3">
        <p><b className="text-pink-300">Item Name:</b> <span className="text-emerald-300 font-bold">{order.itemName}</span></p>
        <p><b className="text-pink-300">Catalogue:</b> <span className="text-emerald-300 font-bold">{order.catalogue}</span></p>
        <p><b className="text-pink-300">Design:</b> <span className="text-emerald-300 font-bold">{order.design}</span></p>
        <p><b className="text-pink-300">Size:</b> <span className="text-emerald-300 font-bold">{order.size}</span></p>
        <p><b className="text-pink-300">Metal:</b> <span className="text-emerald-300 font-bold">{order.metal}</span></p>
        <p><b className="text-pink-300">Metal Price:</b> <span className="text-yellow-300 font-bold">{metalPrice}</span></p>
        <p><b className="text-pink-300">Metal Weight:</b> <span className="text-yellow-300 font-bold">{order.metal_weight}</span></p>
        <p><b className="text-pink-300">Wastage:</b> <span className="text-yellow-300 font-bold">{order.wastage || "—"}</span></p>
        <p><b className="text-pink-300">Making Charges:</b> <span className="text-yellow-300 font-bold">{order.making_charges}</span></p>
        <p><b className="text-pink-300">Stone Weight:</b> <span className="text-yellow-300 font-bold">{order.stone_weight || "—"}</span></p>
        <p><b className="text-pink-300">Stone Amount:</b> <span className="text-yellow-300 font-bold">{order.stone_amount || "—"}</span></p>
      </div>

      <div className="space-y-3 border-l border-white/20 pl-8">
        <p><b className="text-pink-300">Wax Weight:</b> <span className="text-yellow-300 font-bold">{order.wax_weight || "—"}</span></p>
        <p><b className="text-pink-300">Wax Amount:</b> <span className="text-yellow-300 font-bold">{order.wax_amount || "—"}</span></p>
        <p><b className="text-pink-300">Diamond Weight:</b> <span className="text-yellow-300 font-bold">{order.diamond_weight || "—"}</span></p>
        <p><b className="text-pink-300">Diamond Amount:</b> <span className="text-yellow-300 font-bold">{order.diamond_amount || "—"}</span></p>
        <p><b className="text-pink-300">Bits Weight:</b> <span className="text-yellow-300 font-bold">{order.bits_weight || "—"}</span></p>
        <p><b className="text-pink-300">Bits Amount:</b> <span className="text-yellow-300 font-bold">{order.bits_amount || "—"}</span></p>
        <p><b className="text-pink-300">Gross Weight:</b> <span className="text-yellow-300 font-bold">{order.gross_weight}</span></p>
        <p><b className="text-pink-300">Stock Box:</b> <span className="text-yellow-300 font-bold">{order.stockBox || "—"}</span></p>

        <div className="mt-6 rounded-2xl bg-white/10 p-4">
          <p className="text-pink-300 font-bold">Final Estimation Amount</p>
          <p className="text-4xl font-extrabold text-yellow-300 mt-2">
            ₹{totalAmount}
          </p>
        </div>
      </div>
    </div>
  </div>
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
    </Paper>
)}
      {showEstimationSection && showEstimation && (
        <div className="text-center mt-6 print:hidden">
          <button
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-4"
          >
            🖨️ Print Estimation
          </button>
        </div>
      )}


{showStockBoxSection && (

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
         <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
  <Typography variant="h4" fontWeight="bold" color="primary">
    All Stock Box Data
  </Typography>

  {isSales && (
    <Button
      variant="outlined"
      color="error"
      onClick={() => navigate("/sales")}
      sx={{ borderRadius: "12px", fontWeight: "bold" }}
    >
      Close
    </Button>
  )}
</Box>
<Box
  sx={{
    display: "flex",
    alignItems: "center",
    gap: 2,
    mb: 3,
    flexWrap: "wrap",
  }}
>
 

  <TextField
    placeholder="Search by Stock Box Name"
    variant="outlined"
    size="small"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    sx={{
      width: 320,
      backgroundColor: "white",
      borderRadius: "10px",
    }}
  InputProps={{
  startAdornment: (
    <InputAdornment position="start">
      <SearchIcon color="action" />
    </InputAdornment>
  ),

  endAdornment: search ? (
    <InputAdornment position="end">
      <IconButton
        size="small"
        onClick={() => setSearch("")}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </InputAdornment>
  ) : null,
}}
  />
   <Button
    variant="contained"
    color="secondary"
    onClick={handleClearSelected}
    sx={{
      height: "40px",
      fontWeight: "bold",
      borderRadius: "10px",
      px: 3,
    }}
  >
    CLEAR SELECTED
  </Button>
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
                    <th className="border px-3 py-2 text-center">Select</th>
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
                    <th className="border px-3 py-2 text-center">Description</th>
                    <th className="border px-3 py-2 text-center">
                      <div className="flex justify-center items-center">
                        Actions
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((box) => (
                    <tr
                      key={box.stockBoxId}
                      className="bg-white/90 text-center"
                    >
                      <td className="border px-3 py-2 text-center">
  <input
    type="checkbox"
    checked={box.checked === true}
    onChange={(e) => handleUpdateChecked(box, e.target.checked)}
    className="w-4 h-4"
  />
</td>
                      <td className="border px-3 py-2">{box.stockBoxName}</td>
                      <td className="border px-3 py-2">
                        {box.totalStockBoxCount}
                      </td>
                      <td className="border px-3 py-2">
                        {box.totalStockBoxWeight}
                      </td>
                      <td className="border px-3 py-2 text-center">
  <div className="flex justify-center items-center gap-2">
    <span>{box.description || "Add"}</span>

    <IconButton
      size="small"
      color="secondary"
      onClick={() => {
        setSelectedDescBox(box);
        setDescriptionInput(box.description || "");
        setDescDialog(true);
      }}
    >
      <EditIcon fontSize="small" />
    </IconButton>
  </div>
</td>
                    <td className="border px-3 py-2 text-center">
  <div className="flex justify-center items-center gap-2">

    <IconButton
      size="medium"
      color="primary"
      onClick={() => {
        localStorage.setItem("selectedStockBox", JSON.stringify(box));
       navigate(
  isSales
    ? `/sales/stock-box-details/${box.stockBoxId}`
    : `/admin/salesStockBoxDetails/${box.stockBoxId}`
);
      }}
    >
      <VisibilityIcon fontSize="medium" />
    </IconButton>

    {isAdmin && (
      <>
        <IconButton
          size="medium"
          color="warning"
          onClick={() => handleProtectedAction("edit", box)}
        >
          <EditIcon fontSize="medium" />
        </IconButton>

        {(!box.stockBoxData || box.stockBoxData.length === 0) && (
          <IconButton
            size="medium"
            color="error"
            onClick={() => handleProtectedAction("delete", box)}
          >
            <DeleteIcon fontSize="medium" />
          </IconButton>
        )}
      </>
    )}

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
)}

{editBox && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-xl w-[400px] shadow-xl">
      <h2 className="text-xl font-bold mb-4">Edit Stock Box</h2>

    <TextField
  label="Stock Box Name"
  fullWidth
  value={editStockBoxName}
  onChange={(e) => setEditStockBoxName(e.target.value)}
  sx={{ mb: 2 }}
/>

      <TextField
        label="Total Stock Box Count"
        fullWidth
        type="number"
        value={editCount}
        onChange={(e) => setEditCount(e.target.value)}
        sx={{ mb: 2 }}
      />

      <TextField
        label="Total Stock Box Weight"
        fullWidth
        type="number"
        value={editWeight}
        onChange={(e) => setEditWeight(e.target.value)}
        sx={{ mb: 3 }}
      />

      <div className="flex justify-end gap-2">
        <Button variant="outlined" onClick={() => setEditBox(null)}>
          Cancel
        </Button>

        <Button variant="contained" onClick={handleUpdateStockBox}>
          Save
        </Button>
      </div>
    </div>
  </div>
)}

{passwordDialog && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-xl w-[400px] shadow-xl">
      <h2 className="text-xl font-bold mb-4">
        Enter Admin Password
      </h2>

      <TextField
        label="Password"
        type="password"
        fullWidth
        value={passwordInput}
        onChange={(e) => setPasswordInput(e.target.value)}
        sx={{ mb: 3 }}
      />

      <div className="flex justify-end gap-2">
        <Button
          variant="outlined"
          onClick={() => {
            setPasswordDialog(false);
            setPendingAction(null);
            setPasswordInput("");
          }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          color="primary"
          onClick={verifyPasswordAndProceed}
        >
          Verify
        </Button>
      </div>
    </div>
  </div>
)}

{descDialog && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-xl w-[400px] shadow-xl">
      <h2 className="text-xl font-bold mb-4">Add Description</h2>

      <TextField
        label="Description"
        fullWidth
        value={descriptionInput}
        onChange={(e) => setDescriptionInput(e.target.value)}
        sx={{ mb: 3 }}
      />

     <div className="flex justify-end gap-2">
  <Button
    variant="text"
    color="error"
    onClick={() => {
      setDescriptionInput("Add");
    }}
  >
    CLEAR
  </Button>

  <Button
    variant="text"
    onClick={() => {
      setDescDialog(false);
      setSelectedDescBox(null);
      setDescriptionInput("");
    }}
  >
    CANCEL
  </Button>

  <Button
    variant="contained"
    onClick={handleSaveDescription}
  >
    SAVE
  </Button>
</div>
    </div>
  </div>
)}

    </div>

    
  );

  

};

export default SalesPage;
