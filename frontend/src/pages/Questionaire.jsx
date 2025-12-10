import React, { useState } from "react";

const questionnaireFields = {
  Gender: {
    type: "select",
    options: ["Male", "Female", "Other"],
    placeholder: "Select your gender",
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

const Questionnaire = () => {
  const [questionnaire, setQuestionnaire] = useState({
    Gender: false,
    Age: false,
    "Skin Type": false,
    Name: false,
    "Phone Number": false,
  });

  const [answers, setAnswers] = useState({
    Gender: "",
    Age: "",
    "Skin Type": "",
  });

  const [required, setRequired] = useState({
    Gender: false,
    Age: false,
    "Skin Type": false,
    Name: false,
    "Phone Number": false,
  });

  // ---------------------------------------------------
  // SAVE QUESTIONNAIRE API CALL
  // ---------------------------------------------------
  const saveQuestionnaire = async () => {
    const flow_id = localStorage.getItem("flow_id");
    const user_id = localStorage.getItem("userId");
    const organization_id = localStorage.getItem("organization_id");

    if (!flow_id) {
      alert("Flow ID not found");
      return;
    }

    const fields = {};

    Object.keys(questionnaire).forEach((field) => {
      const isYes = questionnaire[field] === true;
      const config = questionnaireFields[field];

      fields[field] = {
        type: config.type || null,
        options: config.options || null,
        required: required[field],
        yes_no: isYes ? "yes" : "no",
      };

      // If YES and has input field
      if (isYes && !config.noInput) {
        fields[field].keyValue = answers[field];
      }
    });

    console.log("Sending payload:", {
      flow_id,
      user_id,
      organization_id,
      fields,
    });

    try {
      const res = await fetch("http://localhost:5000/save_questionnaire", {
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

      if (res.ok) {
        alert("Questionnaire saved successfully");
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      alert("Failed to connect to API");
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 border border-gray-300 rounded mt-4">
      <h2 className="font-semibold text-lg mb-3">Questionnaire</h2>

      {/* List of fields */}
      {Object.keys(questionnaireFields).map((field) => {
        const config = questionnaireFields[field];
        const showInput = questionnaire[field] && !config.noInput;

        return (
          <div key={field} className="flex flex-col gap-2">
            <div className="flex items-center justify-between border p-2 rounded">
              <span className="font-medium">{field}</span>

              <div className="flex gap-3 items-center">
                {/* YES button */}
                <button
                  onClick={() =>
                    setQuestionnaire((prev) => ({ ...prev, [field]: true }))
                  }
                  className={`px-3 py-1 rounded ${
                    questionnaire[field]
                      ? "bg-[#01bcd5] text-white"
                      : "bg-gray-300"
                  }`}
                >
                  Yes
                </button>

                {/* NO button */}
                <button
                  onClick={() =>
                    setQuestionnaire((prev) => ({ ...prev, [field]: false }))
                  }
                  className={`px-3 py-1 rounded ${
                    questionnaire[field] === false
                      ? "bg-[#01bcd5] text-white"
                      : "bg-gray-300"
                  }`}
                >
                  No
                </button>

                {/* Required checkbox */}
                <input
                  type="checkbox"
                  checked={required[field]}
                  onChange={() =>
                    setRequired((prev) => ({
                      ...prev,
                      [field]: !prev[field],
                    }))
                  }
                />
              </div>
            </div>

            {/* Show input if YES */}
            {showInput && (
              <div className="flex gap-2">
                {config.type === "select" ? (
                  <select
                    value={answers[field]}
                    onChange={(e) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [field]: e.target.value,
                      }))
                    }
                    className="border px-3 py-2 rounded w-full"
                  >
                    <option value="">{config.placeholder}</option>
                    {config.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={config.type}
                    placeholder={config.placeholder}
                    value={answers[field]}
                    onChange={(e) =>
                      setAnswers((prev) => ({
                        ...prev,
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

      {/* Save Button */}
      <button
        onClick={saveQuestionnaire}
        className="bg-[#01bcd5] text-white px-4 py-2 rounded"
      >
        Save Questionnaire
      </button>
    </div>
  );
};

export default Questionnaire;
