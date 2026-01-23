import React, { useState, useEffect, useRef } from "react";
import { API_BASE } from "../utils/api";
import MultiSelectDropdown from "../components/MultiSelectDropdown";

/* ================= QUESTION CONFIG ================= */
const questionaireFields = {
  Gender: {
    type: "multi-select",
    options: ["Male", "Female", "Transgender"],
    multi: true,
  },
  Age: { type: "number", placeholder: "Enter your minimum age" },
  "Skin Type": {
    type: "multi-select",
    options: [],
    multi: true,
  },
};

const Questionaire = ({ data, setData, setSaveFunction }) => {
  const [questionaire, setQuestionaire] = useState(data.questionaire || {});
  const [answers, setAnswers] = useState({
    ...data.answers,
    Gender: Array.isArray(data.answers?.Gender) ? data.answers.Gender : [],
    "Skin Type": Array.isArray(data.answers?.["Skin Type"])
      ? data.answers["Skin Type"]
      : [],
  });
  const [required, setRequired] = useState(data.required || {});
  const [errorMsg, setErrorMsg] = useState("");

  const [skinTypes, setSkinTypes] = useState([]);

  useEffect(() => {
  const fetchSavedQuestionnaire = async () => {
    const token = localStorage.getItem("AUTH_TOKEN");
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/flow/questionnaire`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;

      const saved = await res.json();

      const q = {};
      const a = {};
      const r = {};

      Object.keys(saved).forEach((field) => {

       
        if (saved[field].key === "yes") q[field] = true;
        else if (saved[field].key === "no") q[field] = false;

        a[field] =
          saved[field].value ??
          (questionaireFields[field]?.multi ? [] : "");

        r[field] = saved[field].required || false;
      });

      setQuestionaire(q);
      setAnswers(a);
      setRequired(r);

    } catch (err) {
      console.error("Restore failed", err);
    }
  };

  fetchSavedQuestionnaire();
}, []);


  /* ================= FETCH SKIN TYPES ================= */
  useEffect(() => {
    const fetchSkinTypes = async () => {
      const token = localStorage.getItem("AUTH_TOKEN");
      if (!token) return;

      try {
        const res = await fetch(`${API_BASE}/skin_types`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setSkinTypes(await res.json());
      } catch (err) {
        console.error("Failed to fetch skin types", err);
      }
    };
    fetchSkinTypes();
  }, []);

  useEffect(() => {
    setData({ questionaire, answers, required });
  }, [questionaire, answers, required]);

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 3000);
  };

  /* ================= SAVE FUNCTION ================= */
  useEffect(() => {
    const saveQuestionaire = async (flowId, _stepData, options = {}) => {
      const user_id = localStorage.getItem("userId");
      const token = localStorage.getItem("AUTH_TOKEN");
      if (!flowId || !user_id || !token) return false;

      const skip = options?.skip === true;
      const dataToSave = skip
        ? {}
        : _stepData || { questionaire, answers, required };

      const unselectedFields = Object.keys(questionaireFields).filter(
        (field) => dataToSave.questionaire?.[field] === undefined
      );

      if (unselectedFields.length > 0 && !skip) {
        showError("Please select Yes or No for all questions");
        return false;
      }

      const emptyInputFields = Object.keys(questionaireFields).filter(
        (field) => {
          const isYes = dataToSave.questionaire?.[field] === true;
          if (!isYes) return false;

          const config = questionaireFields[field];
          const value = dataToSave.answers?.[field];

          if (config.multi && Array.isArray(value) && value.length === 0)
            return true;
          if (!config.multi && (!value || value.toString().trim() === ""))
            return true;

          return false;
        }
      );

      if (emptyInputFields.length > 0 && !skip) {
        showError(
          `Please select or enter value for: ${emptyInputFields.join(", ")}`
        );
        return false;
      }

      const fields = {};
      Object.keys(questionaireFields).forEach((field) => {
        fields[field] = {
          yes_no: dataToSave.questionaire?.[field] ? "yes" : "no",
          value:
            dataToSave.answers?.[field] ||
            (questionaireFields[field].multi ? [] : null),
          required: dataToSave.required?.[field] || false,
          type: questionaireFields[field].type || "yes_no",
          options: questionaireFields[field].options || null,
        };
      });

      try {
        const res = await fetch(`${API_BASE}/save_questionaire`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            flow_id: flowId,
            user_id,
            fields,
            skip,
          }),
        });

        const result = await res.json();
        if (!res.ok) {
          showError(`Failed to save questionaire: ${result.error}`);
          return false;
        }

        return true;
      } catch (err) {
        console.error(err);
        showError("Failed to save questionaire.");
        return false;
      }
    };

    setSaveFunction(() => saveQuestionaire);
  }, [setSaveFunction, questionaire, answers, required]);

  const toggleGenderOption = (opt) => {
    setAnswers((prev) => ({
      ...prev,
      Gender: prev.Gender?.includes(opt)
        ? prev.Gender.filter((o) => o !== opt)
        : [...(prev.Gender || []), opt],
    }));
  };

  const handleNoClick = (field) => {
    setQuestionaire((p) => ({ ...p, [field]: false }));
    setRequired((p) => ({ ...p, [field]: false }));
    setAnswers((prev) => ({
      ...prev,
      [field]: questionaireFields[field]?.multi ? [] : "",
    }));
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

      <h2 className="font-semibold text-lg mb-3">Questionaire</h2>

      {Object.keys(questionaireFields).map((field) => {
        const config = questionaireFields[field];
        const showInput = questionaire[field];

        return (
          <div key={field} className="flex flex-col gap-2">
            <div className="flex items-center justify-between border p-2 rounded">
              <span className="font-medium">{field}</span>
              <div className="flex gap-3 items-center">
                <button
                  onClick={() =>
                    setQuestionaire((p) => ({ ...p, [field]: true }))
                  }
                  className={`px-3 py-1 rounded ${
                    questionaire[field]
                      ? "bg-[#01bcd5] text-white"
                      : "bg-gray-300"
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => handleNoClick(field)}
                  className={`px-3 py-1 rounded ${
                    questionaire[field] === false
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

            {showInput && (
              <>
                {field === "Skin Type" ? (
                  <MultiSelectDropdown
                    label="Skin Type"
                    options={skinTypes}
                    selectedOptions={answers["Skin Type"] || []}
                    setSelectedOptions={(vals) =>
                      setAnswers((p) => ({ ...p, "Skin Type": vals }))
                    }
                  />
                ) : config.multi ? (
                  <div className="flex gap-4 ml-2 mt-1">
                    {config.options.map((opt) => (
                      <label key={opt} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={answers.Gender?.includes(opt) || false}
                          onChange={() => toggleGenderOption(opt)}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    type={config.type}
                    placeholder={config.placeholder}
                    value={answers[field] || ""}
                    onChange={(e) =>
                      setAnswers((p) => ({
                        ...p,
                        [field]: e.target.value,
                      }))
                    }
                    className="border px-3 py-2 rounded w-full"
                  />
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Questionaire;
