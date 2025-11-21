import React, { useRef, useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  PersonStanding,
  LogOut,
  Boxes,
  PackagePlus,
  Sun,
  Box as BoxIcon,
  Moon,
  Gem,
  ReceiptText,
  BadgeIndianRupee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logo2 from "../assets/logo2.png";

import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import classNames from "classnames";
import Dashboard from "@/pages/admin/Dashboard";
import Customers from "@/pages/admin/Customers";
import Orders from "@/pages/admin/Orders";
import GenerateBill from "./admin/GenerateBill";
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
import StockBoxData from "./admin/StockBoxData";
import StockBoxDetails from "./admin/StockBoxDetails";
import Loan from "./admin/Loan";
import LoanItems from "./admin/LoanItems";
import LoanItemDetails from "./admin/LoanItemDetails";
import GenerateLoanBill from "./admin/GenerateLoanBill";
import BillLoanDetails from "./admin/BillLoanDetails";
import BillLoanData from "./admin/BillLoanData";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin/Dashboard" },
  { icon: Users, label: "Customers", path: "/admin/Customers" },
  { icon: PersonStanding, label: "Workers", path: "/admin/workers" },
  { icon: Boxes, label: "Services", path: "/admin/service" },
  { icon: PackagePlus, label: "Products", path: "/admin/products" },
  { icon: Gem, label: "Showroom", path: "/admin/showroom-metal-stock" },
  { icon: BoxIcon, label: "Stock Box", path: "/admin/stockBox" },
  { icon: ReceiptText, label: "Billing", path: "/admin/billing-orders" },
  { icon: BadgeIndianRupee, label: "Loan", path: "/admin/Loan" },
];

type SidebarProps = {
  activeIndex: number;
  darkMode: boolean;
  onToggleDark: () => void;
  onLogout: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({
  activeIndex,
  darkMode,
  onToggleDark,
  onLogout,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const [highlightTop, setHighlightTop] = useState(0);

  const computeHighlight = React.useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = container.querySelectorAll(".sidebar-item");
    const activeItem = items[activeIndex] as HTMLElement | undefined;
    if (!activeItem) return;

    const containerTop = container.getBoundingClientRect().top;
    const itemRect = activeItem.getBoundingClientRect();
    const pillH = highlightRef.current?.offsetHeight ?? activeItem.offsetHeight;

    const top =
      itemRect.top - containerTop + (activeItem.offsetHeight - pillH) / 2;

    setHighlightTop(top);
  }, [activeIndex]);

  useEffect(() => {
    requestAnimationFrame(computeHighlight);
  }, [computeHighlight]);

  useEffect(() => {
    const onResize = () => computeHighlight();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [computeHighlight]);

  return (
    <aside
      ref={containerRef}
      className="fixed left-0 top-0 h-screen w-[80px] z-20 
bg-gradient-to-b from-black via-gray-900 to-amber-700
             flex flex-col items-center py-4 
             rounded-tr-3xl rounded-br-3xl overflow-hidden shadow-xl"
    >
      {/* White curved highlight (same width as item = w-14) */}
      <div
        ref={highlightRef}
        className="absolute left-2 w-20 h-16 transition-[top] duration-300 ease-in-out"
        style={{ top: `${highlightTop}px` }}
      >
        <div className="w-full h-full bg-white rounded-l-full shadow-md" />
      </div>

      {/* Menu items: icon + compact label; width matches pill to avoid clipping */}
      <div className="relative z-10 flex flex-col items-center gap-2 w-full">
        {menuItems.map((item, idx) => {
          const isActive = idx === activeIndex;
          return (
            <NavLink
              key={idx}
              to={item.path}
              className={classNames(
                "sidebar-item flex flex-col items-center justify-center w-14 h-16 select-none",
                "transition-colors",
                isActive ? "text-[rgb(136,71,255)]" : "text-white"
              )}
              title={item.label}
              onFocus={() => requestAnimationFrame(computeHighlight)}
              onMouseEnter={() => requestAnimationFrame(computeHighlight)}
            >
              <item.icon className="w-5 h-5" />
              <span className="mt-1 text-[12px] leading-none text-center inline-block w-14 px-1 truncate">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Utilities */}
      <div className="pb-4 flex flex-col items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleDark}
          className="text-white hover:bg-white/15 rounded-xl"
          title="Toggle theme"
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
          onClick={onLogout}
          className="text-white hover:bg-white/15 rounded-xl"
          title="Logout"
        >
          <LogOut className="w-6 h-6" />
        </Button>
      </div>
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
    location.pathname.startsWith("/admin/orders") ||
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
  } else if (
    location.pathname.startsWith("/admin/loanItems") ||
    location.pathname.startsWith("/admin/loanItem-details") ||
    location.pathname === "/admin/generate-loan-bill" ||
    location.pathname === "/admin/bill-loan-details" ||
    location.pathname === "/admin/bill-loan-data"
  ) {
    activeIndex = 8;
  }

  if (activeIndex === -1) activeIndex = 0;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/login";
  };

  return (
    // add left padding equal to fixed sidebar width so content never sits under it
    <div className="min-h-screen bg-white dark:bg-[#1a1b1f] transition-colors pl-[82px]">
      <Sidebar
        activeIndex={activeIndex}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode((v) => !v)}
        onLogout={handleLogout}
      />

      <main className="p-6 text-gray-800 dark:text-white">
        <div className="bg-gradient-to-r from-gray-900 to-amber-700 p-6 rounded-3xl text-white shadow-xl flex justify-between items-center ">
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
            <Route index element={<Dashboard />} />
            {/* ✅ default when path = /admin */}
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="customers" element={<Customers />} />
            <Route path="orders" element={<Orders />} />
            <Route path="generate-bill" element={<GenerateBill />} />
            <Route path="generate-loan-bill" element={<GenerateLoanBill />} />
            <Route path="bill-details" element={<BillDetails />} />
            <Route path="bill-loan-details" element={<BillLoanDetails />} />
            <Route path="bill-data" element={<BillData />} />
            <Route path="bill-loan-data" element={<BillLoanData />} />
            <Route path="order-details/:orderId" element={<OrderDetails />} />
            <Route
              path="loanItem-details/:loanId"
              element={<LoanItemDetails />}
            />

            <Route
              path="StockBoxDetails/:stockBoxId"
              element={<StockBoxDetails />}
            />
            <Route path="workers" element={<Workers />} />
            <Route path="service" element={<AdminService />} />
            <Route path="products" element={<Products />} />
            <Route path="billing-orders" element={<AllBillingOrders />} />
            <Route path="Loan" element={<Loan />} />
            <Route path="loanItems" element={<LoanItems />} />
            <Route path="stockBox" element={<StockBoxData />} />
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
    </div>
  );
}

const AdminPanel: React.FC = () => (
  <WorkersProvider>
    <AdminPanelContent />
  </WorkersProvider>
);

export default AdminPanel;
