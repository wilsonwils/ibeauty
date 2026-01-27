import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../utils/api";

const Permission = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [modules, setModules] = useState([]);
  const [planSignatures, setPlanSignatures] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [permissions, setPermissions] = useState({});

  // ---------------- FETCH USERS ----------------
  useEffect(() => {
    fetchUsers();
    fetchModules();
    fetchPlanSignatures();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("AUTH_TOKEN");
      const res = await fetch(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 403) {
        const data = await res.json();
        if (data.error === "FREE_TRIAL_EXPIRED") {
          alert("Your free trial has ended. Please upgrade your plan.");
          navigate("/i-beauty/add-plan");
          return;
        }
      }

      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- FETCH MODULES ----------------
  const fetchModules = async () => {
    const token = localStorage.getItem("AUTH_TOKEN");
    const res = await fetch(`${API_BASE}/all-modules`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    setModules(data.modules || []); // [{id,name}]
  };

  // ---------------- FETCH PLAN SIGNATURES ----------------
  const fetchPlanSignatures = async () => {
    const token = localStorage.getItem("AUTH_TOKEN");
    const res = await fetch(`${API_BASE}/plan-signatures`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    setPlanSignatures(data.plans || []); // [{id, plan_name, module_ids}]
  };

  // ---------------- OPEN PANEL ----------------
  const openPanel = (user) => {
    setSelectedUser(user);
    setIsPanelOpen(true);

    const plan = planSignatures.find(
      (p) => p.plan_name.toLowerCase() === user.plan.toLowerCase()
    );

    const defaultModules = plan ? plan.module_ids : [];
    const customModules = Array.isArray(user.customized_module_id)
      ? user.customized_module_id
      : [];

    const state = {};

    modules.forEach((mod) => {
      state[mod.id] =
        defaultModules.includes(mod.id) || customModules.includes(mod.id);
    });

    setPermissions(state);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
    setSelectedUser(null);
    setPermissions({});
  };

  // ---------------- TOGGLE MODULE ----------------
  const toggleModule = (id) => {
    setPermissions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // ---------------- UPDATE LOCAL STATE ----------------
  const updateLocalUserModules = (userId, newModules) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, customized_module_id: newModules } : u
      )
    );

    setSelectedUser((prev) =>
      prev && prev.id === userId
        ? { ...prev, customized_module_id: newModules }
        : prev
    );
  };

  // ---------------- SUBMIT ----------------
  const submitModules = async () => {
    if (!selectedUser) return;

    const plan = planSignatures.find(
      (p) => p.plan_name.toLowerCase() === selectedUser.plan.toLowerCase()
    );

    const defaultModules = plan ? plan.module_ids : [];

    const selectedModuleIds = Object.entries(permissions)
      .filter(([id, enabled]) => enabled && !defaultModules.includes(Number(id)))
      .map(([id]) => Number(id));

    try {
      const token = localStorage.getItem("AUTH_TOKEN");

      const res = await fetch(`${API_BASE}/update-modules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: selectedUser.id,
          module_ids: selectedModuleIds,
        }),
      });

      const data = await res.json();

      if (res.status === 200 && data.status === "success") {
        alert("Modules updated successfully!");
        updateLocalUserModules(selectedUser.id, selectedModuleIds);
        closePanel();
      } else {
        alert(data.error || "Something went wrong");
      }
    } catch (err) {
      alert("Server error");
    }
  };

  // ---------------- RENDER ----------------
  return (
    <>
      <div className="bg-white p-6 rounded shadow-md max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Permissions</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 border">Full Name</th>
                <th className="px-4 py-3 border">Email</th>
                <th className="px-4 py-3 border">Phone</th>
                <th className="px-4 py-3 border">Organization</th>
                <th className="px-4 py-3 border">Current Plan</th>
                <th className="px-4 py-3 border">Update Plan</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan="6" className="text-center py-6">
                    Loading...
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border">{user.full_name}</td>
                    <td className="px-4 py-2 border">{user.email}</td>
                    <td className="px-4 py-2 border">{user.phone}</td>
                    <td className="px-4 py-2 border">
                      {user.organization_name || "-"}
                    </td>

                       <td className="px-4 py-2 border">
                      {user.plan && user.plan.trim() && user.plan !== "-" ? (
                        <button
                          onClick={() => openPanel(user)}
                          className="hover:underline cursor-pointer font-medium text-black"
                        >
                          {user.plan}
                        </button>
                      ) : (
                        <button
                          className="font-medium text-gray-500"
                        >
                          Nil
                        </button>
                      )}
                    </td> 
                 
                    <td className="px-4 py-2 border text-center">
                      <button
                        onClick={() =>
                          navigate("/i-beauty/add-plan", {
                            state: {
                              user,
                              currentPlan: user.plan || null,
                            },
                          })
                        }
                        className="text-gray-600 hover:underline font-medium"
                      >
                        {user.plan && user.plan.trim() && user.plan !== "-" ? "Update Plan" : "Add Plan"}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT SLIDE PANEL */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-white border-l shadow-lg z-40 transition-transform ${
          isPanelOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedUser && (
          <div className="p-6 flex flex-col h-full">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-xl font-semibold">
                {selectedUser.plan} Plan Modules
              </h3>
              <button onClick={closePanel} className="text-xl">
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2 overflow-y-auto">
              {modules.map((mod) => {
                const plan = planSignatures.find(
                  (p) =>
                    p.plan_name.toLowerCase() ===
                    selectedUser.plan.toLowerCase()
                );

                const defaultModules = plan ? plan.module_ids : [];
                const customModules = selectedUser.customized_module_id || [];

                const isDefault = defaultModules.includes(mod.id);
                const isCustom = !isDefault && customModules.includes(mod.id);

                return (
                  <label
                    key={mod.id}
                    className={`flex items-center justify-between border-b py-1 text-sm ${
                      isDefault ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  >
                    <span>
                      {mod.name}{" "}
                      {isCustom && (
                        <span className="text-green-600 text-xs">
                          (custom)
                        </span>
                      )}
                    </span>

                    <input
                      type="checkbox"
                      checked={permissions[mod.id] || false}
                      disabled={isDefault}
                      onChange={() => toggleModule(mod.id)}
                    />
                  </label>
                );
              })}
            </div>

            <button
              onClick={submitModules}
              className="mt-auto bg-[#00bcd4] text-white py-2 rounded"
            >
              Submit
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Permission;
