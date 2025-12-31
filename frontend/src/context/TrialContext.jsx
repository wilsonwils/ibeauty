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
      if (!token) return;

      const res = await fetch(`${API_BASE}/my-modules`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();


      if (
        data.status === "success" &&
        data.plan_id === 0 &&
        data.trial_expired === true
      ) {
        setTrialExpired(true);
      } else {
        setTrialExpired(false);
      }
    } catch (err) {
      console.error("Trial check failed", err);
      setTrialExpired(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrialStatus();
  }, []);

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
