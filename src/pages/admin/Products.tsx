import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Grid,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";


const API_BASE = "http://15.207.98.116:8081";

/* ---------- Types ---------- */
type ProductQuery = {
  metal: string;
  itemName: string;
  design: string;
  size: string;
  weight: string;
};

type StockProduct = {
  stockProductId: number;
  metal: string;
  itemName: string;
  design: number | string;
  size: number | string;
  metal_weight: number;
  stone_weight: number;
  stock?: number;
  barcodeValue?: string;
  barcodeImage?: string;
};

type ProductForm = {
  // strings for ALL fields to avoid the “0 won’t clear” problem in inputs
  metal: string;
  metalPrice: string;
  itemName: string;
  design: string;
  size: string;
  metal_weight: string;
  wastage: string;
  making_charges: string;
  stone_weight: string;
  diamond_weight: string;
  bits_weight: string;
  enamel_weight: string;
  pearls_weight: string;
  other_weight: string;
  stock: string;
  gross_weight: string;
  total_item_amount: string;
};

/* ---------- Initial State ---------- */
const initialQuery: ProductQuery = {
  metal: "",
  itemName: "",
  design: "",
  size: "",
  weight: "",
};

const initialProduct: ProductForm = {
  metal: "",
  metalPrice: "",
  itemName: "",
  design: "",
  size: "",
  metal_weight: "",
  wastage: "",
  making_charges: "",
  stone_weight: "",
  diamond_weight: "",
  bits_weight: "",
  enamel_weight: "",
  pearls_weight: "",
  other_weight: "",
  stock: "",
  gross_weight: "",
  total_item_amount: "",
};

const requiredProductKeys: (keyof ProductForm)[] = [
  "metal",
  "metalPrice",
  "itemName",
  "design",
  "size",
  "metal_weight",
  "total_item_amount",
];

const numericKeys: (keyof ProductForm)[] = [
  "metalPrice",
  "metal_weight",
  "wastage",
  "making_charges",
  "stone_weight",
  "diamond_weight",
  "bits_weight",
  "enamel_weight",
  "pearls_weight",
  "other_weight",
  "stock",
  "gross_weight",
  "total_item_amount",
];

const label = (k: string) =>
  k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const toNum = (s: string) => (s.trim() === "" ? 0 : Number(s));

