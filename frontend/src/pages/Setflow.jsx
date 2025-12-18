import React, { useState, useEffect } from "react";
import { API_BASE } from "../utils/api";
import LandingPage from "./LandingPage";
import Questionaire from "./Questionaire";
import CapturePage from "./CapturePage";
import ContactPage from "./ContactPage";
import Segmentation from "./Segmentation";
import SkingoalPage from "./SkingoalPage";
import SummaryPage from "./SummaryPage";
import SuggestProduct from "./SuggestProduct";
import { permissionService } from "../services/permissionService";

const Setflow = () => {
<<<<<<< HEAD
  // ==================================================
  // USER-SPECIFIC STORAGE KEY
  // ==================================================
=======
  const steps = [
    "Landing Page",
    "Questionaire",
    "Capture",
    "Contact",
    "Segmentation",
    "Skin Goal",
    "Summary",
    // "Routine",
    "Suggest Product",
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // -------------------- USER-SPECIFIC LOCALSTORAGE --------------------
>>>>>>> b6494d93faf5102e10cc2679ae4d8bae84e18d84
  const getUserKey = (key) => {
    const userId = localStorage.getItem("userId");
    return `${key}_${userId || "guest"}`;
  };

  // ==================================================
  // BASIC STATE
  // ==================================================
  const [activeIndex, setActiveIndex] = useState(0);
  const [currentSaveFunction, setCurrentSaveFunction] = useState(null);

  // ==================================================
  // FLOW IDS (IMPORTANT)
  // ==================================================
  const [flowIds, setFlowIds] = useState(
    JSON.parse(localStorage.getItem(getUserKey("flow_ids"))) || {}
  );

  useEffect(() => {
    localStorage.setItem(getUserKey("flow_ids"), JSON.stringify(flowIds));
  }, [flowIds]);

  // reset save handler on step change
  useEffect(() => {
    setCurrentSaveFunction(null);
  }, [activeIndex]);

  // ==================================================
  // STEP DATA STATES
  // ==================================================
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
  const [suggestData, setSuggestData] = useState(
    JSON.parse(localStorage.getItem(getUserKey("suggest_data"))) || {}
  );

  // ==================================================
  // PERSIST DATA
  // ==================================================
  useEffect(() => {
    localStorage.setItem(getUserKey("landing_data"), JSON.stringify(landingData));
  }, [landingData]);

  useEffect(() => {
    localStorage.setItem(getUserKey("question_data"), JSON.stringify(questionData));
  }, [questionData]);

  useEffect(() => {
    localStorage.setItem(getUserKey("capture_data"), JSON.stringify(captureData));
  }, [captureData]);

  useEffect(() => {
    localStorage.setItem(getUserKey("contact_data"), JSON.stringify(contactData));
  }, [contactData]);

  useEffect(() => {
    localStorage.setItem(
      getUserKey("segmentation_data"),
      JSON.stringify(segmentationData)
    );
  }, [segmentationData]);

  useEffect(() => {
    localStorage.setItem(getUserKey("skingoal_data"), JSON.stringify(skingoalData));
  }, [skingoalData]);

  useEffect(() => {
    localStorage.setItem(getUserKey("summary_data"), JSON.stringify(summaryData));
  }, [summaryData]);

  useEffect(() => {
    localStorage.setItem(getUserKey("suggest_data"), JSON.stringify(suggestData));
  }, [suggestData]);

  // ==================================================
  // FLOW CONFIG (SINGLE SOURCE OF TRUTH)
  // ==================================================
  const flowConfig = [
    {
      label: "Landing Page",
      moduleId: 4,
      render: (
        <LandingPage
          data={landingData}
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
          data={questionData}
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
          data={captureData}
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
          data={contactData}
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
          data={segmentationData}
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
          data={skingoalData}
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
          data={summaryData}
          setData={setSummaryData}
          setSaveFunction={setCurrentSaveFunction}
        />
      ),
    },
    {
      label: "Suggest Product",
      moduleId: 13,
      render: (
        <SuggestProduct
          data={suggestData}
          setData={setSuggestData}
          setSaveFunction={setCurrentSaveFunction}
        />
      ),
    },
  ];

  // ==================================================
  // APPLY PERMISSIONS
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

  // ==================================================
  // SAVE / SKIP HANDLER
  // ==================================================
  const handleSave = async ({ skip = false, goNext = false } = {}) => {
    const token = localStorage.getItem("AUTH_TOKEN");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      alert("User not logged in");
      return;
    }

    const stepName = steps[activeIndex];

    try {
      let currentFlowId = flowIds[stepName];

<<<<<<< HEAD
      if (!currentFlowId) {
        const res = await fetch(`${API_BASE}/create_flow`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_id: userId,
            flow_name: stepName,
            skip,
          }),
=======
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
        if (stepName === "Suggest Product") stepData = suggestData;

        return await currentSaveFunction(newFlowId, stepData, {
          skip: skipValue,
>>>>>>> b6494d93faf5102e10cc2679ae4d8bae84e18d84
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Flow creation failed");

        currentFlowId = data.flow_id;
        setFlowIds((prev) => ({ ...prev, [stepName]: currentFlowId }));
      }

      if (typeof currentSaveFunction === "function") {
        await currentSaveFunction(currentFlowId, { skip });
      }

      if (goNext && activeIndex < steps.length - 1) {
        setActiveIndex((prev) => prev + 1);
      }
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save step");
    }
  };

<<<<<<< HEAD
=======
  
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
      case "Suggest Product":
        setLastSavedSuggest(suggestData);
        break;
      default:
        break;
    }

    if (activeIndex < steps.length - 1) {
      setActiveIndex(activeIndex + 1);
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
  // FINAL SAVE (UPDATED)
  // ==================================================
  const handleFinalSave = async () => {
    const saved = await saveStep(false);
    if (!saved) return;

    setIsCompleted(true);
    setActiveIndex(0); // GO TO LANDING PAGE
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
      data={
        Object.keys(segmentationData).length
          ? segmentationData
          : lastSavedSegmentation
      }
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
    // <div key="routine">Content for Summary & Routine</div>,
    <SuggestProduct
      key="suggest"
      data={Object.keys(suggestData).length ? suggestData : lastSavedSuggest}
      setData={setSuggestData}
      setSaveFunction={setCurrentSaveFunction}
    />,
  ];

>>>>>>> b6494d93faf5102e10cc2679ae4d8bae84e18d84
  // ==================================================
  // RENDER
  // ==================================================
  return (
    <div className="p-6">
      {/* STEPS */}
      <div className="flex mb-6">
        {steps.map((step, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`flex-1 py-3 font-bold rounded ${
              activeIndex === i ? "bg-[#00bcd4] text-white" : "bg-gray-200"
            }`}
          >
            {step}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div className="p-6 border rounded bg-gray-50 min-h-[200px]">
        {contents[activeIndex]}
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex justify-end gap-3 mt-6">
        {activeIndex > 0 && (
          <button
            onClick={() => setActiveIndex(activeIndex - 1)}
            className="px-4 py-2 bg-gray-300 rounded"
          >
            Previous
          </button>
        )}

        <button
          onClick={() => handleSave({ skip: true, goNext: true })}
          className="px-4 py-2 bg-yellow-400 rounded"
        >
          Skip & Next
        </button>

        <button
          onClick={() => handleSave({ skip: false, goNext: true })}
          className="px-4 py-2 bg-[#00bcd4] text-white rounded"
        >
          Save & Next
        </button>
      </div>
    </div>
  );
};

export default Setflow;
