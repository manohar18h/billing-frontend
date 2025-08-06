// src/pages/admin/Products.tsx
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
  MenuItem,
} from "@mui/material";

const API_BASE = "http://15.207.98.116:8081";

const goldItems = [
  "Pusthela Thadu",
  "Mattalu",
  "Finger Ring",
  "Vaddanam",
  "Bracelet",
  "Bangles",
  "Vathulu",
  "Gundla Mala",
  "Papidi Billa",
  "Necklace",
  "Nose Ring",
  "Neck Chains",
  "Jhumkas",
  "Earring",
];
const silverItems = [
  "Kadiyam",
  "Finger Ring",
  "Ring",
  "Ring2",
  "Neck Chains",
  "Pattilu",
  "Bangles",
  "Bracelet",
  "Mettalu",
  "Pilenlu",
];

const possibleWeightKeys = [
  "stone_weight",
  "diamond_weight",
  "bits_weight",
  "enamel_weight",
  "pearls_weight",
  "other_weight",
];

const prettySelectSx = {
  "& .MuiOutlinedInput-root": {
    height: 56,
    borderRadius: 2,
  },
  "& .MuiSelect-select": {
    display: "flex",
    alignItems: "center",
    padding: "12px 14px",
  },
  "& .MuiInputLabel-root": {
    fontWeight: 500,
  },
};

type ProductQuery = {
  metal: string;
  itemName: string;
  design: string;
  size: string;
  weightRange: string;
};

type StockProduct = {
  stockProductId: number;
  metal: string;
  itemName: string;
  design: number | string;
  size: number | string;
  metal_weight: number;
  stone_weight: number;
  stone_amount: number;
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
  stock?: number;
  barcodeValue?: string;
  barcodeImageBase64?: string;
};

type ProductForm = {
  metal: string;
  metalPrice: string;
  itemName: string;
  design: string;
  size: string;
  metal_weight: string;
  wastage: string;
  making_charges: string;
  stone_weight: string;
  stone_amount: string;
  diamond_weight: string;
  diamond_amount: string;
  bits_weight: string;
  bits_amount: string;
  enamel_weight: string;
  enamel_amount: string;
  pearls_weight: string;
  pearls_amount: string;
  other_weight: string;
  other_amount: string;
  stock: string;
  gross_weight: string; // auto (metal_weight + stone_weight)
  total_item_amount: string;
};

/* ---------- Helpers ---------- */
const labelize = (k: string) =>
  k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const toNum = (s: string) => (s.trim() === "" ? 0 : Number(s));

/* ---------- Initial State ---------- */
const initialQuery: ProductQuery = {
  metal: "",
  itemName: "",
  design: "",
  size: "",
  weightRange: "",
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
  stone_amount: "",
  diamond_weight: "",
  diamond_amount: "",
  bits_weight: "",
  bits_amount: "",
  enamel_weight: "",
  enamel_amount: "",
  pearls_weight: "",
  pearls_amount: "",
  other_weight: "",
  other_amount: "",
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
  "stone_weight", // added because gross depends on it
  "total_item_amount",
];

const numericKeys: (keyof ProductForm)[] = [
  "metalPrice",
  "metal_weight",
  "wastage",
  "making_charges",
  "stone_weight",
  "stone_amount",
  "diamond_weight",
  "diamond_amount",
  "bits_weight",
  "bits_amount",
  "enamel_weight",
  "enamel_amount",
  "pearls_weight",
  "pearls_amount",
  "other_weight",
  "other_amount",
  "stock",
  "gross_weight",
  "total_item_amount",
];

