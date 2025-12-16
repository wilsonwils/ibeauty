import React, { useState, useEffect } from "react";
import { API_BASE } from "../utils/api";

const SkingoalPage = ({ data, setData, setSaveFunction }) => {
  const conditions = [
    "Clearer, Balanced Skin",
    "Refined-looking pores",
    "Even-Toned complexion",
    "Brighten Skin",
    "Even Pigmentation",
    "Improve Hydration",
    "Smooth Texture",
    "Radiant Glow",
    "Youthful-looking skin",
    "Brighten under-eyes",
    "Improve Firmness",
    "Even Skin tone",
  ];

  
  const [selected, setSelected] = useState(() =>
    conditions.reduce((acc, c) => {
      acc[c] = data?.[c] || false;
      return acc;
    }, {})
  );

  const toggle = (field) => {
    setSelected((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  
  useEffect(() => {
    const saveSkingoal = async (flowId) => {
      const token = localStorage.getItem("AUTH_TOKEN");
      if (!flowId || !token) return false;

    
      const selectedFields = Object.keys(selected).filter(
        (k) => selected[k]
      );

      if (!selectedFields.length) {
        // alert("Select at least one skingoal option");
        return false;
      }

      try {
        const res = await fetch(`${API_BASE}/save_skingoal`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            flow_id: flowId,
            skingoal_fields: selectedFields, 
          }),
        });

        const result = await res.json();
        if (!res.ok) {
          alert(result.error || "Failed to save skingoal");
          return false;
        }

        
        const mapped = selectedFields.reduce((acc, f) => {
          acc[f] = true;
          return acc;
        }, {});

        setData({
          ...mapped,
          skingoal_id: result.id,
        });

        return true;
      } catch (err) {
        console.error(err);
        alert("Failed to save skingoal");
        return false;
      }
    };

    setSaveFunction(() => saveSkingoal);
  }, [selected, setSaveFunction, setData]);

  return (
    <div className="p-4 border rounded mt-4">
      <h2 className="font-bold mb-4 text-lg">Skin Goal</h2>

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

export default SkingoalPage;
