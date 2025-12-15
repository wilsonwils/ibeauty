// Setflow.jsx
import React, { useState } from "react";
import { API_BASE } from "../utils/api";
import LandingPage from "./LandingPage";
import Questionaire from "./Questionaire";
import CapturePage from "./CapturePage";
import ContactPage from "./ContactPage";
import Segmentation from "./Segmentation";

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

  const [flowIds, setFlowIds] = useState(
    JSON.parse(localStorage.getItem("flow_ids")) || {}
  );

  // -------------------- STEP DATA --------------------
  const [landingData, setLandingData] = useState({});
  const [questionData, setQuestionData] = useState({});
  const [captureData, setCaptureData] = useState({});
  const [contactData, setContactData] = useState({});
  const [segmentationData, setSegmentationData] = useState({});

  // -------------------- LAST SAVED --------------------
  const [lastSavedLanding, setLastSavedLanding] = useState({});
  const [lastSavedQuestion, setLastSavedQuestion] = useState({});
  const [lastSavedCapture, setLastSavedCapture] = useState({});
  const [lastSavedContact, setLastSavedContact] = useState({});
  const [lastSavedSegmentation, setLastSavedSegmentation] = useState({});

  const [currentSaveFunction, setCurrentSaveFunction] = useState(null);

  const isDataChanged = (oldData, newData) =>
    JSON.stringify(oldData) !== JSON.stringify(newData);

  // ==================================================
  // SAVE STEP
  // ==================================================
  const saveStep = async (skipValue) => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("AUTH_TOKEN");

    if (!userId || !token) {
      alert("User not logged in.");
      return false;
    }

    const stepName = steps[activeIndex];

    try {
      const res = await fetch(`${API_BASE}/create_flow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          flow_name: stepName,
          description: skipValue
            ? `${stepName} skipped`
            : `${stepName} saved successfully`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to save step");
        return false;
      }

      const newFlowId = data.flow_id;
      if (!newFlowId) return false;

      const updated = { ...flowIds, [stepName]: newFlowId };
      setFlowIds(updated);
      localStorage.setItem("flow_ids", JSON.stringify(updated));

      if (typeof currentSaveFunction === "function") {
        return await currentSaveFunction(newFlowId);
      }

      return true;
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save step");
      return false;
    }
  };

  // ==================================================
  // VALIDATION
  // ==================================================
  const validateStep = async () => {
    const stepName = steps[activeIndex];

    if (stepName === "Landing Page") {
      if (
        !landingData.uploadedThumbnailUrl &&
        !landingData.selectedPosition
      ) {
        alert("Upload thumbnail OR select CTA position.");
        return false;
      }
    }
    return true;
  };

  // ==================================================
  // SAVE & NEXT
  // ==================================================
  const handleSaveNext = async () => {
    const stepName = steps[activeIndex];
    const valid = await validateStep();
    if (!valid) return;

    let shouldSave = false;

    if (stepName === "Landing Page")
      shouldSave = isDataChanged(lastSavedLanding, landingData);

    if (stepName === "Questionaire")
      shouldSave = isDataChanged(lastSavedQuestion, questionData);

    if (stepName === "Capture")
      shouldSave = isDataChanged(lastSavedCapture, captureData);

    if (stepName === "Contact")
      shouldSave = isDataChanged(lastSavedContact, contactData);

    // ✅ SEGMENTATION MUST ALWAYS SAVE
    if (stepName === "Segmentation")
      shouldSave = true;

    if (shouldSave) await saveStep(false);

    // update last saved
    if (stepName === "Landing Page") setLastSavedLanding(landingData);
    if (stepName === "Questionaire") setLastSavedQuestion(questionData);
    if (stepName === "Capture") setLastSavedCapture(captureData);
    if (stepName === "Contact") setLastSavedContact(contactData);
    if (stepName === "Segmentation")
      setLastSavedSegmentation(segmentationData);

    if (activeIndex < steps.length - 1) {
      setActiveIndex(activeIndex + 1);
    }
  };

  // ==================================================
  // SKIP & NEXT
  // ==================================================
  const goSkip = async () => {
    const stepName = steps[activeIndex];

    let isAlreadySaved = false;

    if (stepName === "Landing Page")
      isAlreadySaved = Object.keys(lastSavedLanding).length > 0;

    if (stepName === "Questionaire")
      isAlreadySaved = Object.keys(lastSavedQuestion).length > 0;

    if (stepName === "Capture")
      isAlreadySaved = Object.keys(lastSavedCapture).length > 0;

    if (stepName === "Contact")
      isAlreadySaved = Object.keys(lastSavedContact).length > 0;

    // ✅ segmentation always saves on skip
    if (stepName === "Segmentation")
      isAlreadySaved = false;

    if (!isAlreadySaved) await saveStep(true);

    if (activeIndex < steps.length - 1) {
      setActiveIndex(activeIndex + 1);
    }
  };

  // ==================================================
  // FINAL SAVE
  // ==================================================
  const handleFinalSave = async () => {
    await saveStep(false);
    setIsCompleted(true);
  };

  // ==================================================
  // CONTENT
  // ==================================================
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
    <ContactPage
      key="contact"
      data={contactData}
      setData={setContactData}
      setSaveFunction={setCurrentSaveFunction}
    />,
    <Segmentation
      key="segmentation"
      data={segmentationData}
      setData={setSegmentationData}
      setSaveFunction={setCurrentSaveFunction}
    />,
    <div key="skin_goal">Content for Skin Goal</div>,
    <div key="summary">Content for Summary & Routine</div>,
    <div key="suggest_products">Content for Suggest Products</div>,
  ];

  // ==================================================
  // RENDER
  // ==================================================
  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <button
              disabled={!isCompleted}
              onClick={() => isCompleted && setActiveIndex(index)}
              className={`flex-1 py-3 font-bold rounded
                ${activeIndex === index ? "bg-[#00bcd4] text-white" : "bg-gray-200"}
                ${!isCompleted ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {step}
            </button>
            {index < steps.length - 1 && (
              <span className="mx-2 font-bold">→</span>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="p-6 border rounded bg-gray-50 min-h-[150px]">
        {contents[activeIndex]}

        <div className="flex justify-end gap-3 mt-6">
          {activeIndex > 0 && (
            <button
              onClick={() => setActiveIndex(activeIndex - 1)}
              className="px-4 py-2 bg-[#00bcd4] text-white rounded"
            >
              Previous
            </button>
          )}

          {activeIndex !== steps.length - 1 && (
            <button
              onClick={goSkip}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              Skip & Next
            </button>
          )}

          <button
            onClick={
              activeIndex === steps.length - 1
                ? handleFinalSave
                : handleSaveNext
            }
            className="px-4 py-2 bg-[#00bcd4] text-white rounded"
          >
            {activeIndex === steps.length - 1 ? "Save" : "Save & Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Setflow;
