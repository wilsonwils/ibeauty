import React, { useState, useEffect } from "react";
import { API_BASE } from "../utils/api";
import LandingPage from "./LandingPage";
import Questionaire from "./Questionaire";
import CapturePage from "./CapturePage";
import ContactPage from "./ContactPage";
import Segmentation from "./Segmentation";
import SkingoalPage from "./SkingoalPage";
import SummaryPage from "./SummaryPage";
import RoutinePage from "./RoutinePage";
import SuggestProduct from "./SuggestProduct";
import { permissionService } from "../services/permissionService";
import { useTrial } from "../context/TrialContext";
import TrialPopup from "../components/TrialPopup";
import { useNavigate } from "react-router-dom";

const Setflow = () => {
  const navigate = useNavigate();

  // =========================================
  // BASIC STATES
  // =========================================
  const [activeIndex, setActiveIndex] = useState(0);
  const [flowIds, setFlowIds] = useState({});
  const [skippedSteps, setSkippedSteps] = useState({});
  const [currentSaveFunction, setCurrentSaveFunction] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState(null);
 

  // =========================================
  // STEP DATA STATES (ONLY ONE SOURCE)
  // =========================================
  const [landingData, setLandingData] = useState({});
  const [questionData, setQuestionData] = useState({});
  const [captureData, setCaptureData] = useState({});
  const [contactData, setContactData] = useState({});
  const [segmentationData, setSegmentationData] = useState({});
  const [skingoalData, setSkingoalData] = useState({});
  const [summaryData, setSummaryData] = useState({});
  const [routineData, setRoutineData] = useState({});
  const [suggestData, setSuggestData] = useState({});

  // =========================================
  // FLOW CONFIG
  // =========================================
  const flowConfig = [
  { label: "Landing Page", moduleId: 4, component: LandingPage },
  { label: "Questionaire", moduleId: 5, component: Questionaire },
  { label: "Capture", moduleId: 6, component: CapturePage },
  { label: "Contact", moduleId: [7, 8], component: ContactPage },
  { label: "Segmentation", moduleId: 9, component: Segmentation },
  { label: "Skin Goal", moduleId: 10, component: SkingoalPage },
  { label: "Summary", moduleId: 11, component: SummaryPage },
  { label: "Routine", moduleId: 12, component: RoutinePage },
  { label: "Suggest Product", moduleId: 13, component: SuggestProduct },
];

  const permittedFlow = flowConfig.filter((step) =>
    Array.isArray(step.moduleId)
      ? permissionService.hasAny(step.moduleId)
      : permissionService.has(step.moduleId)
  );

  const steps = permittedFlow.map((s) => s.label);
  const stepDataMap = {
  "Landing Page": [landingData, setLandingData],
  "Questionaire": [questionData, setQuestionData],
  "Capture": [captureData, setCaptureData],
  "Contact": [contactData, setContactData],
  "Segmentation": [segmentationData, setSegmentationData],
  "Skin Goal": [skingoalData, setSkingoalData],
  "Summary": [summaryData, setSummaryData],
  "Routine": [routineData, setRoutineData],
  "Suggest Product": [suggestData, setSuggestData],
};

const contents = permittedFlow.map((step) => {
  const StepComponent = step.component;
  const [data, setData] = stepDataMap[step.label];

  return (
    <StepComponent
      key={step.label}
      data={data}
      setData={setData}
      setSaveFunction={setCurrentSaveFunction}
    />
  );
});


const handleGenerate = async () => {
  const token = localStorage.getItem("AUTH_TOKEN");
  const userId = localStorage.getItem("userId");

  if (!token || !userId) {
    alert("User not logged in");
    return;
  }

  try {
    setGenerating(true);
    setGenerateResult(null);

    const res = await fetch(`${API_BASE}/session/generate-link`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        module_id: 1,
        user_id: userId,
        landingData,
        questionData,
        captureData,
        contactData,
        segmentationData,
        skingoalData,
        summaryData,
        routineData,
        suggestData,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Generate failed");

    setGenerateResult(data);
    alert("Generated successfully ✅");
  } catch (err) {
    alert(err.message);
  } finally {
    setGenerating(false);
  }
};
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
        skip: skipValue,

       
        current_step: activeIndex
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



    // PASS SKIP FLAG TO CHILD
    if (typeof currentSaveFunction === "function") {
      const stepDataMap = {
        "Landing Page": landingData,
        "Questionaire": questionData,
        "Capture": captureData,
        "Contact": contactData,
        "Segmentation": segmentationData,
        "Skin Goal": skingoalData,
        "Summary": summaryData,
        "Routine": routineData,
        "Suggest Product": suggestData,
      };

const stepData = stepDataMap[stepName] || {};

      return await currentSaveFunction(newFlowId, stepData, {
        skip: skipValue,
      });
    }

    return true;
  } catch (err) {
    console.error("Save error:", err);
    alert("Failed to save step");
    return false;
  }
};

  
  // ==================================================
  // SAVE & NEXT
  // ==================================================
