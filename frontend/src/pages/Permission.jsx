import React, { useEffect, useState } from "react";
import { API_BASE } from "../utils/api";

const Permission = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch users");
        setUsers([]);
      } else {
        setUsers(Array.isArray(data.users) ? data.users : []);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Server error");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Permissions</h2>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
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

            {!loading && !error && users.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-6">
                  No users found
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
                  <td className="px-4 py-2 border">{user.organization_name || "-"}</td>
                  <td className="px-4 py-2 border">{user.plan || "-"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Permission;
