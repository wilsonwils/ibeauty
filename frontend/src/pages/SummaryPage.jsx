import React, { useEffect, useState } from "react";
import { API_BASE } from "../utils/api";

const SummaryPage = ({ data, setData, setSaveFunction }) => {
  const questions = [
    "AI Generated Summary",
    "Download Pdf Template",
  ];

  const emptyState = questions.reduce((acc, q) => {
    acc[q] = null;
    return acc;
  }, {});

  const [selected, setSelected] = useState(() => ({
    ...emptyState,
    ...data,
  }));

  // ✅ toggle yes / no
  const toggle = (key, value) => {
    setSelected((prev) => ({
      ...prev,
      [key]: value,
    }));

    // sync with Setflow data
    setData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // ✅ SAVE FUNCTION (no useRef)
  const saveSummary = async (flowId, stepData, options = {}) => {
  const token = localStorage.getItem("AUTH_TOKEN");
  if (!flowId || !token) return false;

  const skip = options.skip === true;

  const payload = skip
    ? {}
    : Object.fromEntries(
        Object.entries(stepData).filter(([_, value]) => value !== null)
      );

  try {
    const res = await fetch(`${API_BASE}/save_summary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        flow_id: flowId,
        summary_fields: payload,
        skip,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || "Save failed");
      return false;
    }

    if (!skip) {
      setData((prev) => ({
        ...prev,
        ...payload,
      }));
    }

    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

 
  useEffect(() => {
    setSaveFunction(() => saveSummary);
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
                  selected[key] === true
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
