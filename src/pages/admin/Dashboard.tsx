import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardHeader,
  Typography,
  IconButton,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import api from "@/services/api";

interface MetalRates {
  metalPriceId: number;
  goldRate: number;
  silverRate: number;
}

const DashboardMain: React.FC = () => {
  /* ───────── state for precious‑metal prices ───────── */

  const [prices, setPrices] = useState({
    gold: Number(localStorage.getItem("GoldPrice")) || 0,
    silver: Number(localStorage.getItem("SilverPrice")) || 0,
  });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<{
    gold: string | number;
    silver: string | number;
  }>({
    gold: "",
    silver: "",
  });
  const token = localStorage.getItem("token"); // your JWT token

  useEffect(() => {
    api
      .get<MetalRates>("/admin/getRates", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const { goldRate, silverRate } = res.data;
        setPrices({ gold: goldRate, silver: silverRate });
        setDraft({ gold: String(goldRate), silver: String(silverRate) });

        // save in localStorage
        localStorage.setItem("GoldPrice", goldRate.toString());
        localStorage.setItem("SilverPrice", silverRate.toString());
      })
      .catch((err) => console.error("Error fetching rates:", err));
  }, [token]);

  const saveEdit = () => {
    api
      .put<MetalRates>(
        `/admin/updateRates?goldRate=${draft.gold}&silverRate=${draft.silver}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then((res) => {
        const { goldRate, silverRate } = res.data;
        setPrices({ gold: goldRate, silver: silverRate });
        setEditing(false);

        localStorage.setItem("GoldPrice", goldRate.toString());
        localStorage.setItem("SilverPrice", silverRate.toString());

        console.log("Updated Prices =>", goldRate, silverRate);
      })
      .catch((err) => console.error("Error updating rates:", err));
  };

  /* ───────── helper card components ───────── */
  const Summary = ({
    title,
    value,
    small,
  }: {
    title: string;
    value: string;
    small?: string;
  }) => (
    <Card variant="outlined" sx={{ p: 2, height: "100%" }}>
      <Typography variant="caption" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="h4" fontWeight={600} mt={1} lineHeight={1.3}>
        {value}
      </Typography>
      {small && (
        <Typography variant="caption" color="text.secondary">
          {small}
        </Typography>
      )}
    </Card>
  );

  return (
    <Box sx={{ width: "100%", p: { xs: 4, md: 6 } }}>
      {/* SUMMARY CARDS ROW */}
      <Grid container spacing={2} mb={6}>
        {/* METAL PRICE WIDGET + REVENUE TREND PLACEHOLDER */}
        <Grid container spacing={2} mb={3}>
          {/* editable metal prices */}
          <Grid size={{ xs: 6, md: 15 }}>
            <Card variant="outlined" sx={{ p: 2, height: "100%" }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="start"
              >
                <Typography fontWeight={600}>Metal Prices</Typography>
                {!editing ? (
                  <IconButton size="small" onClick={() => setEditing(true)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                ) : (
                  <Box>
                    <IconButton size="small" color="success" onClick={saveEdit}>
                      <CheckIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setEditing(false)}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Box>

              {/* display vs edit form */}
              {!editing ? (
                <Box mt={2} lineHeight={1.8}>
                  <Typography variant="body2">
                    Gold:&nbsp;
                    <Typography component="span" fontWeight={600}>
                      ₹{prices.gold}
                    </Typography>
                  </Typography>
                  <Typography variant="body2">
                    Silver:&nbsp;
                    <Typography component="span" fontWeight={600}>
                      ₹{prices.silver}
                    </Typography>
                  </Typography>
                </Box>
              ) : (
                <Box mt={1} display="flex" flexDirection="column" gap={1}>
                  <TextField
                    size="small"
                    type="number"
                    label="Gold ₹/g"
                    value={draft.gold ?? ""} // show empty if null/undefined
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        gold: e.target.value, // can be "" or a number-like string
                      })
                    }
                  />
                  <TextField
                    size="small"
                    type="number"
                    label="Silver ₹/g"
                    value={draft.silver ?? ""}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        silver: e.target.value,
                      })
                    }
                  />
                  <Button
                    onClick={saveEdit}
                    variant="contained"
                    size="small"
                    sx={{ alignSelf: "flex-start", mt: 0.5 }}
                  >
                    Save
                  </Button>
                </Box>
              )}
            </Card>
          </Grid>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Summary title="Total Customers" value="1,250" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Summary
            title="Orders Overview"
            value="320"
            small="12 new / 3 pending"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Summary title="Pending Bills" value="$15,200" small="35 customers" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Summary title="Total Revenue" value="$45,300" small="(This Month)" />
        </Grid>
      </Grid>

      {/* RECENT ORDERS & LOW‑STOCK */}
      <Grid container spacing={2}>
        {/* recent orders */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined">
            <CardHeader title="Recent Orders" sx={{ pb: 0 }} />
            <Table size="small">
              <TableHead>
                <TableRow>
                  {["ID", "Customer", "Date", "Status", "Employee"].map((h) => (
                    <TableCell key={h}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  ["#1028", "Ashles S.", "21 Apr.", "Processed", "Megan"],
                  ["#1029", "David M.", "20 Apr.", "Pending", "Kevin"],
                  ["#1016", "Maria R.", "16 Jun.", "Completed", "Sarah"],
                  ["#1018", "John D.", "26 Jun.", "Pending", "Brian"],
                ].map((row) => (
                  <TableRow
                    key={row[0]}
                    sx={{ "&:last-child td": { border: 0 } }}
                  >
                    {row.map((cell) => (
                      <TableCell key={cell}>{cell}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </Grid>

        {/* low stock */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined">
            <CardHeader title="Low Stock Products" sx={{ pb: 0 }} />
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Qty</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  ["Gold Necklace", 5],
                  ["Diamond Ring", 3],
                ].map(([p, q]) => (
                  <TableRow key={p} sx={{ "&:last-child td": { border: 0 } }}>
                    <TableCell>{p}</TableCell>
                    <TableCell>{q}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardMain;
