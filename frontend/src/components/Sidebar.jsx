import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { permissionService } from "../services/permissionService";

// ICONS
import producticon from "../assets/product.png";
import analyticicon from "../assets/analytic.png";
import integicon from "../assets/integ.png";
import seticon from "../assets/setting.png";
import logicon from "../assets/logout.png";
import permicon from "../assets/permission.png";
import { MdOutlineDashboard } from "react-icons/md";

const Sidebar = ({ dashboardOnly = false }) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("AUTH_TOKEN");
    navigate("/i-beauty");
  };

  const menuItems = [
    {
      key: "dashboard",
      icon: <MdOutlineDashboard />,
      label: "Dashboard",
      action: () => navigate("/dashboard"),
    },
    {
      key: "products",
      icon: producticon,
      label: "Products",
      action: () => navigate("/productlist"),
      permission: 3,
    },
    {
      key: "analytics",
      icon: analyticicon,
      label: "Analytics",
      action: () => navigate("/setflow"),
      permission: [14, 15],
    },
    {
      key: "integration",
      icon: integicon,
      label: "Integration",
      action: () => navigate("/integration"),
    },
    {
      key: "settings",
      icon: seticon,
      label: "Settings",
      action: () => navigate("/settings"),
    },
    {
      key: "permission",
      icon: permicon,
      label: "Permission",
      action: () => navigate("/organization-permission"),
      adminOnly: true,
    },
  ];

  const filteredMenuItems = menuItems.filter((item) => {
    // DASHBOARD ONLY MODE
    if (dashboardOnly) {
      return ["dashboard", "products", "settings"].includes(item.key);
    }

    // ADMIN ONLY
    if (item.adminOnly && !permissionService.isAdmin()) return false;

    // PERMISSION CHECK
    if (!item.permission) return true;

    if (Array.isArray(item.permission)) {
      return permissionService.hasAny(item.permission);
    }

    return permissionService.has(item.permission);
  });

  return (
    <aside
      className={`h-screen bg-[#25AFC1] shadow-xl flex flex-col 
      transition-all duration-300 fixed left-5 top-2 
      ${expanded ? "w-44" : "w-34"} rounded-3xl`}
    >
      {/* LOGO */}
      <div
        className="flex flex-col items-center pt-6 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h1 className="text-lg text-[#1b2341] font-semibold">Logo Here</h1>
        <div className="w-8 h-px bg-[#ffffff60] mt-2"></div>
      </div>

      {/* MENU */}
      <div className="mt-12 flex flex-col gap-6 px-3">
        {filteredMenuItems.map((item) => (
          <button
            key={item.key}
            onClick={item.action}
            className={`flex items-center transition-all 
            ${expanded ? "justify-start px-4 py-3" : "justify-center p-2"} 
            rounded-xl hover:bg-[#1b2341]/20`}
          >
            {typeof item.icon === "string" ? (
              <img src={item.icon} alt={item.label} className="w-6 h-6" />
            ) : (
              <span className="text-white text-2xl">{item.icon}</span>
            )}

            {expanded && (
              <span className="ml-4 text-white font-medium">
                {item.label}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* LOGOUT */}
      <div className="mt-auto px-3 py-6">
        <button
          onClick={handleLogout}
          className={`flex items-center transition-all w-full 
          ${expanded ? "justify-start px-4 py-3" : "justify-center p-3"} 
          rounded-xl hover:bg-[#1b2341]/70 text-white`}
        >
          <img src={logicon} alt="Logout" className="w-6 h-6" />
          {expanded && <span className="ml-4 font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
