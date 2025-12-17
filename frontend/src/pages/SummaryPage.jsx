import React, { useEffect, useState, useCallback, useRef } from "react";
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

  // ✅ REF ALWAYS HOLDS LATEST STATE
  const selectedRef = useRef(selected);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const toggle = (key, value) => {
  setSelected((prev) => {
    const updated = {
      ...prev,
      [key]: value,
    };

    // 🔑 SYNC WITH SETFLOW STATE
    setData((d) => ({
      ...d,
      [key]: value,
    }));

    return updated;
  });
};

  // ✅ SAVE FUNCTION (reads from ref, not stale state)
  const saveSummary = useCallback(
    async (flowId, _data, options = {}) => {
      const token = localStorage.getItem("AUTH_TOKEN");
      if (!flowId || !token) return false;

      const skip = options.skip === true;

      const source = selectedRef.current;

      const payload = skip
        ? {}
        : Object.fromEntries(
            Object.entries(source).filter(
              ([_, value]) => value !== null
            )
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
      } catch (e) {
        console.error(e);
        return false;
      }
    },
    [setData]
  );

  // ✅ register save fn
  useEffect(() => {
    setSaveFunction(() => saveSummary);
  }, [saveSummary, setSaveFunction]);

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
