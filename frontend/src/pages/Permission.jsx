import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../utils/api";
import { MODULES, PLAN_SIGNATURES } from "../config/module";

const Permission = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [permissions, setPermissions] = useState({});

  // ---------------- FETCH USERS ----------------
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("AUTH_TOKEN");
      if (!token) throw new Error("Token missing");

      const res = await fetch(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- OPEN PANEL ----------------
  const openPanel = (user) => {
    setSelectedUser(user);
    setIsPanelOpen(true);

    const defaultModules = PLAN_SIGNATURES[user.plan] || [];
    const customModules = Array.isArray(user.customized_module_id)
      ? user.customized_module_id
      : [];

    const state = {};
    MODULES.forEach((_, index) => {
      const id = index + 1;
      state[id] = defaultModules.includes(id) || customModules.includes(id);
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

  // ---------------- UPDATE LOCAL USER MODULES ----------------
  const updateLocalUserModules = (userId, newModules) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, customized_module_id: newModules } : u
      )
    );
  };

  // ---------------- SUBMIT MODULES ----------------
  const submitModules = async () => {
    if (!selectedUser) {
      alert("No user selected!");
      return;
    }

    const defaultModules = PLAN_SIGNATURES[selectedUser.plan] || [];
    const selectedModuleIds = Object.entries(permissions)
      .filter(([id, enabled]) => {
        const numericId = parseInt(id, 10);
        return enabled && !defaultModules.includes(numericId);
      })
      .map(([id]) => parseInt(id, 10));

    try {
      const token = localStorage.getItem("AUTH_TOKEN");
      if (!token) {
        alert("Token missing. Please login again.");
        return;
      }

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
        alert(data.error || "Something went wrong while updating modules");
      }
    } catch (err) {
      console.error("Submit Modules Error:", err);
      alert("Failed to update modules due to network or server error.");
    }
  };

  return (
    <>
      {/* ========== MAIN TABLE ========== */}
      <div className="bg-white p-6 rounded shadow-md max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Permissions</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 border text-left">Full Name</th>
                <th className="px-4 py-3 border text-left">Email</th>
                <th className="px-4 py-3 border text-left">Phone</th>
                <th className="px-4 py-3 border text-left">Organization</th>
                <th className="px-4 py-3 border text-left">Plan</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan="5" className="text-center py-6">
                    Loading...
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-red-500">
                    {error}
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
                      onClick={() => navigate("/i-beauty/add-plan", { state: { user } })}
                      className="hover:underline cursor-pointer font-medium text-gray-500"
                    >
                      Add Plan
                    </button>
                  )}
                </td>


                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========== RIGHT PANEL ========== */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-white border-l shadow-lg z-40
        transform transition-transform duration-300
        ${isPanelOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {selectedUser && (
          <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-xl font-semibold">
                {selectedUser.plan && selectedUser.plan.trim()
                  ? selectedUser.plan
                  : "No Plan"}{" "}
                Plan Modules
              </h3>
              <button
                onClick={closePanel}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2 overflow-y-auto">
              {MODULES.map((moduleName, index) => {
                const id = index + 1;
                const defaultModules =
                  PLAN_SIGNATURES[selectedUser.plan] || [];
                const customModules = Array.isArray(
                  selectedUser.customized_module_id
                )
                  ? selectedUser.customized_module_id
                  : [];

                const isDefault = defaultModules.includes(id);
                const isCustomized =
                  !isDefault && customModules.includes(id);

                return (
                  <label
                    key={id}
                    className={`flex items-center justify-between border-b py-1 text-sm ${
                      isDefault
                        ? "opacity-60 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {moduleName}
                      {isCustomized && (
                        <span className="text-xs text-green-600 font-medium">
                          (customized)
                        </span>
                      )}
                    </span>
                    <input
                      type="checkbox"
                      checked={permissions[id] || false}
                      disabled={isDefault}
                      onChange={() => toggleModule(id)}
                      className="h-4 w-4 text-blue-600 disabled:cursor-not-allowed"
                    />
                  </label>
                );
              })}
            </div>

            <div className="mt-auto pt-4 border-t">
              <button
                onClick={submitModules}
                className="w-full bg-[#00bcd4] text-white py-2 rounded hover:bg-[#00acc1]"
              >
                Submit
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Permission;
