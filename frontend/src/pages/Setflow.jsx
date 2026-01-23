import React, { useState } from "react";
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
import { label } from "three/tsl";
import { useTrial } from "../context/TrialContext";
import TrialPopup from "../components/TrialPopup";


const Setflow = () => {

  const fetchAndStoreFlowData = async () => {
  const token = localStorage.getItem("AUTH_TOKEN");
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/flow/retrieve`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) return null;

    const data = await res.json();

    // 🔑 store FULL response
    localStorage.setItem("FLOW_RETRIEVE_DATA", JSON.stringify(data));

    return data;
  } catch (err) {
    console.error("Flow retrieve failed", err);
    return null;
  }
};
const isEmptyObject = (obj) =>
  !obj || (typeof obj === "object" && Object.keys(obj).length === 0);
const retrieveFlowData = async () => {
  let stored = localStorage.getItem("FLOW_RETRIEVE_DATA");
  let data = stored ? JSON.parse(stored) : null;

  // 🔥 FIX: {} should NOT block API call
  if (!data || !data.flows || data.flows.length === 0) {
    data = await fetchAndStoreFlowData();
    if (!data) return;
  }

  // ---------------- HYDRATE EXISTING STATE ----------------
  data.flows.forEach(({ flow, ...rest }) => {
    const name = flow.flow_name;

    setFlowIds((p) => ({ ...p, [name]: flow.id }));
    setSkippedSteps((p) => ({ ...p, [name]: flow.skip }));

    if (name === "Landing Page" && rest.landing_page)
      setLandingData(rest.landing_page);

    if (name === "Questionaire" && rest.questionnaire)
      setQuestionData(rest.questionnaire);

    if (name === "Capture" && rest.capture_page)
      setCaptureData(rest.capture_page);

    if (name === "Contact" && rest.contact_page)
      setContactData(rest.contact_page);

    if (name === "Segmentation" && rest.segmentation)
      setSegmentationData(rest.segmentation);

    if (name === "Skin Goal" && rest.skin_goal)
      setSkingoalData(rest.skin_goal);

    if (name === "Summary" && rest.summary)
      setSummaryData(rest.summary);

    if (name === "Routine" && rest.summary)
      setRoutineData(rest.summary);

    if (name === "Suggest Product" && rest.suggest_product)
      setSuggestData(rest.suggest_product);
  });
};

    const getUserKey = (key) => {
    const userId = localStorage.getItem("userId");
    return `${key}_${userId || "guest"}`;
  };

  const [activeIndex, setActiveIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const [maxReachedIndex, setMaxReachedIndex] = useState(0);
  const [flowUnlocked, setFlowUnlocked] = useState(false);

  const [generating, setGenerating] = useState(false);
const [generateResult, setGenerateResult] = useState(null);


  // -------------------- USER-SPECIFIC LOCALSTORAGE --------------------

  const [flowIds, setFlowIds] = useState(
    JSON.parse(localStorage.getItem(getUserKey("flow_ids"))) || {}
  );

  const [skippedSteps, setSkippedSteps] = useState(
    JSON.parse(localStorage.getItem(getUserKey("skipped_steps"))) || {}
  );

  // -------------------- STEP DATA --------------------
  const [landingData, setLandingData] = useState(
    JSON.parse(localStorage.getItem(getUserKey("landing_data"))) || {}
  );
  const [questionData, setQuestionData] = useState(
    JSON.parse(localStorage.getItem(getUserKey("question_data"))) || {}
  );
  const [captureData, setCaptureData] = useState(
    JSON.parse(localStorage.getItem(getUserKey("capture_data"))) || {}
  );
  const [contactData, setContactData] = useState(
    JSON.parse(localStorage.getItem(getUserKey("contact_data"))) || {}
  );
  const [segmentationData, setSegmentationData] = useState(
    JSON.parse(localStorage.getItem(getUserKey("segmentation_data"))) || {}
  );
  const [skingoalData, setSkingoalData] = useState(
    JSON.parse(localStorage.getItem(getUserKey("skingoal_data"))) || {}
  );
  const [summaryData, setSummaryData] = useState(
    JSON.parse(localStorage.getItem(getUserKey("summary_data"))) || {}
  );
    const [routineData, setRoutineData] = useState(
    JSON.parse(localStorage.getItem(getUserKey("routine_data"))) || {}
  );

  const [suggestData, setSuggestData] = useState(
    JSON.parse(localStorage.getItem(getUserKey("suggest_data"))) || {}
  );

  // -------------------- PERSIST STEP DATA --------------------

React.useEffect(() => {
  retrieveFlowData();
}, []);

  React.useEffect(() => {
    localStorage.setItem(getUserKey("landing_data"), JSON.stringify(landingData));
  }, [landingData]);
  React.useEffect(() => {
    localStorage.setItem(getUserKey("question_data"), JSON.stringify(questionData));
  }, [questionData]);
  React.useEffect(() => {
    localStorage.setItem(getUserKey("capture_data"), JSON.stringify(captureData));
  }, [captureData]);
  React.useEffect(() => {
    localStorage.setItem(getUserKey("contact_data"), JSON.stringify(contactData));
  }, [contactData]);
  React.useEffect(() => {
    localStorage.setItem(getUserKey("segmentation_data"), JSON.stringify(segmentationData));
  }, [segmentationData]);
  React.useEffect(() => {
    localStorage.setItem(getUserKey("skingoal_data"), JSON.stringify(skingoalData));
  }, [skingoalData]);
  React.useEffect(() => {
    localStorage.setItem(getUserKey("summary_data"), JSON.stringify(summaryData));
  }, [summaryData]);
    React.useEffect(() => {
    localStorage.setItem(getUserKey("routine_data"), JSON.stringify(routineData));
  }, [routineData]);
  React.useEffect(() => {
    localStorage.setItem(getUserKey("suggest_data"), JSON.stringify(suggestData));
  }, [suggestData]);

  // -------------------- LAST SAVED --------------------
  const [lastSavedLanding, setLastSavedLanding] = useState({});
  const [lastSavedQuestion, setLastSavedQuestion] = useState({});
  const [lastSavedCapture, setLastSavedCapture] = useState({});
  const [lastSavedContact, setLastSavedContact] = useState({});
  const [lastSavedSegmentation, setLastSavedSegmentation] = useState({});
  const [lastSavedSkingoal, setLastSavedSkingoal] = useState({});
  const [lastSavedSummary, setLastSavedSummary] = useState({});
  const [lastSavedRoutine, setLastSavedRoutine] = useState( {} );
  const [lastSavedSuggest, setLastSavedSuggest] = useState({});

  const [currentSaveFunction, setCurrentSaveFunction] = useState(null);

  const isDataChanged = (oldData, newData) =>
    JSON.stringify(oldData) !== JSON.stringify(newData);

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
      localStorage.setItem(getUserKey("flow_ids"), JSON.stringify(updated));

      //  PASS SKIP FLAG TO CHILD
      if (typeof currentSaveFunction === "function") {
        let stepData = {};
        if (stepName === "Landing Page") stepData = landingData;
        if (stepName === "Questionaire") stepData = questionData;
        if (stepName === "Capture") stepData = captureData;
        if (stepName === "Contact") stepData = contactData;
        if (stepName === "Segmentation") stepData = segmentationData;
        if (stepName === "Skin Goal") stepData = skingoalData;
        if (stepName === "Summary") stepData = summaryData;
        if (stepName === "Routine") stepData = routineData;
        if (stepName === "Suggest Product") stepData = suggestData;

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
    if (stepName === "Summary") shouldSave = true;
    if (stepName === "Routine") shouldSave = true;
    if (stepName === "Suggest Product")
      shouldSave = isDataChanged(lastSavedSuggest, suggestData);

    let saved = true;
    if (shouldSave) {
      saved = await saveStep(false);
    

      if (skippedSteps[stepName]) {
        const updatedSkipped = { ...skippedSteps };
        delete updatedSkipped[stepName];
        setSkippedSteps(updatedSkipped);
        localStorage.setItem(getUserKey("skipped_steps"), JSON.stringify(updatedSkipped));
      }
    }

    if (!saved) return;

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
      case "Routine":
        setLastSavedRoutine(routineData);
        break;
      case "Suggest Product":
        setLastSavedSuggest(suggestData);
        break;
      default:
        break;
    }

    if (activeIndex < steps.length - 1) {
      setActiveIndex(activeIndex + 1);
    }
    if (next > maxReachedIndex) {
      setMaxReachedIndex(next);
    }
  };

  // ==================================================
  // SKIP & NEXT
  // ==================================================
  const goSkip = async () => {
    const stepName = steps[activeIndex];
    await saveStep(true);

    const updatedSkipped = { ...skippedSteps, [stepName]: true };
    setSkippedSteps(updatedSkipped);
    localStorage.setItem(getUserKey("skipped_steps"), JSON.stringify(updatedSkipped));

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
      case "Routine":
        setLastSavedRoutine({});
        setRoutineData({});
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
    if (next > maxReachedIndex) {
      setMaxReachedIndex(next);
   }

  };

  // ==================================================
  // FINAL SAVE (UPDATED)
  // ==================================================
  const handleFinalSave = async () => {
    const saved = await saveStep(false);
    if (!saved) return;

    setIsCompleted(true);
    setFlowUnlocked(true);
    setActiveIndex(0); // GO TO LANDING PAGE
        
   
  };

  // ==================================================
  // CONTENT
  // ==================================================
  const flowConfig = [
  {
    label: "Landing Page",
    moduleId: 4,
    render: (
      <LandingPage
        data={Object.keys(landingData).length ? landingData : lastSavedLanding}
        setData={setLandingData}
        setSaveFunction={setCurrentSaveFunction}
      />
    ),
  },
  {
    label: "Questionaire",
    moduleId: 5,
    render: (
      <Questionaire
        data={Object.keys(questionData).length ? questionData : lastSavedQuestion}
        setData={setQuestionData}
        setSaveFunction={setCurrentSaveFunction}
      />
    ),
  },
  {
    label: "Capture",
    moduleId: 6,
    render: (
      <CapturePage
        data={Object.keys(captureData).length ? captureData : lastSavedCapture}
        setData={setCaptureData}
        setSaveFunction={setCurrentSaveFunction}
      />
    ),
  },
  {
    label: "Contact",
    moduleId: [7, 8],
    render: (
      <ContactPage
        data={Object.keys(contactData).length ? contactData : lastSavedContact}
        setData={setContactData}
        setSaveFunction={setCurrentSaveFunction}
      />
    ),
  },
  {
    label: "Segmentation",
    moduleId: 9,
    render: (
      <Segmentation
        data={
          Object.keys(segmentationData).length
            ? segmentationData
            : lastSavedSegmentation
        }
        setData={setSegmentationData}
        setSaveFunction={setCurrentSaveFunction}
      />
    ),
  },
  {
    label: "Skin Goal",
    moduleId: 10,
    render: (
      <SkingoalPage
        data={Object.keys(skingoalData).length ? skingoalData : lastSavedSkingoal}
        setData={setSkingoalData}
        setSaveFunction={setCurrentSaveFunction}
      />
    ),
  },
  {
    label: "Summary",
    moduleId: 11,
    render: (
      <SummaryPage
        data={Object.keys(summaryData).length ? summaryData : lastSavedSummary}
        setData={setSummaryData}
        setSaveFunction={setCurrentSaveFunction}
      />
    ),
  },
  {
    label: "Routine",
    moduleId: 12,
    render: (
      <RoutinePage
        data={Object.keys(routineData).length ? routineData : lastSavedRoutine}
        setData={setRoutineData}
        setSaveFunction={setCurrentSaveFunction}
      />

    ),
  },
  {
    label: "Suggest Product",
    moduleId: 13,
    render: (
      <SuggestProduct
        data={Object.keys(suggestData).length ? suggestData : lastSavedSuggest}
        setData={setSuggestData}
        setSaveFunction={setCurrentSaveFunction}
      />
    ),
  },
];

// ==================================================
// PERMISSIONS
// ==================================================
const permittedFlow = flowConfig.filter((step) =>
  Array.isArray(step.moduleId)
    ? permissionService.hasAny(step.moduleId)
    : permissionService.has(step.moduleId)
);

const steps = permittedFlow.map((s) => s.label);
const contents = permittedFlow.map((s, i) =>
  React.cloneElement(s.render, { key: i })
);

const { trialExpired } = useTrial();
const [showPopup, setShowPopup] = useState(false);


const guardAction = (action) => {
  if (trialExpired) {
    setShowPopup(true);
    return;
  }
  action();
};



  // ==================================================
  // RENDER
  // ==================================================
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
    onClick={() =>
      guardAction(
        activeIndex === steps.length - 1
          ? handleFinalSave
          : handleSaveNext
      )
    }
    className="px-4 py-2 bg-[#00bcd4] text-white rounded"
  >
    {activeIndex === steps.length - 1 ? "Save" : "Save & Next"}
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
