import React, { useEffect, useState } from "react";
import { API_BASE } from "../utils/api";

const SummaryPage = ({ data, setData, setSaveFunction }) => {
  const questions = [
    "AI Generated Summary",
    "Download Pdf Template",
  ];
 
  const [selected, setSelected] = useState(() =>
    questions.reduce((acc, q) => {
      acc[q] = data?.[q] ?? null;
      return acc;
    }, {})
  );

  const toggle = (key, value) => {
    setSelected((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  useEffect(() => {
  setSaveFunction(() => async (flowId) => {
    const token = localStorage.getItem("AUTH_TOKEN");
    if (!flowId || !token) return false;

    try {
      const res = await fetch(`${API_BASE}/save_suggestproduct`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          flow_id: flowId,
          suggest_fields: selected,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Save failed");
        return false;
      }

      const result = await res.json();
      setData({ ...selected, suggest_id: result.id });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  });
}, []);



  return (
    <div className="p-4 border rounded mt-4">
      <h2 className="font-bold mb-4 text-lg">Summary</h2>

      <div className="flex flex-col gap-3">
        {questions.map((key) => (
          <div
            key={key}
            className="flex items-center justify-between border p-3 rounded"
          >
            <span className="font-medium">{key}</span>

            <div className="flex gap-3">
              <button
                onClick={() => toggle(key, true)}
                className={`px-4 py-1 rounded ${
                  selected[key]
                    ? "bg-[#01bcd5] text-white"
                    : "bg-gray-300"
                }`}
              >
                Yes
              </button>

              <button
                onClick={() => toggle(key, false)}
                className={`px-4 py-1 rounded ${
                  selected[key] === false
                    ? "bg-[#01bcd5] text-white"
                    : "bg-gray-300"
                }`}
              >
                No
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SummaryPage;
