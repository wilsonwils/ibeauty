import React, { useState, useEffect } from "react";
import { API_BASE } from "../utils/api";

const CapturePage = ({ data, setData, setSaveFunction }) => {
  const [description, setDescription] = useState(data.description || "");

 
  useEffect(() => {
    setData((prev) => ({ ...prev, description }));
  }, [description, setData]);

  useEffect(() => {
  const saveCapturePage = async (flowId, _stepData, options = {}) => {
    const token = localStorage.getItem("AUTH_TOKEN");
    if (!flowId || !token) return false;

    const skip = options?.skip === true;

    try {
      const res = await fetch(`${API_BASE}/save_capture_page`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          flow_id: flowId,
          skip,
          text_area: skip ? null : _stepData?.description || "",
        }),
      });

      return res.ok;
    } catch (err) {
      console.error("Save error:", err);
      return false;
    }
  };

  setSaveFunction(() => saveCapturePage);
}, [setSaveFunction]);

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
