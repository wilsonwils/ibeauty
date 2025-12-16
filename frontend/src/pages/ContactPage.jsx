import React, { useState, useEffect } from "react";
import { API_BASE } from "../utils/api";

const ContactPage = ({ data, setData, setSaveFunction }) => {
  const [selected, setSelected] = useState({
    name: data.name || false,
    phone: data.phone || false,
    whatsapp: data.whatsapp || false,
    email: data.email || false,
  });

  const [popupMsg, setPopupMsg] = useState("");


    useEffect(() => {
    setData(selected);
  }, [selected, setData]);

  const showPopup = (msg) => {
    setPopupMsg(msg);
    setTimeout(() => setPopupMsg(""), 3000);
  };

  
  useEffect(() => {
  const saveContactPage = async (flowId) => {
    const user_id = localStorage.getItem("userId");
    const token = localStorage.getItem("AUTH_TOKEN"); 
    if (!flowId || !user_id || !token) return false;

    // If none selected → show error (UNCHANGED)
    if (!selected.name && !selected.phone && !selected.whatsapp && !selected.email) {
      showPopup("Select at least one option");
      return false;
    }

    try {
      const res = await fetch(`${API_BASE}/save_contact_page`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({
          flow_id: flowId, 
          user_id,
          ...selected,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        showPopup(`Failed to save contact: ${result.error}`);
        return false;
      }

      setData((prev) => ({ ...prev, contact_id: result.id }));
      return true;
    } catch (err) {
      console.error("Contact save error:", err);
      showPopup("Failed to save contact.");
      return false;
    }
  };

  setSaveFunction(() => saveContactPage);
}, [selected, setData, setSaveFunction]);

  const toggle = (field) => {
    setSelected((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    
    <div className="p-4 border rounded mt-4 relative">
      {popupMsg && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded shadow-md">
          {popupMsg}
        </div>
      )}
      
      <div className="flex items-center gap-8">
        
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
