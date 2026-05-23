import React from "react";
import { Box, Paper, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const SalesDashboard: React.FC = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  if (role !== "SALES") {
    return <div className="p-10 text-center text-red-600 font-bold">Access Denied</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff7ed] via-white to-[#f4f0ff] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-[32px] bg-gradient-to-r from-gray-950 via-gray-900 to-amber-800 p-8 text-white shadow-2xl mb-8">
          <p className="text-sm text-amber-200 font-semibold">HAMBIRE JEWELLERY</p>
          <h1 className="text-4xl font-extrabold mt-2">Sales Dashboard</h1>
          <p className="text-white/70 mt-2">
            Quick access for sales counter, products, stock box and estimation.
          </p>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
  <Paper onClick={() => navigate("/sales/products")} className="cursor-pointer p-6 rounded-3xl hover:shadow-xl transition">
    <div className="text-4xl mb-3">📦</div>
    <Typography variant="h6" fontWeight={800}>Products</Typography>
    <p className="text-sm text-gray-500 mt-1">Add/search products and RFID labels.</p>
  </Paper>

  <Paper onClick={() => navigate("/sales/stock-box")} className="cursor-pointer p-6 rounded-3xl hover:shadow-xl transition">
    <div className="text-4xl mb-3">🔍</div>
    <Typography variant="h6" fontWeight={800}>Search Stock Box</Typography>
    <p className="text-sm text-gray-500 mt-1">View stock box count and weight.</p>
  </Paper>

  <Paper onClick={() => navigate("/sales/estimation")} className="cursor-pointer p-6 rounded-3xl hover:shadow-xl transition">
    <div className="text-4xl mb-3">🧾</div>
    <Typography variant="h6" fontWeight={800}>Estimation</Typography>
    <p className="text-sm text-gray-500 mt-1">Search barcode and print estimation.</p>
  </Paper>
</div>
        

        <Box textAlign="center" mt={8}>
          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("role");
              navigate("/login");
            }}
          >
            Logout
          </Button>
        </Box>
      </div>
    </div>
  );
};

export default SalesDashboard;