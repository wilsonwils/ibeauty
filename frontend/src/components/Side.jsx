import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import logicon from "../assets/logout.png";
import producticon from "../assets/product.png";
import seticon from "../assets/setting.png";

import { MdOutlineDashboard } from "react-icons/md";

const Side = () => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("userId");
    navigate("/i-beauty");
  };

  // Menu items
  const menuItems = [
    {
      icon: <MdOutlineDashboard />,
      label: "Dashboard",
      action: () => navigate("/dashboard"),
    },
    {
      icon: producticon,
      label: "Products",
      action: () => navigate("/productlist"),
    },
    {
      icon: seticon,
      label: "Settings",
      action: () => navigate("/settings"),
    },
    {
      icon: logicon,
      label: "Logout",
      action: handleLogout,
    },
  ];

  return (
    <aside
      className={`h-screen bg-[#25AFC1] shadow-md flex flex-col items-start py-6 fixed left-0 top-0 transition-all duration-300 ${
        expanded ? "w-48" : "w-20"
      }`}
    >
      {/* LOGO */}
      <div
        className="flex items-center justify-between w-full px-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h1 className="text-2xl font-bold text-[#1b2341]">iC</h1>
        {expanded && (
          <span
            className="text-gray-700 text-xl font-bold cursor-pointer"
            onClick={() => setExpanded(false)}
          >
            ×
          </span>
        )}
      </div>

      {/* MENU */}
      <div className="flex flex-col gap-6 mt-8 w-full">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={item.action}
            className="flex items-center gap-4 px-4 py-2 hover:bg-[#1b2341]/70 text-white transition w-full"
          >
            {/* ICON */}
            {typeof item.icon === "string" ? (
              <img src={item.icon} alt={item.label} className="w-6 h-6" />
            ) : (
              <span className="text-2xl">{item.icon}</span>
            )}

            {/* LABEL */}
            {expanded && <span className="text-base">{item.label}</span>}
          </button>
        ))}
      </div>
    </aside>
  );
};

export default Side;
