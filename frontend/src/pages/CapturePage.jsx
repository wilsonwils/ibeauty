import React, { useState, useEffect, useRef } from "react";
import { API_BASE } from "../utils/api";
import Quill from "quill";
import "quill/dist/quill.snow.css"; // Quill styles

const CapturePage = ({ data, setData, setSaveFunction }) => {
  const [description, setDescription] = useState(data.description || "");
  const [errorMsg, setErrorMsg] = useState("");
  const editorRef = useRef(null);
  const quillInstance = useRef(null);

  // Initialize Quill
  useEffect(() => {
    if (!editorRef.current) return;

    quillInstance.current = new Quill(editorRef.current, {
      theme: "snow",
      placeholder: "Enter description here",
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["link", "clean"],
        ],
      },
    });

    // Set initial content
    quillInstance.current.root.innerHTML = description;

    // Listen to text changes
    quillInstance.current.on("text-change", () => {
      setDescription(quillInstance.current.root.innerHTML);
    });
  }, []);

  // Update parent data whenever description changes
  useEffect(() => {
    setData((prev) => ({ ...prev, description }));
  }, [description, setData]);

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 3000);
  };

  // Save function to be used externally
  useEffect(() => {
    const saveCapturePage = async (flowId, _stepData, options = {}) => {
      const token = localStorage.getItem("AUTH_TOKEN");
      if (!flowId || !token) return false;

      const skip = options?.skip === true;

      if (!skip && (!_stepData?.description || _stepData.description.trim() === "")) {
        showError("Please enter a description");
        return false;
      }

      try {
        const res = await fetch(`${API_BASE}/save_capture_page`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            flow_id: flowId,
            skip,
            text_area: skip ? null : _stepData?.description || "",
          }),
        });

        return res.ok;
      } catch (err) {
        console.error("Save error:", err);
        showError("Failed to save description.");
        return false;
      }
    };

    setSaveFunction(() => saveCapturePage);
  }, [setSaveFunction]);

  return (
    <div className="flex flex-col gap-4 relative">
      {errorMsg && (
        <div className="mt-4 flex justify-center">
          <div className="inline-block rounded-md bg-red-100 border border-red-400 text-red-700 px-6 py-2 text-sm font-medium shadow-sm">
            {errorMsg}
          </div>
        </div>
      )}

      <div>
        <label className="font-semibold">Disclaimer</label>
        <div ref={editorRef} style={{ height: 100 }} />
      </div>
    </div>
  );
};

export default CapturePage;
