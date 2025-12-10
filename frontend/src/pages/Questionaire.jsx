import React, { useState, useEffect } from "react";
import { API_BASE } from "../utils/api";

const questionaireFields = {
  Gender: {
    type: "multi-select",
    options: ["Male", "Female", "Other"],
    placeholder: "Select gender",
    multi: true,
  },
  Age: {
    type: "number",
    placeholder: "Enter your minimum age",
  },
  "Skin Type": {
    type: "text",
    placeholder: "Enter your skin type",
  },
  Name: {
    noInput: true,
  },
  "Phone Number": {
    noInput: true,
  },
};

const Questionaire = ({ setSaveFunction }) => {
  const [questionaire, setQuestionaire] = useState({
    Gender: false,
    Age: false,
    "Skin Type": false,
    Name: false,
    "Phone Number": false,
  });

  const [answers, setAnswers] = useState({
    Gender: [],
    Age: "",
    "Skin Type": [],
  });

  const [skinInput, setSkinInput] = useState("");

  const [required, setRequired] = useState({
    Gender: false,
    Age: false,
    "Skin Type": false,
    Name: false,
    "Phone Number": false,
  });

  // ------------------------------------------------
  // 🔥 LOAD FROM LOCALSTORAGE (AUTO RESTORE)
  // ------------------------------------------------
  useEffect(() => {
    const saved = localStorage.getItem("questionaire_data");
    if (saved) {
      const parsed = JSON.parse(saved);
      setQuestionaire(parsed.questionaire || {});
      setAnswers(parsed.answers || {});
      setRequired(parsed.required || {});
    }
  }, []);

  // ------------------------------------------------
  // 🔥 SAVE TO LOCALSTORAGE (AUTO SAVE)
  // ------------------------------------------------
  useEffect(() => {
    localStorage.setItem(
      "questionaire_data",
      JSON.stringify({ questionaire, answers, required })
    );
  }, [questionaire, answers, required]);

  // ------------------------------
  // SAVE QUESTIONAIRE
  // ------------------------------
  const saveQuestionaire = async () => {
    const flow_id = localStorage.getItem("flow_id");
    const user_id = localStorage.getItem("userId");
    const organization_id = localStorage.getItem("organization_id");

    const anyYes = Object.values(questionaire).some((v) => v === true);
    if (!anyYes) {
      alert("Select at least one question (Yes).");
      return false;
    }

    if (!flow_id) {
      alert("Flow ID not found");
      return false;
    }

    const fields = {};

    Object.keys(questionaire).forEach((field) => {
      const isYes = questionaire[field];
      const config = questionaireFields[field];

      fields[field] = {
        type: config.type || null,
        options: config.options || null,
        required: required[field],
        yes_no: isYes ? "yes" : "no",
      };

      if (isYes && !config.noInput) {
        fields[field].keyValue = answers[field];
      }
    });

    try {
      const res = await fetch(`${API_BASE}/save_questionaire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flow_id,
          user_id,
          organization_id,
          fields,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert("Error: " + data.error);
        return false;
      }

      return true;
    } catch (err) {
      alert("Failed to connect");
      return false;
    }
  };

  // Multi-select gender
  const toggleGenderOption = (opt) => {
    setAnswers((prev) => {
      const updated = prev.Gender.includes(opt)
        ? prev.Gender.filter((o) => o !== opt)
        : [...prev.Gender, opt];

      return { ...prev, Gender: updated };
    });
  };

  // Skin type tags input
  const addSkinType = () => {
    if (!skinInput.trim()) return;

    setAnswers((prev) => ({
      ...prev,
      "Skin Type": [...prev["Skin Type"], skinInput.trim()],
    }));

    setSkinInput("");
  };

  const removeSkinType = (idx) => {
    setAnswers((prev) => ({
      ...prev,
      "Skin Type": prev["Skin Type"].filter((_, i) => i !== idx),
    }));
  };

  // Expose save function
  useEffect(() => {
    setSaveFunction(() => saveQuestionaire);
  }, [answers, questionaire, required]);

  // ------------------------------
  // RESET INPUTS when No clicked
  // ------------------------------
  const handleNoClick = (field) => {
    setQuestionaire((p) => ({ ...p, [field]: false }));
    setRequired((p) => ({ ...p, [field]: false }));

    setAnswers((prev) => {
      const updated = { ...prev };
      const config = questionaireFields[field];

      if (config?.multi) updated[field] = [];
      if (config?.type === "text" || config?.type === "number") updated[field] = "";
      if (field === "Skin Type") updated["Skin Type"] = [];
      return updated;
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4 border border-gray-300 rounded mt-4">
      <h2 className="font-semibold text-lg mb-3">Questionaire</h2>

      {Object.keys(questionaireFields).map((field) => {
        const config = questionaireFields[field];
        const showInput = questionaire[field] && !config.noInput;

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
                  }`}>
                  Yes
                </button>

                <button
                  onClick={() => handleNoClick(field)}
                  className={`px-3 py-1 rounded ${
                    questionaire[field] === false
                      ? "bg-[#01bcd5] text-white"
                      : "bg-gray-300"
                  }`}>
                  No
                </button>

                <input
                  type="checkbox"
                  checked={required[field]}
                  onChange={() =>
                    setRequired((p) => ({ ...p, [field]: !p[field] }))
                  }
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
                          checked={answers.Gender.includes(opt)}
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
                        className="bg-[#01bcd5] text-white px-3 py-2 rounded">
                        Add
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {answers["Skin Type"].map((type, index) => (
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
                    value={answers[field]}
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
