import React, { useState, useEffect } from "react";
import MultiSelectDropdown from "../components/MultiSelectDropdown";
import { API_BASE } from "../utils/api";

/* ================= SEGMENTATION CONFIG ================= */
const segmentationFields = {
  "Skin Concerns": { multi: true },
  "Skin Conditions": { multi: true },
};

const Segmentation = ({ data, setData, setSaveFunction }) => {
  /* ================= STATE ================= */

  const [segmentation, setSegmentation] = useState(data.segmentation || {});

  const [answers, setAnswers] = useState({
    ...data.answers,
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

  /* ================= ERROR ================= */

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 3000);
  };

  /* ================= RESTORE FROM BACKEND ================= */

  useEffect(() => {
    const fetchSavedSegmentation = async () => {
      const token = localStorage.getItem("AUTH_TOKEN");
      if (!token) return;

      try {
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

          if (item.key === "yes") s[field] = true;
          else if (item.key === "no") s[field] = false;

          a[field] = item.options ?? [];
          r[field] = item.required || false;
        });

        setSegmentation(s);
        setAnswers(a);
        setRequired(r);
      } catch (err) {
        console.error("Restore failed", err);
      }
    };

    fetchSavedSegmentation();
  }, []);

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
    setData({ segmentation, answers, required });
  }, [segmentation, answers, required, setData]);

  /* ================= SAVE FUNCTION ================= */

  useEffect(() => {
    const saveSegmentation = async (flowId, _stepData, options = {}) => {
      const token = localStorage.getItem("AUTH_TOKEN");
      if (!flowId || !token) return false;

      const skip = options?.skip === true;

      const dataToSave = skip
        ? { segmentation: {}, answers: {}, required: {} }
        : _stepData || { segmentation, answers, required };

      /* ===== validation ===== */

      if (!skip) {
        // yes/no not selected
        const unselectedFields = Object.keys(segmentationFields).filter(
          (field) => dataToSave.segmentation?.[field] === undefined
        );

        if (unselectedFields.length > 0) {
          showError("Please select Yes or No for all segmentation fields");
          return false;
        }

        // yes selected but no options
        const emptyInputFields = Object.keys(segmentationFields).filter(
          (field) => {
            const isYes = dataToSave.segmentation?.[field] === true;
            if (!isYes) return false;

            const value = dataToSave.answers?.[field];
            return !value || value.length === 0;
          }
        );

        if (emptyInputFields.length > 0) {
          showError(
            `Please select at least one option for: ${emptyInputFields.join(", ")}`
          );
          return false;
        }
      }


      const segmentation_fields = Object.keys(segmentationFields).map((field) => ({
        label: field,
        key: dataToSave.segmentation?.[field] ? "yes" : "no",

        options:
          dataToSave.segmentation?.[field] === true
            ? dataToSave.answers?.[field] || []
            : [],

        required: dataToSave.required?.[field] || false,
      }));


      /* ===== API CALL ===== */

      try {
        const res = await fetch(`${API_BASE}/save_segmentation`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            flow_id: flowId,
            segmentation_fields: segmentation_fields,
            skip,
          }),
        });

        return res.ok;
      } catch (err) {
        console.error(err);
        showError("Failed to save segmentation");
        return false;
      }
    };

    setSaveFunction(() => saveSegmentation);
  }, [setSaveFunction, segmentation, answers, required]);

  /* ================= ACTIONS ================= */

  const handleNoClick = (field) => {
    setSegmentation((p) => ({ ...p, [field]: false }));
    setRequired((p) => ({ ...p, [field]: false }));
    setAnswers((p) => ({ ...p, [field]: [] }));
  };


  return (
    <div className="flex flex-col gap-4 p-4 border border-gray-300 rounded mt-4 relative">
      {errorMsg && (
        <div className="mt-4 flex justify-center">
          <div className="inline-block rounded-md bg-red-100 border border-red-400 text-red-700 px-6 py-2 text-sm font-medium shadow-sm">
            {errorMsg}
          </div>
        </div>
      )}

      <h2 className="font-semibold text-lg mb-3">Segmentation</h2>

      {Object.keys(segmentationFields).map((field) => {
        const options =
          field === "Skin Concerns" ? skinConcerns : skinConditions;

        return (
          <div key={field} className="flex flex-col gap-2">
            {/* YES / NO row */}
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
                  onClick={() => handleNoClick(field)}
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

            {/* Dropdown */}
            {segmentation[field] && (
              <MultiSelectDropdown
                label={field}
                options={options}
                selectedOptions={answers[field] || []}
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
