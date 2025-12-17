import React, { useState, useEffect } from "react";
import { API_BASE } from "../utils/api";

const ContactPage = ({ data, setData, setSaveFunction }) => {
  // Local state for checkboxes
  const [selected, setSelected] = useState({
    name: data?.name || false,
    phone: data?.phone || false,
    whatsapp: data?.whatsapp || false,
    email: data?.email || false,
  });

  const [popupMsg, setPopupMsg] = useState("");

  // Initialize local state when component mounts
  useEffect(() => {
    if (!data) return;
    setSelected({
      name: data.name ?? false,
      phone: data.phone ?? false,
      whatsapp: data.whatsapp ?? false,
      email: data.email ?? false,
    });
  }, []); 

  // Keep parent data in sync when selected changes
  useEffect(() => {
    setData((prev) => ({
      ...prev,
      ...selected,
    }));
  }, [selected, setData]);

  // Function to show popup messages
  const showPopup = (msg) => {
    setPopupMsg(msg);
    setTimeout(() => setPopupMsg(""), 3000);
  };

  // Save function
  useEffect(() => {
    const saveContactPage = async (flowId, _data, options = {}) => {
      const user_id = localStorage.getItem("userId");
      const token = localStorage.getItem("AUTH_TOKEN");
      if (!flowId || !user_id || !token) return false;

      const skip = options.skip === true;

     
      if (!skip && !selected.name && !selected.phone && !selected.whatsapp && !selected.email) {
        showPopup("Select at least one option");
        return false;
      }


      const payload = skip
        ? {
            name: null,
            phone: null,
            whatsapp: null,
            email: null,
          }
        : {
            name: selected.name || false,
            phone: selected.phone || false,
            whatsapp: selected.whatsapp || false,
            email: selected.email || false,
          };

      try {
        const res = await fetch(`${API_BASE}/save_contact_page`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            flow_id: flowId,
            user_id,
            ...payload,
            skip, 
          }),
        });

        const result = await res.json();

        if (!res.ok) {
          showPopup(result.error || "Failed to save contact");
          return false;
        }

        if (!skip) {
          setData((prev) => ({
            ...prev,
            contact_id: result.id,
          }));
        }

        return true;
      } catch (err) {
        console.error("Contact save error:", err);
        showPopup("Failed to save contact.");
        return false;
      }
    };

    setSaveFunction(() => saveContactPage);
  }, [selected, setSaveFunction, setData]);

  // Toggle checkbox values
  const toggle = (field) => {
    setSelected((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <div className="p-4 border rounded mt-4 relative">
      {/* Popup message */}
      {popupMsg && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded shadow-md z-10">
          {popupMsg}
        </div>
      )}

      <div className="flex items-center gap-8 flex-wrap">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selected.name}
            onChange={() => toggle("name")}
          />
          <span className="font-semibold">Name</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selected.phone}
            onChange={() => toggle("phone")}
          />
          <span className="font-semibold">Phone Number</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selected.whatsapp}
            onChange={() => toggle("whatsapp")}
          />
          <span className="font-semibold">Whatsapp</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selected.email}
            onChange={() => toggle("email")}
          />
          <span className="font-semibold">Email</span>
        </label>
      </div>
    </div>
  );
};

export default ContactPage;
