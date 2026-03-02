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
import api from "@/services/api";
import { useWorkers } from "@/contexts/WorkersContext";

const goldItems = [
  "Batuvu",
  "One Stone Pulla",
  "Gundu Pulla",
  "3-Pujala Pulla",
  "Sridevi Pulla",
  "Sadha J-Pulla",
  "Sadha Nose Ring",
  "J-Stone Pulla",
  "Fancy Pulla",
  "Chandravanka Pulla",
  "Kamma Pulla",
  "Muthyam Pulla",
  "Pressing One Stone Pulla",
  "Pressing Gundu Pulla",
  "Kammalu",
  "Chand Bali Kammalu",
  "Stone Kammalu",
  "Sherlu Kammalu",
  "Pogulu",
  "Mukku Pogu",
  "Sadha Mukku Pogu",
  "Earring",
  "Earring Small",
  "Fancy Earring",
  "Jhumkas",
  "Sadha Vanku",
  "Stone Vanku",
  "Studs",
  "Laxmi Devi Puste",
  "Andhra Puste",
  "Gante Puste",
  "Thirmandhar Puste",
  "Silva Puste",
  "Fancy Puste",
  "House Puste",
  "Chaknam Puste",
  "Matilu",
  "Matilu Small",
  "Matilu Big",
  "Pusthela Thadu",
  "Kadiyam",
  "Ladies Ring",
  "Men Ring",
  "Fancy Ring",
  "Fancy Baby Ring",
  "Bracelet H.M",
  "Bracelet M.M",
  "Necklace",
  "Nallapusalu Chain",
  "7 piece Necklace",
  "Chain",
  "Gundla Mala",
  "Gundlu Yannalu",
  "Design Gundlu",
  "Champaswaralu",
  "Long Haram",
  "Short Haram",
  "Locket",
  "Bangle",
  "kankanalu",
  "Baby Bangle",
  "Papidi Billa",
  "God Idol",
  "God Mokkulu",
  "Gold 24 Biscuit",
  "Gold 22 Biscuit",
  "Other",
];

const silverItems = [
  "Vottulu",
  "Pilenlu",
  "Batuvu",
  "Mettelu",
  "Spring Mettelu",
  "Jali Mettelu",
  "Bracelet H.M",
  "Bracelet M.M",
  "Chain H.M",
  "Chain M.M",
  "Kathi Billa",
  "Nalla Pusala Danda ",
  "Ladies Ring",
  "Men Ring",
  "Small Ring",
  "Fancy Ring",
  "Fancy Baby Ring",
  "Kadiyam",
  "Bedi",
  "Small Kadiyam",
  "Sadan Kadiyam",
  "Billa Kadiyam",
  "Bongu Kadiyam",
  "R.D Kadam",
  "Ragi Kadiyam",
  "Kadiyal Plain",
  "Bolgajal Kadiyal",
  "R.D Sadan Kadiyal",
  "Pattilu",
  "Bolgajal Pattilu",
  "Single Chain Pattilu",
  "Fancy Pattilu",
  "Pusala Pattilu",
  "Jaler Pattilu",
  "S-Patagolsu",
  "Nadumu Golusu",
  "Chekkudu Gutti - HM",
  "Chekkudu Gutti - MM",
  "Locket",
  "Bangle",
  "Baby Bangle",
  "Uyyala",
  "God Idol",
  "God Mokkulu",
  "Ashtalakshmi Kalash",
  "Tulsi",
  "Deepam",
  "Flowers",
  "Kamakshi Deepam",
  "Panchapali",
  "Chemmalu",
  "Small Deepam Plates",
  "Kumkum Bharani",
  "Kalash",
  "Ganta",
  "Plates",
  "Glass",
  "Bowls",
  "Spoons",
  "Glass & Bowls",
  "Glass & Spoons",
  "Bowls & Spoons",
  "Plates & Bowls",
  "Plates & Spoons",
  "Plates & Glass",
  "Plates & Glass & Spoons",
  "Plates & Bowls & Spoons",
  "Plates & Glass & Bowls",
  "Plates & Glass & Bowls & Spoons",
  "Silver Biscuit",
  "Other",
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
  catalogue: string;
  design: string;
  size: string;
  weightRange: string;
};

type StockProduct = {
  stockProductId: number;
  metal: string;
  itemName: string;
  catalogue: string;
  design: number | string;
  size: number | string;
  metal_weight: number;
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
  stock?: number;
  stockBox: string;
  linkWorker?: string;
  barcodeValue?: string;
  itemCode?: string;
  barcodeImageBase64?: string;
};

interface StockProductResponse {
  totalStock: number;
  products: StockProduct[];
}

type StockApiResponse =
  | number
  | {
      stock?: number;
      newStock?: number;
      count?: number;
    };

