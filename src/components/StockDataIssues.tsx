
import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RefreshIcon from "@mui/icons-material/Refresh";
import api from "@/services/api";

type StockIssueBox = {
  stockBoxId: number;
  stockBoxName: string;
  showroom: number;
  issueCount: number;
};

type StockIssuesResponse = {
  showroom: number | "ALL";
  boxes: StockIssueBox[];
};

type StockIssueDetail = {
  barcodeValue: string;
  metal: string;
  stock: number;
  methodType: string | null;
  methodType2: string | null;
  issueDescription: string;
};

type StockIssueDetailsResponse = {
  stockBoxId: number;
  issues: StockIssueDetail[];
};

const StockDataIssues: React.FC<{
  token: string | null;
}> = ({ token }) => {
  const [showroom, setShowroom] = useState("ALL");
  const [boxes, setBoxes] = useState<StockIssueBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedBox, setSelectedBox] =
    useState<StockIssueBox | null>(null);

  const [details, setDetails] = useState<StockIssueDetail[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setBoxes([]);
      setError("Admin login required.");
      return;
    }

    const controller = new AbortController();

    const fetchIssues = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get<StockIssuesResponse>(
          "/admin/analytics/stock/issues",
          {
            params:
              showroom === "ALL"
                ? {}
                : { showroom: Number(showroom) },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!controller.signal.aborted) {
          setBoxes(
            Array.isArray(response.data.boxes)
              ? response.data.boxes
              : []
          );
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setBoxes([]);
          setError("Unable to load stock issues.");
          console.error(err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchIssues();

    return () => controller.abort();
  }, [showroom, token, refreshKey]);

  useEffect(() => {
    if (!selectedBox || !token) {
      setDetails([]);
      setDetailsError("");
      return;
    }

    const controller = new AbortController();

    const fetchDetails = async () => {
      setDetailsLoading(true);
      setDetailsError("");
      setDetails([]);

      try {
        const response =
          await api.get<StockIssueDetailsResponse>(
            "/admin/analytics/stock/issues/details",
            {
              params: {
                stockBoxId: selectedBox.stockBoxId,
              },
              headers: {
                Authorization: `Bearer ${token}`,
              },
                      }
          );

        if (!controller.signal.aborted) {
          setDetails(
            Array.isArray(response.data.issues)
              ? response.data.issues
              : []
          );
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setDetailsError("Unable to load barcode details.");
          console.error(err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setDetailsLoading(false);
        }
      }
    };

    fetchDetails();

    return () => controller.abort();
  }, [selectedBox, token, refreshKey]);

  const totalIssues = boxes.reduce(
    (sum, box) => sum + Number(box.issueCount || 0),
    0
  );

  return (
    <>
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
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Stock Data Issues
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Barcode and stock history inconsistencies
              </Typography>
            </Box>

            <Box display="flex" gap={1} alignItems="center">
              <TextField
                select
                size="small"
                label="Showroom"
                value={showroom}
                onChange={(e) => {
                  setShowroom(e.target.value);
                  setSelectedBox(null);
                }}
                sx={{ minWidth: 170 }}
              >
                <MenuItem value="ALL">Both Showrooms</MenuItem>
                <MenuItem value="1">1# Showroom</MenuItem>
                <MenuItem value="2">2# Showroom</MenuItem>
              </TextField>

              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => setRefreshKey((v) => v + 1)}
                disabled={loading}
              >
                Refresh
              </Button>
            </Box>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          {loading ? (
            <CircularProgress size={28} />
          ) : (
            <>
              <Box
                display="grid"
                gridTemplateColumns={{
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                }}
                gap={2}
                mb={3}
              >
                <Box sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}>
                  <Typography color="text.secondary" variant="body2">
                    Affected Stock Boxes
                  </Typography>
                  <Typography variant="h4" fontWeight={800}>
                    {boxes.length}
                  </Typography>
                </Box>

                <Box sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "#fff7ed",
                  border: "1px solid #fed7aa",
                }}>
                  <Typography color="text.secondary" variant="body2">
                    Flagged Records
                  </Typography>
                  <Typography variant="h4" fontWeight={800}>
                    {totalIssues}
                  </Typography>
                </Box>
              </Box>

              {boxes.length === 0 ? (
                <Alert severity="success">
                  {error
                    ? "Stock issues could not be loaded."
                    : "No stock issues detected."}
                </Alert>
              ) : (
                <TableContainer sx={{ maxHeight: 480 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Stock Box</TableCell>
                        <TableCell>Showroom</TableCell>
                        <TableCell align="center">Issues</TableCell>
                        <TableCell align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {boxes.map((box) => (
                        <TableRow key={box.stockBoxId} hover>
                          <TableCell>
                            <Typography fontWeight={600}>
                              {box.stockBoxName}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Box ID: {box.stockBoxId}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            {box.showroom}# Showroom
                          </TableCell>

                          <TableCell align="center">
                            <Chip
                              label={box.issueCount}
                              color="warning"
                              size="small"
                            />
                          </TableCell>

                          <TableCell align="right">
                            <Button
                              size="small"
                              startIcon={<VisibilityIcon />}
                              onClick={() => setSelectedBox(box)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedBox)}
        onClose={() => setSelectedBox(null)}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between"
            alignItems="center">
            <Box>
              <Typography fontWeight={700}>
                {selectedBox?.stockBoxName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Showroom {selectedBox?.showroom} •
                Box ID {selectedBox?.stockBoxId}
              </Typography>
            </Box>

            <IconButton onClick={() => setSelectedBox(null)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {detailsError && (
            <Alert severity="error">{detailsError}</Alert>
          )}

          {detailsLoading ? (
            <CircularProgress />
          ) : !detailsError && details.length === 0 ? (
            <Alert severity="success">
              No current issues in this stock box.
            </Alert>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Barcode</TableCell>
                    <TableCell>Metal</TableCell>
                    <TableCell>Stock</TableCell>
                    <TableCell>Method Type</TableCell>
                    <TableCell>Method Type 2</TableCell>
                    <TableCell>Issue Description</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {details.map((item, index) => (
                    <TableRow key={`${item.barcodeValue}-${index}`}>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {item.barcodeValue}
                      </TableCell>
                      <TableCell>{item.metal ?? "-"}</TableCell>
                      <TableCell>{item.stock}</TableCell>
                      <TableCell>{item.methodType ?? "-"}</TableCell>
                      <TableCell>{item.methodType2 ?? "-"}</TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color="warning.dark"
                        >
                          {item.issueDescription}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StockDataIssues;
