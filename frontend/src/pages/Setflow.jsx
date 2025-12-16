import React, { useState } from "react";
import { API_BASE } from "../utils/api";
import LandingPage from "./LandingPage";
import Questionaire from "./Questionaire";
import CapturePage from "./CapturePage";
import ContactPage from "./ContactPage";
import Segmentation from "./Segmentation";
import SkingoalPage from "./SkingoalPage";
import SummaryPage from "./SummaryPage";
import SuggestProduct from "./SuggestProduct";

const Setflow = () => {
  const steps = [
    "Landing Page",
    "Questionaire",
    "Capture",
    "Contact",
    "Segmentation",
    "Skin Goal",
    "Summary",
    "Routine",
    "Suggest Product",
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const [flowIds, setFlowIds] = useState(
    JSON.parse(localStorage.getItem("flow_ids")) || {}
  );

  const [skippedSteps, setSkippedSteps] = useState(
    JSON.parse(localStorage.getItem("skipped_steps")) || {}
  );

  // -------------------- STEP DATA --------------------
  const [landingData, setLandingData] = useState({});
  const [questionData, setQuestionData] = useState({});
  const [captureData, setCaptureData] = useState({});
  const [contactData, setContactData] = useState({});
  const [segmentationData, setSegmentationData] = useState({});
  const [skingoalData, setSkingoalData] = useState({});
  const [summaryData, setSummaryData] = useState({});
  const [suggestData, setSuggestData] = useState({});

  // -------------------- LAST SAVED --------------------
  const [lastSavedLanding, setLastSavedLanding] = useState({});
  const [lastSavedQuestion, setLastSavedQuestion] = useState({});
  const [lastSavedCapture, setLastSavedCapture] = useState({});
  const [lastSavedContact, setLastSavedContact] = useState({});
  const [lastSavedSegmentation, setLastSavedSegmentation] = useState({});
  const [lastSavedSkingoal, setLastSavedSkingoal] = useState({});
  const [lastSavedSummary, setLastSavedSummary] = useState({});
  const [lastSavedSuggest, setLastSavedSuggest] = useState({});

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
      if (!landingData.uploadedThumbnailUrl && !landingData.selectedPosition) {
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
    if (stepName === "Segmentation") shouldSave = true;
    if (stepName === "Skin Goal") shouldSave = true;
    if (stepName === "Summary")
      shouldSave = isDataChanged(lastSavedSummary, summaryData);
    if (stepName === "Suggest Product")
      shouldSave = isDataChanged(lastSavedSuggest, suggestData);

    let saved = true;
    if (shouldSave) {
      saved = await saveStep(false);

      // Remove skipped label if saved
      if (skippedSteps[stepName]) {
        const updatedSkipped = { ...skippedSteps };
        delete updatedSkipped[stepName];
        setSkippedSteps(updatedSkipped);
        localStorage.setItem("skipped_steps", JSON.stringify(updatedSkipped));
      }
    }

    if (!saved) return;

    // update last saved
    switch (stepName) {
      case "Landing Page":
        setLastSavedLanding(landingData);
        break;
      case "Questionaire":
        setLastSavedQuestion(questionData);
        break;
      case "Capture":
        setLastSavedCapture(captureData);
        break;
      case "Contact":
        setLastSavedContact(contactData);
        break;
      case "Segmentation":
        setLastSavedSegmentation(segmentationData);
        break;
      case "Skin Goal":
        setLastSavedSkingoal(skingoalData);
        break;
      case "Summary":
        setLastSavedSummary(summaryData);
        break;
      case "Suggest Product":
        setLastSavedSuggest(suggestData);
        break;
      default:
        break;
    }

    if (activeIndex < steps.length - 1) setActiveIndex(activeIndex + 1);
  };

  // ==================================================
  // SKIP & NEXT
  // ==================================================
  const goSkip = async () => {
    const stepName = steps[activeIndex];

    // Always save as skipped
    await saveStep(true);

    // Mark step as skipped
    const updatedSkipped = { ...skippedSteps, [stepName]: true };
    setSkippedSteps(updatedSkipped);
    localStorage.setItem("skipped_steps", JSON.stringify(updatedSkipped));

    // Reset data
    switch (stepName) {
      case "Landing Page":
        setLastSavedLanding({});
        setLandingData({});
        break;
      case "Questionaire":
        setLastSavedQuestion({});
        setQuestionData({});
        break;
      case "Capture":
        setLastSavedCapture({});
        setCaptureData({});
        break;
      case "Contact":
        setLastSavedContact({});
        setContactData({});
        break;
      case "Segmentation":
        setLastSavedSegmentation({});
        setSegmentationData({});
        break;
      case "Skin Goal":
        setLastSavedSkingoal({});
        setSkingoalData({});
        break;
      case "Summary":
        setLastSavedSummary({});
        setSummaryData({});
        break;
      case "Suggest Product":
        setLastSavedSuggest({});
        setSuggestData({});
        break;
      default:
        break;
    }

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
      data={Object.keys(landingData).length ? landingData : lastSavedLanding}
      setData={setLandingData}
      setSaveFunction={setCurrentSaveFunction}
    />,
    <Questionaire
      key="questionaire"
      data={Object.keys(questionData).length ? questionData : lastSavedQuestion}
      setData={setQuestionData}
      setSaveFunction={setCurrentSaveFunction}
    />,
    <CapturePage
      key="capture"
      data={Object.keys(captureData).length ? captureData : lastSavedCapture}
      setData={setCaptureData}
      setSaveFunction={setCurrentSaveFunction}
    />,
    <ContactPage
      key="contact"
      data={Object.keys(contactData).length ? contactData : lastSavedContact}
      setData={setContactData}
      setSaveFunction={setCurrentSaveFunction}
    />,
    <Segmentation
      key="segmentation"
      data={Object.keys(segmentationData).length ? segmentationData : lastSavedSegmentation}
      setData={setSegmentationData}
      setSaveFunction={setCurrentSaveFunction}
    />,
    <SkingoalPage
      key="skingoal"
      data={Object.keys(skingoalData).length ? skingoalData : lastSavedSkingoal}
      setData={setSkingoalData}
      setSaveFunction={setCurrentSaveFunction}
    />,
    <SummaryPage
      key="summary"
      data={Object.keys(summaryData).length ? summaryData : lastSavedSummary}
      setData={setSummaryData}
      setSaveFunction={setCurrentSaveFunction}
    />,
    <div key="routine">Content for Summary & Routine</div>,
    <SuggestProduct
      key="suggest"
      data={Object.keys(suggestData).length ? suggestData : lastSavedSuggest}
      setData={setSuggestData}
      setSaveFunction={setCurrentSaveFunction}
    />
  ];

  // ==================================================
  // RENDER
  // ==================================================
  return (
    <div className="p-6">
      {/* Step Buttons */}
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
            {index < steps.length - 1 && <span className="mx-2 font-bold">→</span>}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <div className="relative p-6 border rounded bg-gray-50 min-h-[150px]">
        {/* Skipped Label */}
        {skippedSteps[steps[activeIndex]] && (
          <span className="absolute top-0 right-0 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
            Skipped
          </span>
        )}

        {contents[activeIndex]}

        {/* Navigation Buttons */}
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
              activeIndex === steps.length - 1 ? handleFinalSave : handleSaveNext
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
