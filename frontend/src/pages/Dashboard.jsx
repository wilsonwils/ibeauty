import React, { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";
import { useNavigate } from "react-router-dom";
import { getModules } from "../services/moduleService";
import { api } from "../utils/api";

const Dashboard = () => {
  const [modules, setModules] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getModules().then((res) => {
      setModules(res.data || res);
    });
  }, []);

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
      console.error(err);
      alert("Unable to verify module access");
    }
  };

  return (
    <main className="w-full px-10 py-10">
      <h2 className="text-3xl font-semibold mb-8">Products</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-30">
        {modules.map((item) => (
          <ProductCard
            key={item.id || item.title}
            item={item}
            onClick={handleModuleClick}
          />
        ))}
      </div>
    </main>
  );
};

export default Dashboard;
