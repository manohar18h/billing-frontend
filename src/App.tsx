import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginScreen from "./components/Login";
import WrappedAdminPanel from "./pages/AdminPanel";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SalesPage from "./pages/admin/SalesPage";
import SalesStockBoxDetails from "./pages/admin/SalesStockBoxDetails";
import WorkerProfile from "./pages/admin/WorkerProfile";
import SalesDashboard from "./pages/admin/SalesDashboard";
import Products from "./pages/admin/Products";
import { isTokenExpired, logout } from "./utils/auth";

const App = () => {
  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem("token");

      if (token && isTokenExpired(token)) {
        logout();
      }
    };

    checkToken();

    const interval = setInterval(checkToken, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/admin/*" element={<WrappedAdminPanel />} />

        <Route path="/sales" element={<SalesDashboard />} />
        <Route path="/sales/products" element={<Products />} />
        <Route path="/sales/stock-box" element={<SalesPage mode="stockBox" />} />
        <Route path="/sales/estimation" element={<SalesPage mode="estimation" />} />

        <Route
          path="/sales/stock-box-details/:stockBoxId"
          element={<SalesStockBoxDetails />}
        />

        <Route path="/worker" element={<WorkerProfile />} />

        <Route
          path="/admin/salesStockBoxDetails/:stockBoxId"
          element={<SalesStockBoxDetails />}
        />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>

      <ToastContainer />
    </Router>
  );
};

export default App;