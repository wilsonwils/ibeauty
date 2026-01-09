import React, { useState, useEffect } from "react";
import MultiSelectDropdown from "../components/MultiSelectDropdown";
import { API_BASE } from "../utils/api";

/* ================= SEGMENTATION CONFIG ================= */
const segmentationFields = {
  "Skin Concerns": { multi: true },
  "Skin Conditions": { multi: true },
};

const Segmentation = ({ data, setData, setSaveFunction }) => {
  const [segmentation, setSegmentation] = useState(data.segmentation || {});
  const [answers, setAnswers] = useState({
    "Skin Concerns": Array.isArray(data.answers?.["Skin Concerns"])
      ? data.answers["Skin Concerns"]
      : [],
    "Skin Conditions": Array.isArray(data.answers?.["Skin Conditions"])
      ? data.answers["Skin Conditions"]
      : [],
  });
  const [required, setRequired] = useState(data.required || {});
  const [errorMsg, setErrorMsg] = useState("");

  const [skinConcerns, setSkinConcerns] = useState([]);
  const [skinConditions, setSkinConditions] = useState([]);

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 3000);
  };

  /* ================= FETCH OPTIONS ================= */
  useEffect(() => {
    const token = localStorage.getItem("AUTH_TOKEN");
    if (!token) return;

    fetch(`${API_BASE}/skin-concerns`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setSkinConcerns)
      .catch(console.error);

    fetch(`${API_BASE}/skin-conditions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setSkinConditions)
      .catch(console.error);
  }, []);

  /* ================= SYNC DATA ================= */
  useEffect(() => {
    setData({ segmentation, answers, required });
  }, [segmentation, answers, required]);

  /* ================= SAVE FUNCTION ================= */
  useEffect(() => {
    const saveSegmentation = async (flowId, _stepData, options = {}) => {
  const token = localStorage.getItem("AUTH_TOKEN");
  if (!flowId || !token) return false;

  const skip = options?.skip === true;
  if (!skip) {
    // ✅ VALIDATION: Yes but no options selected
    const invalidFields = Object.keys(segmentationFields).filter(
      (field) =>
        segmentation[field] === true &&
        (!answers[field] || answers[field].length === 0)
    );

    if (invalidFields.length > 0) {
      showError(
        `Please select at least one option for: ${invalidFields.join(", ")}`
      );
      return false;
    }
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
        skip,
        segmentation_fields: Object.keys(segmentationFields).map((field) => ({
          label: field,
          key: segmentation[field] ? "yes" : "no",
          required: required[field] || false,
          options: segmentation[field] ? answers[field] || [] : [],
        })),
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      showError(result.error || "Failed to save segmentation");
      return false;
    }

    return true;
  } catch (err) {
    console.error(err);
    showError("Failed to save segmentation");
    return false;
  }
};



    setSaveFunction(() => saveSegmentation);
  }, [segmentation, answers, required]);

  const handleNo = (field) => {
    setSegmentation((p) => ({ ...p, [field]: false }));
    setRequired((p) => ({ ...p, [field]: false }));
    setAnswers((p) => ({ ...p, [field]: [] }));
  };

 
  return (
    <div className="flex flex-col gap-4 p-4 border rounded mt-4">
      {errorMsg && (
        <div className="flex justify-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-2 rounded text-sm">
            {errorMsg}
          </div>
        </div>
      )}

      <h2 className="font-semibold text-lg">Segmentation</h2>

      {Object.keys(segmentationFields).map((field) => {
        const options =
          field === "Skin Concerns" ? skinConcerns : skinConditions;

        return (
          <div key={field} className="flex flex-col gap-2">
            <div className="flex items-center justify-between border p-2 rounded">
              <span className="font-medium">{field}</span>

              <div className="flex gap-3 items-center">
                <button
                  onClick={() =>
                    setSegmentation((p) => ({ ...p, [field]: true }))
                  }
                  className={`px-3 py-1 rounded ${
                    segmentation[field]
                      ? "bg-[#01bcd5] text-white"
                      : "bg-gray-300"
                  }`}
                >
                  Yes
                </button>

                <button
                  onClick={() => handleNo(field)}
                  className={`px-3 py-1 rounded ${
                    segmentation[field] === false
                      ? "bg-[#01bcd5] text-white"
                      : "bg-gray-300"
                  }`}
                >
                  No
                </button>

                <input
                  type="checkbox"
                  checked={required[field] || false}
                  onChange={() =>
                    setRequired((p) => ({ ...p, [field]: !p[field] }))
                  }
                />
              </div>
            </div>

            {segmentation[field] && (
              <MultiSelectDropdown
                label={field}
                options={options}
                selectedOptions={answers[field]}
                setSelectedOptions={(vals) =>
                  setAnswers((p) => ({ ...p, [field]: vals }))
                }
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Segmentation;
