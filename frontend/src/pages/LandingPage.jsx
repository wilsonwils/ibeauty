import React, { useState, useEffect } from "react";
import { API_BASE } from "../utils/api";

const LandingPage = ({ data, setData, setSaveFunction }) => {
  const [uploadedThumbnailUrl, setUploadedThumbnailUrl] = useState(data.uploadedThumbnailUrl || null);
  const [selectedPosition, setSelectedPosition] = useState(data.selectedPosition || "");
  const [isUploading, setIsUploading] = useState(false);

  // Persist changes to parent
  useEffect(() => {
    setData((prev) => ({
      ...prev,
      uploadedThumbnailUrl,
      selectedPosition,
    }));
  }, [uploadedThumbnailUrl, selectedPosition, setData]);

  // Expose save function
  useEffect(() => {
    const saveLandingPage = async () => {
      const userId = localStorage.getItem("userId");
      const flowId = localStorage.getItem("flow_id");
      if (!userId || !flowId) return false;

      try {
        const res = await fetch(`${API_BASE}/save_landing_page`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            flow_id: flowId,
            user_id: userId,
            thumbnail: uploadedThumbnailUrl || null,
            cta_position: selectedPosition || null,
          }),
        });

        const result = await res.json();

        if (res.ok && result.id) {
          // Save landing page ID in state
          setData((prev) => ({ ...prev, landing_id: result.id }));
        }

        return res.ok;
      } catch (err) {
        console.error("Landing page save error:", err);
        return false;
      }
    };

    setSaveFunction(() => saveLandingPage);
  }, [uploadedThumbnailUrl, selectedPosition, setData, setSaveFunction]);

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
      console.error("Upload error:", err);
      alert("Image upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <label className="font-semibold">Add Thumbnail:</label>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="border p-2 rounded"
      />

      {uploadedThumbnailUrl && (
        <div className="mt-4">
          <p className="font-semibold">Preview:</p>
          <img
            src={uploadedThumbnailUrl}
            alt="Thumbnail"
            className="h-32 w-32 object-cover rounded"
          />
        </div>
      )}

      {isUploading && <p className="text-blue-500">Uploading...</p>}

      <label className="font-semibold mt-4">CTA Button Position:</label>
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
