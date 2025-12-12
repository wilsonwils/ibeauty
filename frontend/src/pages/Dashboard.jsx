import React, { useState, useEffect } from "react";
import ProductCard from "../components/ProductCard";
import Side from "../components/Side";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { getModules } from "../services/moduleService";
import { api } from "../utils/api";
const Dashboard = () => {
  const { user, loading } = useUser();
  const [sideOpen, setSideOpen] = useState(false);
  const [open, setOpen] = useState(false);

  const [modules, setModules] = useState([]);
  const navigate = useNavigate();

  const today = new Date().toLocaleDateString();

  const handleLogout = () => {
    localStorage.removeItem("userId");
    navigate("/i-beauty");
  };

  // -----------------------------
  // 🔥 Fetch Modules From API
  // -----------------------------
  const fetchModules = async () => {
    try {
      const result = await getModules();
      setModules(result.data || result); // Adjust based on your backend response
    } catch (error) {
      console.error("Module fetch error:", error);
    }
  };
  
  
  const handleModuleClick = async (item) => {
  try {
    const res = await api("/check-module-access", {
      method: "POST",
      body: JSON.stringify({ moduleId: item.id }),
    });

    const data = await res.json();

    if (data.access) {
      navigate(`/i-beauty/product/${item.title}`);
    } else {
      alert(data.message || "Not subscribed to this module");
    }

  } catch (err) {
    console.error("Module access error", err);
    alert("Unable to verify module access");
  }
};


  // Fetch modules when page loads
  useEffect(() => {
    fetchModules();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg font-semibold">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f5f6fb] text-[#1b2341]">

      {/* SIDEBAR */}
      <div
        className={`transition-all duration-300 bg-white shadow-md h-screen fixed top-0 left-0 z-20
        ${sideOpen ? "w-[200px]" : "w-[85px]"}`}
      >
        <Side sideOpen={sideOpen} setSideOpen={setSideOpen} />
      </div>

      {/* MAIN CONTENT */}
      <div
        className={`flex-1 transition-all duration-300 ml-0 ${
          sideOpen ? "ml-[250px]" : "ml-[85px]"
        }`}
      >
        {/* HEADER */}
        <header className="bg-white shadow-sm">
          <div className="w-full px-10 py-4 flex items-center justify-between">
            <h1
              className="text-transparent bg-clip-text 
              bg-[linear-gradient(to_right,#00B7C2,#2D4DBA,#6A1B9A,#E65100,#D81B60,#1E40FF)]
              font-medium text-3xl tracking-wide"
            >
              iBEAUTY
            </h1>

            <div className="flex items-center gap-6 relative">
              <button className="text-2xl hover:text-[#0ab0ff] transition-colors">⚙️</button>

              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => setOpen(!open)}
              >
                <div className="text-right">
                  <p className="text-sm font-semibold">Hi {user?.fullName}</p>
                  <p className="text-xs text-gray-500">{today}</p>
                </div>

                <img
                  src={user?.avatar || "https://i.pravatar.cc/80"}
                  alt="Profile"
                  className="w-11 h-11 rounded-full object-cover border-2 border-[#0ab0ff]"
                />
              </div>

              {open && (
                <div className="absolute right-0 top-16 w-48 bg-white shadow-lg rounded-lg border border-gray-200">
                  <div className="p-4 border-b">
                    <p className="font-semibold">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
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
        </header>

        {/* MAIN BODY */}
        <main className="w-full px-10 py-10">
          <h2 className="text-3xl font-semibold mb-8">Products</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {modules.map((item) => (
              <ProductCard key={item.id || item.title} item={item}  onClick={handleModuleClick}  />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
