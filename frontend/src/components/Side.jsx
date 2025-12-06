import React, { useState } from "react";
import logicon from "../assets/logout.png";
import { useNavigate } from "react-router-dom";
import dashicon from "../assets/dash.png";
import seticon from "../assets/setting.png";
import analyticicon from "../assets/analytic.png";

const Side = () => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate(); 

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("userId"); 
    navigate("/i-beauty"); 
  };

  // Menu items with icons and labels
  const menuItems = [
    { icon: dashicon, label: "Dashboard", action: () => navigate("/dashboard") },
     { icon: seticon, label: "Settings", action: () => navigate("/settings") },
     { icon: logicon, label: "Logout", action: handleLogout }, 
  ];

  return (
    <aside
      className={`h-screen bg-[#27afbf] shadow-md flex flex-col items-start py-6 fixed left-0 top-0 transition-all duration-300 ${
        expanded ? "w-45" : "w-20"
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
            className="text-gray-500 text-lg font-bold cursor-pointer"
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
            className="flex items-center gap-4 px-4 py-2 text-gray-600 hover:text-[#0ab0ff] transition w-full"
          >
            <img src={item.icon} alt="" />
            {expanded && <span className="text-base">{item.label}</span>}
          </button>
        ))}
      </div>
    </aside>
  );
};

export default Side;