import React, { useState, useEffect } from "react";
import { API_BASE } from "../utils/api";

const CapturePage = ({ data, setData, setSaveFunction }) => {
  const [description, setDescription] = useState(data.description || "");

  // Persist to parent (FIXED → properly merge)
  useEffect(() => {
    setData((prev) => ({ ...prev, description }));
  }, [description, setData]);

  useEffect(() => {
    const saveCapturePage = async () => {
      const userId = localStorage.getItem("userId");
      const flowId = localStorage.getItem("flow_id");

      const capture_id = flowId; // alias only in frontend

      if (!userId || !flowId) return false;

      try {
        const res = await fetch(`${API_BASE}/save_capture_page`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            flow_id: capture_id, // backend expects flow_id
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
        <label className="font-semibold">Description</label>
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
