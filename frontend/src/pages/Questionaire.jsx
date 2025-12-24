import React, { useState, useEffect } from "react";
import { API_BASE } from "../utils/api";

const questionaireFields = {
  Gender: {
    type: "multi-select",
    options: ["Male", "Female", "Transgender"],
    multi: true,
  },
  Age: { type: "number", placeholder: "Enter your minimum age" },
  "Skin Type": { type: "text", placeholder: "Enter your skin type" },
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
  const [skinInput, setSkinInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

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

      // Validation 1: Yes/No selected
      const unselectedFields = Object.keys(questionaireFields).filter(
        (field) => dataToSave.questionaire?.[field] === undefined
      );

      if (unselectedFields.length > 0 && !skip) {
        showError("Please select Yes or No for all questions");
        return false;
      }

      // Validation 2: Input required when Yes is selected
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

  /* ================= HANDLERS ================= */

  const toggleGenderOption = (opt) => {
    setAnswers((prev) => ({
      ...prev,
      Gender: prev.Gender?.includes(opt)
        ? prev.Gender.filter((o) => o !== opt)
        : [...(prev.Gender || []), opt],
    }));
  };

  const addSkinType = () => {
    if (!skinInput.trim()) return;
    setAnswers((prev) => ({
      ...prev,
      "Skin Type": [...(prev["Skin Type"] || []), skinInput.trim()],
    }));
    setSkinInput("");
  };

  const removeSkinType = (idx) => {
    setAnswers((prev) => ({
      ...prev,
      "Skin Type": prev["Skin Type"].filter((_, i) => i !== idx),
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

  /* ================= UI ================= */

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
                  title="Required"
                />
              </div>
            </div>

            {showInput && (
              <div className="flex flex-col gap-2">
                {config.multi ? (
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
                ) : field === "Skin Type" ? (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={skinInput}
                        placeholder={config.placeholder}
                        onChange={(e) => setSkinInput(e.target.value)}
                        className="border px-3 py-2 rounded w-full"
                      />
                      <button
                        onClick={addSkinType}
                        className="bg-[#01bcd5] text-white px-3 py-2 rounded"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {answers["Skin Type"]?.map((type, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-200 rounded flex items-center gap-2"
                        >
                          {type}
                          <button
                            onClick={() => removeSkinType(index)}
                            className="text-red-500 font-bold"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </>
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
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Questionaire;
