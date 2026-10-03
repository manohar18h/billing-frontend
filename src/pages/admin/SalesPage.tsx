import React, { useState, useEffect } from "react";
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
import CameraAltIcon from "@mui/icons-material/CameraAlt";


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
stock: number | null; // ✅ ADD THIS
   methodType2?: string | null;
  sellingDate?: string | null;
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

  methodType2?: string;
  sellingDate?: string;

  checked?: boolean;
  description?: string;
  checkedAt?: string;
  checkedBy?: string;
};

type StockBoxCheckHistory = {
  stockBoxCheckHistoryId: number;
  stockBoxId: number;
  stockBoxName: string;

  expectedCount: number;
  actualCount: number;
  missingCount: number;

  expectedWeight: number;
  actualWeight: number;
  weightDifference: number;

  description?: string;
  checkedBy?: string;
  checkedAt?: string;
  checkStatus?: string;
};

type StockDataBox = {
  stockBoxId: number;
  stockBoxName: string;
  totalStockBoxCount: number;
  totalStockBoxWeight: number;

  description?: string;
  checked?: boolean;

  latestCheck?: StockBoxCheckHistory | null;

todaySoldCount?: number;
todaySoldWeight?: number;

// Latest sale TODAY
latestSoldAt?: string | null;

// Latest sale across ALL dates
lastRecentSoldAt?: string | null;

// Returned by paginated backend for delete protection
hasStockBoxData?: boolean;
};

