import React, { useState, useEffect } from "react";
import { API_BASE } from "../utils/api";

// Import CKEditor
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

const CapturePage = ({ data, setData, setSaveFunction }) => {
  const [description, setDescription] = useState(data.description || "");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setData((prev) => ({ ...prev, description }));
  }, [description, setData]);

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 3000);
  };

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
        <CKEditor
          editor={ClassicEditor}
          data={description}
          onChange={(event, editor) => {
            const data = editor.getData();
            setDescription(data);
          }}
          config={{
            placeholder: "Enter description here",
            toolbar: [
              "heading", "|",
              "bold", "italic", "underline", "strikethrough", "|",
              "link", "bulletedList", "numberedList", "|",
              "undo", "redo"
            ]
          }}
        />
      </div>
    </div>
  );
};

export default CapturePage;
