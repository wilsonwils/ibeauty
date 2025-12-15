import React, { useState, useEffect } from "react";
import { API_BASE } from "../utils/api";

const CapturePage = ({ data, setData, setSaveFunction }) => {
  const [description, setDescription] = useState(data.description || "");

  // Persist to parent (UNCHANGED)
  useEffect(() => {
    setData((prev) => ({ ...prev, description }));
  }, [description, setData]);

  useEffect(() => {
  const saveCapturePage = async (flowId) => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("AUTH_TOKEN"); 
    console.log(token);
    if (!userId || !flowId || !token) return false;

    try {
      const res = await fetch(`${API_BASE}/save_capture_page`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // ✅ send token
        },
        body: JSON.stringify({
          flow_id: flowId,
          user_id: userId,
          text_area: description,
        }),
      });

      await res.json();
      return res.ok;
    } catch (err) {
      console.error("Save error:", err);
      return false;
    }
  };

  setSaveFunction(() => saveCapturePage);
}, [description, setSaveFunction]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="font-semibold">Disclaimer</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border p-2 rounded"
          rows={4}
          placeholder="Enter description here"
        />
      </div>
    </div>
  );
};

export default CapturePage;