type StockBoxPageResponse = {
  content: StockDataBox[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
};




type SalesPageProps = {
  mode?: "stockBox" | "estimation";
};

const SalesPage: React.FC<SalesPageProps> = ({ mode }) => {
    const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
const basePath = role === "ADMIN" ? "/admin" : "/sales";
 const isAdmin = role === "ADMIN";
  const barcodeApi = `${basePath}/getByBarcode`;
  const isSales = role === "SALES";
const showEstimationSection = !isSales || mode === "estimation";
const showStockBoxSection = !isSales || mode === "stockBox";
  const [searchQuery, setSearchQuery] = useState("");

  const [qrScannerOpen, setQrScannerOpen] = useState(false);
const [cameraError, setCameraError] = useState("");

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
 const [showroom1Search, setShowroom1Search] = useState<string>("");
const [showroom2Search, setShowroom2Search] = useState<string>("");
const STOCK_BOX_PAGE_SIZE = 25;

const [showroom1Page, setShowroom1Page] = useState(0);
const [showroom2Page, setShowroom2Page] = useState(0);

const [totalPages, setTotalPages] = useState(0);
const [totalElements, setTotalElements] = useState(0);

const [selectedShowroom, setSelectedShowroom] =
  useState<1 | 2 | null>(() => {
    const saved = sessionStorage.getItem("selectedSalesShowroom");

    if (saved === "1") return 1;
    if (saved === "2") return 2;

    return null;
  });
useEffect(() => {
  if (selectedShowroom !== null) {
    sessionStorage.setItem(
      "selectedSalesShowroom",
      String(selectedShowroom)
    );
  }
}, [selectedShowroom]);
const [editBox, setEditBox] = useState<StockDataBox | null>(null);
const [editCount, setEditCount] = useState("");
const [editWeight, setEditWeight] = useState("");
const [editStockBoxName, setEditStockBoxName] = useState("");

const [verifiedEditPassword, setVerifiedEditPassword] =
  useState("");


const [passwordDialog, setPasswordDialog] = useState(false);
const [passwordInput, setPasswordInput] = useState("");
const [pendingAction, setPendingAction] = useState<{
  type: "edit" | "delete";
  box: StockDataBox;
} | null>(null);

const [restorePasswordDialog, setRestorePasswordDialog] =
  useState(false);

const [restorePassword, setRestorePassword] =
  useState("");

const [restoringItem, setRestoringItem] =
  useState(false);

  const isSoldOrUnavailable =
  !!order &&
  (
    Number(order.stock ?? 0) <= 0 ||
    order.methodType2?.trim().toUpperCase() === "SELL"
  );

const handleProtectedAction = (
  type: "edit" | "delete",
  box: StockDataBox
) => {
  setPendingAction({ type, box });
  setPasswordInput("");
  setPasswordDialog(true);
};

const verifyPasswordAndProceed = async () => {

  if (!pendingAction) return;

  if (!passwordInput.trim()) {
    alert("Please enter admin password.");
    return;
  }

  try {

    // Verify password ONLY on backend
    await api.post(
      "/admin/verify-admin-action-password",
      {
        password: passwordInput,
      },
      {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : undefined,
      }
    );

    const action = pendingAction;
    const verifiedPassword = passwordInput;

    setPasswordDialog(false);
    setPendingAction(null);
    setPasswordInput("");

    if (action.type === "edit") {

        setVerifiedEditPassword(verifiedPassword);


      handleOpenEdit(action.box);

    } else if (action.type === "delete") {

      await handleDeleteStockBox(
        action.box,
        verifiedPassword
      );
    }

  } catch (error: any) {

    const message =
      error.response?.data?.message ||
      "Incorrect admin password.";

    alert(message);
  }
};

const fetchStockBoxes = async (
  showroomOverride?: 1 | 2,
  pageOverride?: number,
  searchOverride?: string
) => {
  const showroom = showroomOverride ?? selectedShowroom;

  if (!showroom) {
    setRows([]);
    return;
  }

  const currentPage =
    pageOverride ??
    (showroom === 1 ? showroom1Page : showroom2Page);

  const currentSearch =
    searchOverride ??
    (showroom === 1 ? showroom1Search : showroom2Search);

  setLoading(true);
  setErr(null);

  try {
    const response = await api.get<StockBoxPageResponse>(
      `${basePath}/stock-box/page`,
      {
        params: {
          showroom,
          page: currentPage,
          size: STOCK_BOX_PAGE_SIZE,
          search: currentSearch.trim(),
        },

        headers: token
          ? { Authorization: `Bearer ${token}` }
          : undefined,
      }
    );

    const data = response.data;

    setRows(Array.isArray(data?.content) ? data.content : []);

    setTotalPages(Number(data?.totalPages || 0));
    setTotalElements(Number(data?.totalElements || 0));

  } catch (error) {
    console.error("Failed to fetch stock boxes:", error);

    setRows([]);
    setTotalPages(0);
    setTotalElements(0);

    setErr("Failed to load Stock Box Data.");
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  if (!selectedShowroom) {
  setRows([]);
  setTotalPages(0);
  setTotalElements(0);
  setLoading(false);
  return;
}

  const currentPage =
    selectedShowroom === 1
      ? showroom1Page
      : showroom2Page;

  const search =
    selectedShowroom === 1
      ? showroom1Search
      : showroom2Search;

  const timer = window.setTimeout(() => {
    fetchStockBoxes(
      selectedShowroom,
      currentPage,
      search
    );
  }, 350);

  return () => {
    window.clearTimeout(timer);
  };
}, [
  selectedShowroom,
  showroom1Page,
  showroom2Page,
  showroom1Search,
  showroom2Search,
]);



  const handleRestoreClick = () => {

 if (!order) return;

  // Restore is required whenever actual stock is 0.
  // StockBoxData may or may not exist.
  if (Number(order.stock ?? 0) > 0) {
    alert(
      "Item is already available. Restore not required."
    );
    return;
  }

  const confirmed = window.confirm(
    "IMPORTANT:\n\n" +
    "Please physically check that the barcode/RFID tag is available with this item.\n\n" +
    "Only restore the item if the correct tag is physically present.\n\n" +
    "Do you want to continue?"
  );

  if (!confirmed) {
    return;
  }

  setRestorePassword("");
  setRestorePasswordDialog(true);
};

const handleRestoreItem = async () => {

  if (!order) return;

  if (!restorePassword.trim()) {
    alert("Please enter admin password.");
    return;
  }

  try {

    setRestoringItem(true);

   const response = await api.post<{
  success: boolean;
  message: string;
}>(
  "/admin/restore-sold-item",
  {
    barcodeValue: order.barcodeValue,
    password: restorePassword,
  },
  {
    headers: token
      ? { Authorization: `Bearer ${token}` }
      : undefined,
  },
);

    const message =
      response.data?.message ||
      "Item restored successfully.";

    alert(message);

    if (
      message ===
      "Item restored successfully."
    ) {

      // Update screen immediately.
     setOrder((previous) =>
  previous
    ? {
        ...previous,
        stock: 1,
        methodType2: null,
        sellingDate: null,
      }
    : previous,
);

      setRestorePasswordDialog(false);
setRestorePassword("");

// Refresh stock box count / weight immediately
await fetchStockBoxes();
    }

  } catch (error: any) {

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      "Failed to restore item.";

    alert(message);

  } finally {

    setRestoringItem(false);
  }
};

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

const handleClearSelected = async (_showroom: 1 | 2) => {
  const checkedRows = rows.filter(
    (box) => box.checked === true
  );

  if (checkedRows.length === 0) {
    return;
  }

  try {
    await Promise.all(
      checkedRows.map((box) =>
        api.put(
          `${basePath}/stock-box/update-checked/${box.stockBoxId}`,
          { checked: false },
          {
            headers: token
              ? { Authorization: `Bearer ${token}` }
              : undefined,
          }
        )
      )
    );

    await fetchStockBoxes();

  } catch (error) {
    console.error(
      "Failed to clear selected stock boxes:",
      error
    );

    alert("Failed to clear selected stock boxes.");
  }
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

setShowEstimation(false);

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
  password: verifiedEditPassword,
},
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }
  );

  setEditBox(null);
setVerifiedEditPassword("");
await fetchStockBoxes();
};


const handleDeleteStockBox = async (
  box: StockDataBox,
  password: string
) => {
  const hasData = box.hasStockBoxData === true;

  if (hasData) {
    alert("Cannot delete. This stock box contains data.");
    return;
  }

  const confirmDelete = window.confirm(
    `Are you sure want to delete?\n\n` +
      `Stock Box Name: ${box.stockBoxName}\n` +
      `Total Count: ${box.totalStockBoxCount}\n` +
      `Total Weight: ${Number(
        box.totalStockBoxWeight || 0
      ).toFixed(3)}`
  );

  if (!confirmDelete) return;

  try {
    await api.delete(
      `/admin/stock-box/delete/${box.stockBoxId}?password=${encodeURIComponent(
        password
      )}`,
      {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : undefined,
      }
    );

    await fetchStockBoxes();

  } catch (error: any) {
    console.error("Failed to delete stock box:", error);

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      "Failed to delete stock box.";

    alert(message);
  }
};


 // ======================================================
