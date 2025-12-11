import React, { useState } from "react";
import { API_BASE } from "../utils/api";
import LandingPage from "./LandingPage";
import Questionaire from "./Questionaire";
import CapturePage from "./CapturePage";

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
  const [isCompleted, setIsCompleted] = useState(false);

  const [landingData, setLandingData] = useState({});
  const [questionData, setQuestionData] = useState({});
  const [captureData, setCaptureData] = useState({});

  const [lastSavedLanding, setLastSavedLanding] = useState({});
  const [lastSavedQuestion, setLastSavedQuestion] = useState({});
  const [lastSavedCapture, setLastSavedCapture] = useState({});

  const [currentSaveFunction, setCurrentSaveFunction] = useState(null);

  const isDataChanged = (oldData, newData) =>
    JSON.stringify(oldData) !== JSON.stringify(newData);

  const checkPageEmpty = (pageObj) =>
    Object.values(pageObj).every(
      (v) => v === null || v === "" || (Array.isArray(v) && v.length === 0)
    );

  // SAVE STEP
  const saveStep = async (skipValue) => {
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
          description: skipValue
            ? `${stepName} skipped`
            : `${stepName} saved successfully`,
          thumbnail: landingData.uploadedThumbnailUrl || null,
          cta_position: landingData.selectedPosition || null,
          landing_id: landingData.landing_id || null, // <-- pass landing ID
          skip: skipValue,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert("Failed to save step: " + data.error);
        return;
      }

      if (data.flow_id) localStorage.setItem("flow_id", data.flow_id);

      // SAVE PAGE DATA (Landing / Questionaire / Capture)
      if (typeof currentSaveFunction === "function") {
        await currentSaveFunction();
      }
    } catch (err) {
      console.error("Error saving step:", err);
      alert("Failed to save step.");
    }
  };

  const validateStep = async () => {
    const stepName = steps[activeIndex];

    if (stepName === "Landing Page") {
      if (!landingData.uploadedThumbnailUrl && !landingData.selectedPosition) {
        alert("Upload thumbnail OR select CTA position.");
        return false;
      }
    }

    if (stepName === "Questionaire" || stepName === "Capture") {
      if (typeof currentSaveFunction === "function") {
        return await currentSaveFunction();
      }
      return false;
    }

    return true;
  };

  const handleSaveNext = async () => {
    const stepName = steps[activeIndex];
    const isValid = await validateStep();
    if (!isValid) return;

    let shouldSave = false;

    if (stepName === "Landing Page")
      shouldSave = isDataChanged(lastSavedLanding, landingData);
    if (stepName === "Questionaire")
      shouldSave = isDataChanged(lastSavedQuestion, questionData);
    if (stepName === "Capture")
      shouldSave = isDataChanged(lastSavedCapture, captureData);

    if (shouldSave) {
      await saveStep(false);

      if (stepName === "Landing Page") setLastSavedLanding(landingData);
      if (stepName === "Questionaire") setLastSavedQuestion(questionData);
      if (stepName === "Capture") setLastSavedCapture(captureData);
    }

    if (activeIndex < steps.length - 1) setActiveIndex(activeIndex + 1);
  };

  const goSkip = async () => {
    const stepName = steps[activeIndex];
    let hasData = false;

    if (stepName === "Landing Page") hasData = !checkPageEmpty(landingData);
    if (stepName === "Questionaire") hasData = !checkPageEmpty(questionData);
    if (stepName === "Capture") hasData = !checkPageEmpty(captureData);

    if (hasData) {
      if (activeIndex < steps.length - 1) setActiveIndex(activeIndex + 1);
      return;
    }

    await saveStep(true);
    if (activeIndex < steps.length - 1) setActiveIndex(activeIndex + 1);
  };

  const handleFinalSave = async () => {
    await saveStep(false);
    setIsCompleted(true);
  };

  const contents = [
    <LandingPage
      key="landing"
      data={landingData}
      setData={setLandingData}
      setSaveFunction={setCurrentSaveFunction}
    />,
    <Questionaire
      key="questionaire"
      data={questionData}
      setData={setQuestionData}
      setSaveFunction={setCurrentSaveFunction}
    />,
    <CapturePage
      key="capture"
      data={captureData}
      setData={setCaptureData}
      setSaveFunction={setCurrentSaveFunction}
    />,
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
            {index < steps.length - 1 && (
              <span className="mx-2 font-bold text-gray-500">→</span>
            )}
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
              Skip & Next
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
