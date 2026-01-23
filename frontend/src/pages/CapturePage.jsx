import React, { useState, useEffect, useRef } from "react";
import { API_BASE } from "../utils/api";
import Quill from "quill";
import "quill/dist/quill.snow.css";

const CapturePage = ({ data, setData, setSaveFunction }) => {
  const [description, setDescription] = useState(data?.description || "");
  const [errorMsg, setErrorMsg] = useState("");

  const editorRef = useRef(null);
  const quillInstance = useRef(null);

  /* ===============================
     FETCH STORED DATA
  =============================== */
  useEffect(() => {
    const fetchCapture = async () => {
      try {
        const token = localStorage.getItem("AUTH_TOKEN");
        if (!token) return;

        const res = await fetch(`${API_BASE}/flow/capture`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await res.json();

        if (res.ok && result) {
          const value = result.text_area || "";

          setDescription(value);

          // sync parent
          setData((prev) => ({
            ...prev,
            description: value,
          }));
        }
      } catch (err) {
        console.error("Capture fetch failed:", err);
      }
    };

    fetchCapture();
  }, [setData]);

  /* ===============================
     INIT QUILL 
  =============================== */
  useEffect(() => {
    if (!editorRef.current || quillInstance.current) return;

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

    quillInstance.current.on("text-change", () => {
      const html = quillInstance.current.root.innerHTML;
      setDescription(html);
    });
  }, []);

  /* ===============================
     SYNC STATE ➜ QUILL
  =============================== */
  useEffect(() => {
    if (!quillInstance.current) return;

    const editorHTML = quillInstance.current.root.innerHTML;

    if (editorHTML !== description) {
      quillInstance.current.root.innerHTML = description || "";
    }
  }, [description]);

  /* ===============================
     SYNC CHILD ➜ PARENT
  =============================== */
  useEffect(() => {
    setData((prev) => ({
      ...prev,
      description,
    }));
  }, [description, setData]);

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 3000);
  };

  /* ===============================
     SAVE 
  =============================== */
  useEffect(() => {
    const saveCapturePage = async (flowId, stepData, options = {}) => {
      const token = localStorage.getItem("AUTH_TOKEN");
      if (!flowId || !token) return false;

      const skip = options?.skip === true;

      if (!skip && (!stepData?.description || stepData.description.trim() === "")) {
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
            text_area: skip ? null : stepData.description,
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
        <div
          ref={editorRef}
          style={{ height: 120 }}
          className="bg-white"
        />
      </div>
    </div>
  );
};

export default CapturePage;
