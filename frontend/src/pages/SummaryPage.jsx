import React, { useEffect, useState } from "react";
import { API_BASE } from "../utils/api";

const SummaryPage = ({ data, setData, setSaveFunction }) => {
 
  const questions = [
    { label: "AI Generated Summary", key: "ai_generated_summary" },
    { label: "Download Pdf Template", key: "download_pdf_template" },
  ];

  // =======================================
  // FETCH SAVED SUMMARY
  // =======================================
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const token = localStorage.getItem("AUTH_TOKEN");
        if (!token) return;

        const res = await fetch(`${API_BASE}/flow/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const result = await res.json();

        if (res.ok && result) {
          // restore UI
          setSelected(prev => ({
            ...prev,
            ...result,
          }));

          // sync parent
          setData(prev => ({
            ...prev,
            ...result,
          }));
        }
      } catch (err) {
        console.error("Summary fetch failed:", err);
      }
    };

    fetchSummary();
  }, [setData]);

  // ================================
  // STATE
  // ================================
  const emptyState = questions.reduce((acc, q) => {
    acc[q.key] = null;
    return acc;
  }, {});

  const [selected, setSelected] = useState(() => ({
    ...emptyState,
    ...data,
  }));

  const [errorMsg, setErrorMsg] = useState("");

  // ================================
  // TOGGLE FUNCTION
  // ================================
  const toggle = (key, value) => {
    setSelected(prev => {
      const updated = { ...prev, [key]: value };
      const allFilled = questions.every(q => updated[q.key] !== null);
      if (allFilled) setErrorMsg(""); // clear error if all filled
      return updated;
    });

    setData(prev => ({ ...prev, [key]: value }));
  };

  // ================================
  // SAVE FUNCTION 
  // ================================
  const saveSummary = async (flowId, stepData, options = {}) => {
    const token = localStorage.getItem("AUTH_TOKEN");
    if (!flowId || !token) return false;

    const skip = options.skip === true;

    if (!skip) {
      const unfilled = questions.filter(q => selected[q.key] === null);
      if (unfilled.length > 0) {
        setErrorMsg("Please select Yes or No for all fields.");
        return false;
      }
    }

    const payload = skip ? {} : { ...selected };

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
        setErrorMsg(result.error || "Save failed");
        return false;
      }

      setErrorMsg("");
      setData(prev => ({ ...prev, ...payload }));
      return true;
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error. Please try again.");
      return false;
    }
  };

  useEffect(() => {
    setSaveFunction(() => saveSummary);
  }, [selected]);


  return (
    <div className="p-4 border rounded mt-4">
      {errorMsg && (
        <div className="mt-4 flex justify-center">
          <div className="inline-block rounded-md bg-red-100 border border-red-400 text-red-700 px-6 py-2 text-sm font-medium shadow-sm">
            {errorMsg}
          </div>
        </div>
      )}

      <h2 className="font-bold mb-4 text-lg">Summary</h2>

      <div className="flex flex-col gap-3">
        {questions.map(({ label, key }) => (
          <div key={key} className="flex items-center justify-between border p-3 rounded">
            <span className="font-medium">{label}</span>

            <div className="flex gap-3">
              <button
                onClick={() => toggle(key, "yes")}
                className={`px-4 py-1 rounded ${
                  selected[key] === "yes" ? "bg-[#01bcd5] text-white" : "bg-gray-300"
                }`}
              >
                Yes
              </button>

              <button
                onClick={() => toggle(key, "no")}
                className={`px-4 py-1 rounded ${
                  selected[key] === "no" ? "bg-[#01bcd5] text-white" : "bg-gray-300"
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
