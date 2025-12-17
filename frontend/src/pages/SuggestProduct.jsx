import React, { useEffect, useState } from "react";
import { API_BASE } from "../utils/api";

const SuggestProduct = ({ data, setData, setSaveFunction }) => {
  const questions = ["Product Suggestion"];

  const emptyState = questions.reduce((acc, q) => {
    acc[q] = null;
    return acc;
  }, {});

  const [selected, setSelected] = useState(() => ({
    ...emptyState,
    ...data,
  }));

  const [errorMsg, setErrorMsg] = useState("");

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 3000);
  };

  const toggle = (key, value) => {
    const updated = { ...selected, [key]: value };
    setSelected(updated);
    setData(updated);
  };

 
  const saveSuggest = async (flowId, stepData, options = {}) => {
  const token = localStorage.getItem("AUTH_TOKEN");
  if (!flowId || !token) return false;

  const skip = options.skip === true;

 
  if (!skip && Object.values(stepData).some((v) => v === null)) {
    showError("Please select an option before proceeding.");
    return false;
  }

  const payload = skip
    ? questions.reduce((acc, q) => ({ ...acc, [q]: null }), {})
    : stepData;

  try {
    const res = await fetch(`${API_BASE}/save_suggestproduct`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        flow_id: flowId,
        suggest_fields: payload,
        skip,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      showError(result.error || "Failed to save suggestion");
      return false;
    }

    return true;
  } catch (err) {
    console.error("Save error:", err);
    showError("Failed to save suggestion");
    return false;
  }
};


  useEffect(() => {
    setSaveFunction(() => saveSuggest);

  }, []);

  return (
    <div>
      <h2 className="font-bold mb-4 text-lg">Product Suggestion</h2>

      {errorMsg && (
        <div className="mt-4 flex justify-center">
          <div className="inline-block rounded-md bg-red-100 border border-red-400 text-red-700 px-6 py-2 text-sm font-medium shadow-sm">
            {errorMsg}
          </div>
        </div>
      )}


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
  );
};

export default SuggestProduct;
