import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { permissionService } from "../services/permissionService";

// ICONS
import dashicon from "../assets/dash.png";
import analyticicon from "../assets/analytic.png";
import integicon from "../assets/integ.png";
import seticon from "../assets/setting.png";
import logicon from "../assets/logout.png";
import permicon from "../assets/permission.png"

const Sidebar = () => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("AUTH_TOKEN");
    navigate("/i-beauty");
  };

  const menuItems = [
    {
      icon: dashicon,
      label: "Products",
      action: () => navigate("/productlist"),
      permission: 3, // Product Module
    },
    {
      icon: analyticicon,
      label: "Analytics",
      action: () => navigate("/setflow"),
      permission: [14,15], // Analytics Basic OR Advanced
    },
    {
      icon: integicon,
      label: "Integration",
      action: () => navigate("/integration"),
    },
    {
      icon: seticon,
      label: "Settings",
      action: () => navigate("/settings"),
    },
    {
      icon: permicon,
      label: "Organization-permission",
      action: () => navigate("/organization-permission"),
    },
  ];

  // ✅ FILTER MENU ITEMS BASED ON PERMISSION
  const filteredMenuItems = menuItems.filter((item) => {
    if (!item.permission) return true;

    if (Array.isArray(item.permission)) {
      return permissionService.hasAny(item.permission);
	  
    }

    return permissionService.has(item.permission);
  });

  return (
    
    <aside
      className={`h-screen bg-[#25AFC1] shadow-xl flex flex-col 
      transition-all duration-300 fixed left-5 top-0 
      ${expanded ? "w-40" : "w-30"} rounded-3xl`}
    >
      {/* LOGO */}
      <div
        className="flex flex-col items-center pt-6 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h1 className="text-lg text-[#1b2341] font-semibold">Logo Here</h1>
        <div className="w-8 h-px bg-[#ffffff60] mt-2"></div>
      </div>
      

      {/* MENU SECTION */}
      <div className="mt-12 flex flex-col gap-6 px-3">
        {filteredMenuItems.map((item, index) => (
          <button
            key={index}
            onClick={item.action}
            className={`flex items-center transition-all 
            ${expanded ? "justify-start px-4 py-3" : "justify-center p-2"} 
            rounded-xl hover:bg-[#1b2341]/20`}
          >
            <img src={item.icon} className="w-6 h-6" alt="" />
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
          <img src={logicon} className="w-6 h-6" alt="" />
          {expanded && (
            <span className="ml-4 text-white font-medium">Logout</span>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