// SPLIT STOCK BOXES INTO 1# SHOWROOM AND 2# SHOWROOM
// ======================================================








  useEffect(() => {
  if (!qrScannerOpen) return;

  let stream: MediaStream | null = null;
  let animationFrameId: number;
  let stopped = false;

  const startScanner = async () => {
    try {
      setCameraError("");

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera is not supported on this device/browser.");
        return;
      }

      const video = document.getElementById(
        "qr-camera-video"
      ) as HTMLVideoElement | null;

      if (!video) return;

      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: "environment",
          },
        },
        audio: false,
      });

      video.srcObject = stream;

      await video.play();

      const BarcodeDetectorClass = (window as any).BarcodeDetector;

      if (!BarcodeDetectorClass) {
        setCameraError(
          "QR scanning is not supported in this browser. Please use Chrome on Android."
        );
        return;
      }

      const detector = new BarcodeDetectorClass({
        formats: ["qr_code"],
      });

      const scan = async () => {
        if (stopped) return;

        try {
          if (video.readyState >= 2) {
            const detectedCodes = await detector.detect(video);

            if (detectedCodes.length > 0) {
              const value = detectedCodes[0]?.rawValue?.trim();

              if (value) {
                setSearchQuery(value);

                stopped = true;

                stream?.getTracks().forEach((track) => track.stop());

                setQrScannerOpen(false);

                return;
              }
            }
          }
        } catch (error) {
          console.error("QR detection error:", error);
        }

        animationFrameId = requestAnimationFrame(scan);
      };

      scan();
    } catch (error) {
      console.error("Camera error:", error);

      setCameraError(
        "Unable to open camera. Please allow camera permission."
      );
    }
  };

  startScanner();

  return () => {
    stopped = true;

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  };
}, [qrScannerOpen]);

const formatSoldTime = (
  value?: string | null
): string => {
  if (!value) return "";

  // Backend LocalDateTime:
  // 2026-10-03T13:24:30
  const match = value.match(
    /T(\d{2}):(\d{2})/
  );

  if (!match) return "";

  let hour = Number(match[1]);
  const minute = match[2];

  const period = hour >= 12 ? "PM" : "AM";

  hour = hour % 12 || 12;

  return `${hour}:${minute} ${period}`;
};

const formatSoldDate = (
  value?: string | null
): string => {
  if (!value) return "";

  // Backend LocalDateTime:
  // 2026-10-03T13:24:30
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})/
  );

  if (!match) return "";

  const year = match[1];
  const month = match[2];
  const day = match[3];

  return `${day}/${month}/${year}`;
};

