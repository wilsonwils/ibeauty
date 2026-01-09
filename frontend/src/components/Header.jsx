import React, { useState } from "react";
import { FiSearch, FiMic, FiMail, FiBell } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

const Header = () => {
  const { user, loading } = useUser(); 
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const today = new Date().toLocaleDateString();

  const handleLogout = () => {
    localStorage.removeItem("userId");
    navigate("/i-beauty");
  };

  if (loading) {
    return (
      <div className="w-full p-4 text-center text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="w-full flex items-center justify-between bg-white shadow-md rounded-xl p-4 px-6 relative">

     
      <div className="w-[40%]"></div>
      {/* Right Section */}
      <div className="flex items-center gap-6 relative">

        {/* Light / Dark Switch */}
        <div className="flex items-center bg-gray-100 p-1 rounded-full border">
          <button className="px-3 py-1 bg-[#00bcd4] text-white text-sm rounded-full">
            Light
          </button>
          <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition">
            Dark
          </button>
        </div>

        {/* Icons */}
        <div className="flex items-center gap-4 text-gray-600 text-xl cursor-pointer">
          <FiMail />
          <FiBell />
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-300"></div>

        {/* User Profile */}
        <div
          className="flex items-center gap-3 cursor-pointer relative"
          onClick={() => setOpen(!open)}
        >
          <div className="text-right">
            <p className="text-sm font-semibold">
               {user?.fullName || "Admin"}
            </p>
            <p className="text-xs text-gray-500">{today}</p>
          </div>

          <img
            src={user?.avatar || "https://i.pravatar.cc/80"}
            alt="Profile"
            className="w-11 h-11 rounded-full object-cover border-2 border-[#00bcd4]"
          />

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 top-14 w-48 bg-white shadow-lg rounded-lg border border-gray-200 z-10">
              <div className="p-4 border-b">
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>

              {/* Edit Profile */}
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={() => navigate("/i-beauty/edit-profile")}
              >
                Edit Profile
              </button>

              {/* Logout */}
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>


          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
