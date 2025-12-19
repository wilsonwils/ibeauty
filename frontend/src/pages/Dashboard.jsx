import React, { useState, useEffect } from "react";
import ProductCard from "../components/ProductCard";
import Side from "../components/Side";
import Header from "../components/Header"; // ✅ Import Header
import { useNavigate } from "react-router-dom";
import { getModules } from "../services/moduleService";
import { api } from "../utils/api";

const Dashboard = () => {
  const [sideOpen, setSideOpen] = useState(false);
  const [modules, setModules] = useState([]);
  const navigate = useNavigate();

  const fetchModules = async () => {
    try {
      const result = await getModules();
      setModules(result.data || result);
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

  useEffect(() => {
    fetchModules();
  }, []);

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
        <Header /> {/* ✅ Use the Header component */}

        {/* MAIN BODY */}
        <main className="w-full px-10 py-10">
          <h2 className="text-3xl font-semibold mb-8">Products</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {modules.map((item) => (
              <ProductCard
                key={item.id || item.title}
                item={item}
                onClick={handleModuleClick}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