/* ============================ Component ============================ */
const Products: React.FC = () => {
  /* --------- Search (top) --------- */
  const [q, setQ] = useState<ProductQuery>(initialQuery);
  const [topLoading, setTopLoading] = useState(false);
  const [topResults, setTopResults] = useState<StockProduct[] | null>(null);

  // controls visibility of the Products form
  const [showProductForm, setShowProductForm] = useState(false);

  const onQChange =
    (k: keyof ProductQuery) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setQ((p) => ({ ...p, [k]: e.target.value }));

  const searchTop = async () => {
    // If any field missing → open the form instead
    if (Object.values(q).some((v) => !v.trim())) {
      alert("Please fill all search fields (or add the product below).");
      setTopResults(null);
      setShowProductForm(true);
      return;
    }

    try {
      setTopLoading(true);
      const token = localStorage.getItem("token") ?? "";
      const url = `${API_BASE}/admin/getStockProduct/${encodeURIComponent(
        q.metal.trim()
      )}/${encodeURIComponent(q.itemName.trim())}/${encodeURIComponent(
        q.design.trim()
      )}/${q.size.trim()}/${q.weight.trim()}`;

      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!res.ok) {
        // Not found → show the form
        alert("No data found. Please add it below.");
        setTopResults(null);
        setShowProductForm(true);
        return;
      }

      const data: StockProduct | StockProduct[] = await res.json();
      const list = Array.isArray(data) ? data : [data];

      if (list.length) {
        setTopResults(list);
        setShowProductForm(false); // hide the form when found
        alert("Found!");
      } else {
        alert("No data found. Please add it below.");
        setTopResults(null);
        setShowProductForm(true);
      }
    } catch (err) {
      console.error(err);
      alert("Search failed.");
      setTopResults(null);
      setShowProductForm(true);
    } finally {
      setTopLoading(false);
    }
  };

  /* --------- Products form (bottom) --------- */
  const [product, setProduct] = useState<ProductForm>(initialProduct);
  const [errors, setErrors] =
    useState<Partial<Record<keyof ProductForm, string>>>({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Table B (shown only after a successful submit)
  const [bottomResults, setBottomResults] = useState<StockProduct[] | null>(
    null
  );
  const [bottomLoading, setBottomLoading] = useState(false);

  const onProductChange =
    (k: keyof ProductForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setProduct((p) => ({ ...p, [k]: raw })); // keep as string (no forced 0)
      if (errors[k]) setErrors((prev) => ({ ...prev, [k]: undefined }));
    };

  const validateProduct = () => {
    const e: Partial<Record<keyof ProductForm, string>> = {};
    requiredProductKeys.forEach((k) => {
      if (!product[k].trim()) e[k] = "Required";
    });
    // numeric sanity (optional)
    numericKeys.forEach((k) => {
      const v = product[k].trim();
      if (v !== "" && Number.isNaN(Number(v))) e[k] = "Invalid number";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const fetchBottomTable = async () => {
    // fetch the just-added item for Table B
    setBottomLoading(true);
    try {
      const token = localStorage.getItem("token") ?? "";
      const url = `${API_BASE}/admin/getStockProduct/${encodeURIComponent(
        product.metal.trim()
      )}/${encodeURIComponent(product.itemName.trim())}/${encodeURIComponent(
        product.design.trim()
      )}/${product.size.trim()}/${product.metal_weight.trim()}`;

      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!res.ok) {
        setBottomResults(null);
        return;
      }

      const data: StockProduct | StockProduct[] = await res.json();
      setBottomResults(Array.isArray(data) ? data : [data]);
    } catch (err) {
      console.error(err);
      setBottomResults(null);
    } finally {
      setBottomLoading(false);
    }
  };

  const onSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProduct()) {
      alert("Please fill the required fields.");
      return;
    }

    // build numeric payload
    const payload = {
      metal: product.metal.trim(),
      metalPrice: toNum(product.metalPrice),
      itemName: product.itemName.trim(),
      design: product.design.trim(),
      size: product.size.trim(),
      metal_weight: toNum(product.metal_weight),
      wastage: toNum(product.wastage),
      making_charges: toNum(product.making_charges),
      stone_weight: toNum(product.stone_weight),
      diamond_weight: toNum(product.diamond_weight),
      bits_weight: toNum(product.bits_weight),
      enamel_weight: toNum(product.enamel_weight),
      pearls_weight: toNum(product.pearls_weight),
      other_weight: toNum(product.other_weight),
      stock: toNum(product.stock),
      gross_weight: toNum(product.gross_weight),
      total_item_amount: toNum(product.total_item_amount),
    };

    try {
      setSubmitLoading(true);
      const token = localStorage.getItem("token") ?? "";
      const res = await fetch(`${API_BASE}/admin/addStockProduct`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error("Add product failed:", txt);
        alert("Failed to submit the product.");
        return;
      }

      alert("Submitted!");
      // Show Table B for the newly added product
      await fetchBottomTable();
    } catch (err) {
      console.error(err);
      alert("Something went wrong while submitting.");
    } finally {
      setSubmitLoading(false);
    }
  };

  /* ------------------------------ UI ----------------------------- */
  return (
    <Box>
      {/* ---------- SEARCH STOCK PRODUCT ---------- */}
      <Paper
        elevation={0}
        sx={{
          mt: 4,
          p: 4,
          borderRadius: 3,
          backgroundColor: "background.paper",
          border: "1px solid #d0b3ff",
          boxShadow: "0 10px 30px rgba(136,71,255,0.15)",
        }}
      >
        <Typography variant="h5" fontWeight={700} color="primary" mb={3}>
          Search Stock Product
        </Typography>

        <Grid container spacing={2}>
          {(["metal", "itemName", "design", "size", "weight"] as const).map(
            (k) => (
              <Grid xs={12} sm={6} md={4} key={k}>
                <TextField
                  label={label(k)}
                  type={k === "size" || k === "weight" ? "number" : "text"}
                  inputProps={
                    k === "size" || k === "weight" ? { step: "any" } : undefined
                  }
                  value={q[k]}
                  onChange={onQChange(k)}
                  fullWidth
                />
              </Grid>
            )
          )}
        </Grid>

        <Box display="flex" justifyContent="flex-end" mt={3}>
          <Button
            variant="contained"
            onClick={searchTop}
            disabled={topLoading}
            sx={{ minWidth: 120 }}
          >
            {topLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Search"
            )}
          </Button>
        </Box>
      </Paper>

      {/* ---------- TABLE A (only when search found) ---------- */}
      {topResults && (
        <Paper
          elevation={0}
          sx={{
            mt: 4,
            p: 4,
            borderRadius: 3,
            backgroundColor: "background.paper",
            border: "1px solid #d0b3ff",
            boxShadow: "0 10px 30px rgba(136,71,255,0.15)",
          }}
        >
          <Typography variant="h6" fontWeight={600} mb={2}>
            Result (Search Stock Product)
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Metal</TableCell>
                <TableCell>Item</TableCell>
                <TableCell>Design</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Weight</TableCell>
                <TableCell>Stock</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {topResults.map((p) => (
                <TableRow key={p.stockProductId}>
                  <TableCell>{p.stockProductId}</TableCell>
                  <TableCell>{p.metal}</TableCell>
                  <TableCell>{p.itemName}</TableCell>
                  <TableCell>{p.design}</TableCell>
                  <TableCell>{p.size}</TableCell>
                  <TableCell>{p.metal_weight}</TableCell>
                  <TableCell>{p.stock ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* ---------- PRODUCTS FORM (shown only when search failed or fields missing) ---------- */}
      {showProductForm && (
        <Box component="form" onSubmit={onSubmitProduct}>
          <Paper
            elevation={0}
            sx={{
              mt: 4,
              p: 4,
              borderRadius: 3,
              backgroundColor: "background.paper",
              border: "1px solid #d0b3ff",
              boxShadow: "0 10px 30px rgba(136,71,255,0.15)",
            }}
          >
            <Typography variant="h4" fontWeight={700} color="primary" mb={3}>
              Products
            </Typography>

            <Grid container spacing={3}>
              {(Object.keys(initialProduct) as (keyof ProductForm)[]).map(
                (k) => {
                  const isNumber = numericKeys.includes(k);
                  return (
                    <Grid xs={12} sm={6} md={4} key={k}>
                      <TextField
                        label={label(k)}
                        type={isNumber ? "number" : "text"}
                        inputProps={isNumber ? { step: "any" } : undefined}
                        value={product[k]} // stays string; no forced 0 in UI
                        error={!!errors[k]}
                        helperText={errors[k] || ""}
                        fullWidth
                        onChange={onProductChange(k)}
                      />
                    </Grid>
                  );
                }
              )}
            </Grid>

            <Box display="flex" justifyContent="flex-end" mt={4}>
              <Button
                type="submit"
                variant="contained"
                disabled={submitLoading}
                sx={{
                  background: "#8847FF",
                  fontWeight: 600,
                  textTransform: "none",
                  "&:hover": { background: "#6c30cc" },
                  px: 5,
                }}
              >
                {submitLoading ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  "Submit"
                )}
              </Button>
            </Box>
          </Paper>
        </Box>
      )}

      {/* ---------- TABLE B (only after successful submit) ---------- */}
      {bottomResults && (
        <Paper
          elevation={0}
          sx={{
            mt: 4,
            p: 4,
            borderRadius: 3,
            backgroundColor: "background.paper",
            border: "1px solid #d0b3ff",
            boxShadow: "0 10px 30px rgba(136,71,255,0.15)",
          }}
        >
          <Typography variant="h6" fontWeight={600} mb={2}>
            Result (Products Submit)
          </Typography>

          {bottomLoading ? (
            <CircularProgress size={22} />
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Metal</TableCell>
                  <TableCell>Item Name</TableCell>
                  <TableCell>Metal Weight</TableCell>
                  <TableCell>Stone Weight</TableCell>
                  <TableCell>Barcode Value</TableCell>
                  <TableCell>Barcode Image</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bottomResults.map((r) => (
                  <TableRow key={r.stockProductId}>
                    <TableCell>{r.stockProductId}</TableCell>
                    <TableCell>{r.metal}</TableCell>
                    <TableCell>{r.itemName}</TableCell>
                    <TableCell>{r.metal_weight}</TableCell>
                    <TableCell>{r.stone_weight}</TableCell>
                    <TableCell>{r.barcodeValue ?? "-"}</TableCell>
                    <TableCell>
                      {r.barcodeImage ? (
                        <img
                          alt="barcode"
                          src={`data:image/png;base64,${r.barcodeImage}`}
                          style={{ height: 60 }}
                        />
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default Products;
