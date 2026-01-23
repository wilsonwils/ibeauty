import React, { useState, useEffect } from "react";
import MultiSelectDropdown from "../components/MultiSelectDropdown";
import { API_BASE } from "../utils/api";

/* ================= SEGMENTATION CONFIG ================= */
const segmentationFields = {
  "Skin Concerns": { multi: true },
  "Skin Conditions": { multi: true },
};

const Segmentation = ({ data, setData, setSaveFunction }) => {

 

  const [segmentation, setSegmentation] = useState(() => data.segmentation || {});
  const [answers, setAnswers] = useState(() => ({
    "Skin Concerns": data.answers?.["Skin Concerns"] || [],
    "Skin Conditions": data.answers?.["Skin Conditions"] || [],
  }));
  const [required, setRequired] = useState(() => data.required || {});
  const [errorMsg, setErrorMsg] = useState("");

  const [skinConcerns, setSkinConcerns] = useState([]);
  const [skinConditions, setSkinConditions] = useState([]);

  /* ================= HELPERS ================= */

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 3000);
  };

  /* ================= RESTORE FROM BACKEND  ================= */

  useEffect(() => {
  if (Object.keys(data.segmentation || {}).length > 0) return;

  const fetchSegmentation = async () => {
    try {
      const token = localStorage.getItem("AUTH_TOKEN");
      if (!token) return;

      const res = await fetch(`${API_BASE}/flow/segmentation`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;

      const saved = await res.json();

      const s = {};
      const a = {};
      const r = {};

      saved.forEach((item) => {
        const field = item.label;

        s[field] = item.key === "yes"; 
        a[field] = item.options || [];   
        r[field] = item.required || false;
      });

      setSegmentation(s);
      setAnswers(a);
      setRequired(r);

      setData((prev) => ({
        ...prev,
        segmentation: s,
        answers: a,
        required: r,
      }));
    } catch (err) {
      console.error(err);
    }
  };

  fetchSegmentation();
}, [setData]);

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

  /* ================= SYNC TO PARENT ================= */

  useEffect(() => {
    setData((prev) => ({
      ...prev,
      segmentation,
      answers,
      required,
    }));
  }, [segmentation, answers, required, setData]);

  /* ================= SAVE FUNCTION (STABLE) ================= */

  const saveSegmentation = async (flowId, _stepData, options = {}) => {
    const token = localStorage.getItem("AUTH_TOKEN");
    if (!flowId || !token) return false;

    const skip = options?.skip === true;

    const finalSegmentation = skip ? {} : segmentation;
    const finalAnswers = skip ? {} : answers;
    const finalRequired = skip ? {} : required;

    if (!skip) {
  const enabledFields = Object.keys(segmentationFields).filter(
    (field) => finalSegmentation[field] === true
  );

  //  No field selected
  if (enabledFields.length === 0) {
    showError("Please select at least one segmentation option.");
    return false;
  }

  //  Selected but no answers
  const invalidFields = enabledFields.filter(
    (field) =>
      !finalAnswers[field] || finalAnswers[field].length === 0
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
            key: skip ? "no" : finalSegmentation[field] ? "yes" : "no",
            required: skip ? false : finalRequired[field] || false,
            options:
              skip || !finalSegmentation[field]
                ? []
                : finalAnswers[field] || [],
          })),
        }),
      });

      return res.ok;
    } catch (err) {
      console.error(err);
      showError("Failed to save segmentation");
      return false;
    }
  };

  useEffect(() => {
    setSaveFunction(() => saveSegmentation);
  }, [setSaveFunction]);

  /* ================= ACTIONS ================= */

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