const renderStockBoxData = (
  displayRows: StockDataBox[],
  currentPage: number
) => {
  if (displayRows.length === 0) {
    return (
      <p className="py-6 text-center text-gray-500">
        No stock boxes found.
      </p>
    );
  }

const sortedDisplayRows = displayRows;

  return (
    <div className="mt-4">

      {/* ================= MOBILE VIEW ================= */}
      <div className="space-y-3 md:hidden">
        {sortedDisplayRows.map((box, index) => {
  const latest = box.latestCheck;

  const serialNumber =
    currentPage * STOCK_BOX_PAGE_SIZE +
    index +
    1;

          return (
            <div
              key={box.stockBoxId}
              className="rounded-2xl border border-gray-100 bg-[#fffaf0] p-4 shadow-sm"
            >
              <div className="text-[11px] font-bold text-gray-500">
  S.No: {serialNumber}
</div>
              {/* Stock Box Name + Checkbox */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-gray-500">
                    Stock Box
                  </div>

                  <div className="font-bold text-blue-700">
                    {box.stockBoxName}
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={box.checked === true}
                  onChange={(e) =>
                    handleUpdateChecked(box, e.target.checked)
                  }
                  className="h-5 w-5"
                />
              </div>

              {/* Count + Weight */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-white p-2">
                  <div className="text-[11px] text-gray-500">
                    Count
                  </div>

                  <div className="text-sm font-bold">
                    {box.totalStockBoxCount}
                  </div>
                </div>

                <div className="rounded-xl bg-white p-2">
                  <div className="text-[11px] text-gray-500">
                    Weight
                  </div>

                  <div className="text-sm font-bold text-[#e38111]">
                    {Number(
                      box.totalStockBoxWeight || 0
                    ).toFixed(3)}{" "}
                    g
                  </div>
                </div>
              </div>

              {/* Last Inventory Check */}
              <div className="mt-3 rounded-xl bg-purple-50 p-3">
                <div className="text-[11px] font-bold text-purple-700">
                  LAST INVENTORY CHECK
                </div>

              {latest ? (
  <>
    <div
      className={`mt-1 font-bold ${
        latest.checkStatus === "ALL_GOOD"
          ? "text-green-600"
          : latest.checkStatus ===
            "WEIGHT_ISSUE"
          ? "text-orange-600"
          : "text-red-600"
      }`}
    >
      {latest.checkStatus === "ALL_GOOD"
        ? "✓ All Good"
        : latest.checkStatus ===
          "PIECES_ISSUE"
        ? "⚠ Pieces Issue"
        : latest.checkStatus ===
          "WEIGHT_ISSUE"
        ? "⚠ Weight Issue"
        : "⚠ Pieces & Weight Issue"}
    </div>

    {Number(latest.missingCount || 0) > 0 && (
      <div className="text-xs text-red-600">
        Missing: {latest.missingCount}
      </div>
    )}

    {Math.abs(
      Number(
        latest.weightDifference || 0
      )
    ) >= 0.001 && (
      <div className="text-xs text-orange-600">
        Weight Diff:{" "}
        {Number(
          latest.weightDifference
        ).toFixed(3)}{" "}
        g
      </div>
    )}

    {latest.description && (
      <div className="mt-1 text-xs">
        Note: {latest.description}
      </div>
    )}

    <div className="mt-1 text-[11px] text-gray-500">
      {latest.checkedAt
        ? new Date(
            latest.checkedAt
          ).toLocaleString("en-IN")
        : ""}
    </div>
  </>
) : (
  <div className="mt-1 text-xs text-gray-400">
    Not Checked
  </div>
)}
              </div>

             {/* Today's Sold */}
<div className="mt-2 rounded-xl bg-red-50 p-3">
  <div className="text-[11px] font-bold text-red-700">
    TODAY SOLD
  </div>

  {Number(box.todaySoldCount || 0) > 0 ? (
    <>
      <div className="mt-1 text-sm font-bold text-red-600">
        {box.todaySoldCount} Sold
      </div>

      <div className="text-xs text-gray-700">
        Weight:{" "}
        {Number(
          box.todaySoldWeight || 0
        ).toFixed(3)}{" "}
        g
      </div>

      {box.latestSoldAt && (
        <div className="mt-1 text-[11px] font-semibold text-red-500">
          Last Sold: {formatSoldTime(box.latestSoldAt)}
        </div>
      )}
    </>
  ) : (
    <div className="mt-1 text-xs text-gray-400">
      No sales today
    </div>
  )}
</div>

        {/* Last Recent Sold */}
<div className="mt-2 rounded-xl bg-blue-50 p-3">
  <div className="text-[11px] font-bold text-blue-700">
    LAST RECENT SOLD
  </div>

  {box.lastRecentSoldAt ? (
    <>
      <div className="mt-1 text-sm font-bold text-blue-700">
        {formatSoldDate(box.lastRecentSoldAt)}
      </div>

      <div className="text-xs font-semibold text-gray-600">
        {formatSoldTime(box.lastRecentSoldAt)}
      </div>
    </>
  ) : (
    <div className="mt-1 text-xs text-gray-400">
      No previous sale
    </div>
  )}
</div>

              {/* Actions */}
              <div className="mt-3 flex justify-end gap-2">
                <IconButton
                  size="medium"
                  color="primary"
                 onClick={() => {
  // Remember which showroom is currently open
  if (selectedShowroom) {
    sessionStorage.setItem(
      "selectedSalesShowroom",
      String(selectedShowroom)
    );
  }

  // Remember selected stock box
  localStorage.setItem(
    "selectedStockBox",
    JSON.stringify(box)
  );

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
                      onClick={() =>
                        handleProtectedAction("edit", box)
                      }
                    >
                      <EditIcon fontSize="medium" />
                    </IconButton>

                    {box.hasStockBoxData !== true && (
                      <IconButton
                        size="medium"
                        color="error"
                        onClick={() =>
                          handleProtectedAction("delete", box)
                        }
                      >
                        <DeleteIcon fontSize="medium" />
                      </IconButton>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= DESKTOP VIEW ================= */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse overflow-hidden rounded-xl border border-gray-300">
          <thead className="bg-gray-200">
            <tr>
              <th className="border px-3 py-2 text-center">
  S.No
</th>
              <th className="border px-3 py-2 text-center">
                Select
              </th>

              <th className="border px-3 py-2 text-center">
                Stock Box Name
              </th>

              <th className="border px-3 py-2 text-center">
                Count
              </th>

              <th className="border px-3 py-2 text-center">
                Weight
              </th>

              <th className="border px-3 py-2 text-center">
                  Inventory Status
              </th>

             <th className="border px-3 py-2 text-center">
  Today Sold
</th>

<th className="border px-3 py-2 text-center">
  Last Recent Sold
</th>

<th className="border px-3 py-2 text-center">
  Actions
</th>
            </tr>
          </thead>

          <tbody>
          {sortedDisplayRows.map((box, index) => {
  const latest = box.latestCheck;

  const serialNumber =
    currentPage * STOCK_BOX_PAGE_SIZE +
    index +
    1;

              return (
                <tr
                  key={box.stockBoxId}
                  className="bg-white/90 text-center"
                >
                  <td className="border px-3 py-2 font-bold text-gray-600">
  {serialNumber}
</td>
                  {/* Select */}
                  <td className="border px-3 py-2">
                    <input
                      type="checkbox"
                      checked={box.checked === true}
                      onChange={(e) =>
                        handleUpdateChecked(
                          box,
                          e.target.checked
                        )
                      }
                      className="h-4 w-4"
                    />
                  </td>

                  {/* Stock Box */}
                  <td className="border px-3 py-2 font-semibold text-blue-700">
                    {box.stockBoxName}
                  </td>

                  {/* Count */}
                  <td className="border px-3 py-2 font-bold">
                    {box.totalStockBoxCount}
                  </td>

                  {/* Weight */}
                  <td className="border px-3 py-2 font-bold text-[#e38111]">
                    {Number(
                      box.totalStockBoxWeight || 0
                    ).toFixed(3)}{" "}
                    g
                  </td>

                <td className="border px-3 py-2">
  {!latest ? (
    <div className="text-center">
      <div className="font-semibold text-gray-400">
        Not Checked
      </div>
    </div>
  ) : (
    <div className="min-w-[190px] text-left">

      {latest.checkStatus === "ALL_GOOD" && (
        <div className="font-bold text-green-600">
          ✓ All Good
        </div>
      )}

      {latest.checkStatus ===
        "PIECES_ISSUE" && (
        <div className="font-bold text-red-600">
          ⚠ Pieces Issue
        </div>
      )}

      {latest.checkStatus ===
        "WEIGHT_ISSUE" && (
        <div className="font-bold text-orange-600">
          ⚠ Weight Issue
        </div>
      )}

      {latest.checkStatus ===
        "PIECES_AND_WEIGHT_ISSUE" && (
        <div className="font-bold text-red-600">
          ⚠ Pieces & Weight Issue
        </div>
      )}

      {Number(latest.missingCount || 0) > 0 && (
        <div className="mt-1 text-xs font-semibold text-red-600">
          Missing: {latest.missingCount}
        </div>
      )}

      {Math.abs(
        Number(
          latest.weightDifference || 0
        )
      ) >= 0.001 && (
        <div className="text-xs font-semibold text-orange-600">
          Weight Diff:{" "}
          {Number(
            latest.weightDifference
          ) > 0
            ? "+"
            : ""}
          {Number(
            latest.weightDifference
          ).toFixed(3)}{" "}
          g
        </div>
      )}

      {latest.description && (
        <div className="mt-1 text-xs text-gray-700">
          Note: {latest.description}
        </div>
      )}

      <div className="mt-1 text-[11px] text-gray-500">
        {latest.checkedAt
          ? new Date(
              latest.checkedAt
            ).toLocaleString("en-IN")
          : ""}
      </div>

      <div className="text-[11px] text-gray-500">
        By: {latest.checkedBy || "-"}
      </div>

    </div>
  )}
</td>



               {/* Today Sold */}
<td className="border px-3 py-2">
  {Number(box.todaySoldCount || 0) > 0 ? (
    <div className="min-w-[120px]">

      <div className="font-bold text-red-600">
        {box.todaySoldCount} Sold
      </div>

      <div className="text-xs text-gray-600">
        {Number(
          box.todaySoldWeight || 0
        ).toFixed(3)}{" "}
        g
      </div>

      {box.latestSoldAt && (
        <div className="mt-1 text-[11px] font-semibold text-red-500">
          Last Sold: {formatSoldTime(box.latestSoldAt)}
        </div>
      )}

    </div>
  ) : (
    <span className="text-gray-400">
      -
    </span>
  )}
</td>

{/* Last Recent Sold */}
<td className="border px-3 py-2">
  {box.lastRecentSoldAt ? (
    <div className="min-w-[120px] text-center">

      <div className="font-bold text-blue-700">
        {formatSoldDate(box.lastRecentSoldAt)}
      </div>

      <div className="mt-1 text-xs font-semibold text-gray-600">
        {formatSoldTime(box.lastRecentSoldAt)}
      </div>

    </div>
  ) : (
    <span className="text-gray-400">
      -
    </span>
  )}
</td>

              

                  {/* Actions */}
                  <td className="border px-3 py-2">
                    <div className="flex items-center justify-center gap-2">
                     <IconButton
  size="medium"
  color="primary"
  onClick={() => {
    if (selectedShowroom) {
      sessionStorage.setItem(
        "selectedSalesShowroom",
        String(selectedShowroom)
      );
    }

    localStorage.setItem(
      "selectedStockBox",
      JSON.stringify(box)
    );

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
                            onClick={() =>
                              handleProtectedAction(
                                "edit",
                                box
                              )
                            }
                          >
                            <EditIcon fontSize="medium" />
                          </IconButton>

                         {box.hasStockBoxData !== true && (
                            <IconButton
                              size="medium"
                              color="error"
                              onClick={() =>
                                handleProtectedAction(
                                  "delete",
                                  box
                                )
                              }
                            >
                              <DeleteIcon fontSize="medium" />
                            </IconButton>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};



  return (
   <div className="bg-white p-3 text-black md:p-6">
      
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
  p: { xs: 2, md: 6 },
  width: "100%",
  maxWidth: "80rem",
  borderRadius: "24px",
  backgroundColor: "rgba(255,255,255,0.75)",
  backdropFilter: "blur(12px)",
  border: "1px solid #d0b3ff",
  boxShadow: "0 10px 30px rgba(136,71,255,0.3)",
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
       {/* 🔍 Barcode Search */}
<Box
  sx={{
    mb: 4,
    maxWidth: 600,
    mx: "auto",
    width: "100%",
  }}
>
  {/* Barcode + Camera row */}
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: { xs: 1, md: 2 },
      width: "100%",
    }}
  >
    <TextField
      fullWidth
      variant="outlined"
      placeholder="Enter Barcode..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      sx={{
        flex: 1,
        minWidth: 0,
        backgroundColor: "white",
        borderRadius: "10px",

        "& .MuiOutlinedInput-root": {
          height: { xs: 46, md: 56 },
          borderRadius: "25px",
        },

        "& input": {
          fontSize: { xs: "14px", md: "16px" },
          py: { xs: 1, md: 1.5 },
        },
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon
              color="action"
              sx={{ fontSize: { xs: 20, md: 24 } }}
            />
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
      }}
    />

    {/* Camera */}
    <IconButton
      onClick={() => setQrScannerOpen(true)}
      sx={{
        backgroundColor: "#7c3aed",
        color: "white",

        width: { xs: 46, md: 52 },
        height: { xs: 46, md: 52 },

        flexShrink: 0,

        "&:hover": {
          backgroundColor: "#6d28d9",
        },
      }}
    >
      <CameraAltIcon
        sx={{
          fontSize: { xs: 22, md: 26 },
        }}
      />
    </IconButton>

    {/* Desktop Search Button */}
    <Button
      variant="contained"
      onClick={handleSearch}
      sx={{
        display: { xs: "none", md: "inline-flex" },

        height: 52,
        px: 3,
        borderRadius: "12px",
        fontWeight: "bold",
        flexShrink: 0,
      }}
    >
      Search
    </Button>
  </Box>

  {/* Mobile Search Button */}
  <Button
    fullWidth
    variant="contained"
    onClick={handleSearch}
    sx={{
      display: { xs: "flex", md: "none" },

      mt: 1.5,
      height: 44,

      borderRadius: "12px",
      fontWeight: "bold",
      fontSize: "14px",
    }}
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
       <p><b className="text-pink-300">Wax Weight:</b> <span className="text-yellow-300 font-bold">{order.wax_weight || "—"}</span></p>
        <p><b className="text-pink-300">Wax Amount:</b> <span className="text-yellow-300 font-bold">{order.wax_amount || "—"}</span></p>
          <p>
  <b className="text-pink-300">Pearls Weight:</b>{" "}
  <span className="text-yellow-300 font-bold">
    {order.pearls_weight || "—"}
  </span>
</p>

<p>
  <b className="text-pink-300">Pearls Amount:</b>{" "}
  <span className="text-yellow-300 font-bold">
    {order.pearls_amount || "—"}
  </span>
</p>
      </div>

      <div className="space-y-3 border-l border-white/20 pl-8">
    
       <p><b className="text-pink-300">Diamond Weight:</b> <span className="text-yellow-300 font-bold">{order.diamond_weight || "—"}</span></p>
        <p><b className="text-pink-300">Diamond Amount:</b> <span className="text-yellow-300 font-bold">{order.diamond_amount || "—"}</span></p>
      <p>
  <b className="text-pink-300">Bits Weight:</b>{" "}
  <span className="text-yellow-300 font-bold">
    {order.bits_weight || "—"}
  </span>
</p>

<p>
  <b className="text-pink-300">Bits Amount:</b>{" "}
  <span className="text-yellow-300 font-bold">
    {order.bits_amount || "—"}
  </span>
</p>

{/* OTHER */}
<p>
  <b className="text-pink-300">Other Weight:</b>{" "}
  <span className="text-yellow-300 font-bold">
    {order.other_weight || "—"}
  </span>
</p>

<p>
  <b className="text-pink-300">Other Amount:</b>{" "}
  <span className="text-yellow-300 font-bold">
    {order.other_amount || "—"}
  </span>
</p>

<p>
  <b className="text-pink-300">Gross Weight:</b>{" "}
  <span className="text-yellow-300 font-bold">
    {order.gross_weight}
  </span>
</p>
 <p><b className="text-pink-300">Stock Box:</b> <span className="text-yellow-300 font-bold">{order.stockBox || "—"}</span></p>
<p>
  <b className="text-pink-300">Item Status:</b>{" "}
  {isSoldOrUnavailable ? (
    <span className="font-extrabold text-red-400">
      SOLD / NOT AVAILABLE
    </span>
  ) : (
    <span className="font-extrabold text-green-400">
      AVAILABLE
    </span>
  )}
</p>

{order.methodType2?.toUpperCase() === "SELL" && (
  <p>
    <b className="text-pink-300">Selling Date:</b>{" "}
    <span className="font-bold text-red-300">
      {order.sellingDate || "—"}
    </span>
  </p>
)}
{isAdmin && Number(order.stock ?? 0) <= 0 && (

  <div className="mt-5">

    <button
      type="button"
      onClick={handleRestoreClick}
      disabled={restoringItem}
      className="
        bg-green-600
        hover:bg-green-700
        disabled:bg-gray-500
        text-white
        font-bold
        px-6
        py-3
        rounded-xl
        shadow-lg
        transition
      "
    >
      ♻️ RESTORE ITEM
    </button>

  </div>
)}

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
      disabled={isSoldOrUnavailable}
      onClick={() => setShowEstimation(true)}
    >
      GENERATE ESTIMATION
    </Button>

    {isSoldOrUnavailable && (
      <div className="mt-4 rounded-xl bg-red-100 p-3 text-center font-bold text-red-700">
        This item is sold or not available in stock. Estimation cannot be generated.
      </div>
    )}
  </Box>
)}
        {showEstimation &&
  order &&
  order.methodType2?.toUpperCase() !== "SELL" && (
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
                  <span>Pearls</span>
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
      {showEstimationSection &&
  showEstimation &&
  order?.methodType2?.toUpperCase() !== "SELL" && (
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
  <div className="mt-10 flex flex-col items-center justify-center gap-8 p-3">

    {/* ================================================= */}
    {/* SHOWROOM SELECTOR - ALWAYS VISIBLE */}
    {/* ================================================= */}

    <Box
      sx={{
        width: "100%",
        maxWidth: "80rem",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: { xs: 1.5, sm: 3 },
        flexWrap: "wrap",
      }}
    >
     <Button
  variant={selectedShowroom === 1 ? "contained" : "outlined"}
  onClick={() => {
    setSelectedShowroom(1);
    setShowroom1Page(0);
    setShowroom2Search("");
  }}
  sx={{
    minWidth: { xs: "145px", sm: "220px" },
    height: { xs: "48px", md: "55px" },
    borderRadius: "14px",
    fontWeight: "bold",
    fontSize: { xs: "14px", md: "17px" },
  }}
>
  1# SHOWROOM
</Button>

<Button
  variant={selectedShowroom === 2 ? "contained" : "outlined"}
  onClick={() => {
    setSelectedShowroom(2);
    setShowroom2Page(0);
    setShowroom1Search("");
  }}
  sx={{
    minWidth: { xs: "145px", sm: "220px" },
    height: { xs: "48px", md: "55px" },
    borderRadius: "14px",
    fontWeight: "bold",
    fontSize: { xs: "14px", md: "17px" },
  }}
>
  2# SHOWROOM
</Button>
    </Box>


    {/* ================================================= */}
    {/* 1# SHOWROOM */}
    {/* ================================================= */}

    {selectedShowroom === 1 && (
      <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 6 },
        width: "100%",
        maxWidth: "80rem",
        borderRadius: "24px",
        backgroundColor: "rgba(255,255,255,0.75)",
        backdropFilter: "blur(12px)",
        border: "1px solid #d0b3ff",
        boxShadow: "0 10px 30px rgba(136,71,255,0.3)",
      }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography
          variant="h4"
          fontWeight="bold"
          color="primary"
        >
          1# Showroom Stock Box Data
        </Typography>

        {isSales && (
          <Button
            variant="outlined"
            color="error"
            onClick={() => navigate("/sales")}
            sx={{
              borderRadius: "12px",
              fontWeight: "bold",
            }}
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
          placeholder="Search 1# Showroom Stock Box"
          variant="outlined"
          size="small"
          value={showroom1Search}
          onChange={(e) => {
  setShowroom1Search(e.target.value);
  setShowroom1Page(0);
}}
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

            endAdornment: showroom1Search ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => {
  setShowroom1Search("");
  setShowroom1Page(0);
}}
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
      onClick={() => handleClearSelected(1)}
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
        <p className="py-4 text-red-600">
          {err}
        </p>
      ) : (
        renderStockBoxData(rows, showroom1Page)
      )}

      {!loading && !err && totalPages > 0 && (
  <Box
    sx={{
      mt: 3,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: 2,
      flexWrap: "wrap",
    }}
  >
    <Button
      variant="outlined"
      disabled={showroom1Page === 0}
      onClick={() =>
        setShowroom1Page((prev) =>
          Math.max(0, prev - 1)
        )
      }
    >
      Previous
    </Button>

    <Typography fontWeight="bold">
      Page {showroom1Page + 1} of {totalPages}
    </Typography>

    <Button
      variant="outlined"
      disabled={
        showroom1Page >= totalPages - 1
      }
      onClick={() =>
        setShowroom1Page((prev) =>
          prev + 1
        )
      }
    >
      Next
    </Button>

    <Typography
      variant="body2"
      color="text.secondary"
    >
      Total: {totalElements} Stock Boxes
    </Typography>
  </Box>
)}
    </Paper>
)}

    {/* ================================================= */}
    {/* 2# SHOWROOM */}
    {/* ================================================= */}
{selectedShowroom === 2 && (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 6 },
        width: "100%",
        maxWidth: "80rem",
        borderRadius: "24px",
        backgroundColor: "rgba(255,255,255,0.75)",
        backdropFilter: "blur(12px)",
        border: "1px solid #d0b3ff",
        boxShadow: "0 10px 30px rgba(136,71,255,0.3)",
      }}
    >
     <Box
  display="flex"
  justifyContent="space-between"
  alignItems="center"
  mb={3}
>
  <Typography
    variant="h4"
    fontWeight="bold"
    color="primary"
  >
    2# Showroom Stock Box Data
  </Typography>

  {isSales && (
    <Button
      variant="outlined"
      color="error"
      onClick={() => navigate("/sales")}
      sx={{
        borderRadius: "12px",
        fontWeight: "bold",
      }}
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
          placeholder="Search 2# Showroom Stock Box"
          variant="outlined"
          size="small"
          value={showroom2Search}
         onChange={(e) => {
  setShowroom2Search(e.target.value);
  setShowroom2Page(0);
}}
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

            endAdornment: showroom2Search ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => {
  setShowroom2Search("");
  setShowroom2Page(0);
}}
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
     onClick={() => handleClearSelected(2)}
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
        <p className="py-4 text-red-600">
          {err}
        </p>
      ) : (
        renderStockBoxData(rows, showroom2Page)
      )}
      {!loading && !err && totalPages > 0 && (
  <Box
    sx={{
      mt: 3,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: 2,
      flexWrap: "wrap",
    }}
  >
    <Button
      variant="outlined"
      disabled={showroom2Page === 0}
      onClick={() =>
        setShowroom2Page((prev) =>
          Math.max(0, prev - 1)
        )
      }
    >
      Previous
    </Button>

    <Typography fontWeight="bold">
      Page {showroom2Page + 1} of {totalPages}
    </Typography>

    <Button
      variant="outlined"
      disabled={
        showroom2Page >= totalPages - 1
      }
      onClick={() =>
        setShowroom2Page((prev) =>
          prev + 1
        )
      }
    >
      Next
    </Button>

    <Typography
      variant="body2"
      color="text.secondary"
    >
      Total: {totalElements} Stock Boxes
    </Typography>
  </Box>
)}
    </Paper>
)}
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


{restorePasswordDialog && (

  <div
    className="
      fixed inset-0
      bg-black/50
      flex items-center
      justify-center
      z-[9999]
    "
  >

    <div
      className="
        bg-white
        rounded-2xl
        shadow-2xl
        p-6
        w-[420px]
        max-w-[90vw]
      "
    >

      <h2
        className="
          text-xl
          font-bold
          text-gray-900
          mb-2
        "
      >
        Restore Sold Item
      </h2>

      <p
        className="
          text-sm
          text-red-600
          font-semibold
          mb-4
        "
      >
        Confirm the physical barcode/RFID
        tag is available before restoring.
      </p>

      <label
        className="
          block
          font-semibold
          text-gray-700
          mb-2
        "
      >
        Admin Password
      </label>

      <input
        type="password"
        value={restorePassword}
        autoFocus
        onChange={(e) =>
          setRestorePassword(
            e.target.value
          )
        }
        onKeyDown={(e) => {
          if (
            e.key === "Enter" &&
            !restoringItem
          ) {
            handleRestoreItem();
          }
        }}
        placeholder="Enter admin password"
        className="
          w-full
          border
          border-gray-300
          rounded-lg
          px-3
          py-2
          mb-5
          focus:outline-none
          focus:ring-2
          focus:ring-green-500
        "
      />

      <div
        className="
          flex
          justify-end
          gap-3
        "
      >

        <button
          type="button"
          disabled={restoringItem}
          onClick={() => {
            setRestorePasswordDialog(false);
            setRestorePassword("");
          }}
          className="
            px-4 py-2
            border
            rounded-lg
            font-semibold
          "
        >
          Cancel
        </button>

        <button
          type="button"
          disabled={restoringItem}
          onClick={handleRestoreItem}
          className="
            px-5 py-2
            bg-green-600
            hover:bg-green-700
            disabled:bg-gray-500
            text-white
            rounded-lg
            font-bold
          "
        >
          {restoringItem
            ? "Restoring..."
            : "Restore"}
        </button>

      </div>

    </div>

  </div>
)}


{qrScannerOpen && (
  <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 p-4">

    <div className="w-full max-w-[480px] rounded-2xl bg-white p-4 shadow-2xl">

      <div className="mb-3 flex items-center justify-between">

        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Scan Jewellery QR
          </h2>

          <p className="text-sm text-gray-500">
            Point the camera at the QR code
          </p>
        </div>

        <IconButton
          onClick={() => setQrScannerOpen(false)}
        >
          <CloseIcon />
        </IconButton>

      </div>

      <div className="relative overflow-hidden rounded-xl bg-black">

        <video
          id="qr-camera-video"
          playsInline
          autoPlay
          muted
          className="h-[380px] w-full object-cover"
        />

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">

          <div className="h-[220px] w-[220px] rounded-2xl border-4 border-white shadow-lg" />

        </div>

      </div>

      {cameraError && (
        <div className="mt-3 rounded-lg bg-red-100 p-3 text-sm font-semibold text-red-700">
          {cameraError}
        </div>
      )}

      <p className="mt-3 text-center text-sm text-gray-500">
        QR will be detected automatically
      </p>

    </div>

  </div>
)}


    </div>

    
  );

  

};

export default SalesPage;
