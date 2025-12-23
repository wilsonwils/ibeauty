import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MODULES, PLAN_SIGNATURES } from "../config/module";

const PLANS = [
  { id: 1, name: "Standard", modules: PLAN_SIGNATURES.Standard },
  { id: 2, name: "Pro", modules: PLAN_SIGNATURES.Pro },
  { id: 3, name: "Premium", modules: PLAN_SIGNATURES.Premium },
];

const AddPlan = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedModules, setSelectedModules] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(true);

  const navigate = useNavigate();

  // Fetch users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem("AUTH_TOKEN");
      if (!token) return alert("Authorization token missing!");

      try {
        const res = await fetch("/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch users");

        setUsers(data.users || []);
        if (data.users.length > 0) setSelectedUser(data.users[0]);
      } catch (err) {
        console.error(err);
        alert(`Error fetching users: ${err.message}`);
      } finally {
        setFetchingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  // Toggle module selection
  const handleToggleModule = (planId, moduleId) => {
    setSelectedModules((prev) => {
      const prevModules = prev[planId] || [];
      if (prevModules.includes(moduleId)) {
        return { ...prev, [planId]: prevModules.filter((id) => id !== moduleId) };
      } else {
        return { ...prev, [planId]: [...prevModules, moduleId] };
      }
    });
  };

  // Add plan
  const handleAddPlan = async (planName, planId) => {
    if (!selectedUser) {
      alert("Please select a user first!");
      return;
    }

    const modules = selectedModules[planId] || [];
    const token = localStorage.getItem("AUTH_TOKEN");
    if (!token) return alert("Authorization token missing!");

    const payload = {
      user_id: selectedUser.id,
      organization_id: selectedUser.organization_id || 123,
      plan_id: planId,
      customized_module_id: modules,
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

      alert(`Plan "${planName}" added successfully!`);

      // ✅ Redirect to permissions page
      navigate("/i-beauty/organization-permission");

    } catch (err) {
      console.error(err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingUsers) return <p>Loading users...</p>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4">Add Plan</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const defaultModules = plan.modules;

          return (
            <div
              key={plan.id}
              className="border rounded-lg p-4 shadow-sm transition bg-white border-gray-300"
            >
              <div className="flex justify-center items-center mb-4">
                <h3 className="font-semibold text-lg">{plan.name}</h3>
              </div>

              <ul className="pl-2 space-y-1 mb-4 text-sm">
                {MODULES.map((moduleName, index) => {
                  const moduleId = index + 1;
                  const isDefault = defaultModules.includes(moduleId);
                  const isSelected = selectedModules[plan.id]?.includes(moduleId);

                  return (
                    <li
                      key={moduleId}
                      className="flex justify-between items-center border-b border-gray-200 py-1"
                    >
                      <span className={isDefault ? "text-black font-semibold" : "text-gray-700"}>
                        {moduleName}
                      </span>
                      <input
                        type="checkbox"
                        checked={isDefault || isSelected}
                        disabled={isDefault}
                        onChange={() => handleToggleModule(plan.id, moduleId)}
                        className="h-5 w-5 text-blue-500"
                      />
                    </li>
                  );
                })}
              </ul>

              <button
                onClick={() => handleAddPlan(plan.name, plan.id)}
                disabled={loading || !selectedUser}
                className="w-full bg-[#00bcd4] text-white py-2 rounded-lg font-semibold hover:bg-[#00acc1] disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add Plan"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AddPlan;