const handleSaveNext = async () => {
  const stepName = steps[activeIndex];

  const saved = await saveStep(false);
  if (!saved) return;

  // remove skipped flag if previously skipped
  if (skippedSteps[stepName]) {
    const updated = { ...skippedSteps };
    delete updated[stepName];
    setSkippedSteps(updated);
  }

  // move next
  setActiveIndex((prev) => prev + 1);
};


  // ==================================================
  // SKIP & NEXT
  // ==================================================
  const goSkip = async () => {
  const stepName = steps[activeIndex];

  const saved = await saveStep(true); 
  if (!saved) return;

  // mark skipped
  setSkippedSteps(prev => ({
    ...prev,
    [stepName]: true,
  }));

  // clear local state
  const clearMap = {
    "Landing Page": () => setLandingData({}),
    "Questionaire": () => setQuestionData({}),
    "Capture": () => setCaptureData({}),
    "Contact": () => setContactData({}),
    "Segmentation": () => setSegmentationData({}),
    "Skin Goal": () => setSkingoalData({}),
    "Summary": () => setSummaryData({}),
    "Routine": () => setRoutineData({}),
    "Suggest Product": () => setSuggestData({}),
  };

  clearMap[stepName]?.();

  setActiveIndex(prev => prev + 1);
};



  // ==================================================
  // FINAL SAVE (UPDATED)
  // ==================================================
const handleFinalSave = async () => {
  const saved = await saveStep(false);
  if (!saved) return;

  // if product suggestion → go add product page
  if (suggestData["Product Suggestion"]) {
    navigate("/i-beauty/add-product", {
      replace: true,
      state: { fromFlow: true, flowIds },
    });
    return;
  }

  // otherwise just restart flow
  setActiveIndex(0);
};


  
const { trialExpired } = useTrial();
const [showPopup, setShowPopup] = useState(false);


const guardAction = (action) => {
  if (trialExpired) {
    setShowPopup(true);
    return;
  }
  action();
};



return (
  <>
      {/* Trial popup */}
    <TrialPopup
      show={showPopup}
      onClose={() => setShowPopup(false)}
    />
    <div className="p-6">
  <div className="flex mb-6">
    {steps.map((step, i) => (
      <button
        key={i}
        onClick={() => setActiveIndex(i)}
        className={`flex-1 py-3 font-bold rounded transition
          ${
            activeIndex === i
              ? "bg-[#00bcd4] text-white"
              : "bg-gray-200 text-black hover:bg-gray-300"
          }`}
      >
        {step}
      </button>
    ))}
  </div>


     <div className="relative p-6 border rounded bg-gray-50 min-h-[150px]">
        {skippedSteps[steps[activeIndex]] && (
          <span className="absolute top-0 right-0 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
            Skipped
          </span>
        )}

         {contents[activeIndex]}




<div className="flex justify-end gap-3 mt-6">
  {activeIndex > 0 && (
    <button
      onClick={() =>
        guardAction(() => setActiveIndex(activeIndex - 1))
      }
      className="px-4 py-2 bg-[#00bcd4] text-white rounded"
    >
      Previous
    </button>
  )}

  {activeIndex !== steps.length - 1 && (
    <button
      onClick={() => guardAction(goSkip)}
      className="px-4 py-2 bg-yellow-400 rounded"
    >
      Skip & Next
    </button>
  )}

      <button
        onClick={activeIndex === steps.length - 1 ? handleFinalSave : handleSaveNext}
        className="px-4 py-2 bg-[#00bcd4] text-white rounded"
      >
        {steps[activeIndex] === "Suggest Product" &&
        suggestData["Product Suggestion"] === true
          ? "Save & Add Product"
          : activeIndex === steps.length - 1
          ? "Save"
          : "Save & Next"}
      </button>


  {activeIndex === steps.length - 1 && (
  <button
    onClick={() => guardAction(handleGenerate)}
    disabled={generating}
    className="px-4 py-2 bg-green-600 text-white rounded"
  >
    {generating ? "Generating..." : "Generate"}
  </button>
)}
</div>

      </div>
    </div>
    </>
  );
};


export default Setflow;