/* ============================ Component ============================ */
const Products: React.FC = () => {
  /* --------- SEARCH (top) --------- */
  const [q, setQ] = useState<ProductQuery>(initialQuery);
  const [topLoading, setTopLoading] = useState(false);
  const [topResults, setTopResults] = useState<StockProduct[] | null>(null);

  // inline edit for stock in top results
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [savingId, setSavingId] = useState<number | null>(null);

  const [totalStock, setTotalStock] = useState<number>(0);

  // controls visibility of the Products form
  const [showProductForm, setShowProductForm] = useState(false);

  const onQChange =
    (k: keyof ProductQuery) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setQ((p) => ({ ...p, [k]: e.target.value }));

  const addProductStock = async () => {
    setShowProductForm(true);
  };

  const searchTop = async () => {
    // If any field missing → open the form instead
    if (Object.values(q).some((v) => !v.trim())) {
      alert("Please fill all search fields (or add the product below).");
      setTopResults(null);
      setShowProductForm(true);
      return;
    }

    try {
      const range = q.weightRange.trim();

      const [minStr, maxStr] = range.split("-");
      const min: number = parseInt(minStr, 10);
      const max: number = parseInt(maxStr, 10);

      console.log(min); // 10
      console.log(max); // 20
      setTopLoading(true);
      const token = localStorage.getItem("token") ?? "";
      const url = `${API_BASE}/admin/getStockProduct/${encodeURIComponent(
        q.metal.trim()
      )}/${encodeURIComponent(q.itemName.trim())}/${encodeURIComponent(
        q.design.trim()
      )}/${q.size.trim()}/${min}/${max}`;

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

      const data = await res.json();
      setTotalStock(data.totalStock);
      const list = Array.isArray(data.products) ? data.products : [];
      if (list.length) {
        setTopResults(list);
        setShowProductForm(false);
        alert("Found!");
      } else {
        alert("No data found.");
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

  const saveStock = async (row: StockProduct) => {
    if (editValue.trim() === "") {
      alert("Please enter a stock value.");
      return;
    }
    const newStock = Number(editValue.trim());
    if (Number.isNaN(newStock)) {
      alert("Stock must be a number.");
      return;
    }
    if (newStock == 0) {
      alert("please enter a Non Zero Number to add.");
      return;
    }
    const current = Number(row.stock ?? 0);
    //const newTotal = current + newStock;

    try {
      setSavingId(row.stockProductId);
      const token = localStorage.getItem("token") ?? "";
      const res = await fetch(
        `${API_BASE}/admin/addStockCount/${
          row.stockProductId
        }?stock=${encodeURIComponent(String(newStock))}`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("Update stock failed:", txt);
        alert("Failed to update stock.");
        return;
      }
      let newTotal = current + newStock;
      try {
        const data = await res.json();
        // accept number or { stock: X } / { newStock: X } / { count: X }
        if (typeof data === "number") newTotal = Number(data);
        else if (data && (data.stock ?? data.newStock ?? data.count) != null) {
          newTotal = Number(data.stock ?? data.newStock ?? data.count);
        }
      } catch {
        // response might be empty; keep computed newTotal
      }

      setTopResults((prev) =>
        prev
          ? prev.map((p) =>
              p.stockProductId === row.stockProductId
                ? { ...p, stock: newTotal }
                : p
            )
          : prev
      );

      setEditingId(null);
      setEditValue("");
    } catch (e) {
      console.error(e);
      alert("Something went wrong while updating.");
    } finally {
      setSavingId(null);
    }
  };

  /* --------- PRODUCTS form (bottom) --------- */
  const [product, setProduct] = useState<ProductForm>(initialProduct);
  const [errors, setErrors] = useState<
    Partial<Record<keyof ProductForm, string>>
  >({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Table B (shown only after a successful submit)
  const [bottomResults, setBottomResults] = useState<StockProduct[] | null>(
    null
  );
  const [bottomLoading, setBottomLoading] = useState(false);

  const onProductChange =
    (k: keyof ProductForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setProduct((prev) => {
        const next = { ...prev, [k]: val };

        // Auto-calc gross_weight = metal_weight + stone_weight
        if (k === "metal_weight" || k === "stone_weight") {
          const mw = toNum(k === "metal_weight" ? val : next.metal_weight);
          const sw = toNum(k === "stone_weight" ? val : next.stone_weight);
          next.gross_weight =
            Number.isNaN(mw) || Number.isNaN(sw) ? "" : String(mw + sw);
        }
        return next;
      });

      if (errors[k]) setErrors((prev) => ({ ...prev, [k]: undefined }));
    };

  const validateProduct = () => {
    const e: Partial<Record<keyof ProductForm, string>> = {};
    requiredProductKeys.forEach((k) => {
      if (!product[k].trim()) e[k] = "Required";
    });
    numericKeys.forEach((k) => {
      const v = product[k].trim();
      if (v !== "" && Number.isNaN(Number(v))) e[k] = "Invalid number";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProduct()) {
      alert("Please fill the required fields.");
      return;
    }

    // numeric payload
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
      stone_amount: toNum(product.stone_amount),
      diamond_weight: toNum(product.diamond_weight),
      diamond_amount: toNum(product.diamond_amount),
      bits_weight: toNum(product.bits_weight),
      bits_amount: toNum(product.bits_amount),
      enamel_weight: toNum(product.enamel_weight),
      enamel_amount: toNum(product.enamel_amount),
      pearls_weight: toNum(product.pearls_weight),
      pearls_amount: toNum(product.pearls_amount),
      other_weight: toNum(product.other_weight),
      other_amount: toNum(product.other_amount),
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
      const data: StockProduct | StockProduct[] = await res.json();
      setBottomResults(Array.isArray(data) ? data : [data]);
      // await fetchBottomTable(); // show Table B rows
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
          {/* Metal (select) */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              label="Metal"
              value={q.metal}
              onChange={onQChange("metal")}
              fullWidth
              sx={prettySelectSx}
              InputLabelProps={{ shrink: true }}
              SelectProps={{
                displayEmpty: true,
                renderValue: (val) =>
                  val ? (
                    (val as string)
                  ) : (
                    <span style={{ color: "#9aa0a6" }}>Select metal</span>
                  ),
                MenuProps: {
                  PaperProps: { sx: { borderRadius: 2, maxHeight: 320 } },
                },
              }}
            >
              <MenuItem value="">
                <em>Select Metal</em>
              </MenuItem>
              <MenuItem value="Gold">Gold</MenuItem>
              <MenuItem value="Silver">Silver</MenuItem>
            </TextField>
          </Grid>

          {/* ItemName (select depends on metal) */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              label="ItemName"
              value={q.itemName}
              onChange={onQChange("itemName")}
              fullWidth
              sx={prettySelectSx}
              InputLabelProps={{ shrink: true }}
              disabled={!q.metal}
              SelectProps={{
                displayEmpty: true,
                renderValue: (val) =>
                  val ? (
                    (val as string)
                  ) : (
                    <span style={{ color: "#9aa0a6" }}>Select item</span>
                  ),
                MenuProps: {
                  PaperProps: { sx: { borderRadius: 2, maxHeight: 320 } },
                },
              }}
            >
              <MenuItem value="">
                <em>Select Item</em>
              </MenuItem>
              {(q.metal.toLowerCase() === "gold"
                ? goldItems
                : q.metal.toLowerCase() === "silver"
                ? silverItems
                : []
              ).map((it) => (
                <MenuItem key={it} value={it}>
                  {it}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Design */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Design"
              value={q.design}
              onChange={onQChange("design")}
              fullWidth
            />
          </Grid>

          {/* Size */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Size"
              type="number"
              inputProps={{ step: "any" }}
              value={q.size}
              onChange={onQChange("size")}
              fullWidth
            />
          </Grid>

          {/* Weight */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              label="Weight Range"
              value={q.weightRange}
              onChange={onQChange("weightRange")}
              fullWidth
              sx={prettySelectSx}
              InputLabelProps={{ shrink: true }}
              SelectProps={{
                displayEmpty: true,
                renderValue: (val) =>
                  val ? (
                    (val as string)
                  ) : (
                    <span style={{ color: "#9aa0a6" }}>
                      Select Weight Range
                    </span>
                  ),
                MenuProps: {
                  PaperProps: { sx: { borderRadius: 2, maxHeight: 320 } },
                },
              }}
            >
              <MenuItem value="">
                <em>Select Weight Range</em>
              </MenuItem>
              <MenuItem value="0-10"> 0-10 </MenuItem>
              <MenuItem value="10-20">10-20</MenuItem>
              <MenuItem value="20-30">20-30</MenuItem>
              <MenuItem value="30-40">30-40</MenuItem>
              <MenuItem value="40-50">40-50</MenuItem>
              <MenuItem value="50-60">50-60</MenuItem>
              <MenuItem value="60-70">60-70</MenuItem>
              <MenuItem value="70-80">70-80</MenuItem>
              <MenuItem value="80-90">80-90</MenuItem>
              <MenuItem value="90-100">90-100</MenuItem>
            </TextField>
          </Grid>

          {totalStock > 0 && (
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Total Stock"
                value={totalStock}
                fullWidth
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
          )}
        </Grid>

        <Box display="flex" justifyContent="flex-end" mt={3}>
          <Button
            variant="contained"
            onClick={searchTop}
            disabled={topLoading}
            sx={{ minWidth: 120 }} // <- margin-left to add space
          >
            {topLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Search"
            )}
          </Button>
          <Button
            variant="contained"
            onClick={addProductStock}
            disabled={topLoading}
            sx={{ minWidth: 120, ml: 2 }}
          >
            {topLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Add Product"
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
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {topResults.map((p) => {
                const isEditing = editingId === p.stockProductId;
                return (
                  <TableRow key={p.stockProductId}>
                    <TableCell>{p.stockProductId}</TableCell>
                    <TableCell>{p.metal}</TableCell>
                    <TableCell>{p.itemName}</TableCell>
                    <TableCell>{p.design}</TableCell>
                    <TableCell>{p.size}</TableCell>
                    <TableCell>{p.metal_weight}</TableCell>
                    <TableCell>{p.stock ?? "-"}</TableCell>
                    <TableCell>
                      {!isEditing ? (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setEditingId(p.stockProductId);
                            setEditValue(String(p.stock ?? ""));
                          }}
                        >
                          Edit Stock
                        </Button>
                      ) : (
                        <Box display="flex" gap={1} alignItems="center">
                          <TextField
                            size="small"
                            type="number"
                            inputProps={{ step: "any" }}
                            placeholder="+ amount"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            sx={{ maxWidth: 120 }}
                          />
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => saveStock(p)}
                            disabled={savingId === p.stockProductId}
                          >
                            {savingId === p.stockProductId ? "Saving…" : "Save"}
                          </Button>
                          <Button
                            size="small"
                            onClick={() => {
                              setEditingId(null);
                              setEditValue("");
                            }}
                          >
                            Cancel
                          </Button>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
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

            <Grid container spacing={2}>
              {/* Metal select */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  label="Metal"
                  value={product.metal}
                  onChange={onProductChange("metal")}
                  fullWidth
                  sx={prettySelectSx}
                  InputLabelProps={{ shrink: true }}
                  SelectProps={{
                    displayEmpty: true,
                    renderValue: (val) =>
                      val ? (
                        (val as string)
                      ) : (
                        <span style={{ color: "#9aa0a6" }}>Select metal</span>
                      ),
                  }}
                >
                  <MenuItem value="">
                    <em>Select Metal</em>
                  </MenuItem>
                  <MenuItem value="Gold">Gold</MenuItem>
                  <MenuItem value="Silver">Silver</MenuItem>
                </TextField>
              </Grid>

              {/* ItemName select (depends on metal) */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  label="ItemName"
                  value={product.itemName}
                  onChange={onProductChange("itemName")}
                  fullWidth
                  sx={prettySelectSx}
                  InputLabelProps={{ shrink: true }}
                  disabled={!product.metal}
                  SelectProps={{
                    displayEmpty: true,
                    renderValue: (val) =>
                      val ? (
                        (val as string)
                      ) : (
                        <span style={{ color: "#9aa0a6" }}>Select item</span>
                      ),
                  }}
                >
                  <MenuItem value="">
                    <em>Select Item</em>
                  </MenuItem>
                  {(product.metal.toLowerCase() === "gold"
                    ? goldItems
                    : product.metal.toLowerCase() === "silver"
                    ? silverItems
                    : []
                  ).map((it) => (
                    <MenuItem key={it} value={it}>
                      {it}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* MetalPrice */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="MetalPrice"
                  type="number"
                  inputProps={{ step: "any" }}
                  value={product.metalPrice}
                  onChange={onProductChange("metalPrice")}
                  fullWidth
                  error={!!errors.metalPrice}
                  helperText={errors.metalPrice || ""}
                />
              </Grid>

              {/* Design */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Design"
                  value={product.design}
                  onChange={onProductChange("design")}
                  fullWidth
                  error={!!errors.design}
                  helperText={errors.design || ""}
                />
              </Grid>

              {/* Size */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Size"
                  type="number"
                  inputProps={{ step: "any" }}
                  value={product.size}
                  onChange={onProductChange("size")}
                  fullWidth
                  error={!!errors.size}
                  helperText={errors.size || ""}
                />
              </Grid>

              {/* Metal Weight */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Metal Weight"
                  type="number"
                  inputProps={{ step: "any" }}
                  value={product.metal_weight}
                  onChange={onProductChange("metal_weight")}
                  fullWidth
                  error={!!errors.metal_weight}
                  helperText={errors.metal_weight || ""}
                />
              </Grid>

              {/* Wastage */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Wastage"
                  type="number"
                  inputProps={{ step: "any" }}
                  value={product.wastage}
                  onChange={onProductChange("wastage")}
                  fullWidth
                />
              </Grid>

              {/* Making Charges */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Making Charges"
                  type="number"
                  inputProps={{ step: "any" }}
                  value={product.making_charges}
                  onChange={onProductChange("making_charges")}
                  fullWidth
                />
              </Grid>

              {/* Stone Weight */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Stone Weight"
                  type="number"
                  inputProps={{ step: "any" }}
                  value={product.stone_weight}
                  onChange={onProductChange("stone_weight")}
                  fullWidth
                  error={!!errors.stone_weight}
                  helperText={errors.stone_weight || ""}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Stone Amount"
                  type="number"
                  inputProps={{ step: "any" }}
                  value={product.stone_amount}
                  onChange={onProductChange("stone_amount")}
                  fullWidth
                  error={!!errors.stone_amount}
                  helperText={errors.stone_amount || ""}
                />
              </Grid>

              {/* Diamond Weight */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Diamond Weight"
                  type="number"
                  inputProps={{ step: "any" }}
                  value={product.diamond_weight}
                  onChange={onProductChange("diamond_weight")}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Diamond Amount"
                  type="number"
                  inputProps={{ step: "any" }}
                  value={product.diamond_amount}
                  onChange={onProductChange("diamond_amount")}
                  fullWidth
                  error={!!errors.diamond_amount}
                  helperText={errors.diamond_amount || ""}
                />
              </Grid>

              {/* Bits Weight */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Bits Weight"
                  type="number"
                  inputProps={{ step: "any" }}
                  value={product.bits_weight}
                  onChange={onProductChange("bits_weight")}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Bits Amount"
                  type="number"
                  inputProps={{ step: "any" }}
                  value={product.bits_amount}
                  onChange={onProductChange("bits_amount")}
                  fullWidth
                  error={!!errors.bits_amount}
                  helperText={errors.bits_amount || ""}
                />
              </Grid>

              {/* Enamel Weight */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Enamel Weight"
                  type="number"
                  inputProps={{ step: "any" }}
                  value={product.enamel_weight}
                  onChange={onProductChange("enamel_weight")}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Enamel Amount"
                  type="number"
                  inputProps={{ step: "any" }}
                  value={product.enamel_amount}
                  onChange={onProductChange("enamel_amount")}
                  fullWidth
                  error={!!errors.enamel_amount}
                  helperText={errors.enamel_amount || ""}
                />
              </Grid>

              {/* Pearls Weight */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Pearls Weight"
                  type="number"
                  inputProps={{ step: "any" }}
                  value={product.pearls_weight}
                  onChange={onProductChange("pearls_weight")}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Pearls Amount"
                  type="number"
                  inputProps={{ step: "any" }}
                  value={product.pearls_amount}
                  onChange={onProductChange("pearls_amount")}
                  fullWidth
                  error={!!errors.pearls_amount}
                  helperText={errors.pearls_amount || ""}
                />
              </Grid>

              {/* Other Weight */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Other Weight"
                  type="number"
                  inputProps={{ step: "any" }}
                  value={product.other_weight}
                  onChange={onProductChange("other_weight")}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Other Amount"
                  type="number"
                  inputProps={{ step: "any" }}
                  value={product.other_amount}
                  onChange={onProductChange("other_amount")}
                  fullWidth
                  error={!!errors.other_amount}
                  helperText={errors.other_amount || ""}
                />
              </Grid>

              {/* Stock */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Stock"
                  type="number"
                  inputProps={{ step: "any" }}
                  value={product.stock}
                  onChange={onProductChange("stock")}
                  fullWidth
                />
              </Grid>

              {/* Gross Weight (auto) */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Gross Weight (auto)"
                  type="number"
                  inputProps={{ step: "any" }}
                  value={product.gross_weight}
                  onChange={onProductChange("gross_weight")}
                  fullWidth
                  disabled
                />
              </Grid>

              {/* Total Item Amount */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Total Item Amount"
                  type="number"
                  inputProps={{ step: "any" }}
                  value={product.total_item_amount}
                  onChange={onProductChange("total_item_amount")}
                  fullWidth
                  error={!!errors.total_item_amount}
                  helperText={errors.total_item_amount || ""}
                />
              </Grid>
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
                  <TableCell>Gross Weight</TableCell>
                  <TableCell>Metal Weight</TableCell>
                  {bottomResults?.[0] &&
                    possibleWeightKeys.map((key) => {
                      const val = bottomResults[0][key as keyof StockProduct];
                      return typeof val === "number" && val > 0 ? (
                        <TableCell key={key}>{labelize(key)}</TableCell>
                      ) : null;
                    })}
                  <TableCell>Barcode Value</TableCell>
                  <TableCell>Barcode Image</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bottomResults.map((r) => (
                  <TableRow key={r.stockProductId}>
                    <TableCell>{r.stockProductId}</TableCell>
                    <TableCell>{r.gross_weight}</TableCell>
                    <TableCell>{r.metal_weight}</TableCell>
                    {possibleWeightKeys.map((key) => {
                      const val = r[key as keyof StockProduct];
                      return typeof val === "number" && val > 0 ? (
                        <TableCell key={key}>{val}</TableCell>
                      ) : null;
                    })}
                    <TableCell>{r.barcodeValue ?? "-"}</TableCell>
                    <TableCell>
                      {r.barcodeImageBase64 ? (
                        <img
                          alt="barcode"
                          src={`data:image/png;base64,${r.barcodeImageBase64}`}
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