type ProductForm = {
  metal: string;
  itemName: string;
  catalogue: string;
  design: string;
  size: string;
  metal_weight: string;
  wastage: string;
  making_charges: string;
  stone_weight: string;
  stone_rate: string;
  stone_amount: string;
  wax_weight: string;
  wax_rate: string;
  wax_amount: string;
  diamond_weight: string;
  diamond_rate: string;
  diamond_amount: string;
  bits_weight: string;
  bits_rate: string;
  bits_amount: string;
  enamel_weight: string;
  enamel_rate: string;
  enamel_amount: string;
  pearls_weight: string;
  pearls_rate: string;
  pearls_amount: string;
  other_weight: string;
  other_rate: string;
  other_amount: string;
  stock: string;
  stockBox: string;
  linkWorker?: string;
  gross_weight: string; // auto (metal_weight + stone_weight)
};

/* ---------- Initial State ---------- */
const initialQuery: ProductQuery = {
  metal: "",
  itemName: "",
  catalogue: "",
  design: "",
  size: "",
  weightRange: "",
};

const initialProduct: ProductForm = {
  metal: "",
  itemName: "",
  catalogue: "",
  design: "",
  size: "",
  metal_weight: "",
  wastage: "",
  making_charges: "",
  stone_weight: "",
  stone_rate: "",
  stone_amount: "",
  wax_weight: "",
  wax_rate: "",
  wax_amount: "",
  diamond_weight: "",
  diamond_rate: "",
  diamond_amount: "",
  bits_weight: "",
  bits_rate: "",
  bits_amount: "",
  enamel_weight: "",
  enamel_rate: "",
  enamel_amount: "",
  pearls_weight: "",
  pearls_rate: "",
  pearls_amount: "",
  other_weight: "",
  other_rate: "",
  other_amount: "",
  stock: "",
  stockBox: "",
  linkWorker: "",
  gross_weight: "",
};

const requiredProductKeys: (keyof ProductForm)[] = [
  "metal",
  "itemName",
  "catalogue",
  "design",
  "size",
  "metal_weight",
];

