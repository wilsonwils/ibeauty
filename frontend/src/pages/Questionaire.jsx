import React, { useState, useEffect } from "react";
import { API_BASE } from "../utils/api";

const questionaireFields = {
  Gender: { type: "multi-select", options: ["Male", "Female", "Transgender"], multi: true },
  Age: { type: "number", placeholder: "Enter your minimum age" },
  "Skin Type": { type: "text", placeholder: "Enter your skin type" },
  Name: { noInput: true },
  "Phone Number": { noInput: true },
};

const Questionaire = ({ data, setData, setSaveFunction }) => {
  const [questionaire, setQuestionaire] = useState(data.questionaire || {});
  const [answers, setAnswers] = useState({
    ...data.answers,
    Gender: data.answers?.Gender || [],
    "Skin Type": data.answers?.["Skin Type"] || [],
  });
  const [required, setRequired] = useState(data.required || {});
  const [skinInput, setSkinInput] = useState("");
  const [popupMsg, setPopupMsg] = useState("");

  // Persist changes to parent (UNCHANGED)
  useEffect(() => {
    setData({ questionaire, answers, required });
  }, [questionaire, answers, required]);

  const showPopup = (msg) => {
    setPopupMsg(msg);
    setTimeout(() => setPopupMsg(""), 3000);
  };

  // ✅ ONLY flow_id logic fixed here
  useEffect(() => {
  const saveQuestionaire = async (flowId) => {
    const user_id = localStorage.getItem("userId");
    const token = localStorage.getItem("AUTH_TOKEN"); // ✅ get JWT token
    if (!flowId || !user_id || !token) return false;

    const isSkipMode = Object.keys(questionaire).every(
      (k) => questionaire[k] === false || questionaire[k] === undefined
    );

    if (!isSkipMode) {
      for (const field of Object.keys(questionaireFields)) {
        const config = questionaireFields[field];
        if (questionaire[field] && !config.noInput) {
          if (config.multi && (!answers[field] || answers[field].length === 0)) {
            showPopup(`Please select at least one option for "${field}"`);
            return false;
          }
          if (
            field === "Skin Type" &&
            (!answers["Skin Type"] || answers["Skin Type"].length === 0)
          ) {
            showPopup("Please add at least one skin type");
            return false;
          }
          if (
            !config.multi &&
            field !== "Skin Type" &&
            (!answers[field] || answers[field].toString().trim() === "")
          ) {
            showPopup(`Please fill the input for "${field}"`);
            return false;
          }
        }
      }
    }

    const fields = {};
    Object.keys(questionaireFields).forEach((field) => {
      fields[field] = {
        yes_no: questionaire[field] ? "yes" : "no",
        keyValue: answers[field] || (questionaireFields[field].multi ? [] : null),
        required: required[field] || false,
        type: questionaireFields[field].type || "yes_no",
        options: questionaireFields[field].options || null,
      };
    });

    try {
      const res = await fetch(`${API_BASE}/save_questionaire`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // ✅ include JWT token
        },
        body: JSON.stringify({
          flow_id: flowId,
          user_id,
          fields,
          skip: isSkipMode,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        showPopup(`Failed to save questionaire: ${result.error}`);
        return false;
      }

      return true;
    } catch (err) {
      console.error(err);
      showPopup("Failed to save questionaire.");
      return false;
    }
  };

  setSaveFunction(() => saveQuestionaire);
}, [answers, questionaire, required, setSaveFunction]);

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

  return (
    <div className="flex flex-col gap-4 p-4 border border-gray-300 rounded mt-4 relative">
      <h2 className="font-semibold text-lg mb-3">Questionaire</h2>

      {popupMsg && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded shadow-md z-50">
          {popupMsg}
        </div>
      )}

      {Object.keys(questionaireFields).map((field) => {
        const config = questionaireFields[field];
        const showInput = questionaire[field] && !config.noInput;

        return (
          <div key={field} className="flex flex-col gap-2">
            <div className="flex items-center justify-between border p-2 rounded">
              <span className="font-medium">{field}</span>
              <div className="flex gap-3 items-center">
                <button
                  onClick={() => setQuestionaire((p) => ({ ...p, [field]: true }))}
                  className={`px-3 py-1 rounded ${
                    questionaire[field] ? "bg-[#01bcd5] text-white" : "bg-gray-300"
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => handleNoClick(field)}
                  className={`px-3 py-1 rounded ${
                    questionaire[field] === false ? "bg-[#01bcd5] text-white" : "bg-gray-300"
                  }`}
                >
                  No
                </button>
                <input
                  type="checkbox"
                  checked={required[field] || false}
                  onChange={() => setRequired((p) => ({ ...p, [field]: !p[field] }))}
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
                      setAnswers((p) => ({ ...p, [field]: e.target.value }))
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
