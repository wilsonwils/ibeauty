import React, { useState } from "react";
import { API_BASE } from "../utils/api";

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
  const [showSelect, setShowSelect] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);

  // ----------------------------
  // Upload thumbnail to backend
  // ----------------------------
  const uploadThumbnail = async (file) => {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`${API_BASE}/upload_image`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.imageUrl) return data.imageUrl;

      console.error("Thumbnail upload failed:", data);
      return null;
    } catch (err) {
      console.error("Error uploading thumbnail:", err);
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
      const response = await fetch(`${API_BASE}/save_landing_page`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flow_id: flowId,
          user_id: userId,
          thumbnail: uploadedThumbnailUrl || null,
          cta_position: selectedPosition || null,
        }),
      });

      const data = await response.json();
      console.log("Landing Page Saved:", data);
    } catch (err) {
      console.error("Error saving landing page:", err);
    }
  };

  // ----------------------------
  // Save current step dynamically
  // ----------------------------
  const saveStep = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      alert("User not logged in.");
      return;
    }

    const stepName = steps[activeIndex];

    try {
      const response = await fetch(`${API_BASE}/create_flow`, {
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

      const data = await response.json();

      if (!response.ok) {
        alert(`Failed to save step: ${data.error}`);
        return;
      }

      console.log("Step Saved:", data);

      // -----------------------------------
      // EXTRA CALL ONLY FOR LANDING PAGE
      // -----------------------------------
      if (stepName === "Landing Page") {
        await saveLandingPage(data.flow_id, userId);
      }

    } catch (error) {
      console.error("Error saving step:", error);
      alert("Failed to save step.");
    }
  };

  const goNext = async () => {
    await saveStep();
    if (activeIndex < steps.length - 1) setActiveIndex(activeIndex + 1);
  };

  const goSkip = () => goNext();

  const handleFinalSave = async () => {
    await saveStep();
    alert("Flow saved successfully!");
    setIsCompleted(true);
  };

  // ----------------------------
  // Step content
  // ----------------------------
  const contents = [
    <div className="flex flex-col gap-4" key="landing">
      <label className="font-semibold">Add Thumbnail:</label>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="border border-gray-300 rounded p-2"
      />

      {thumbnail && (
        <div className="mt-4">
          <p className="font-semibold">Preview:</p>
          <img
            src={thumbnail}
            alt="Thumbnail Preview"
            className="h-32 w-32 object-cover rounded"
          />
        </div>
      )}

      <div className="flex items-center gap-4 mt-4">
        <button
          onClick={() => setShowSelect(!showSelect)}
          className="bg-[#00bcd4] text-white py-2 px-4 rounded hover:bg-[#009aae]"
        >
          CTA Button Position
        </button>

        {showSelect && (
          <select
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
            className="border border-gray-300 rounded p-2"
          >
            <option value="">Select</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
          </select>
        )}
      </div>
    </div>,

    <div key="questionaire">Content for Questionaire</div>,
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
              className={`flex-1 py-3 text-center font-bold rounded transition-colors duration-300 
                ${activeIndex === index ? "bg-[#00bcd4] text-white" : "bg-gray-200"} 
                ${!isCompleted ? "cursor-not-allowed opacity-60" : "hover:bg-gray-300"}`}
            >
              {step}
            </button>
            {/* Add arrow between buttons except after last one */}
            {index < steps.length - 1 && (
              <span className="mx-2 text-gray-500 font-bold">→</span>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="relative p-6 border border-gray-300 rounded min-h-[150px] bg-gray-50">
        {contents[activeIndex]}

        <div className="absolute bottom-4 right-4 flex gap-3">
          {/* Previous Button */}
          {activeIndex > 0 && (
            <button
              onClick={() => setActiveIndex(activeIndex - 1)}
              className="px-4 py-2 bg-[#00bcd4] text-black rounded hover:bg-[#009aae]"
            >
              Previous
            </button>
          )}

          {/* Skip Button */}
          {activeIndex !== steps.length - 1 && (
            <button
              onClick={goSkip}
              className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
            >
              Skip
            </button>
          )}

          {/* Save / Save & Next */}
          {activeIndex === steps.length - 1 ? (
            <button
              onClick={handleFinalSave}
              className="px-4 py-2 bg-[#00bcd4] text-white rounded hover:bg-[#009aae]"
            >
              Save
            </button>
          ) : (
            <button
              onClick={goNext}
              className="px-4 py-2 bg-[#00bcd4] text-white rounded hover:bg-[#009aae]"
            >
              Save & Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Setflow;