export interface SpeclWorkRequest {
  itemName: string;
  metal: string;
  workerMetalWeight: number;
  otherMetalName: string;
  otherWeight: number;
  amount: number;
  wastage: number;
  itemLinkCode: string;
}

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
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | "">("");
  const { workers, invalidate, refresh } = useWorkers();

  // controls visibility of the Products form
  const [showProductForm, setShowProductForm] = useState(false);

  const onQChange =
    (k: keyof ProductQuery) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setQ((p) => ({ ...p, [k]: e.target.value }));

  const addProductStock = async () => {
    setShowProductForm(true);
  };

  const [spclWork, setSpclWork] = useState<SpeclWorkRequest>({
    itemName: "",
    metal: "",
    workerMetalWeight: 0,
    otherMetalName: "",
    otherWeight: 0,
    amount: 0,
    wastage: 0,
    itemLinkCode: "",
  });

  const handleChange =
    (field: keyof SpeclWorkRequest) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setSpclWork({ ...spclWork, [field]: e.target.value });
    };

  const handleSelect = (field: keyof SpeclWorkRequest) => (e: any) => {
    setSpclWork({ ...spclWork, [field]: e.target.value });
  };

  const handleWorkAdding = async () => {
    if (!selectedWorkerId) {
      alert("Please select a worker.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const requestBody = {
        itemName: spclWork.itemName,
        metal: spclWork.metal,
        workerMetalWeight: parseFloat(spclWork.workerMetalWeight.toString()),
        otherMetalName: spclWork.otherMetalName.toString(),
        otherWeight: parseFloat(spclWork.otherWeight.toString()),
        amount: parseFloat(spclWork.amount.toString()),
        wastage: parseFloat(spclWork.wastage.toString()),
        itemLinkCode: spclWork.itemLinkCode,
      };

      console.log("requestBody", JSON.stringify(requestBody));

      const res = await api.post(
        `/admin/addSpeclWork/${selectedWorkerId}`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = res.data;
      console.log("API result:", result);

      await invalidate();
      await refresh();

      // optional: clear form
      setSpclWork({
        itemName: "",
        metal: "",
        workerMetalWeight: 0,
        otherMetalName: "",
        otherWeight: 0,
        amount: 0,
        wastage: 0,
        itemLinkCode: "",
      });
      setSelectedWorkerId("");
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error submitting lot work:", error.message);
      } else {
        console.error("Unexpected error:", error);
        alert("Failed to submit lot work.");
      }
    }
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
      const min = parseInt(minStr, 10);
      const max = parseInt(maxStr, 10);

      setTopLoading(true);
      const token = localStorage.getItem("token") ?? "";

      // ✅ axios auto-prepends VITE_API_URL
      const url = `/admin/getStockProduct/${encodeURIComponent(
        q.metal.trim(),
      )}/${encodeURIComponent(q.itemName.trim())}/${encodeURIComponent(
        q.catalogue.trim(),
      )}/${encodeURIComponent(q.design.trim())}/${q.size.trim()}/${min}/${max}`;

      const res = await api.get<StockProductResponse>(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const data = res.data;
      setTotalStock(data.totalStock);

      const list = Array.isArray(data.products) ? data.products : [];
      if (list.length) {
        setTopResults(list);
        setShowProductForm(false);
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
    if (newStock === 0) {
      alert("Please enter a non-zero number to add.");
      return;
    }

    const current = Number(row.stock ?? 0);

    try {
      setSavingId(row.stockProductId);

      const token = localStorage.getItem("token") ?? "";

      const response = await api.post<StockApiResponse>(
        `/admin/addStockCount/${row.stockProductId}`,
        null, // no body
        {
          params: { stock: newStock },
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      );

      let newTotal = current + newStock;

      const data = response.data;

      if (typeof data === "number") {
        newTotal = data;
      } else if (data && typeof data === "object") {
        newTotal = Number(
          data.stock ?? data.newStock ?? data.count ?? newTotal,
        );
      }

      setTopResults((prev) =>
        prev
          ? prev.map((p) =>
              p.stockProductId === row.stockProductId
                ? { ...p, stock: newTotal }
                : p,
            )
          : prev,
      );

      setEditingId(null);
      setEditValue("");
    } catch (err) {
      if (err instanceof Error) {
        console.error("Stock update failed:", err.message);
      } else {
        console.error("Stock update failed:", err);
      }
      alert("Something went wrong while updating.");
    } finally {
      setSavingId(null);
    }
  };
  /* --------- PRODUCTS form (bottom) --------- */
  const [errors, setErrors] = useState<
    Partial<Record<keyof ProductForm, string>>
  >({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Table B (shown only after a successful submit)
  const [bottomResults, setBottomResults] = useState<StockProduct[] | null>(
    null,
  );

  const validateProduct = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    for (const key of requiredProductKeys) {
      const value = product[key];

      if (!value || String(value).trim() === "") {
        newErrors[key] = "Required";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProduct()) {
      alert("Please fill the required fields.");
      return;
    }

    const safeNum = (val: any) =>
      val === null || val === undefined || val === "" ? 0 : Number(val);

    const payload = {
      metal: product.metal.trim(),
      itemName: product.itemName.trim(),
      catalogue: product.catalogue.trim(),
      design: product.design.trim(),
      size: product.size.trim(),
      metal_weight: safeNum(product.metal_weight),
      wastage: safeNum(product.wastage),
      making_charges: safeNum(product.making_charges),

      // Gems (defaults to 0 if empty)
      stone_weight: safeNum(product.stone_weight),
      stone_rate: safeNum(product.stone_rate),
      stone_amount: safeNum(product.stone_amount),

      wax_weight: safeNum(product.wax_weight),
      wax_rate: safeNum(product.wax_rate),
      wax_amount: safeNum(product.wax_amount),

      diamond_weight: safeNum(product.diamond_weight),
      diamond_rate: safeNum(product.diamond_rate),
      diamond_amount: safeNum(product.diamond_amount),

      bits_weight: safeNum(product.bits_weight),
      bits_rate: safeNum(product.bits_rate),
      bits_amount: safeNum(product.bits_amount),

      enamel_weight: safeNum(product.enamel_weight),
      enamel_rate: safeNum(product.enamel_rate),
      enamel_amount: safeNum(product.enamel_amount),

      pearls_weight: safeNum(product.pearls_weight),
      pearls_rate: safeNum(product.pearls_rate),
      pearls_amount: safeNum(product.pearls_amount),

      other_weight: safeNum(product.other_weight),
      other_rate: safeNum(product.other_rate),
      other_amount: safeNum(product.other_amount),

      stock: safeNum(product.stock),
      stockBox: product.stockBox.trim(),
      linkWorker: product.linkWorker?.trim(),
      gross_weight: safeNum(product.gross_weight),
    };

    try {
      setSubmitLoading(true);
      const token = localStorage.getItem("token") ?? "";

      console.log("Request Body:", payload);

      const res = await api.post<StockProduct | StockProduct[]>(
        "/admin/addStockProduct",
        payload,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        },
      );
      const data = res.data;
      setBottomResults(Array.isArray(data) ? data : [data]);
      setProduct(initialProduct);
      setErrors({});
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Add product failed:", err.message);
      } else {
        console.error("Add product failed:", err);
      }
      alert("Something went wrong while submitting.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // --- Utility functions ---
  const toNum = (v: string | number | undefined): number => {
    const n = Number(v);
    return !isNaN(n) && n > 0 ? n : 0;
  };

  const calculateAmount = (weight: number, rate: number): number => {
    if (weight <= 0 || rate <= 0) return 0;
    return weight * 5 * rate;
  };

  // --- State ---
  const [product, setProduct] = useState<ProductForm>(initialProduct);

  // --- Handler for normal product fields ---
  const onProductChange =
    (k: keyof ProductForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;

      setProduct((prev) => {
        const next = { ...prev, [k]: val };

        // whenever weight fields update, recalc gross weight
        next.gross_weight = String(calcGrossWeight(next));
        return next;
      });
    };

  // --- Handler for materials with weight & rate ---
  const handleMaterialChange = (
    material:
      | "stone"
      | "bits"
      | "diamond"
      | "enamel"
      | "pearls"
      | "wax"
      | "other",
    field: "weight" | "rate",
    value: string,
  ) => {
    setProduct((prev) => {
      const next = { ...prev };

      // update weight or rate
      next[`${material}_${field}` as keyof ProductForm] = value;

      // recalc amount for that material
      const weight = toNum(next[`${material}_weight` as keyof ProductForm]);
      const rate = toNum(next[`${material}_rate` as keyof ProductForm]);
      const amount = calculateAmount(weight, rate);

      next[`${material}_amount` as keyof ProductForm] = String(amount);

      // recalc gross weight
      next.gross_weight = String(calcGrossWeight(next));

      return next;
    });
  };

  // --- Gross weight calculator ---
  const calcGrossWeight = (p: ProductForm): number => {
    return (
      toNum(p.metal_weight) +
      toNum(p.stone_weight) +
      toNum(p.bits_weight) +
      toNum(p.diamond_weight) +
      toNum(p.enamel_weight) +
      toNum(p.pearls_weight) +
      toNum(p.other_weight) +
      toNum(p.wax_weight)
    );
  };

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
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
              <MenuItem value="24 Gold">24 Gold</MenuItem>
              <MenuItem value="22 Gold">22 Gold</MenuItem>
              <MenuItem value="999 Silver">999 Silver</MenuItem>
              <MenuItem value="995 Silver">995 Silver</MenuItem>
            </TextField>
          </Grid>

          {/* ItemName (select depends on metal) */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
              {(q.metal.toLowerCase() === "24 gold" ||
              q.metal.toLowerCase() === "22 gold"
                ? goldItems
                : q.metal.toLowerCase() === "999 silver" ||
                    q.metal.toLocaleLowerCase() === "995 silver"
                  ? silverItems
                  : []
              ).map((it) => (
                <MenuItem key={it} value={it}>
                  {it}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              select
              label="catalogue"
              value={q.catalogue}
              onChange={onQChange("catalogue")}
              fullWidth
              sx={prettySelectSx}
              InputLabelProps={{ shrink: true }}
              SelectProps={{
                displayEmpty: true,
                renderValue: (val) =>
                  val ? (
                    (val as string)
                  ) : (
                    <span style={{ color: "#9aa0a6" }}>Select Catalogue</span>
                  ),
                MenuProps: {
                  PaperProps: { sx: { borderRadius: 2, maxHeight: 320 } },
                },
              }}
            >
              <MenuItem value="">
                <em>Select Catalogue</em>
              </MenuItem>
              <MenuItem value="Royal Gold">Royal Gold</MenuItem>
              <MenuItem value="Star">Star</MenuItem>
              <MenuItem value="SSP">SSP</MenuItem>
              <MenuItem value="Navkar">Navkar</MenuItem>
              <MenuItem value="Vardhaman">Vardhaman</MenuItem>
              <MenuItem value="MJR">MJR</MenuItem>
              <MenuItem value="MDC">MDC</MenuItem>
              <MenuItem value="SWM">SWM</MenuItem>
              <MenuItem value="OSS">OSS</MenuItem>
              <MenuItem value="Gold Works">Gold Works</MenuItem>
              <MenuItem value="Sri Mondal Jewels">Sri Mondal Jewels</MenuItem>
              <MenuItem value="SK Jewels">SK Jewels</MenuItem>
              <MenuItem value="Navratan Collection">
                Navratan Collection
              </MenuItem>
              <MenuItem value="Tops Collection">Tops Collection</MenuItem>
              <MenuItem value="Jhumkhi Collection">Tops Collection</MenuItem>
              <MenuItem value="Royal Ringtone">Royal Ringtone</MenuItem>
              <MenuItem value="Gold Bond">Gold Bond</MenuItem>
              <MenuItem value="Shree Viswakarma">Shree Viswakarma</MenuItem>
              <MenuItem value="Self">Self</MenuItem>
            </TextField>
          </Grid>

          {/* Design */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              label="Design"
              value={q.design}
              onChange={onQChange("design")}
              fullWidth
            />
          </Grid>

          {/* Size */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              label="Size"
              type="number"
              value={q.size}
              onChange={onQChange("size")}
              inputProps={{
                step: "any",
                onKeyDown: (e) => {
                  if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                    e.preventDefault();
                  }
                },
              }}
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
              fullWidth
            />
          </Grid>

          {/* Weight */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                <TableCell>catalogue</TableCell>
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
                    <TableCell>{p.catalogue}</TableCell>
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
        <div>
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
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                    <MenuItem value="24 Gold">24 Gold</MenuItem>
                    <MenuItem value="22 Gold">22 Gold</MenuItem>
                    <MenuItem value="999 Silver">999 Silver</MenuItem>
                    <MenuItem value="995 Silver">995 Silver</MenuItem>
                  </TextField>
                </Grid>

                {/* ItemName select (depends on metal) */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                    {(product.metal.toLowerCase() === "24 gold" ||
                    product.metal.toLowerCase() === "22 gold"
                      ? goldItems
                      : product.metal.toLowerCase() === "999 silver" ||
                          product.metal.toLowerCase() === "995 silver"
                        ? silverItems
                        : []
                    ).map((it) => (
                      <MenuItem key={it} value={it}>
                        {it}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    select
                    label="catalogue"
                    value={product.catalogue}
                    onChange={onProductChange("catalogue")}
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
                            Select Catalogue
                          </span>
                        ),
                    }}
                  >
                    <MenuItem value="">
                      <em>Select Catalogue</em>
                    </MenuItem>
                    <MenuItem value="Royal Gold">Royal Gold</MenuItem>
                    <MenuItem value="Star">Star</MenuItem>
                    <MenuItem value="SSP">SSP</MenuItem>
                    <MenuItem value="Navkar">Navkar</MenuItem>
                    <MenuItem value="Vardhaman">Vardhaman</MenuItem>
                    <MenuItem value="MJR">MJR</MenuItem>
                    <MenuItem value="MDC">MDC</MenuItem>
                    <MenuItem value="SWM">SWM</MenuItem>
                    <MenuItem value="OSS">OSS</MenuItem>
                    <MenuItem value="Gold Works">Gold Works</MenuItem>
                    <MenuItem value="Sri Mondal Jewels">
                      Sri Mondal Jewels
                    </MenuItem>
                    <MenuItem value="SK Jewels">SK Jewels</MenuItem>
                    <MenuItem value="Navratan Collection">
                      Navratan Collection
                    </MenuItem>
                    <MenuItem value="Tops Collection">Tops Collection</MenuItem>
                    <MenuItem value="Jhumkhi Collection">
                      Tops Collection
                    </MenuItem>
                    <MenuItem value="Royal Ringtone">Royal Ringtone</MenuItem>
                    <MenuItem value="Gold Bond">Gold Bond</MenuItem>
                    <MenuItem value="Shree Viswakarma">
                      Shree Viswakarma
                    </MenuItem>
                    <MenuItem value="Self">Self</MenuItem>
                  </TextField>
                </Grid>

                {/* Design */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    label="Size"
                    type="number"
                    value={product.size}
                    onChange={onProductChange("size")}
                    inputProps={{
                      step: "any",
                      onKeyDown: (e) => {
                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                          e.preventDefault();
                        }
                      },
                    }}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    fullWidth
                    error={!!errors.size}
                    helperText={errors.size || ""}
                  />
                </Grid>

                {/* Metal Weight */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    label="Metal Weight"
                    type="number"
                    value={product.metal_weight}
                    onChange={onProductChange("metal_weight")}
                    inputProps={{
                      step: "any",
                      onKeyDown: (e) => {
                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                          e.preventDefault();
                        }
                      },
                    }}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    fullWidth
                    error={!!errors.metal_weight}
                    helperText={errors.metal_weight || ""}
                  />
                </Grid>

                {/* Wastage */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    label="Wastage"
                    type="number"
                    value={product.wastage}
                    onChange={onProductChange("wastage")}
                    inputProps={{
                      step: "any",
                      onKeyDown: (e) => {
                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                          e.preventDefault();
                        }
                      },
                    }}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    fullWidth
                  />
                </Grid>

                {/* Making Charges */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    label="Making Charges"
                    type="number"
                    value={product.making_charges}
                    onChange={onProductChange("making_charges")}
                    inputProps={{
                      step: "any",
                      onKeyDown: (e) => {
                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                          e.preventDefault();
                        }
                      },
                    }}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    fullWidth
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    label="Stone Weight"
                    type="number"
                    value={product.stone_weight}
                    onChange={(e) =>
                      handleMaterialChange("stone", "weight", e.target.value)
                    }
                    inputProps={{
                      step: "any",
                      onKeyDown: (e) => {
                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                          e.preventDefault();
                        }
                      },
                    }}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    label="Stone Rate"
                    type="number"
                    value={product.stone_rate}
                    onChange={(e) =>
                      handleMaterialChange("stone", "rate", e.target.value)
                    }
                    inputProps={{
                      step: "any",
                      onKeyDown: (e) => {
                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                          e.preventDefault();
                        }
                      },
                    }}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    label="Stone Amount"
                    value={product.stone_amount}
                    InputProps={{ readOnly: true }}
                    inputProps={{
                      step: "any",
                      onKeyDown: (e) => {
                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                          e.preventDefault();
                        }
                      },
                    }}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    fullWidth
                  />
                </Grid>

                {/* ---- Bits ---- */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    label="Bits Weight"
                    type="number"
                    value={product.bits_weight}
                    onChange={(e) =>
                      handleMaterialChange("bits", "weight", e.target.value)
                    }
                    inputProps={{
                      step: "any",
                      onKeyDown: (e) => {
                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                          e.preventDefault();
                        }
                      },
                    }}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    label="Bits Rate"
                    type="number"
                    value={product.bits_rate}
                    onChange={(e) =>
                      handleMaterialChange("bits", "rate", e.target.value)
                    }
                    inputProps={{
                      step: "any",
                      onKeyDown: (e) => {
                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                          e.preventDefault();
                        }
                      },
                    }}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    label="Bits Amount"
                    value={product.bits_amount}
                    InputProps={{ readOnly: true }}
                    inputProps={{
                      step: "any",
                      onKeyDown: (e) => {
                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                          e.preventDefault();
                        }
                      },
                    }}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    fullWidth
                  />
                </Grid>

                {/* ---- Diamond ---- */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    label="Diamond Weight"
                    type="number"
                    value={product.diamond_weight}
                    onChange={(e) =>
                      handleMaterialChange("diamond", "weight", e.target.value)
                    }
                    inputProps={{
                      step: "any",
                      onKeyDown: (e) => {
                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                          e.preventDefault();
                        }
                      },
                    }}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    label="Diamond Rate"
                    type="number"
                    value={product.diamond_rate}
                    onChange={(e) =>
                      handleMaterialChange("diamond", "rate", e.target.value)
                    }
                    inputProps={{
                      step: "any",
                      onKeyDown: (e) => {
                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                          e.preventDefault();
                        }
                      },
                    }}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    label="Diamond Amount"
                    value={product.diamond_amount}
                    InputProps={{ readOnly: true }}
                    inputProps={{
                      step: "any",
                      onKeyDown: (e) => {
                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                          e.preventDefault();
                        }
                      },
                    }}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    fullWidth
                  />
                </Grid>

                {/* ---- Enamel ---- */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    label="Enamel Weight"
                    type="number"
                    value={product.enamel_weight}
                    onChange={(e) =>
                      handleMaterialChange("enamel", "weight", e.target.value)
                    }
                    inputProps={{
                      step: "any",
                      onKeyDown: (e) => {
                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                          e.preventDefault();
                        }
                      },
                    }}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    label="Enamel Rate"
                    type="number"
                    value={product.enamel_rate}
                    onChange={(e) =>
                      handleMaterialChange("enamel", "rate", e.target.value)
                    }
                    inputProps={{
                      step: "any",
                      onKeyDown: (e) => {
                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                          e.preventDefault();
                        }
                      },
                    }}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    label="Enamel Amount"
                    value={product.enamel_amount}
                    InputProps={{ readOnly: true }}
                    inputProps={{
                      step: "any",
                      onKeyDown: (e) => {
                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                          e.preventDefault();
                        }
                      },
                    }}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    fullWidth
                  />
                </Grid>

                {/* ---- Pearls ---- */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    label="Pearls Weight"
                    type="number"
                    value={product.pearls_weight}
                    onChange={(e) =>
                      handleMaterialChange("pearls", "weight", e.target.value)
                    }
                    inputProps={{
                      step: "any",
                      onKeyDown: (e) => {
                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                          e.preventDefault();
                        }
                      },
                    }}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    label="Pearls Rate"
                    type="number"
                    value={product.pearls_rate}
                    onChange={(e) =>
                      handleMaterialChange("pearls", "rate", e.target.value)
                    }
                    inputProps={{
                      step: "any",
                      onKeyDown: (e) => {
                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                          e.preventDefault();
                        }
                      },
                    }}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    label="Pearls Amount"
                    value={product.pearls_amount}
                    InputProps={{ readOnly: true }}
                    inputProps={{
                      step: "any",
                      onKeyDown: (e) => {
                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                          e.preventDefault();
                        }
                      },
                    }}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    fullWidth
                  />
                </Grid>

                {/* ---- Wax ---- */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    label="Wax Weight"
                    type="number"
                    value={product.wax_weight}
                    onChange={(e) =>
                      handleMaterialChange("wax", "weight", e.target.value)
                    }
                    inputProps={{
                      step: "any",
                      onKeyDown: (e) => {
                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                          e.preventDefault();
                        }
                      },
                    }}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    label="Wax Rate"
                    type="number"
                    value={product.wax_rate}
                    onChange={(e) =>
                      handleMaterialChange("wax", "rate", e.target.value)
                    }
                    inputProps={{
                      step: "any",
                      onKeyDown: (e) => {
                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                          e.preventDefault();
                        }
                      },
                    }}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    label="Wax Amount"
                    value={product.wax_amount}
                    InputProps={{ readOnly: true }}
                    inputProps={{
                      step: "any",
                      onKeyDown: (e) => {
                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                          e.preventDefault();
                        }
                      },
                    }}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    fullWidth
                  />
                </Grid>

                {/* Other Weight */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    label="Other Weight"
                    type="number"
                    value={product.other_weight}
                    onChange={(e) =>
                      handleMaterialChange("other", "weight", e.target.value)
                    }
                    inputProps={{
                      step: "any",
                      onKeyDown: (e) => {
                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                          e.preventDefault();
                        }
                      },
                    }}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    label="Other Rate"
                    type="number"
                    value={product.other_rate}
                    onChange={(e) =>
                      handleMaterialChange("other", "rate", e.target.value)
                    }
                    inputProps={{
                      step: "any",
                      onKeyDown: (e) => {
                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                          e.preventDefault();
                        }
                      },
                    }}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    label="Other Amount"
                    value={product.other_amount}
                    InputProps={{ readOnly: true }}
                    inputProps={{
                      step: "any",
                      onKeyDown: (e) => {
                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                          e.preventDefault();
                        }
                      },
                    }}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    fullWidth
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    label="Gross Weight (auto)"
                    value={product.gross_weight}
                    InputProps={{ readOnly: true }}
                    fullWidth
                  />
                </Grid>

                {/* Stock */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    label="Stock"
                    type="number"
                    value={product.stock}
                    onChange={onProductChange("stock")}
                    inputProps={{
                      step: "any",
                      onKeyDown: (e) => {
                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                          e.preventDefault();
                        }
                      },
                    }}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    fullWidth
                  />
                </Grid>

                {/* Stock */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    label="Stock Box"
                    inputProps={{ step: "any" }}
                    value={product.stockBox}
                    onChange={onProductChange("stockBox")}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    select
                    label="Link Worker"
                    value={product.linkWorker}
                    onChange={onProductChange("linkWorker")}
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
                            Select Link Worker
                          </span>
                        ),
                    }}
                  >
                    <MenuItem value="">
                      <em>Select Link Worker</em>
                    </MenuItem>
                    <MenuItem value="No">No</MenuItem>
                    <MenuItem value="Yes">Yes</MenuItem>
                  </TextField>
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
                Worker Spcl Work
              </Typography>

              <Grid container spacing={2}>
                {/* Worker */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    select
                    fullWidth
                    label="Full Name"
                    value={selectedWorkerId}
                    onChange={(e) =>
                      setSelectedWorkerId(Number(e.target.value))
                    }
                    required
                    InputLabelProps={{ shrink: true }}
                    SelectProps={{ displayEmpty: true }}
                  >
                    <MenuItem value="" disabled>
                      -- Select Worker --
                    </MenuItem>
                    {workers.map(({ workerId, fullName }) => (
                      <MenuItem key={workerId} value={workerId}>
                        {fullName}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                {/* Metal select */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    select
                    label="Metal"
                    value={spclWork.metal}
                    onChange={handleSelect("metal")}
                    fullWidth
                  >
                    <MenuItem value="">Select Metal</MenuItem>
                    <MenuItem value="24 Gold">24 Gold</MenuItem>
                    <MenuItem value="22 Gold">22 Gold</MenuItem>
                    <MenuItem value="999 Silver">999 Silver</MenuItem>
                    <MenuItem value="995 Silver">995 Silver</MenuItem>
                  </TextField>
                </Grid>

                {/* ItemName select (depends on metal) */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    select
                    label="Item Name"
                    value={spclWork.itemName}
                    onChange={handleSelect("itemName")}
                    disabled={!spclWork.metal}
                    fullWidth
                  >
                    <MenuItem value="">Select Item</MenuItem>

                    {(spclWork.metal.includes("Gold")
                      ? goldItems
                      : silverItems
                    ).map((it) => (
                      <MenuItem key={it} value={it}>
                        {it}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Metal Weight */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    label="Worker Metal Weight"
                    type="number"
                    value={spclWork.workerMetalWeight}
                    onChange={handleChange("workerMetalWeight")}
                    inputProps={{
                      step: "any",
                      onKeyDown: (e) => {
                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                          e.preventDefault();
                        }
                      },
                    }}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    fullWidth
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    label="Other Metal Name"
                    value={spclWork.otherMetalName}
                    onChange={handleChange("otherMetalName")}
                    fullWidth
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    label="Other Metal Weight"
                    type="number"
                    value={spclWork.otherWeight}
                    onChange={handleChange("otherWeight")}
                    inputProps={{
                      step: "any",
                      onKeyDown: (e) => {
                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                          e.preventDefault();
                        }
                      },
                    }}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    fullWidth
                  />
                </Grid>

                {/* Wastage */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    label="Wastage"
                    type="number"
                    value={spclWork.wastage}
                    onChange={handleChange("wastage")}
                    inputProps={{
                      step: "any",
                      onKeyDown: (e) => {
                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                          e.preventDefault();
                        }
                      },
                    }}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    fullWidth
                  />
                </Grid>

                {/* Making Charges */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    label="Amount"
                    type="number"
                    value={spclWork.amount}
                    onChange={handleChange("amount")}
                    inputProps={{
                      step: "any",
                      onKeyDown: (e) => {
                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                          e.preventDefault();
                        }
                      },
                    }}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    fullWidth
                  />
                </Grid>

                {/* Other Weight */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    label="Item Link Code"
                    value={spclWork.itemLinkCode}
                    onChange={handleChange("itemLinkCode")}
                    inputProps={{
                      step: "any",
                      onKeyDown: (e) => {
                        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                          e.preventDefault();
                        }
                      },
                    }}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    fullWidth
                  />
                </Grid>
              </Grid>

              <Box display="flex" justifyContent="flex-end" mt={4}>
                <Button
                  variant="outlined"
                  onClick={handleWorkAdding}
                  sx={{
                    paddingX: 6,
                    paddingY: 0.2,
                    borderRadius: "12px",
                    fontWeight: "bold",
                    boxShadow: "0px 4px 10px rgba(136,71,255,0.5)",
                    borderColor: "#8847FF",
                    color: "#8847FF",
                    transition: "all 0.3s",
                    "&:hover": { backgroundColor: "#8847FF", color: "#fff" },
                  }}
                >
                  Submmit
                </Button>
              </Box>
            </Paper>
          </Box>
        </div>
      )}

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
            Product Labels (Ready to Print)
          </Typography>

          <Box
            display="flex"
            flexWrap="wrap"
            gap={4}
            justifyContent="flex-start"
            alignItems="center"
          >
            {bottomResults.map((r) => {
              const handlePrint = () => {
                const printContents = `
<div style="
  width: 101.6mm;
  height: 11.9mm;
  display: flex;
  margin-left: 12mm;
  justify-content: flex-start;
  align-items: stretch;
  background-color: #fff;
  padding: 0mm, 2mm;
  box-sizing: border-box;
  overflow: hidden;
  transform: translateY(-1mm); /* Push up slightly */
">
  <!-- QR Section -->
  <div style="display:flex;align-items:stretch;justify-content:center;margin:0;padding:0;height:100%;">
    ${
      r.barcodeImageBase64
        ? `<img src="data:image/png;base64,${r.barcodeImageBase64}" 
                 style="height:100%;width:20mm;object-fit:contain;margin:0;padding:0;display:block;" 
                 alt="QR" />`
        : `<div style="font-size:2mm;">No QR</div>`
    }
  </div>

  <!-- Text Section -->
  <div style="
    display:flex;
    flex-direction:column;
    justify-content:center;
    align-items:flex-start;
    font-size:2mm;
    line-height:1.3;
    padding-left:8mm;
    height:100%;
  ">
    <div style="font-weight:bold;">${r.barcodeValue ?? "-"}</div>
    <div>G.W: ${r.gross_weight ?? "-"}g</div>
    <div>N.W: ${r.metal_weight ?? "-"}g</div>
  </div>
</div>`;

                const printWindow = window.open("", "", "width=400,height=300");
                if (printWindow) {
                  printWindow.document.write(`
<html>
  <head>
    <title>Print Label</title>
    <style>
      @page {
        size: 101.6mm 11.9mm;
        margin: 0;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #fff;
        height: 100%;
        width: 100%;
        overflow: hidden;
      }
      body {
        display: block; /* not flex — avoids phantom top gap */
      }
      img {
        display: block;
        border: none;
        vertical-align: top;
      }
    </style>
  </head>
  <body onload="window.print();window.close();">
    ${printContents}
  </body>
</html>
`);
                  printWindow.document.close();
                }
              };

              return (
                <Box
                  key={r.stockProductId}
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                >
                  {/* Small Label Preview */}
                  <Box
                    sx={{
                      width: 300,
                      height: 120,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: "#fff",
                      gap: 0,
                      position: "relative",
                    }}
                  >
                    {/* Left: Barcode Image + Value */}
                    <Box
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      justifyContent="center"
                      sx={{ mr: 0 }}
                    >
                      {r.barcodeImageBase64 ? (
                        <img
                          alt="barcode"
                          src={`data:image/png;base64,${r.barcodeImageBase64}`}
                          style={{ height: 50 }}
                        />
                      ) : (
                        <Typography fontSize={12}>No Barcode</Typography>
                      )}
                      <Typography fontSize={12} mt={0.5}>
                        {r.barcodeValue ?? "-"}
                      </Typography>
                    </Box>

                    {/* Right: Rotated G.W / N.W */}
                    <Box
                      display="flex"
                      flexDirection="column"
                      justifyContent="center"
                      alignItems="center"
                      fontSize={12}
                      lineHeight={1.4}
                      sx={{
                        transform: "rotate(270deg)",
                        transformOrigin: "center center",
                        position: "absolute",
                        right: 10,
                      }}
                    >
                      <Typography fontSize={12}>
                        G.W: {r.gross_weight ?? "-"}g
                      </Typography>
                      <Typography fontSize={12}>
                        N.W: {r.metal_weight ?? "-"}g
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 5,
                        left: "50%",
                        transform: "translateX(-50%)",
                        backgroundColor: "#f5f5f5",
                        padding: "2px 6px",
                        borderRadius: "4px",
                      }}
                    >
                      <Typography fontSize={12} fontWeight={600}>
                        Item Code: {r.itemCode ?? "-"}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Print Button */}
                  <Button
                    variant="contained"
                    onClick={handlePrint}
                    sx={{
                      mt: 1,
                      backgroundColor: "#6c63ff",
                      "&:hover": { backgroundColor: "#594ef9" },
                      textTransform: "none",
                    }}
                  >
                    Print Label
                  </Button>
                </Box>
              );
            })}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default Products;
