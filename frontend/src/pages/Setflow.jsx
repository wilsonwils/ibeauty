import React, { useState } from "react";
import { API_BASE } from "../utils/api";
import Questionaire from "./Questionaire";

const Setflow = () => {
  const steps = [
    "Landing Page",
    "Questionaire",
    "Capture",
    "Contact",
    "Segmentation",
    "Skin Goal",
    "Summary & Routine",
    "Suggest Products",
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [thumbnail, setThumbnail] = useState(null);
  const [uploadedThumbnailUrl, setUploadedThumbnailUrl] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentSaveFunction, setCurrentSaveFunction] = useState(null);

  const uploadThumbnail = async (file) => {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`${API_BASE}/upload_image`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      return data.imageUrl || null;
    } catch (err) {
      console.error("Thumbnail upload error:", err);
      return null;
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setThumbnail(URL.createObjectURL(file));
    const url = await uploadThumbnail(file);
    setUploadedThumbnailUrl(url);
  };

  const saveLandingPage = async (flowId, userId) => {
    try {
      await fetch(`${API_BASE}/save_landing_page`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flow_id: flowId,
          user_id: userId,
          thumbnail: uploadedThumbnailUrl || null,
          cta_position: selectedPosition || null,
        }),
      });
    } catch (err) {
      console.error("Error saving landing page:", err);
    }
  };

  const saveStep = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return alert("User not logged in.");

    const stepName = steps[activeIndex];

    try {
      const res = await fetch(`${API_BASE}/create_flow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          flow_name: stepName,
          description: `${stepName} saved successfully`,
          cta_position: selectedPosition || null,
          thumbnail: uploadedThumbnailUrl || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert("Failed to save step: " + data.error);
        return;
      }

      if (data.flow_id) localStorage.setItem("flow_id", data.flow_id);
      if (stepName === "Landing Page") await saveLandingPage(data.flow_id, userId);
    } catch (err) {
      console.error("Error saving step:", err);
      alert("Failed to save step.");
    }
  };

  const validateStep = async () => {
    const stepName = steps[activeIndex];

    if (stepName === "Landing Page") {
      if (!uploadedThumbnailUrl && !selectedPosition) {
        alert("Upload thumbnail OR select CTA position.");
        return false;
      }
      return true;
    }

    if (stepName === "Questionaire") {
      if (typeof currentSaveFunction === "function") {
        return await currentSaveFunction();
      }
      return false;
    }

    return true;
  };

  const handleSaveNext = async () => {
    const isValid = await validateStep();
    if (!isValid) return;

    await saveStep();
    if (activeIndex < steps.length - 1) setActiveIndex(activeIndex + 1);
  };

  const goSkip = () => {
    if (activeIndex < steps.length - 1) setActiveIndex(activeIndex + 1);
  };

  const handleFinalSave = async () => {
    await saveStep();
    setIsCompleted(true);
  };

  const contents = [
    <div key="landing" className="flex flex-col gap-4">
      <label className="font-semibold">Add Thumbnail:</label>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="border p-2 rounded"
      />

      {thumbnail && (
        <div className="mt-4">
          <p className="font-semibold">Preview:</p>
          <img src={thumbnail} alt="Thumbnail" className="h-32 w-32 object-cover rounded" />
        </div>
      )}

      <div className="flex flex-col gap-2 mt-4">
        <label className="font-semibold">CTA Button Position:</label>
        <select
          value={selectedPosition}
          onChange={(e) => setSelectedPosition(e.target.value)}
          className="bg-white py-2 px-4 rounded border-2 w-max"
        >
          <option value="">Select</option>
          <option value="left">Left</option>
          <option value="right">Right</option>
          <option value="top">Top</option>
          <option value="bottom">Bottom</option>
        </select>
      </div>
    </div>,

    <Questionaire
  key={activeIndex} // force remount when activeIndex changes
  setSaveFunction={setCurrentSaveFunction}
/>,




    <div key="capture">Content for Capture</div>,
    <div key="contact">Content for Contact</div>,
    <div key="segmentation">Content for Segmentation</div>,
    <div key="skin_goal">Content for Skin Goal</div>,
    <div key="summary">Content for Summary & Routine</div>,
    <div key="suggest_products">Content for Suggest Products</div>,
  ];

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <button
              disabled={!isCompleted}
              onClick={() => isCompleted && setActiveIndex(index)}
              className={`flex-1 py-3 text-center font-bold rounded transition 
                ${activeIndex === index ? "bg-[#00bcd4] text-white" : "bg-gray-200"} 
                ${!isCompleted ? "cursor-not-allowed opacity-60" : "hover:bg-gray-300"}`}
            >
              {step}
            </button>
            {index < steps.length - 1 && <span className="mx-2 font-bold text-gray-500">→</span>}
          </React.Fragment>
        ))}
      </div>

      <div className="p-6 border rounded min-h-[150px] bg-gray-50 flex flex-col gap-4">
        <div className="flex-1">{contents[activeIndex]}</div>

        <div className="flex justify-end gap-3">
          {activeIndex > 0 && (
            <button
              onClick={() => setActiveIndex(activeIndex - 1)}
              className="px-4 py-2 bg-[#00bcd4] text-white rounded hover:bg-[#009aae]">
              Previous
            </button>
          )}

          {activeIndex !== steps.length - 1 && (
            <button
              onClick={goSkip}
              className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400">
              Skip
            </button>
          )}

          <button
            onClick={activeIndex === steps.length - 1 ? handleFinalSave : handleSaveNext}
            className="px-4 py-2 bg-[#00bcd4] text-white rounded hover:bg-[#009aae]">
            {activeIndex === steps.length - 1 ? "Save" : "Save & Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Setflow;
