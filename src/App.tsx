import React from "react";
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

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<LoginScreen />} />
        {/* All admin-related routes go through AdminPanel */}
        <Route path="/admin/*" element={<WrappedAdminPanel />} />
        <Route path="/sales" element={<SalesPage />} /> {/* ← fixed */}
        <Route
          path="/salesStockBoxDetails"
          element={<SalesStockBoxDetails />}
        />{" "}
        {/* ← fixed */}
        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>

      <ToastContainer />
    </Router>
  );
};

export default App;
