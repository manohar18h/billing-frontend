import React, { useRef, useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Package,
  HardHat,
  Hammer,
  Wrench,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  useLocation,
} from "react-router-dom";
import classNames from "classnames";
import Dashboard from "@/pages/admin/Dashboard";
import Customers from "@/pages/admin/Customers";
import Orders from "@/pages/admin/Orders";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin/Dashboard" },
  { icon: Users, label: "Customers", path: "/admin/Customers" },
  { icon: Package, label: "Orders", path: "/admin/orders" },
  { icon: HardHat, label: "Workers", path: "/admin/workers" },
  { icon: Hammer, label: "LotWork", path: "/admin/lotwork" },
  { icon: Wrench, label: "RepairWork", path: "/admin/repairwork" },
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
      setHighlightTop(offsetTop + height / 2 - 28); // 28 = half of the curved highlight height
    }
  }, [activeIndex]);

  return (
    <aside
      ref={containerRef}
      className="relative w-[72px] bg-[rgb(136,71,255)] flex flex-col items-center py-5 space-y-4 rounded-tr-3xl rounded-br-3xl overflow-hidden p-10"
    >
      {/* Curved Highlight Background */}
      <div
        className="absolute left-5 w-[calc(100%-1.25rem)] h-14 transition-all duration-300 ease-in-out"
        style={{ top: `${highlightTop}px` }}
      >
        <div className="w-full h-full bg-white rounded-l-full shadow-lg z-0"></div>
      </div>

      {/* Menu Items */}
      {menuItems.map((item, idx) => (
        <NavLink
          key={idx}
          to={item.path}
          className={({ isActive }) =>
            classNames(
              "sidebar-item relative z-10 flex items-center justify-center w-12 h-12 transition-all duration-300",
              isActive ? "text-[#8847FF]" : "text-white"
            )
          }
        >
          <item.icon className="w-6 h-6" />
        </NavLink>
      ))}
    </aside>
  );
};

const AdminPanel: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();

  const activeIndex = menuItems.findIndex((item) =>
    location.pathname.startsWith(item.path)
  );

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#1a1b1f] transition-colors">
      <Sidebar activeIndex={activeIndex === -1 ? 0 : activeIndex} />

      <main className="flex-1 p-6 text-gray-800 dark:text-white">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-3xl text-white shadow-xl flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Hello, Admin!</h1>
            <p className="text-sm opacity-80">
              Welcome to your smart dashboard panel.
            </p>
          </div>
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white">
            <img
              src="https://i.pravatar.cc/300"
              alt="Admin Avatar"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div>
          <Routes>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="customers" element={<Customers />} />
            <Route path="orders" element={<Orders />} />
            {/* <Route path="workers" element={<Workers />} />
  <Route path="lotwork" element={<LotWork />} />
  <Route path="repairwork" element={<RepairWork />} /> */}
            <Route path="*" element={<p>Select a menu option</p>} />
          </Routes>
        </div>
      </main>

      {/* Utility buttons */}
      <div className="absolute bottom-8 left-6 flex flex-col gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDarkMode(!darkMode)}
          className="text-purple-600 dark:text-gray-400 hover:bg-purple-100 dark:hover:bg-purple-700 transition-all duration-300 rounded-xl"
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
          className="text-red-500 hover:bg-red-100 dark:hover:bg-red-700 transition-all duration-300 rounded-xl"
        >
          <LogOut className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
};

export default AdminPanel;
