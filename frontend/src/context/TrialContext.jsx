import { createContext, useContext, useEffect, useState } from "react";
import { API_BASE } from "../utils/api";

const TrialContext = createContext();

export const useTrial = () => useContext(TrialContext);

export const TrialProvider = ({ children }) => {
  const [trialExpired, setTrialExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);

  const fetchTrialStatus = async () => {
    try {
      const token = localStorage.getItem("AUTH_TOKEN");

      // logout → reset
      if (!token) {
        setTrialExpired(false);
        setShowPopup(false);
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/my-modules`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      const expired =
        data.status === "success" &&
        data.plan_id === 0 &&
        data.trial_expired === true;

      setTrialExpired(expired);
      setShowPopup(expired); // ✅ ALWAYS show if expired
    } catch (err) {
      console.error("Trial check failed", err);
      setTrialExpired(false);
      setShowPopup(false);
    } finally {
      setLoading(false);
    }
  };

  // re-check on login / logout
  useEffect(() => {
    fetchTrialStatus();
  }, [localStorage.getItem("AUTH_TOKEN")]);

  return (
    <TrialContext.Provider
      value={{
        trialExpired,
        loading,
        showPopup,
        setShowPopup,
        refreshTrialStatus: fetchTrialStatus,
      }}
    >
      {children}
    </TrialContext.Provider>
  );
};
