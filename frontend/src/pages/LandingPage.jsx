import React, { useState, useEffect } from "react";
import { API_BASE } from "../utils/api";

const LandingPage = ({ data, setData, setSaveFunction }) => {


  const [uploadedThumbnailUrl, setUploadedThumbnailUrl] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");


  // =====================================
  //  FETCH 
  // =====================================
  useEffect(() => {
    const fetchLanding = async () => {
      try {
        const token = localStorage.getItem("AUTH_TOKEN");
        if (!token) return;

        const res = await fetch(`${API_BASE}/flow/landing`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) return;

        const result = await res.json();

   
        const restored = {
          uploadedThumbnailUrl: result?.thumbnail || null,
          selectedPosition: result?.cta_position || "",
        };

        setUploadedThumbnailUrl(restored.uploadedThumbnailUrl);
        setSelectedPosition(restored.selectedPosition);

        setData(restored);

      } catch (err) {
        console.error("Landing fetch failed:", err);
      }
    };

    fetchLanding();
  }, [setData]);


  // =====================================
  //  SYNC PARENT 
  // =====================================
  useEffect(() => {
    setData({
      uploadedThumbnailUrl,
      selectedPosition,
    });
  }, [uploadedThumbnailUrl, selectedPosition, setData]);


  // =====================================
  // ERROR
  // =====================================
  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 3000);
  };


  // =====================================
  //  SAVE FUNCTION 
  // =====================================
  useEffect(() => {

    const saveLanding = async (flowId, stepData, options = {}) => {
      const token = localStorage.getItem("AUTH_TOKEN");
      const userId = localStorage.getItem("userId");

      if (!token || !flowId || !userId) return false;

      const skip = options.skip === true;

      if (!skip && (!uploadedThumbnailUrl || !selectedPosition)) {
        showError("Please upload thumbnail and select CTA position");
        return false;
      }

      const payload = {
        flow_id: flowId,
        user_id: userId,
        skipped: skip,
      };

      if (!skip) {
        payload.thumbnail = uploadedThumbnailUrl;
        payload.cta_position = selectedPosition;
      }

      try {
        const res = await fetch(`${API_BASE}/save_landing_page`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) return false;

        return true;

      } catch (err) {
        console.error(err);
        return false;
      }
    };

    setSaveFunction(() => saveLanding);

  }, [uploadedThumbnailUrl, selectedPosition, setSaveFunction]);


  // =====================================
  //  FILE UPLOAD
  // =====================================
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`${API_BASE}/upload_image`, {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (result.imageUrl) {
        setUploadedThumbnailUrl(result.imageUrl);
      }

    } catch (err) {
      showError("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };


  return (
    <div className="flex flex-col gap-4">

      {errorMsg && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
          {errorMsg}
        </div>
      )}

      <label className="font-semibold">Add Thumbnail:</label>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="border p-2 rounded"
      />

      {uploadedThumbnailUrl && (
        <img
          src={`${API_BASE}${uploadedThumbnailUrl}`}
          alt="preview"
          className="h-32 w-32 rounded object-cover"
        />
      )}

      {isUploading && <p>Uploading...</p>}

      <label className="font-semibold mt-3">CTA Position:</label>

      <select
        value={selectedPosition}
        onChange={(e) => setSelectedPosition(e.target.value)}
        className="border p-2 rounded w-max"
      >
        <option value="">Select</option>
        <option value="left">Left</option>
        <option value="right">Right</option>
        <option value="top">Top</option>
        <option value="bottom">Bottom</option>
      </select>

    </div>
  );
};

export default LandingPage;
