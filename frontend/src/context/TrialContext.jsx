import { createContext, useContext, useEffect, useState } from "react";
import { API_BASE } from "../utils/api";
import { useUser } from "./UserContext";

const TrialContext = createContext();
export const useTrial = () => useContext(TrialContext);

export const TrialProvider = ({ children }) => {
  const { user, token } = useUser();

  const [trialExpired, setTrialExpired] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTrialStatus = async () => {
    if (!user || !token) {
      setTrialExpired(false);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/my-modules`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      const expired =
        data.status === "success" &&
        data.plan_id === 0 &&
        data.trial_expired === true;

      setTrialExpired(expired);
    } catch (err) {
      console.error("Trial check failed", err);
      setTrialExpired(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrialStatus();
  }, [user?.id, token]);

  return (
    <TrialContext.Provider
      value={{
        trialExpired,
        loading,
      }}
    >
      {children}
    </TrialContext.Provider>
  );
};
