import React, { useEffect, useState } from "react";
import { API_BASE } from "../utils/api";

const SuggestProduct = ({ data, setData, setSaveFunction }) => {


  const questions = ["product_suggestion"];

  const emptyState = questions.reduce((acc, q) => {
    acc[q] = null;
    return acc;
  }, {});


  const [selected, setSelected] = useState(() => ({
    ...emptyState,
  }));

  const [errorMsg, setErrorMsg] = useState("");

  // =====================================
  //  FETCH SAVED DATA 
  // =====================================
useEffect(() => {
  const fetchProduct = async () => {
    try {
      const token = localStorage.getItem("AUTH_TOKEN");
      if (!token) return;

      const res = await fetch(`${API_BASE}/flow/suggest-product`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) return;

      const result = await res.json();

    
      if (result?.product_suggestion === undefined || result?.product_suggestion === null) {
        return;
      }

      const normalizedValue =
        result.product_suggestion === "yes"
          ? true
          : result.product_suggestion === "no"
          ? false
          : null;

      //  RESTORE LOCAL STATE
      setSelected(prev => ({
        ...prev,
        product_suggestion: normalizedValue,
      }));

      //  SYNC FLOW DATA
      setData(prev => ({
        ...prev,
        product_suggestion: normalizedValue,
      }));

    } catch (err) {
      console.error("Suggest fetch failed:", err);
    }
  };

  fetchProduct();
}, [setData]);


  // =====================================
  // ERROR HANDLER
  // =====================================
  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 3000);
  };

  // =====================================
  //  TOGGLE YES / NO
  // =====================================
  const toggle = (key, value) => {
    const updated = { ...selected, [key]: value };

    setSelected(updated);
    setData(prev => ({ ...prev, [key]: value }));
    setErrorMsg("");
  };

  // =====================================
  //  SAVE FUNCTION 
  // =====================================
  const saveSuggest = async (flowId, stepData, options = {}) => {
    const token = localStorage.getItem("AUTH_TOKEN");
    if (!flowId || !token) return false;

    const skip = options.skip === true;

    
    if (!skip && questions.some(q => selected[q] === null)) {
      showError("Please select Yes or No before proceeding.");
      return false;
    }

  
    const payload = skip
      ? emptyState
      : questions.reduce((acc, q) => {
          acc[q] = selected[q];
          return acc;
        }, {});

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
        showError(result?.error || "Failed to save suggestion");
        return false;
      }

      return true;

    } catch (err) {
      console.error(err);
      showError("Network error. Try again.");
      return false;
    }
  };

  // =====================================
  // REGISTER SAVE FUNCTION
  // =====================================
  useEffect(() => {
    setSaveFunction(() => saveSuggest);
  }, [selected, setSaveFunction]);


  return (
    <div className="p-4 border rounded mt-4">

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
