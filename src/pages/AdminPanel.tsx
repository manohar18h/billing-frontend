import React, { useRef, useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  PersonStanding,
  LogOut,
  Boxes,
  PackagePlus,
  Sun,
  Moon,
  Gem,
  ReceiptText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logo2 from "../assets/logo2.png";

import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import classNames from "classnames";
import Dashboard from "@/pages/admin/Dashboard";
import Customers from "@/pages/admin/Customers";
import Orders from "@/pages/admin/Orders";
import GenerateBill from "./admin/GenerateBill";
import CustomerDetails from "./admin/CustomerDetails";
import OrderDetails from "./admin/OrderDetails";
import BillDetails from "./admin/BillDetails";
import Workers from "./admin/Workers";
import Products from "./admin/Products";
import AllBillingOrders from "./admin/AllBillingOrders";
import WorkerStock from "./admin/WorkerStock";
import RepairWork from "./admin/RepairWork";
import LotWork from "./admin/LotWork";
import WorkerTransaction from "./admin/WorkerTransaction";
import WorkerDetails from "./admin/WorkerDetails";
import AdminService from "./admin/Service";
import { WorkersProvider } from "@/contexts/WorkersContext";
import BillData from "./admin/BillData";
import ShowroomMetalStock from "./admin/ShowroomMetalStock";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin/Dashboard" },
  { icon: Users, label: "Customers", path: "/admin/Customers" },
  { icon: PersonStanding, label: "Workers", path: "/admin/workers" },
  { icon: Boxes, label: "Worker Stock", path: "/admin/service" },
  { icon: PackagePlus, label: "Products", path: "/admin/products" },
  {
    icon: Gem,
    label: "Showroom MetalStock",
    path: "/admin/showroom-metal-stock",
  },

  {
    icon: ReceiptText,
    label: "AllBillingOrders",
    path: "/admin/billing-orders",
  },
];

const Sidebar = ({ activeIndex }: { activeIndex: number }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlightTop, setHighlightTop] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const items = containerRef.current.querySelectorAll(".sidebar-item");
    const activeItem = items[activeIndex] as HTMLElement;

    if (activeItem) {
      const offsetTop = activeItem.offsetTop;
      const height = activeItem.offsetHeight;
      setHighlightTop(offsetTop + height / 2 - 28); // Center the white highlight
    }
  }, [activeIndex]);

  return (
    <aside
      ref={containerRef}
      className="relative w-[72px] bg-[rgb(136,71,255)] flex flex-col items-center py-5 space-y-4 rounded-tr-3xl rounded-br-3xl overflow-hidden"
    >
      {/* Curved Highlight Background */}
      <div
        className="absolute left-5 w-[calc(100%-1.25rem)] h-14 transition-all duration-300 ease-in-out"
        style={{ top: `${highlightTop}px` }}
      >
        <div className="w-full h-full bg-white rounded-l-full shadow-md z-0"></div>
      </div>

      {/* Menu Items */}
      {menuItems.map((item, idx) => {
        const isActive = idx === activeIndex;
        return (
          <NavLink
            key={idx}
            to={item.path}
            className={classNames(
              "sidebar-item relative z-10 flex items-center justify-center w-12 h-12 transition-all duration-300",
              isActive ? "text-[rgb(136,71,255)]" : "text-white"
            )}
          >
            <item.icon className="w-6 h-6" />
          </NavLink>
        );
      })}
    </aside>
  );
};

function AdminPanelContent() {
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();

  // Determine which menu to highlight
  let activeIndex = menuItems.findIndex((item) =>
    location.pathname.startsWith(item.path)
  );

  // Force Customers icon active on hidden sub-pages
  if (
    location.pathname === "/admin/customer-details" ||
    location.pathname === "/admin/bill-details" ||
    location.pathname === "/admin/generate-bill" ||
    location.pathname === "/admin/orders" ||
    location.pathname === "/admin/bill-Data" ||
    location.pathname === "/admin/customers" ||
    location.pathname.startsWith("/admin/order-details")
  ) {
    activeIndex = 1;
  } else if (
    location.pathname.startsWith("/admin/workers") ||
    location.pathname.startsWith("/admin/worker-details")
  ) {
    activeIndex = 2;
  }

  if (activeIndex === -1) activeIndex = 0;

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");

    // Optionally redirect
    window.location.href = "/login";
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#1a1b1f] transition-colors">
      <Sidebar activeIndex={activeIndex} />

      <main className="flex-1 p-6 text-gray-800 dark:text-white">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-3xl text-white shadow-xl flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Hambire Jewellery</h1>
            <p className="text-sm opacity-80">
              Welcome to your smart billing-inventory panel.
            </p>
          </div>
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-md border border-gray-200">
            <img
              src={logo2}
              alt="HJ Logo"
              className="w-12 h-12 object-contain"
            />
          </div>
        </div>

        <div>
          <Routes>
            <Route index element={<Dashboard />} />{" "}
            {/* ✅ default when path = /admin */}
            <Route path="dashboard" element={<Dashboard />} />{" "}
            <Route path="customers" element={<Customers />} />
            <Route path="orders" element={<Orders />} />
            <Route path="generate-bill" element={<GenerateBill />} />
            <Route path="customer-details" element={<CustomerDetails />} />
            <Route path="bill-details" element={<BillDetails />} />
            <Route path="bill-data" element={<BillData />} />
            <Route path="order-details/:orderId" element={<OrderDetails />} />
            <Route path="workers" element={<Workers />} />
            <Route path="service" element={<AdminService />} />
            <Route path="products" element={<Products />} />
            <Route path="billing-orders" element={<AllBillingOrders />} />
            <Route path="worker-stock" element={<WorkerStock />} />
            <Route path="repair-work" element={<RepairWork />} />
            <Route path="lot-work" element={<LotWork />} />
            <Route path="worker-transaction" element={<WorkerTransaction />} />
            <Route
              path="showroom-metal-stock"
              element={<ShowroomMetalStock />}
            />
            <Route
              path="worker-details/:workerId"
              element={<WorkerDetails />}
            />
            <Route path="*" element={<p>Select a menu option</p>} />
          </Routes>
        </div>
      </main>

      {/* Utility Buttons */}
      <div className="absolute bottom-8 left-6 flex flex-col gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDarkMode(!darkMode)}
          className="text-red-500 hover:bg-red-100 dark:hover:bg-red-700 transition-all duration-300 rounded-xl"
        >
          {darkMode ? (
            <Sun className="w-6 h-6" />
          ) : (
            <Moon className="w-6 h-6" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="text-red-500 hover:bg-red-100 dark:hover:bg-red-700 transition-all duration-300 rounded-xl"
        >
          <LogOut className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}

const AdminPanel: React.FC = () => (
  <WorkersProvider>
    <AdminPanelContent />
  </WorkersProvider>
);

export default AdminPanel;
