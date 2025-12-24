import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MODULES, PLAN_SIGNATURES } from "../config/module";

const PLANS = [
  { id: 0, name: "Trial", modules: PLAN_SIGNATURES.trial },
  { id: 1, name: "Standard", modules: PLAN_SIGNATURES.standard },
  { id: 2, name: "Pro", modules: PLAN_SIGNATURES.Pro },
  { id: 3, name: "Premium", modules: PLAN_SIGNATURES.Premium },
];

const AddPlan = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = location.state?.user; 

  const [selectedModules, setSelectedModules] = useState({});
  const [loading, setLoading] = useState(false);

  if (!user) {
    return <p className="p-6">No user selected. Go back and select a user first.</p>;
  }

  // ================= MODULE TOGGLE =================
  const handleToggleModule = (planId, moduleId) => {
    setSelectedModules((prev) => {
      const prevModules = prev[planId] || [];
      return {
        ...prev,
        [planId]: prevModules.includes(moduleId)
          ? prevModules.filter((id) => id !== moduleId)
          : [...prevModules, moduleId],
      };
    });
  };

  // ================= ADD PLAN =================
  const handleAddPlan = async (planName, planId) => {
    const token = localStorage.getItem("AUTH_TOKEN");
    if (!token) return alert("Authorization token missing!");

    const payload = {
      user_id: user.id,
      organization_id: user.organization_id || 123,
      plan_id: planId,
      customized_module_id: selectedModules[planId] || [],
    };

    setLoading(true);
    try {
      const res = await fetch("/api/add-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add plan");

      alert(`Plan "${planName}" added successfully`);
      navigate("/i-beauty/organization-permission");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================= UI =================
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold">Add Plan for {user.full_name || user.name}</h2>

      <div className="grid grid-cols-4 gap-6">
        {PLANS.map((plan) => {
          const defaultModules = plan.modules;

          return (
            <div key={plan.id} className="border rounded-lg p-4 shadow bg-white">
              <h3 className="text-center font-semibold text-lg mb-3">{plan.name}</h3>

              <ul className="space-y-2 text-sm mb-4">
                {MODULES.map((moduleName, index) => {
                  const moduleId = index + 1;
                  const isDefault = defaultModules.includes(moduleId);
                  const isSelected = selectedModules[plan.id]?.includes(moduleId);

                  return (
                    <li key={moduleId} className="flex justify-between border-b pb-1">
                      <span className={isDefault ? "font-semibold text-black" : "text-gray-700"}>
                        {moduleName}
                      </span>
                      <input
                        type="checkbox"
                        checked={isDefault || isSelected}
                        disabled={isDefault}
                        onChange={() => handleToggleModule(plan.id, moduleId)}
                        className="h-4 w-4"
                      />
                    </li>
                  );
                })}
              </ul>

<button
  onClick={() => handleAddPlan(plan.name, plan.id)}
  disabled={loading}
  className="w-full bg-[#00bcd4] text-white py-2 rounded font-semibold hover:bg-[#00acc1] disabled:opacity-50"
>
  {plan.name.toLowerCase() === "trial" ? "Free Trial" : "Add Plan"}
</button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AddPlan;
