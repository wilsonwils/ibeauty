import React, { useState, useEffect } from "react";
import { API_BASE } from "../utils/api";

const Segmentation = ({ data, setData, setSaveFunction }) => {
  const conditions = [
    "Oiliness",
    "Dark Circles",
    "Uneven Skin Tone",
    "Dark Spots",
    "Oxygen",
    "Dullness",
    "Pigmentation",
    "Hydration",
    "Eye Wrinkles",
    "Skin Firmness",
    "Wrinkles",
    "Smoothness",
    "Texture",
    "Acne",
  ];

  const [selected, setSelected] = useState(() =>
    conditions.reduce((acc, c) => {
      acc[c] = data?.[c] || false;
      return acc;
    }, {})
  );

  const [errorMsg, setErrorMsg] = useState("");

  const toggle = (field) => {
    setSelected((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 3000);
  };

  useEffect(() => {
    const saveSegmentation = async (flowId, _data, options = {}) => {
      const token = localStorage.getItem("AUTH_TOKEN");
      if (!flowId || !token) return false;

      const skip = options.skip === true;

      const selectedFields = skip
        ? []
        : Object.keys(selected).filter((k) => selected[k]);

     
      if (!skip && selectedFields.length === 0) {
        showError("Select at least one segmentation option");
        return false;
      }

      try {
        const res = await fetch(`${API_BASE}/save_segmentation`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            flow_id: flowId,
            segmentation_fields: selectedFields,
            skip,
          }),
        });

        const result = await res.json();

        if (!res.ok) {
          showError(result.error || "Failed to save segmentation");
          return false;
        }

     
        if (!skip) {
          const mapped = selectedFields.reduce((acc, f) => {
            acc[f] = true;
            return acc;
          }, {});

          setData({
            ...mapped,
            segmentation_id: result.id,
          });
        } else {
          setData({});
        }

        return true;
      } catch (err) {
        console.error(err);
        showError("Failed to save segmentation");
        return false;
      }
    };

    setSaveFunction(() => saveSegmentation);
  }, [selected, setSaveFunction, setData]);

  return (
    <div className="p-4 border rounded mt-4 relative">
      <h2 className="font-bold mb-4 text-lg">Segmentation</h2>

      {/* Error popup */}
      {errorMsg && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded shadow-md z-10">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 text-sm font-semibold">
        {conditions.map((cond) => (
          <label key={cond} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selected[cond]}
              onChange={() => toggle(cond)}
              className="w-4 h-4"
            />
            <span>{cond}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default Segmentation;
