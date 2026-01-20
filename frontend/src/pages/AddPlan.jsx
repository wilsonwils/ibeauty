import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { API_BASE } from "../utils/api";

const AddPlan = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const user = location.state?.user;
  const currentPlan = location.state?.currentPlan;

  const [modules, setModules] = useState([]);
  const [plans, setPlans] = useState([]);
  const [selectedModules, setSelectedModules] = useState({});
  const [loading, setLoading] = useState(false);

  // ================= FETCH MODULES + PLAN SIGNATURES =================
  useEffect(() => {
    fetchModules();
    fetchPlans();
  }, []);

  const fetchModules = async () => {
    const token = localStorage.getItem("AUTH_TOKEN");
    const res = await fetch(`${API_BASE}/all-modules`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setModules(data.modules || []);
  };

  const fetchPlans = async () => {
    const token = localStorage.getItem("AUTH_TOKEN");
    const res = await fetch(`${API_BASE}/plan-signatures`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setPlans(data.plans || []); // [{id, plan_name, module_ids}]
  };

  // ================= TOGGLE MODULE =================
  const handleToggleModule = (planId, moduleId) => {
    setSelectedModules((prev) => {
      const prevSet = prev[planId] || [];
      return {
        ...prev,
        [planId]: prevSet.includes(moduleId)
          ? prevSet.filter((id) => id !== moduleId)
          : [...prevSet, moduleId],
      };
    });
  };

  // ================= SUBMIT =================
  const handleAddPlan = async (planName, planId) => {
    const token = localStorage.getItem("AUTH_TOKEN");
    if (!token) {
      alert("Authorization token missing!");
      return;
    }

    const payload = {
      user_id: user.id,
      organization_id: user.organization_id,
      plan_id: planId,
      customized_module_id: selectedModules[planId] || [],
    };

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/add-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Something went wrong");
        return;
      }

      alert(`Plan "${planName}" added successfully`);
      navigate("/i-beauty/organization-permission");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================= RENDER =================
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold">Update Plan for {user?.full_name}</h2>

      <div className="grid grid-cols-4 gap-6">
        {plans.map((plan) => {
          const defaultModules = plan.module_ids || [];

          const isCurrent =
            currentPlan && currentPlan.toLowerCase() === plan.plan_name.toLowerCase();

          return (
            <div
              key={plan.id}
              className={`border rounded-lg p-4 shadow ${
                isCurrent ? "border-green-500 bg-green-50" : "bg-white"
              }`}
            >
              <h3 className="text-center font-semibold text-lg mb-3">
                {plan.plan_name}
              </h3>

              <ul className="space-y-2 text-sm mb-4">
                {modules.map((mod) => {
                  const isDefault = defaultModules.includes(mod.id);
                  const isSelected = selectedModules[plan.id]?.includes(mod.id);

                  return (
                    <li key={mod.id} className="flex justify-between border-b pb-1">
                      <span className={isDefault ? "font-semibold" : "text-gray-700"}>
                        {mod.name}
                      </span>

                      <input
                        type="checkbox"
                        checked={isDefault || isSelected}
                        disabled={isDefault}
                        onChange={() => handleToggleModule(plan.id, mod.id)}
                      />
                    </li>
                  );
                })}
              </ul>

              <button
                onClick={() => handleAddPlan(plan.plan_name, plan.id)}
                disabled={loading || isCurrent}
                className={`w-full py-2 rounded font-semibold text-white ${
                  isCurrent ? "bg-green-500 cursor-not-allowed" : "bg-[#00bcd4]"
                }`}
              >
                {isCurrent ? "Current Plan" : "Select Plan"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AddPlan;
